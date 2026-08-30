---
name: attendance-rules
description: Rules for attendance, shifts, check-in/check-out, lateness, and attendance dates in DayMark — including overnight shifts that cross midnight. Load before changing attendanceVerification.service.js, workspace schedule settings, the attendance register or filters, the calendar attendance overlay, or any report that groups by attendance date. Triggers on attendance, shift, check-in, checkout, late, present, absent, office hours, workday, night shift, grace period, business day.
---

# Attendance rules

This workspace runs an **overnight shift: 11:00 PM to 6:00 AM.** Every rule below exists because
naive date and time handling produces plausible-looking wrong numbers rather than errors.

## The one rule that matters

**A scan belongs to the business day the shift started on, not the calendar day it happened on.**

A shift running 23:00 Monday to 06:00 Tuesday is *one* attendance record, dated Monday. A 00:45
check-in on Tuesday's clock is a late arrival for **Monday's** shift.

Never group, filter, sort, or report on a raw calendar date. Always convert first.

## Use the helpers, don't rewrite the arithmetic

All four live in `backend/src/services/attendanceVerification.service.js` and are exported:

```js
crossesMidnight(start, end)              // "23:00","06:00" -> true
withinWindow(minutes, start, end)        // wrap-aware containment
minutesLate(checkInMinutes, startClock, graceMinutes)
businessDateKey(calendarDateKey, minutes, rules)   // calendar day -> business day
```

Times are compared as **minutes since midnight**, modulo 1440. Never compare `"HH:MM"` strings.

### The three ways this breaks

Each of these was a real bug. They fail silently — no exception, just wrong numbers.

**1. Grouping by calendar date splits one night into two rows.** The 23:20 check-in files under
Monday, the 06:05 checkout under Tuesday, and the register shows two half-days with no checkout
and no check-in. Fix: `businessDateKey(calendarKey, minutes, rules)`.

**2. Additive lateness means nobody is ever late.** `23*60 + 15 = 1395`. A 00:45 arrival is minute
`45`, and `45 > 1395` is false, so every late arrival reads as on time. `minutesLate` works modulo
1440 and treats more than half a day past the threshold as *early* — which is what keeps a 22:58
arrival at 0 late instead of 1438.

**3. Range checks can't match a wrapped window.** `minutes >= start && minutes <= end` is
unsatisfiable once `end < start`. A checkout window of 05:00–07:00 against a 23:00 start never
matches. Use `withinWindow`.

## Validation

Inverted times are **valid** — they mean an overnight shift. Only *identical* start and end are
rejected, because that is a zero-length day.

This is enforced in four places that must stay in agreement:

- `backend/src/utils/validators.js` (zod, both workday and checkout window)
- `backend/src/services/workspace.service.js` (`updateWorkspaceSettings`)
- `frontend/src/components/WorkspaceSettingsPage.jsx` (client guard)

If you add a fifth time-range setting, relax it the same way — `===`, never `>=`.

## Verifying a change

`backend/test/night-shift.test.js` is the regression suite. Run `cd backend && npm test`.

Any change to this area should keep these true for an 11 PM–6 AM shift with 15 minutes grace:

| Scan            | Business day | Late     |
| --------------- | ------------ | -------- |
| Mon 22:58       | Mon          | 0 min    |
| Mon 23:20       | Mon          | 5 min    |
| Tue 00:45       | **Mon**      | 90 min   |
| Tue 06:05       | **Mon**      | checkout |
| Tue 09:00       | Tue          | off-shift|

If a change makes Tue 00:45 land on Tuesday, it is wrong regardless of what the tests say.

## Still open

`workingDays` and `holidays` are stored as **calendar** days. For a Friday-night shift the business
day is Friday, which is correct today. But marking Saturday non-working while running Friday nights
has not been exercised — check this before relying on holiday logic for overnight shifts.
