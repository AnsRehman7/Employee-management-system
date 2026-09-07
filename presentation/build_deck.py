"""Generates the DayMark FYP presentation deck (academic structure).

Every text helper styles EVERY paragraph and run. python-pptx turns each newline into a
new paragraph, and an unstyled paragraph silently falls back to 18pt black - invisible on
a dark panel. That is the single most important rule in this file.

Prose inside cards is never hard-wrapped with \n: word_wrap does the wrapping, and manual
breaks fight it and leave orphan words.
"""

import os

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ---------------------------------------------------------------- palette --
INK = RGBColor(0x0B, 0x12, 0x24)
SLATE = RGBColor(0x1E, 0x29, 0x3B)
BODY = RGBColor(0x3A, 0x48, 0x5C)
MUTED = RGBColor(0x6B, 0x7A, 0x90)
FAINT = RGBColor(0x9A, 0xA8, 0xBC)
ACCENT = RGBColor(0x00, 0x9E, 0x6D)
ACCENT_DK = RGBColor(0x00, 0x6B, 0x4A)
MINT = RGBColor(0xE6, 0xF7, 0xF0)
AMBER = RGBColor(0xC2, 0x6B, 0x00)
RED = RGBColor(0xC0, 0x2B, 0x2B)
RED_BG = RGBColor(0xFD, 0xEF, 0xEF)
CANVAS = RGBColor(0xF4, 0xF7, 0xFA)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LINE = RGBColor(0xDD, 0xE4, 0xED)

F = "Segoe UI"
W, H = Inches(13.333), Inches(7.5)
M = Inches(0.72)
CW = W - M * 2

prs = Presentation()
prs.slide_width, prs.slide_height = W, H
BLANK = prs.slide_layouts[6]


# ------------------------------------------------------------------ core --
def rich(slide, x, y, w, h, lines, anchor=MSO_ANCHOR.TOP, align=PP_ALIGN.LEFT, spacing=1.18):
    """lines: list of (text, size, color[, bold]) - one paragraph each, all styled."""
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, spec in enumerate(lines):
        txt_, size, color, bold = (list(spec) + [False])[:4]
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(3)
        p.line_spacing = spacing
        r = p.add_run()
        r.text = txt_
        r.font.size, r.font.bold, r.font.name = Pt(size), bold, F
        r.font.color.rgb = color
    return tb


def txt(slide, x, y, w, h, s, size=13, color=BODY, bold=False,
        align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=1.18):
    return rich(slide, x, y, w, h,
                [(ln, size, color, bold) for ln in s.split("\n")], anchor, align, spacing)


def rect(slide, x, y, w, h, fill, line=None, shape=MSO_SHAPE.ROUNDED_RECTANGLE, adj=0.055):
    s = slide.shapes.add_shape(shape, x, y, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(1)
    s.shadow.inherit = False
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        try:
            s.adjustments[0] = adj
        except Exception:
            pass
    s.text_frame.text = ""
    return s


def base(title, kicker):
    s = prs.slides.add_slide(BLANK)
    rect(s, 0, 0, W, H, CANVAS, shape=MSO_SHAPE.RECTANGLE)
    rect(s, 0, 0, Inches(0.1), H, ACCENT, shape=MSO_SHAPE.RECTANGLE)
    txt(s, M, Inches(0.40), CW, Inches(0.26), kicker.upper(), 11, ACCENT, True)
    txt(s, M, Inches(0.66), CW, Inches(0.5), title, 26, INK, True)
    return s


def foot(s, n):
    rect(s, M, Inches(7.02), CW, Pt(0.75), LINE, shape=MSO_SHAPE.RECTANGLE)
    txt(s, M, Inches(7.12), Inches(7), Inches(0.24), "DayMark  ·  Final Year Project", 9, FAINT)
    txt(s, W - M - Inches(0.5), Inches(7.12), Inches(0.5), Inches(0.24), str(n), 9, MUTED, True,
        align=PP_ALIGN.RIGHT)


def card(s, x, y, w, h, title, body, tone=ACCENT, bg=WHITE, tsize=13, bsize=10.5):
    rect(s, x, y, w, h, bg, line=LINE)
    rect(s, x, y, Inches(0.045), h, tone, shape=MSO_SHAPE.RECTANGLE)
    txt(s, x + Inches(0.24), y + Inches(0.15), w - Inches(0.42), Inches(0.26), title, tsize, INK, True)
    txt(s, x + Inches(0.24), y + Inches(0.46), w - Inches(0.42), h - Inches(0.6), body, bsize, BODY)


def chip(s, x, y, w, label, value, tone=ACCENT):
    rect(s, x, y, w, Inches(0.9), WHITE, line=LINE)
    txt(s, x + Inches(0.18), y + Inches(0.12), w - Inches(0.3), Inches(0.36), value, 20, tone, True)
    txt(s, x + Inches(0.18), y + Inches(0.54), w - Inches(0.3), Inches(0.24), label, 9, MUTED, True)


def table(s, x, y, w, headers, rows, col_w, header_bg=INK, highlight=None):
    """Simple table. highlight = index of the row to emphasise."""
    rowh = Inches(0.42)
    rect(s, x, y, w, rowh, header_bg)
    cx = x + Inches(0.2)
    for i, head in enumerate(headers):
        txt(s, cx, y + Inches(0.12), col_w[i], Inches(0.24), head, 10, WHITE, True)
        cx += col_w[i]
    for r, row in enumerate(rows):
        ry = y + rowh + (rowh * r)
        on = highlight == r
        rect(s, x, ry, w, rowh, MINT if on else WHITE, line=LINE)
        cx = x + Inches(0.2)
        for i, cell in enumerate(row):
            txt(s, cx, ry + Inches(0.13), col_w[i], Inches(0.24), str(cell), 10.5,
                ACCENT_DK if on else BODY, on)
            cx += col_w[i]


# ================================================= 1 · TITLE =============
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, W, H, INK, shape=MSO_SHAPE.RECTANGLE)
rect(s, 0, 0, Inches(0.14), H, ACCENT, shape=MSO_SHAPE.RECTANGLE)
rect(s, Inches(8.6), 0, Inches(4.733), H, SLATE, shape=MSO_SHAPE.RECTANGLE)

