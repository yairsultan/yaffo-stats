# React navigation pilot

Review-only pilot. It does not replace or change the production `index.html`, change Pages settings, or deploy itself.

## Run locally

Use Node 22.12+ and npm.

```sh
cd react-pilot
npm ci
npm run dev
```

Open the local Vite URL with `/yaffo-stats/pilot.html` appended. The dev server reads `../games.json` and `../fixtures.json` directly. Update those existing files as before, not a copy in this folder.

```sh
npm test
npm run build
npm run preview
```

Build output is isolated in `react-pilot/dist`. The build copies the unchanged root JSON files into that output. `pilot.html` is the entry point, not `index.html`. There is deliberately no deployment workflow in this change.

## What to review

- Separate season games, season players, and team screens.
- Nested game overview, players, flow, and court screens.
- Copy a game/tab URL, open it in another tab, and refresh. The game, tab, and quarter stay selected.
- Switching game tabs and quarters keeps the vertical scroll position. Back and Forward restore the selected screen and its saved position. Reload restoration uses tab-local session storage and remains optional if storage is blocked.
- Native links support keyboard activation, opening in another tab, and copying a destination.
- Existing `#full` schedule links redirect to the full schedule screen.
- Unknown game IDs show an explicit not-found screen. Invalid quarter parameters use the full game.

Example route shapes:

```text
pilot.html#/games
pilot.html#/players
pilot.html#/team
pilot.html#/games/<stable-game-id>/players?q=4
```

Game IDs use the source date and a deterministic hash of the two source team names, not the array index. Reordering games does not change links. Correcting a game date or team name can change its ID; alias handling for such corrections would need a separate decision before a full migration.

## Boundaries

- Same root source data and statistical interpretation as production, including the existing conditional free-throw estimates and caveats. No new appearances or player facts.
- All source roster members remain visible. Yafo appears first in game players.
- Existing Hebrew/RTL design, theme colors, saved palette, and taller flow chart are retained. The pilot adds a small review banner.
- No analytics script, external fonts, replay, duration collection, or other tracking is loaded. A tested navigation adapter emits local `pilot:navigation` events only. Connecting it to production analytics is not part of this pilot.
- This branch is a navigation pilot, separate from production usability fixes.

## Browser checks

```sh
npx playwright install chromium webkit
npm run build
npm run test:browser
BROWSER_ENGINE=webkit npm run test:browser
```

If using a system Chromium, set `BROWSER_EXECUTABLE` to its executable path. Some Linux hosts need Playwright's documented browser system dependencies.

The browser script serves the actual built output at the GitHub Pages base path. It checks direct/copy/reload links, quarter state, Back/Forward, scroll preservation, roster completeness, schedule compatibility, not-found handling, horizontal page overflow, and absence of external requests. It runs five widths in light and dark themes, plus trusted mobile taps at four widths. Screenshots and the local test report go into ignored `test-artifacts/`.

WebKit coverage is an engine test, not physical iPhone/Safari testing. Physical Android Chrome acceptance of the new pilot remains part of review before a full migration.
