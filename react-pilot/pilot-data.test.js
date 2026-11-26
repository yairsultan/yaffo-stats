import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareGames, gameId, stats, seasonPlayers, quarterPoints, parseQuarter, createNavigationTracker, gameURL, teamGames, swishStats, teamProfile, prepInsights } from './pilot-data.js';
const source = JSON.parse(readFileSync(new URL('../games.json', import.meta.url)));
const games = prepareGames(source);
test('source is immutable, all game identities stable across reordering', () => {
  const before = JSON.stringify(source); prepareGames(source); assert.equal(JSON.stringify(source), before);
  assert.deepEqual(prepareGames([...source].reverse()).map(g => g.id).sort(), games.map(g => g.id).sort());
  assert.equal(new Set(games.map(g => g.id)).size, games.length);
  assert.throws(() => prepareGames([source[0], source[0]]), /Duplicate/);
});
test('scores and quarter points exactly match source', () => {
  for (const game of games) for (const team of game.t) {
    assert.equal(stats(team.ev).pts, team.end[3]);
    for (const quarter of [1, 2, 3, 4]) assert.equal(stats(team.ev, quarter).pts, quarterPoints(team, quarter));
    assert(team.ev.every(e => e.pts >= 1 && e.pts <= 3));
  }
});
test('every source roster member appears, no false appearances or average', () => {
  const rows = seasonPlayers(games);
  assert.equal(rows.length, 15);
  for (const nm of ['ד. ששון', 'י. מוראדי']) { const row = rows.find(r => r.nm === nm); assert.equal(row.gp, 0); assert.equal(row.avg, null); assert.equal(row.pts, 0); }
  assert.equal(rows.reduce((n, p) => n + p.pts, 0), games.reduce((n, g) => n + g.us.pts, 0));
});
test('invalid quarter routes safely default to full game', () => {
  for (const q of ['?q=0', '?q=7', '?q=-1', '?q=NaN', '?q=2.5', '?q=02', '']) assert.equal(parseQuarter(q), 0);
  for (const q of [1, 2, 3, 4]) assert.equal(parseQuarter(`?q=${q}`), q);
});
test('links encode stable game, tab and quarter, not array position', () => { assert.equal(gameURL(games[0], 'players', 4), `/games/${gameId(source[0])}/players?q=4`); });
test('aggregate adapter deduplicates renders/quarters and counts transitions once', () => {
  const events = [], track = createNavigationTracker((name, data) => events.push({ name, data }));
  track({ tab: 'משחקים' }); track({ tab: 'משחקים' });
  track({ game: games[1], tab: 'סקירה' }); track({ game: games[1], tab: 'סקירה' });
  track({ game: games[1], tab: 'שחקני המשחק' }); track({ game: games[1], tab: 'סקירה' });
  assert.deepEqual(events.map(e => e.name), ['tab_view', 'game_open', 'tab_view', 'tab_view', 'tab_view']);
  assert.equal(events[1].data.date, '18/11/2026'); assert(events[1].data.game.includes('הפועל יפו צעירים'));
});

test('explicit published IDs survive name/date corrections', () => {
 for (const g of source) { const id=gameId(g); const edited=structuredClone(g); edited.id=id; edited.d='01/01/2030'; edited.t[0].n+=' correction'; assert.equal(gameId(edited),id); }
});
import { leagueTable, teamByName, balanceTone, normTeam, usTechLosses, US_ID } from './pilot-data.js';
const league = JSON.parse(readFileSync(new URL('../league.json', import.meta.url)));
const fixtures = JSON.parse(readFileSync(new URL('../fixtures.json', import.meta.url)));
test('league table: every game counted once per team, totals balance', () => {
  const table = leagueTable(league);
  const played = league.games.filter(g => g.hs !== undefined).length;
  assert.equal(table.reduce((s, r) => s + r.gp, 0), played * 2);
  assert.equal(table.reduce((s, r) => s + r.w, 0), played);
  assert.equal(table.reduce((s, r) => s + r.pf, 0), table.reduce((s, r) => s + r.pa, 0));
  for (const r of table) assert.equal(r.form.length, r.gp);
});
test('every fixture opponent resolves to a league team, never to our own team', () => {
  const table = leagueTable(league);
  for (const f of fixtures) { const t = teamByName(table, f.o); assert(t, f.o); assert.notEqual(t.id, US_ID); }
  assert.notEqual(teamByName(table, 'הפועל יפו').id, teamByName(table, 'הפועל יפו צעירים').id);
});
test('our scoresheet games match the league results; technical loss is flagged', () => {
  const us = leagueTable(league).find(r => r.id === US_ID);
  const tech = usTechLosses(league);
  assert.equal(tech.length, 1); assert.equal(tech[0].win, false);
  for (const g of games) {
    const [d, m, y] = g.d.split('/'); const lg = league.games.find(x => x.d === `${y}-${m}-${d}` && (x.h === US_ID || x.a === US_ID));
    assert(lg, g.d); assert.equal(lg.h === US_ID ? lg.hs : lg.as, g.us.pts); assert.equal(lg.h === US_ID ? lg.as : lg.hs, g.opponent.pts);
  }
  assert(us.gp >= games.length + tech.length);
});
test('balance tone', () => { assert.equal(balanceTone({ gp: 3, w: 2, l: 1 }), 'pos'); assert.equal(balanceTone({ gp: 3, w: 1, l: 2 }), 'neg'); assert.equal(balanceTone({ gp: 2, w: 1, l: 1 }), 'even'); assert.equal(balanceTone({ gp: 0, w: 0, l: 0 }), 'even'); assert.equal(normTeam('מכבי שוהם-תל אביב ניצ'), normTeam('מכבי שהם/תל אביב ניצ')); });

test('team games list matches the league table record', () => {
  const league = JSON.parse(readFileSync(new URL('../league.json', import.meta.url)));
  for (const row of leagueTable(league)) {
    const list = teamGames(league, row.id);
    assert.equal(list.length, row.gp);
    assert.equal(list.filter(x => x.win).length, row.w);
    assert.equal(list.reduce((n, x) => n + x.f, 0), row.pf);
    assert(list.every((x, i) => i === 0 || `${list[i - 1].d}T${list[i - 1].t}` >= `${x.d}T${x.t}`));
  }
});

const swish = JSON.parse(readFileSync(new URL('../swish.json', import.meta.url)));
test('every played league game has Swish stats that add up to the score (one known app rounding gap)', () => {
  let off = 0;
  for (const g of league.games.filter(x => x.hs !== undefined)) {
    const s = swishStats(swish, g); assert(s, `missing stats ${g.d}`);
    const pts = x => x.ft + 2 * x.p2 + 3 * x.p3;
    if (pts(s.h) !== g.hs || pts(s.a) !== g.as) off++;
  }
  assert.equal(off, 1);
});
test('profiles and insights use only games with stats and skip technical results', () => {
  assert.equal(teamProfile(league, swish, US_ID).n, 2);
  const { weak, strong } = prepInsights(league, swish, 171321);
  assert(weak.length + strong.length > 0); assert(weak.every(r => r.gap > 0));
});
