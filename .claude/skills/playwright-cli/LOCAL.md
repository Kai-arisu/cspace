# Running playwright-cli in this project's cloud sandbox

The sandbox has Chromium preinstalled and no browser sandboxing, so pass the config in `.playwright/`:

    npx -y @playwright/cli@0.1.22 open http://localhost:8765/ --config=.playwright/cli.config.json

Serve the built app first with `python3 -m http.server 8765 --directory public`.
On a normal machine, `npx @playwright/cli open <url>` works without the config.
