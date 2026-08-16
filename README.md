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

The mockups are clickable: buttons, back arrows, quick actions and the bottom tabs all
navigate to the matching screen, so the client can click through the flow.

## Parent app — screens covered

- **Onboarding** — language selection, phone number entry
- **Home** — Today dashboard with quick actions, latest activity and insight
- **Quick logging** — breastfeed, bottle, diaper, sleep, solids, pumping, growth,
  symptom, milestone, note
- **Development** — development menu, growth chart, immunisation schedule

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

1. Copy an existing file in `screens/` and edit the content.
2. Add an entry to `SCREEN_GROUPS` in `assets/screens.js` so it appears in the gallery
   and walkthrough.
