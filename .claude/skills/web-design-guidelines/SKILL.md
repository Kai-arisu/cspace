---
name: web-design-guidelines
description: Review UI code against Vercel's Web Interface Guidelines (accessibility, focus, forms, motion, typography, touch, dark mode, performance). Use when asked to review UI, check accessibility, audit design or UX, or before shipping a UI change.
---

# Web Interface Guidelines

Adapted from vercel-labs/agent-skills `web-design-guidelines` (MIT, see LICENSE). The upstream skill
fetches the rules on every run; this copy keeps them in the folder so it works offline:

- `rules.md`: the review checklist and the output format (from vercel-labs/web-interface-guidelines `command.md`)
- `guidelines.md`: the full MUST / SHOULD / NEVER guide behind it (`AGENTS.md` upstream)

To refresh both: `git clone --depth 1 https://github.com/vercel-labs/web-interface-guidelines` and copy
`command.md` to `rules.md` and `AGENTS.md` to `guidelines.md`.

## How it works

1. Read `rules.md` in full, and `guidelines.md` for any rule that needs detail.
2. Read the files to review (ask which ones if none were given). In this repo the UI lives in
   `creator-space.html`, `web/web.js`, `web/boot.js` and the stylesheets in `web/`.
3. Check every rule. Prefer measuring in a real browser (the Playwright tests in `tests/`) over guessing
   from source when a rule is about rendered output (contrast, overflow, hit-target size).
4. Report in the `file:line` format from `rules.md`, grouped by file, terse, highest impact first.
5. When asked to fix, fix in that order and re-run the affected tests.
