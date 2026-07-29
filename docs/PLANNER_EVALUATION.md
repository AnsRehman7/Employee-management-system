# Explainable Planner Evaluation

## Research Contribution

The question is not whether an LLM can produce a task list. It is whether a hybrid, explainable planner can reduce planning effort while preserving requirement coverage and reducing constraint violations under real workforce limits.

Suggested research question:

> How does an explainable constraint-aware AI planning workflow affect planning time, requirement coverage, schedule feasibility, estimation accuracy, and manager intervention compared with manual and unconstrained AI planning?

## Testable Hypotheses

- **H1:** StaffFlow reduces median planning time versus manual planning.
- **H2:** Traceability yields higher requirement coverage than an unconstrained task-list prompt.
- **H3:** Calendar/capacity/dependency scheduling yields fewer violations than unconstrained AI planning.
- **H4:** Explanations and mandatory review keep unsafe automatic assignments at zero while producing a measurable, decreasing override rate.
- **H5:** Effort-estimation error decreases after repeated evaluated projects provide better local evidence.

## Stored Evidence

Each plan version stores its source (`GROQ` or deterministic fallback), generation duration, warnings, immutable requirements/task snapshots, confidence, risks, traceability, dependency keys, schedule, recommended/approved assignees, recommendation reasons, manager baseline time, and review duration. Approval and evaluation create audit records.

The Reports page and CSV export expose the evaluated observations without inventing values for unfinished projects.

## Metric Definitions

| Metric | Definition |
| --- | --- |
| Requirement coverage | `100 * unique requirements referenced by at least one task / total requirements` |
| Schedule violations | Count of completed materialized tasks finished after their planned end |
| Dependency violations | Count of completed tasks whose predecessor was unfinished or completed later |
| Effort MAE | `mean(abs(actual logged hours - planned hours))` over completed tasks |
| Manager override rate | `100 * approved assignments differing from recommendations / planned tasks` |
| Planning time saved | `max(0, manager manual baseline minutes - recorded review minutes)` |
| Completion rate | `100 * completed materialized tasks / materialized tasks` |
| Fallback rate | `100 * deterministic plans / generated plans` |

Report `n`, median, interquartile range, and confidence intervals alongside means. A percentage without sample size is not defensible evidence.

## Experiment Design

Use a within-subject counterbalanced study with at least three planning conditions:

1. Manual planning using the same project brief and employee roster.
2. Unconstrained AI task generation without traceability or scheduling checks.
3. StaffFlow planner with constraint checks, explanations, and human approval.

Recruit several participants with project-management or senior-student experience. Prepare small, medium, and large project briefs with known requirements, skills, deadlines, calendars, dependencies, and seeded conflicts. Randomize condition order to reduce learning effects.

For each session, capture start/end time, final plan, uncovered requirements, dependency/schedule violations, assignment overrides, System Usability Scale or a short consistent usability instrument, and qualitative explanation feedback. Do not compare different briefs as if they were identical trials.

For completed real projects, record time logs and completion timestamps, then evaluate the approved plan once delivery evidence is sufficient. Treat incomplete-task effort MAE as missing rather than zero.

## Analysis

- Compare paired planning times and violation counts with a paired test appropriate to distribution (paired t-test or Wilcoxon signed-rank).
- Report effect size and confidence intervals, not only p-values.
- Analyze requirement coverage and override rate by project complexity.
- Separate Groq plans from deterministic fallbacks.
- Review low-confidence plans as a subgroup and compare confidence bands with observed error.
- Code manager comments into recurring themes such as missing scope, skill mismatch, unrealistic estimates, and explanation usefulness.

## Validity and Ethics

- **Construct validity:** predefine what counts as a requirement and violation before scoring.
- **Internal validity:** counterbalance order and keep input data identical across conditions.
- **External validity:** state that student/demo teams may not represent commercial organizations.
- **Conclusion validity:** avoid strong claims from a tiny sample; publish raw anonymized observations where consent allows.
- Obtain informed consent, anonymize employee data, and do not use employment outcomes to evaluate individuals.
- Present recommendations as decision support. The manager remains accountable and can leave tasks unassigned.

## Reproducibility Checklist

- Record application commit, model name, planner source, prompt/schema version, seed dataset, timezone, working calendar, and participant condition order.
- Export planner evaluation CSV after each study batch.
- Keep a read-only copy of approved plan snapshots and scoring rubric.
- Publish aggregate results and clearly label missing observations and fallback runs.
