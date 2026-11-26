# league.json refresh

`league.json` holds all results and the schedule of the league (IBBA, ליגה ב׳ תל אביב 2026-16). The site reads it to show win/loss balance and the league table.

Source: public endpoints under `https://ibasketball.co.il/wp-json/sportspress/v2/` (`teams` and `events`, `seasons=119888&leagues=119907`, one request per month). The site sits behind a bot challenge, so plain `curl`/Node requests get 403. Fetch inside a normal browser session, build `raw.json` (`{names, games}`), then run:

    node scripts/update-league.mjs raw.json

Then commit `league.json` only. No rebuild is needed: the site fetches it with `no-store`.
Technical results are marked in `TECH_IDS` in the script.
