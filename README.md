# Bloombubs Mockups

Static HTML mockups of the Bloombubs mobile apps, for client review. No build step, no
dependencies — plain HTML and CSS that can be opened directly in a browser or published
to GitHub Pages.

**Live:** https://bloombubs.github.io/bloombubs-mockups/

## What's here

| Path | Purpose |
| --- | --- |
| `index.html` | Gallery of every screen, grouped by flow |
| `prototype.html` | Single-phone walkthrough with a screen picker |
| `screens/*.html` | One file per screen — the actual mockup markup |
| `assets/app.css` | Screen styles, using the parent app's design tokens |
| `assets/site.css` | Gallery and walkthrough chrome (phone frame, layout) |
| `assets/screens.js` | Screen manifest shared by the gallery and walkthrough |
| `assets/interactions.js` | Makes the controls behave — timers, steppers, toggles, Save |
| `assets/charts.js` | Draws the growth charts on the Sri Lanka CHDR colour bands |
| `assets/logo.png` | Bloombubs mark, copied from `bloombubs-parent-app/assets/icon.png` |

The mockups are clickable: buttons, back arrows, quick actions and the bottom tabs all
navigate to the matching screen, so the client can click through the flow.

The logging controls also work: timers run, steppers count, options select, and Save is
disabled until there is something to save. A saved entry is written to `localStorage` and
shown back on the Today screen — "Reset demo data" there clears it.

## Parent app — screens covered

- **Onboarding** — language selection, phone number entry, parent profile, add baby
- **Home** — Today dashboard with quick actions, latest activity, a 24-hour
  timeline of the day, the day summary dropdown and the logged-activity list
- **Quick logging** — breastfeed, bottle, diaper, sleep, solids, pumping, growth,
  symptom, milestone, note
- **Development** — development menu, growth chart, immunisation schedule
- **Account** — profile, babies on the account, edit and sign out

## Styling

Design tokens mirror `bloombubs-parent-app/src/theme`:

- Font: Plus Jakarta Sans
- Primary: `#356668`, primary container: `#a8dadc`
- Surface: `#f8f9fa`, cards: `#ffffff`
- Radii: 8 / 16 / 24 / full

Token values live in `:root` in `assets/app.css` — change them there and every screen follows.

## Running locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8080
```

## Adding a screen

1. Copy an existing file in `screens/` and edit the content — keep the
   `assets/interactions.js` script tag so the controls stay live.
2. Add an entry to `SCREEN_GROUPS` in `assets/screens.js` so it appears in the gallery
   and walkthrough.
