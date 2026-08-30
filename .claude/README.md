# .claude

Project configuration for Claude Code, checked in so every session and teammate starts with the
same context instead of rediscovering it.

- `../CLAUDE.md` — loaded into **every** session automatically. Deliberately short; only
  project-wide invariants belong there.
- `skills/` — loaded **on demand**, when a task matches the skill's `description`. Detail lives
  here so it costs nothing until it's relevant.
- `settings.json` — shared settings, including an allowlist of read-only commands so routine
  inspection doesn't prompt.

## Adding a skill

Create `skills/<name>/SKILL.md` with frontmatter:

```markdown
---
name: my-skill
description: What it covers and when to load it, with the words someone would actually type.
---
```

The `description` is the only part read until the skill loads, so it decides whether the skill is
ever found. Write it as trigger conditions, not a summary.

Worth writing a skill when knowledge is **non-obvious, easy to get wrong, and expensive to
rediscover** — a trap that has already caused a bug, a procedure with a required order, a rule that
fails silently. Not worth it for anything readable from the code in a few seconds.
