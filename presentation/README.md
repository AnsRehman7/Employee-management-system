# Presentation

| File | What it is |
| --- | --- |
| `DayMark-FYP-Presentation.pptx` | The deck. 12 slides, 16:9, speaker notes on every slide. |
| `build_deck.py` | Regenerates the deck. Edit the text here and re-run rather than hand-editing the file. |
| `FUTURE-ML-MODEL.md` | Background notes on the model direction (superseded by the delivered model). |

## Structure

Follows the required academic format:

| Slide | Section |
| --- | --- |
| 1  | Title — name, roll no, project name (1.1) |
| 2  | Project introduction (1.2) |
| 3  | Problem statement (1.3) |
| 4  | Literature review — base paper (1.4) |
| 5  | Literature review — related work + research gap (1.4) |
| 6  | Proposed methodology — system (1.5) |
| 7  | Proposed methodology — the trained model (1.5) |
| 8  | Results — model evaluation (1.6) |
| 9  | Results — comparison with the literature (1.6) |
| 10 | Limitations, future work, conclusion (1.7) |
| 11 | References (1.8) |
| 12 | Closing |

## Before you present

1. **Slide 1 has placeholders** — replace `[ Your Full Name ]`, `[ Your Roll No ]`,
   `[ Supervisor Name ]`, `[ Department ]` and `[ University Name ]`.
2. Speaker notes are in the notes pane under each slide (View → Notes Page).
3. Fonts are Segoe UI, which ships with Windows.

## References

All six are real, published papers, verified against IEEE Xplore, the ACM Digital Library
and arXiv. [1] is the base paper and the source of the dataset; [2] is the replication
study whose finding justifies choosing a linear model over a deep network.

## Figures quoted in the deck

Measured from the repository and the training run, not estimated:

| Figure | Value |
| --- | --- |
| Lines of code | 30,574 |
| Automated tests | 110 (95 backend, 15 frontend) |
| API endpoints | 88 |
| Database models | 30 |
| Training rows | 22,612 usable of 23,313 |
| Deployed model MAE | 2.587 (baseline 2.880) |
| 5-fold CV | 2.713 ± 0.038 |

Re-measure before final submission if the code moves on.

## To regenerate

```bash
pip install python-pptx
python presentation/build_deck.py
```
