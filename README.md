# Creator Space

One workspace for YouTube and Instagram creators: ideas, notes and scripts, a progress board,
calendar, live channel numbers, sponsor deals, a public page and a team. Live at
https://cspace.cashteaates009.workers.dev, plus Windows, macOS and Linux apps.

## Where things are

| Path | What it is |
| --- | --- |
| `src/index.html` | The page, with `{{placeholders}}` the build fills in |
| `src/shell.html` | The app's own markup: sidebar, top bar, main column, dialogs |
| `src/app/` | The app script, one file per feature. `src/app/ORDER` lists the order they are joined in; they share one scope |
| `src/app/core/` | State, sync engine, render, actions, events, boot |
| `src/app/screens/` | One file per screen: Today, Notes, Ideas, Moodboard, Whiteboard, Calendar, Audience, Team… |
| `src/app/features/` | Focus timer, command palette, search, AI helpers, moodboard export |
| `src/app/web/` | Website-only pieces: sidebar rail, server calls, teammates, push alerts |
| `src/boot/boot.js` | Sign-in, the storage layer the app talks to, public creator pages |
| `src/styles/` | `base.css` plus the layers in `src/styles/ORDER`; `mid.css` is the current look (see DESIGN.md) |
| `src/landing/` | The page signed-out visitors see, with its illustrations in `ill/` |
| `src/sw.js` | Service worker: offline and push notifications |
| `desktop/` | The desktop app (Electron). It opens the live site with `?app=desktop` |
| `supabase/` | Database migrations and edge functions (`social` connects Instagram and other platforms) |
| `worker.js`, `wrangler.jsonc` | Cloudflare Worker. Pushing to `main` redeploys the site |
| `tests/` | End-to-end tests against a stand-in Supabase |

## Everyday commands

```bash
python3 build.py        # build the site into public/ (commit public/ too; CI checks it is current)
npm run lint            # undefined names, duplicate keys, unreachable code
bash tests/all.sh       # every test suite
node tests/t20.js       # one suite
```

Desktop installers: run the **Desktop installers** workflow in GitHub Actions (or push a tag like
`desktop-v1.1.0` to attach them to a release). The installers are not code-signed yet, so Windows
and macOS show a warning the first time they open.
