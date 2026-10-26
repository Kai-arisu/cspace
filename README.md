# Creator Space

- `creator-space.html` — the app (single file). `web/` — website-only code (login, Audience, Creator page).
- `python3 build.py` — builds the deployable site into `public/`.
- `worker.js` + `wrangler.jsonc` — Cloudflare config. Deploy with `npx wrangler deploy`, or push to GitHub and let Cloudflare build it.
- `tests/` — end-to-end tests against a stand-in Supabase (`node tests/t20.js`, `node tests/t19.js`).
