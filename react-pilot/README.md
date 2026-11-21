# React site and isolated review mode

The React source keeps the site's existing Hebrew/RTL design and statistics, with separate season/game routes and native links. Production uses the root `index.html` and hashed JavaScript/CSS assets. The old isolated preview under `pilot-preview/` remains a review snapshot and does not update automatically.

## Data updates

Continue editing the repository's root `games.json` and `fixtures.json`. Production fetches these files with `cache: 'no-store'`. No rebuild is needed for a normal data update.

Existing games now carry explicit `id` metadata equal to their already-shared route IDs. Keep this `id` unchanged if correcting a game's date/team names or reordering the file. New games without an ID get a deterministic date/team fallback; set that resulting ID explicitly when publishing the game. Do not reuse IDs. Duplicate IDs fail visibly rather than opening a different game. Statistical fields and their interpretation are unchanged.

## Local review and production build

Node 22.12+ and npm:

```sh
cd react-pilot
npm ci
npm run dev
```

Open the local URL at `/yaffo-stats/pilot.html`. Development reads the existing root JSON files. The default review build keeps the review banner and sends no tracking.

```sh
npm test
npm run build
npm run preview
```

To regenerate the production root files after a source change:

```sh
npm run build:production
```

This writes root `index.html` and hashed JS/CSS files. It never rewrites the root JSON data. Commit the source and generated root files together. Keep previously published hashed files until old open pages no longer need them. The existing GitHub Pages branch deployment remains the hosting workflow, with no new server.

## Navigation and behavior

Routes include `#/games`, `#/players`, `#/team`, and `#/games/<stable-id>/<overview|players|flow|court>?q=4`. Copied links and refresh retain the selected game/tab/quarter. Season sort uses `?sort=`. Tab changes preserve scroll; Back/Forward and reload restore saved positions. Reload scroll restoration is tab-local and optional when storage is blocked. `#full` opens the full schedule. Unknown games show an explicit not-found screen.

All source roster members remain visible and Yafo appears first in game players. The two recorded losses display as `0–2` with explicit left-to-right numerals, and the average as `-9`. Existing free-throw estimate warnings and methodology disclosures remain. No statistics, appearances, or FL/B1 interpretation were changed.

## Analytics

Production mode preserves the existing Umami website ID, hostname restriction, Do Not Track setting, search/hash exclusion, and only `game_open` / `tab_view` aggregate event fields. Quarter filters, sorting, rerenders, and chart gestures do not count as new logical screens. Slow or blocked analytics never prevents navigation. No duration, replay, identity, or other collection was added. Review mode loads no analytics script.

## Tests

```sh
npx playwright install chromium webkit
npm run build
npm run test:browser
BROWSER_ENGINE=webkit npm run test:browser
```

Set `BROWSER_EXECUTABLE` when using a system Chromium. Some Linux hosts need Playwright system dependencies. The browser tests serve the built output at the actual Pages base path and cover viewport/theme layouts, trusted mobile taps, direct/copy/reload links, quarter state, Back/Forward, scroll preservation, roster completeness, schedule compatibility, invalid routes, and absence of external requests in review/local contexts. Generated test artifacts are ignored.

Release checks also compare every game/quarter's overview, player rows, flow paths/events, and court values against the prior production implementation, plus numerical and failure/analytics cases. WebKit is an engine check, not a claim of physical Safari-device testing.
