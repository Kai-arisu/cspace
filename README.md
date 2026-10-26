# Creator Space

- `creator-space.html` — the app (single file). `web/` — website-only code: login, Audience, Handles, phone dock (`web.js`, `boot.js`) and the Frost look (`frost.css`, loaded last).
- `python3 build.py` — builds the deployable site into `public/`.
- `worker.js` + `wrangler.jsonc` — Cloudflare. Pushing to `main` redeploys.
- `tests/` — end-to-end tests against a stand-in Supabase: `node tests/t20.js`, `node tests/t19.js`. `node tests/shots.js <dir>` screenshots every view.