txt(s, Inches(1.0), Inches(1.25), Inches(7), Inches(0.3),
    "FINAL YEAR PROJECT   ·   BS COMPUTER SCIENCE", 11.5, ACCENT, True)
txt(s, Inches(1.0), Inches(1.70), Inches(7.2), Inches(0.9), "DayMark", 50, WHITE, True)
rich(s, Inches(1.0), Inches(2.72), Inches(7.0), Inches(1.0), [
    ("A Workforce and Project-Delivery Platform with", 16, RGBColor(0xC9, 0xD6, 0xE4)),
    ("Machine-Learning-Based Task Effort Estimation", 16, RGBColor(0xC9, 0xD6, 0xE4)),
])
rect(s, Inches(1.0), Inches(3.80), Inches(1.3), Pt(3), ACCENT, shape=MSO_SHAPE.RECTANGLE)

rich(s, Inches(1.0), Inches(4.20), Inches(7.0), Inches(1.7), [
    ("PRESENTED BY", 9.5, ACCENT, True),
    ("[ Your Full Name ]        Roll No: [ Your Roll No ]", 14, WHITE),
    ("", 6, WHITE),
    ("SUPERVISOR", 9.5, ACCENT, True),
    ("[ Supervisor Name ]", 14, WHITE),
])
txt(s, Inches(1.0), Inches(6.45), Inches(7), Inches(0.3),
    "[ Department ]  ·  [ University Name ]  ·  September 2026", 11, RGBColor(0x8D, 0x9C, 0xB2))

agenda = [("01", "Introduction"), ("02", "Problem Statement"), ("03", "Literature Review"),
          ("04", "Proposed Methodology"), ("05", "Results & Comparison"),
          ("06", "Limitations & Conclusion"), ("07", "References")]
txt(s, Inches(9.15), Inches(1.25), Inches(3.6), Inches(0.26), "CONTENTS", 9.5, ACCENT, True)
for i, (n, t) in enumerate(agenda):
    y = Inches(1.68) + Inches(0.62) * i
    txt(s, Inches(9.15), y, Inches(0.5), Inches(0.26), n, 11, ACCENT, True)
    txt(s, Inches(9.70), y - Inches(0.02), Inches(3.2), Inches(0.3), t, 13, WHITE)

# ================================================= 2 · INTRODUCTION ======
s = base("Project introduction", "1.2  Introduction")
txt(s, M, Inches(1.22), CW, Inches(0.5),
    "DayMark is a workforce, attendance and project-delivery platform for organisations that run shift-based "
    "operations. It unifies verified attendance, project planning and delivery tracking in one multi-tenant system, "
    "and adds a machine-learning model that estimates the effort of each task from its written description.", 13, BODY)

