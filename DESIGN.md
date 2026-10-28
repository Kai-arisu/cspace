# Creator Space design system

Style: **Editorial greeting** (tasteskill app style, seed 1891630665). The stylesheet is
`web/editorial.css`, which loads last and overrides the older layers (`web.css`, `frost.css`,
`studio.css`). Change the look there, not in the older files.

## Idea

A calm, white workspace that greets the creator by name and leads with today's one fact.
Structure comes from tonal panels, not borders or shadows. Colour is reserved for data: one
teal accent marks the main figure, red marks only what is failing.

## Type

| Use | Face | Size / weight |
|---|---|---|
| Greeting on Today (the only serif) | Instrument Serif | 48px / 400 (24px on phones) |
| Screen title (`.hero h1`) | Instrument Sans | 24px / 600 (22px on phones) |
| Panel title | Instrument Sans | 14px / 600 |
| Body, rows, inputs | Instrument Sans | 14px / 400 |
| Captions, meta | Instrument Sans | 12–13px / 400 |
| Figures (KPIs) | Instrument Sans | 32px / 400, tabular numerals |

Fonts are self-hosted (`vendor/fonts`, OFL). No uppercase tracked labels anywhere: group labels
are sentence case, 12.5px, muted.

## Colour tokens

| Token | Light | Dark |
|---|---|---|
| `--bg` page | `#ffffff` | `#000000` |
| `--surface` tonal panel | `#f7f7f6` | `#111111` |
| `--surface2` hover, track | `#f3f3f2` | `#1a1a1a` |
| `--card` inner card, input | `#ffffff` | `#161616` |
| `--line` hairline | `#eaeaea` | `#262626` |
| `--fg` text | `#1f201d` | `#f5f5f4` |
| `--muted` secondary text | `#636361` | `#b4b4b4` |
| `--accent` data accent | `#1b6e66` | `#4fb3a7` |
| `--warn` failing fact | `#b42318` | `#f07a6a` |
| `--ok` positive delta | `#2e7d32` | `#5cc58a` |

Rules: accent covers under 2% of a screen and sits on data (the best bar, the goal track, today's
date), never on chrome. Primary buttons are near-black pills. No violet or indigo. Charts use one
hue: the accent on the main series, a grey ramp (`--c-board`, `--c-ideas`, `--c-notes`) for the rest.
Status pills are a pale fill with dark ink of the same family. All text meets 4.5:1.

## Shape and space

- Panels: radius 22, padding 20, no border, no shadow at rest.
- Inner cards and rows: white, 1px `--line`, radius 14; list rows are 63px tall with 8px gaps.
- Inputs: white, 1px, radius 10, 38–40px tall. Buttons, chips, tabs: pills (radius 999).
- Only floating things cast a shadow (menus, dialogs, toasts, the phone tab bar).
- Grid gap 16px. Icons are 16px outlines in the text colour, never in tinted squares.

## Shell

- Desktop (over 820px): an open sidebar on the page ground with one hairline. From the top:
  workspace name, New, search, notifications, then spaces and the nav groups (Create, Plan, Grow,
  Business) on a 32–34px pitch. The active item is a neutral grey pill. No top bar.
- Phone: a 48px top bar (space switcher) and the floating bottom tab bar.

## Today (home)

A 1100px column on a 12-column grid, starting about 72px from the top:

1. Date and space name (muted), the serif greeting, and the one fact for today, built from data
   (a post going out today, the overdue count, or what is in progress).
2. Quick capture.
3. Four count tiles, 3 columns each: Overdue, Due today, Posts this week, Focus timer.
4. 9 + 3: Needs attention (row cards) and the signature, **Road to the next milestone**: the
   follower count of the biggest connected channel on a track from the last milestone to the next
   (or the channel's own goal), with the 30-day change and an estimate at this month's pace.
5. 6 + 6: Next 7 days, Ideas to act on.
6. 12: Pipeline by stage, then the setup checklist (while unfinished) and the audience list
   (with two or more channels).

## Moodboard

The board is the creator's own brand sheet, so it uses *their* heading and body fonts and *their*
colours, framed by the app's chrome (one white card, radius 22, hairline border):

- Cover: kicker, title in the board's heading font, tagline, keywords; beside it the palette as a
  full-height band (up to six colours, hex in white or black, whichever reads better). Click to copy.
- Poster: filled sections only, each with a 220px label column and a grid of items (paint-chip
  swatches, textures drawn as SVG tiles, quotes in the heading font, plain outline icons, link cards).
  Empty sections gather at the foot under "Still to fill", one row each with its add buttons.
- Collage: the same items in tilted columns, flat with hairlines, no drop shadows.
- Download image: a 2000px PNG that mirrors the cover and board, light or dark with the app theme.

## Checking a change

```
python3 build.py
node tests/snapshot.js <outdir>            # static snapshot of every screen
CHROME_PATH=... node .claude/skills/design-taste-frontend/scripts/inspect.mjs --app <outdir>/home.html --out <dir>
bash tests/all.sh
```

Every screen should show 0 FAIL at 1440, 768 and 390. Known, defended warnings: the 48px greeting
(the style's one display moment), empty space under short lists on sparse demo data, and the
moodboard's own user-chosen fonts.
