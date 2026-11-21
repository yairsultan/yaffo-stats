import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareGames, gameId, stats, seasonPlayers, quarterPoints, parseQuarter, createNavigationTracker, gameURL } from './pilot-data.js';
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