cards = [
    ("Verified attendance", "GPS geofencing with radius and accuracy limits, one-time challenge tokens per scan, and business-day logic that correctly handles shifts crossing midnight.", ACCENT),
    ("Project delivery", "Projects and tasks with Kanban and list views, dependency graphs, time logging, and weighted progress derived from predicted task effort.", ACCENT),
    ("Trained effort model", "A TF-IDF and Ridge regression model, trained by us on 22,612 real Jira issues, that predicts each task's effort and derives its share of project scope.", AMBER),
    ("Language-model assistant", "A natural-language interface that drafts project plans and creates tasks, constrained by an action allowlist and a mandatory human confirmation step.", AMBER),
]
for i, (t, b, tone) in enumerate(cards):
    x = M if i % 2 == 0 else M + Inches(6.06)
    y = Inches(2.02) + Inches(1.62) * (i // 2)
    card(s, x, y, Inches(5.83), Inches(1.42), t, b, tone)

for i, (v, l) in enumerate([("3", "APPLICATIONS"), ("30,574", "LINES OF CODE"),
                            ("110", "AUTOMATED TESTS"), ("88", "API ENDPOINTS")]):
    chip(s, M + Inches(2.99) * i, Inches(5.42), Inches(2.72), l, v)
txt(s, M, Inches(6.48), CW, Inches(0.3),
    "Web application (React), REST API (Node and PostgreSQL), and an Android attendance client, sharing one database and one permission model.",
    10.5, MUTED)
foot(s, 2)

# ================================================= 3 · PROBLEM ===========
s = base("Problem statement", "1.3  Problem")
probs = [
    ("01", "Effort estimation is manual and subjective",
     "Assigning effort to tasks is done by hand and depends on the estimator's experience, making it slow "
     "and inconsistent across a team.",
     "Porru et al., 2016 [3]"),
    ("02", "Overnight shifts break calendar-day logic",
     "A shift from 11:00 PM to 6:00 AM crosses midnight, so software that groups attendance by calendar date "
     "splits one night into two incomplete records.",
     "Observed in our deployment"),
    ("03", "Attendance records cannot be verified",
     "Manual registers and shared devices make proxy marking trivial, and nothing establishes that the employee "
     "was physically present.",
     "Motivating requirement"),
    ("04", "Estimation research is not deployed",
     "Published estimators are evaluated offline on historical datasets; they are rarely integrated into a "
     "working delivery system where their output drives anything.",
     "Gap identified in [1], [2], [4]"),
]
for i, (n, t, b, ref) in enumerate(probs):
    y = Inches(1.28) + Inches(1.32) * i
    rect(s, M, y, CW, Inches(1.18), WHITE, line=LINE)
    rect(s, M, y, Inches(0.045), Inches(1.18), ACCENT, shape=MSO_SHAPE.RECTANGLE)
    txt(s, M + Inches(0.26), y + Inches(0.16), Inches(0.6), Inches(0.3), n, 18, RGBColor(0xA8, 0xD8, 0xC4), True)
    txt(s, M + Inches(0.95), y + Inches(0.14), Inches(7.6), Inches(0.3), t, 14, INK, True)
    txt(s, M + Inches(0.95), y + Inches(0.46), Inches(7.7), Inches(0.6), b, 10.5, BODY)
    rect(s, M + Inches(8.95), y + Inches(0.34), Inches(2.8), Inches(0.5), MINT)
    txt(s, M + Inches(9.1), y + Inches(0.48), Inches(2.6), Inches(0.3), ref, 9.5, ACCENT_DK, True)
foot(s, 3)

# ================================================= 4 · BASE PAPER ========
s = base("Literature review — base paper", "1.4  Literature Review")

rect(s, M, Inches(1.24), CW, Inches(1.28), INK)
txt(s, M + Inches(0.3), Inches(1.40), Inches(10), Inches(0.24), "BASE PAPER", 9.5, ACCENT, True)
rich(s, M + Inches(0.3), Inches(1.68), CW - Inches(0.6), Inches(0.8), [
    ("“A Deep Learning Model for Estimating Story Points”  (Deep-SE)", 15, WHITE, True),
    ("Choetkiertikul, Dam, Tran, Pham, Ghose and Menzies · IEEE Transactions on Software Engineering, 45(7), 2019 [1]",
     11, RGBColor(0xAF, 0xC4, 0xD4)),
])

card(s, M, Inches(2.68), Inches(5.83), Inches(1.86), "What the paper proposes",
     "A deep learning estimator combining Long Short-Term Memory with a Recurrent Highway Network, predicting "
     "story points directly from an issue's title and description without hand-crafted features.")
card(s, M + Inches(6.06), Inches(2.68), Inches(5.83), Inches(1.86), "Why it is our base paper",
     "It introduced the benchmark dataset used in this project: 23,313 issues from 16 open-source projects across "
     "nine repositories, each labelled with a story point value assigned by the team that did the work.", AMBER)

txt(s, M, Inches(4.76), CW, Inches(0.28), "What we take from it, and where we differ", 14, INK, True)
for i, (a, b) in enumerate([
    ("Dataset", "we train on the same 16-project corpus, so our results are comparable to published work"),
    ("Task formulation", "identical: predict a numeric effort value from issue text alone"),
    ("Model choice", "we deliberately use a simpler, interpretable estimator rather than a deep network — justified on the next slide"),
    ("Contribution", "we integrate the estimator into a live delivery system, where its output drives project progress"),
]):
    y = Inches(5.14) + Inches(0.46) * i
    rect(s, M + Inches(0.05), y + Inches(0.08), Inches(0.1), Inches(0.1), ACCENT, shape=MSO_SHAPE.OVAL)
    txt(s, M + Inches(0.32), y, Inches(2.2), Inches(0.26), a, 11.5, ACCENT_DK, True)
    txt(s, M + Inches(2.5), y, Inches(9.2), Inches(0.4), b, 11, BODY)
foot(s, 4)

# ================================================= 5 · RELATED WORK ======
s = base("Literature review — related work", "1.4  Literature Review")
rows = [
    ["Porru et al., 2016 [3]", "TF-IDF features with an SVM classifier", "Showed issue text alone carries enough signal to estimate effort"],
    ["Scott & Pfahl, 2018 [5]", "Adds developer-specific features", "Who does the work affects effort, not only what the work is"],
    ["Fu & Tantithamthavorn, 2023 [4]", "GPT2SP, a GPT-2 transformer estimator", "Transformers improve accuracy but need substantial compute"],
    ["Tawosi et al., 2023 [2]", "Close replication of Deep-SE", "Deep-SE beat simple baselines in only 8 of 42 cases"],
]
table(s, M, Inches(1.26), CW,
      ["STUDY", "APPROACH", "KEY FINDING"], rows,
      [Inches(3.0), Inches(3.6), Inches(5.2)], highlight=3)

rect(s, M, Inches(3.36), CW, Inches(1.5), MINT)
txt(s, M + Inches(0.3), Inches(3.52), Inches(10), Inches(0.26),
    "THE FINDING THAT SHAPED OUR METHODOLOGY", 9.5, ACCENT_DK, True)
txt(s, M + Inches(0.3), Inches(3.82), CW - Inches(0.6), Inches(0.9),
    "Tawosi, Moussa and Sarro replicated Deep-SE and found it outperformed a median baseline and a TF-IDF/SVM "
    "estimator with statistical significance in only 8 of 42 and 9 of 32 cases respectively [2]. Deep learning "
    "therefore offers no consistent advantage on this dataset, which justifies selecting a simpler, faster and "
    "interpretable model for a system that must run inside a serverless function.", 12, SLATE)

txt(s, M, Inches(5.08), CW, Inches(0.28), "Research gap", 14, INK, True)
txt(s, M, Inches(5.44), CW, Inches(1.2),
    "All four studies evaluate estimators offline, in isolation from any system that would consume their output. "
    "None deploys an estimator inside a working project-management tool, and none reports what happens when the "
    "predicted effort is used to drive a live progress metric. This project addresses that gap: the trained model "
    "runs in production and its predictions determine how project completion is calculated.", 12, BODY)
foot(s, 5)

# ================================================= 6 · METHODOLOGY A =====
s = base("Proposed methodology — system", "1.5  Methodology")
tiers = [("Web application", "React 19 · Vite · Tailwind", "Netlify"),
         ("REST API", "Express · Prisma · PostgreSQL", "Vercel serverless"),
         ("Mobile client", "React Native · Android", "Signed APK")]
for i, (t, stack_t, host) in enumerate(tiers):
    x = M + Inches(3.99) * i
    rect(s, x, Inches(1.24), Inches(3.72), Inches(1.2), WHITE, line=LINE)
    rect(s, x, Inches(1.24), Inches(3.72), Inches(0.05), ACCENT, shape=MSO_SHAPE.RECTANGLE)
    txt(s, x + Inches(0.26), Inches(1.42), Inches(3.2), Inches(0.26), t, 13.5, INK, True)
    txt(s, x + Inches(0.26), Inches(1.72), Inches(3.2), Inches(0.28), stack_t, 10.5, BODY)
    txt(s, x + Inches(0.26), Inches(2.06), Inches(3.2), Inches(0.24), host.upper(), 9, ACCENT, True)

rect(s, M, Inches(2.62), CW, Inches(0.66), INK)
rich(s, M + Inches(0.3), Inches(2.74), CW - Inches(0.6), Inches(0.5), [
    ("Shared REST API   ·   88 endpoints   ·   authentication and permission check on every route", 12, WHITE, True),
    ("routes (authenticate + authorise)  →  controllers (validate)  →  services (business logic, tenant scoping)", 10.5, RGBColor(0x9F, 0xC7, 0xB6)),
])

txt(s, M, Inches(3.50), CW, Inches(0.28), "Design decisions", 14, INK, True)
decisions = [
    ("Multi-tenant isolation", "every database query is scoped by organisation, so one deployment serves many companies without data leakage"),
    ("Two-layer authorisation", "the route declares the permission required; the service independently verifies record ownership"),
    ("Business-day attendance engine", "a scan after midnight is attributed to the day the shift began, shared by attendance, reporting and the calendar"),
    ("Deterministic fallbacks", "every AI-assisted feature has a non-AI path, so the system remains usable when a provider is unavailable"),
]
for i, (a, b) in enumerate(decisions):
    y = Inches(3.88) + Inches(0.52) * i
    rect(s, M + Inches(0.05), y + Inches(0.09), Inches(0.1), Inches(0.1), ACCENT, shape=MSO_SHAPE.OVAL)
    txt(s, M + Inches(0.32), y, Inches(3.1), Inches(0.26), a, 11.5, ACCENT_DK, True)
    txt(s, M + Inches(3.5), y, Inches(8.2), Inches(0.45), b, 11, BODY)

rect(s, M, Inches(6.06), CW, Inches(0.66), MINT)
txt(s, M + Inches(0.3), Inches(6.24), CW - Inches(0.6), Inches(0.32),
    "PostgreSQL (30 relational models, 16 migrations)  ·  Redis for one-time codes and rate limits  ·  "
    "Firebase authentication  ·  LLM provider with automatic failover", 11, SLATE, True)
foot(s, 6)

# ================================================= 7 · METHODOLOGY B =====
s = base("Proposed methodology — the trained model", "1.5  Methodology")
steps = [("Dataset", "23,313 labelled\nissues [1]"), ("Preprocess", "clean text,\n22,612 usable"),
         ("Vectorise", "TF-IDF, 4,000\nterms, 1–2 grams"), ("Train", "Ridge regression\n80/20 split"),
         ("Deploy", "export to JSON,\ninfer in Node")]
for i, (t, b) in enumerate(steps):
    x = M + Inches(2.42) * i
    rect(s, x, Inches(1.24), Inches(2.16), Inches(1.14), WHITE, line=LINE)
    txt(s, x + Inches(0.16), Inches(1.38), Inches(1.9), Inches(0.26), t, 12.5, INK, True)
    txt(s, x + Inches(0.16), Inches(1.68), Inches(1.92), Inches(0.62), b, 9.5, BODY)
    if i < 4:
        txt(s, x + Inches(2.14), Inches(1.70), Inches(0.3), Inches(0.3), "→", 15, ACCENT, True)

txt(s, M, Inches(2.62), Inches(5.83), Inches(0.28), "Model specification", 13.5, INK, True)
for i, (a, b) in enumerate([
    ("Input", "issue title concatenated with its description"),
    ("Representation", "TF-IDF, unigrams and bigrams, 4,000 features, min_df = 3"),
    ("Estimator", "Ridge regression (L2 regularised linear model), α = 1.0"),
    ("Target", "story points, clipped to the 1–21 range observed in training"),
    ("Validation", "80/20 hold-out split plus 5-fold cross-validation"),
]):
    y = Inches(3.00) + Inches(0.44) * i
    txt(s, M, y, Inches(1.8), Inches(0.26), a, 11, ACCENT_DK, True)
    txt(s, M + Inches(1.85), y, Inches(3.9), Inches(0.4), b, 10.5, BODY)

txt(s, M + Inches(6.06), Inches(2.62), Inches(5.83), Inches(0.28), "Why a linear model, not a deep network", 13.5, INK, True)
for i, (a, b) in enumerate([
    ("Evidence", "a published replication found deep learning gave no consistent gain on this dataset [2]"),
    ("Interpretability", "coefficients show which words drive an estimate, which a reviewer can inspect"),
    ("Deployability", "a Ridge prediction is a dot product, so inference was ported to JavaScript and runs inside the existing API"),
    ("Cost", "no model server, no GPU, no per-request charge, and no network call at prediction time"),
]):
    y = Inches(3.00) + Inches(0.62) * i
    txt(s, M + Inches(6.06), y, Inches(1.5), Inches(0.26), a, 11, ACCENT_DK, True)
    txt(s, M + Inches(7.6), y, Inches(4.3), Inches(0.6), b, 10.5, BODY)

rect(s, M, Inches(5.66), CW, Inches(1.06), INK)
txt(s, M + Inches(0.3), Inches(5.82), Inches(10), Inches(0.24), "INTEGRATION", 9.5, ACCENT, True)
txt(s, M + Inches(0.3), Inches(6.10), CW - Inches(0.6), Inches(0.5),
    "Predicted efforts are normalised into project weights summing to 100. Completing a task advances project "
    "progress in proportion to its predicted effort, so the model's output drives a metric users act on.", 11.5, WHITE)
foot(s, 7)

# ================================================= 8 · RESULTS ===========
s = base("Results — model evaluation", "1.6  Results")
txt(s, M, Inches(1.20), CW, Inches(0.3),
    "Trained on 18,089 issues and evaluated on 4,523 held-out issues the model had never seen. "
    "Lower MAE and RMSE are better; higher R² is better.", 12, BODY)

rows = [
    ["Baseline (mean predictor)", "2.880", "3.955", "0.000", "23.3%"],
    ["Random Forest + SVD", "2.665", "3.657", "+0.144", "24.2%"],
    ["Ridge + TF-IDF  (deployed)", "2.587", "3.575", "+0.182", "27.9%"],
]
table(s, M, Inches(1.66), CW, ["MODEL", "MAE", "RMSE", "R²", "WITHIN ±1"], rows,
      [Inches(4.6), Inches(1.7), Inches(1.7), Inches(1.7), Inches(2.0)], highlight=2)

for i, (v, l, tone) in enumerate([("2.587", "MAE, DEPLOYED MODEL", ACCENT),
                                  ("10.2%", "ERROR REDUCTION VS BASELINE", ACCENT),
                                  ("±0.038", "5-FOLD CV DEVIATION", ACCENT),
                                  ("22,612", "TRAINING EXAMPLES", MUTED)]):
    chip(s, M + Inches(2.99) * i, Inches(3.46), Inches(2.72), l, v, tone)

txt(s, M, Inches(4.58), CW, Inches(0.28), "Interpretation", 14, INK, True)
for i, (a, b) in enumerate([
    ("The model learns from text", "it reduces mean absolute error by 10.2% against a baseline that always predicts the training mean, and the baseline's R² of 0.000 confirms that baseline explains none of the variance"),
    ("The result is stable", "5-fold cross-validation gives 2.713 ± 0.038, so performance does not depend on a favourable split"),
    ("Linear beats trees here", "Ridge outperformed Random Forest on every metric, consistent with sparse high-dimensional text features"),
]):
    y = Inches(4.96) + Inches(0.56) * i
    rect(s, M + Inches(0.05), y + Inches(0.09), Inches(0.1), Inches(0.1), ACCENT, shape=MSO_SHAPE.OVAL)
    txt(s, M + Inches(0.32), y, Inches(2.9), Inches(0.26), a, 11.5, ACCENT_DK, True)
    txt(s, M + Inches(3.3), y, Inches(8.4), Inches(0.5), b, 10.5, BODY)
foot(s, 8)

# ================================================= 9 · COMPARISON ========
s = base("Results — comparison with the literature", "1.6  Comparison")
txt(s, M, Inches(1.20), CW, Inches(0.3),
    "Reported mean absolute error on the same 16-project benchmark corpus.", 12, BODY)

rows = [
    ["Deep-SE — LSTM + RHN [1]", "Deep learning", "Within-project", "1.29 – 5.97"],
    ["TF-IDF + SVM baseline [2]", "Classical ML", "Within-project", "comparable to Deep-SE"],
    ["Median baseline [2]", "Statistical", "Within-project", "competitive in 34 of 42 cases"],
    ["This work — Ridge + TF-IDF", "Classical ML", "Cross-project (pooled)", "2.587"],
]
table(s, M, Inches(1.62), CW, ["APPROACH", "FAMILY", "EVALUATION", "MAE"], rows,
      [Inches(4.3), Inches(2.3), Inches(3.0), Inches(2.3)], highlight=3)

rect(s, M, Inches(3.82), CW, Inches(1.30), RED_BG, line=RGBColor(0xF2, 0xC7, 0xC7))
txt(s, M + Inches(0.3), Inches(3.96), Inches(10), Inches(0.26),
    "AN HONEST NOTE ON THIS COMPARISON", 9.5, RED, True)
txt(s, M + Inches(0.3), Inches(4.24), CW - Inches(0.6), Inches(0.8),
    "These figures are not directly comparable. Published results are per-project: a model is trained and tested "
    "within a single project, where the team's scale is consistent. Our model is trained across all 16 projects at "
    "once, where a story point of 5 means different things in different organisations. Cross-project estimation is "
    "the harder setting, and is reported as such in the literature.", 11.5, SLATE)

txt(s, M, Inches(5.34), CW, Inches(0.28), "What the comparison does establish", 14, INK, True)
for i, (a, b) in enumerate([
    ("Our result is in the published range", "2.587 sits inside the 1.29–5.97 band Deep-SE reports across projects, despite the harder cross-project setting"),
    ("The simpler model was the right choice", "the replication study [2] found deep learning gave no consistent advantage, and our deployment constraints favoured a linear model"),
]):
    y = Inches(5.70) + Inches(0.58) * i
    rect(s, M + Inches(0.05), y + Inches(0.09), Inches(0.1), Inches(0.1), ACCENT, shape=MSO_SHAPE.OVAL)
    txt(s, M + Inches(0.32), y, Inches(3.4), Inches(0.26), a, 11.5, ACCENT_DK, True)
    txt(s, M + Inches(3.8), y, Inches(7.9), Inches(0.5), b, 10.5, BODY)
foot(s, 9)

# ================================================= 10 · LIMITATIONS ======
s = base("Limitations and future work", "1.7  Limitations & Future Work")

txt(s, M, Inches(1.22), Inches(5.83), Inches(0.28), "Limitations", 14, RED, True)
for i, (a, b) in enumerate([
    ("Cross-project scale variance", "story points are not calibrated across organisations, which bounds achievable accuracy"),
    ("Moderate explanatory power", "an R² of 0.182 means most variance in effort is not explained by issue text alone"),
    ("Text-only features", "the model ignores assignee history, dependencies and project phase, all known to affect effort [5]"),
    ("Open-source training data", "the corpus is drawn from open-source projects, which may not transfer to commercial teams"),
]):
    y = Inches(1.60) + Inches(0.86) * i
    rect(s, M, y, Inches(5.83), Inches(0.76), RED_BG, line=RGBColor(0xF2, 0xC7, 0xC7))
    txt(s, M + Inches(0.24), y + Inches(0.12), Inches(5.3), Inches(0.26), a, 11.5, RED, True)
    txt(s, M + Inches(0.24), y + Inches(0.40), Inches(5.4), Inches(0.34), b, 10, BODY)

txt(s, M + Inches(6.06), Inches(1.22), Inches(5.83), Inches(0.28), "Future work", 14, ACCENT_DK, True)
for i, (a, b) in enumerate([
    ("Per-project fine-tuning", "retrain on each workspace's own history once enough completed tasks exist, removing the scale-variance problem"),
    ("Richer feature set", "add assignee history, dependency count and task category alongside the text representation"),
    ("Attendance fraud detection", "an anomaly-detection model over the GPS, accuracy and device signals already recorded for every scan"),
    ("Continuous evaluation", "compare predicted effort against logged hours as they accumulate, and report drift over time"),
]):
    y = Inches(1.60) + Inches(0.86) * i
    rect(s, M + Inches(6.06), y, Inches(5.83), Inches(0.76), MINT)
    txt(s, M + Inches(6.30), y + Inches(0.12), Inches(5.3), Inches(0.26), a, 11.5, ACCENT_DK, True)
    txt(s, M + Inches(6.30), y + Inches(0.40), Inches(5.4), Inches(0.34), b, 10, SLATE)

rect(s, M, Inches(5.22), CW, Inches(1.5), INK)
txt(s, M + Inches(0.3), Inches(5.38), Inches(10), Inches(0.24), "CONCLUSION", 9.5, ACCENT, True)
txt(s, M + Inches(0.3), Inches(5.66), CW - Inches(0.6), Inches(0.9),
    "DayMark delivers a complete, deployed workforce and project-delivery platform across three applications, "
    "including a correct treatment of overnight-shift attendance that conventional calendar-day logic gets wrong. "
    "Its machine-learning component was trained by us on a published benchmark corpus, evaluated against a "
    "statistical baseline and cross-validated, and — unlike the prior work surveyed here — it runs in production, "
    "where its predictions determine how project progress is calculated.", 11.5, WHITE)
foot(s, 10)

# ================================================= 11 · REFERENCES =======
s = base("References", "1.8  References")
refs = [
    ("[1]", "M. Choetkiertikul, H. K. Dam, T. Tran, T. Pham, A. Ghose and T. Menzies,",
     "“A Deep Learning Model for Estimating Story Points,” IEEE Transactions on Software Engineering, "
     "vol. 45, no. 7, pp. 637–656, 2019.   —  base paper and source of the dataset"),
    ("[2]", "V. Tawosi, R. Moussa and F. Sarro,",
     "“Agile Effort Estimation: Have We Solved the Problem Yet? Insights From a Replication Study,” "
     "IEEE Transactions on Software Engineering, 2023. doi:10.1109/TSE.2022.3228739"),
    ("[3]", "S. Porru, A. Murgia, S. Demeyer, M. Marchesi and R. Tonelli,",
     "“Estimating Story Points from Issue Reports,” Proc. 12th Int. Conf. on Predictive Models in "
     "Software Engineering (PROMISE), 2016. doi:10.1145/2972958.2972959"),
    ("[4]", "M. Fu and C. Tantithamthavorn,",
     "“GPT2SP: A Transformer-Based Agile Story Point Estimation Approach,” IEEE Transactions on "
     "Software Engineering, vol. 49, no. 2, pp. 611–625, 2023."),
    ("[5]", "E. Scott and D. Pfahl,",
     "“Using Developers' Features to Estimate Story Points,” in Proc. Int. Conf. on Software and "
     "System Process (ICSSP), 2018. doi:10.1145/3202710.3203160"),
    ("[6]", "V. Tawosi, R. Moussa and F. Sarro,",
     "“Agile Effort Estimation: Have We Solved the Problem Yet? Insights From a Second Replication Study "
     "(GPT2SP Replication Report),” arXiv:2209.00437, 2022."),
]
for i, (n, authors, rest) in enumerate(refs):
    y = Inches(1.26) + Inches(0.92) * i
    rect(s, M, y, CW, Inches(0.82), WHITE, line=LINE)
    txt(s, M + Inches(0.24), y + Inches(0.14), Inches(0.5), Inches(0.26), n, 12, ACCENT, True)
    txt(s, M + Inches(0.78), y + Inches(0.12), Inches(10.9), Inches(0.26), authors, 11, INK, True)
    txt(s, M + Inches(0.78), y + Inches(0.40), Inches(10.9), Inches(0.36), rest, 10, BODY)
foot(s, 11)

# ================================================= 12 · CLOSING ==========
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, W, H, INK, shape=MSO_SHAPE.RECTANGLE)
rect(s, 0, 0, Inches(0.14), H, ACCENT, shape=MSO_SHAPE.RECTANGLE)
txt(s, Inches(1.0), Inches(1.30), Inches(9), Inches(0.28), "SUMMARY", 11.5, ACCENT, True)
txt(s, Inches(1.0), Inches(1.70), Inches(11), Inches(0.7), "Thank you", 40, WHITE, True)
rect(s, Inches(1.0), Inches(2.58), Inches(1.3), Pt(3), ACCENT, shape=MSO_SHAPE.RECTANGLE)

pts = [("Deployed platform", "three applications on one database, one permission model, in production"),
       ("A model we trained", "TF-IDF and Ridge regression on 22,612 labelled issues from a published benchmark"),
       ("Evaluated honestly", "10.2% below the statistical baseline, cross-validated at 2.713 ± 0.038"),
       ("Research put to work", "unlike the prior studies surveyed, the estimator runs live and drives project progress")]
for i, (t, b) in enumerate(pts):
    y = Inches(2.98) + Inches(0.82) * i
    rect(s, Inches(1.0), y + Inches(0.06), Inches(0.04), Inches(0.54), ACCENT, shape=MSO_SHAPE.RECTANGLE)
    txt(s, Inches(1.26), y, Inches(4.0), Inches(0.3), t, 14, WHITE, True)
    txt(s, Inches(5.4), y + Inches(0.02), Inches(7.0), Inches(0.55), b, 11.5, RGBColor(0xA9, 0xBC, 0xCE))

rect(s, Inches(1.0), Inches(6.30), Inches(3.4), Inches(0.64), ACCENT)
txt(s, Inches(1.0), Inches(6.47), Inches(3.4), Inches(0.32), "Live demonstration", 14.5, WHITE, True, align=PP_ALIGN.CENTER)
txt(s, Inches(4.9), Inches(6.48), Inches(7), Inches(0.3), "Questions welcome", 13, FAINT)

# ------------------------------------------------------------- notes -----
NOTES = [
 "Introduce yourself and the project in one line: DayMark is a workforce and project-delivery platform whose machine-learning component estimates task effort from text. Point at the contents list and say the demo is at the end.",
 "Keep this brief. The four cards are the scope; the two amber ones are the AI contribution. The numbers at the bottom establish that this is a substantial, working system rather than a prototype.",
 "Problems 1 and 4 are the research problems - they lead into the literature review. Problems 2 and 3 are the engineering problems specific to our deployment. The overnight-shift issue is worth pausing on: our own workspace runs 11 PM to 6 AM and that is what exposed it.",
 "Name the base paper clearly and say what we take from it: the dataset and the task formulation. Be explicit that we deliberately did not copy their model, and that the reason comes on the next slide. If asked why not deep learning, the answer is slide 5.",
 "This is the most important slide for the viva. The Tawosi replication is the evidence that justifies our whole methodology: deep learning gave no consistent advantage on this exact dataset. Then state the gap - all four studies are offline, none deploys the estimator anywhere.",
 "Move quickly. The panel needs to see the system is real and layered. If asked why serverless: it costs nothing at student scale, and the trade-off is no shared memory, which is why sessions and one-time codes live in Redis.",
 "Walk the pipeline left to right, then give the three reasons for a linear model: published evidence, interpretability, deployability. The integration box is the point - the model is not a side experiment, its output drives the progress metric.",
 "Give the table a moment. The line to emphasise is the baseline: a model that always predicts the mean has an R-squared of zero, and ours beats it by 10.2%. Mention cross-validation - it shows the result is not a lucky split.",
 "Be the first to raise the caveat, before the panel does. Published numbers are within-project; ours is cross-project, which is the harder setting. Saying this yourself demonstrates you understand your own evaluation.",
 "Do not rush the limitations - being able to state them precisely is what distinguishes understanding from repetition. The R-squared of 0.182 is the honest one: most of the variance is not explained by text alone.",
 "Do not read the references aloud. Note that [1] is the base paper and the source of the dataset, and [2] is the replication that justified the model choice.",
 "Close on the four points, then move straight into the live demo.",
]
for slide, note in zip(prs.slides, NOTES):
    slide.notes_slide.notes_text_frame.text = note

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "DayMark-FYP-Presentation.pptx")
prs.save(out)
print("Saved:", out, "| slides:", len(prs.slides._sldIdLst))
