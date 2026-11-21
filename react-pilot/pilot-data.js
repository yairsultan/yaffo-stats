export const US = 'הפועל יפו צעירים';
export const QUARTERS = ['כל המשחק', 'רבע 1', 'רבע 2', 'רבע 3', 'רבע 4'];
export const TABS = [['overview', 'סקירה'], ['players', 'שחקני המשחק'], ['flow', 'מהלך'], ['court', 'מגרש']];
export const round1 = value => Math.round(value * 10) / 10;
export const average = (items, get) => items.length ? items.reduce((sum, item) => sum + get(item), 0) / items.length : 0;
export const quarterPoints = (team, quarter) => team.end[quarter - 1] - (quarter > 1 ? team.end[quarter - 2] : 0);
export function stats(events, quarter = 0) {
  const selected = events.filter(event => !quarter || event.q === quarter);
  const count = points => selected.filter(event => event.pts === points).length;
  return { pts: selected.reduce((sum, event) => sum + event.pts, 0), t3: count(3), t2: count(2), ft: count(1) };
}
// IDs depend on immutable game identity, never its array position.
export function gameId(game) {
  const date = game.d.split('/').reverse().join('-');
  const identity = game.t.map(team => team.n).join('|');
  let hash = 2166136261;
  for (const char of identity) hash = Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0;
  return `${date}-${hash.toString(16).padStart(8, '0')}`;
}
export function prepareGames(source) {
  const ids = new Set();
  return source.map(raw => {
    const id = gameId(raw);
    if (ids.has(id)) throw new Error('Duplicate game identity');
    ids.add(id);
    const t = raw.t.map(team => {
      let previous = 0;
      const ev = team.m.split(',').map(item => {
        const [s, p] = item.split(':').map(Number);
        const event = { s, p, pts: s - previous, q: team.end.findIndex(end => s <= end) + 1 };
        previous = s;
        return event;
      });
      const us = team.n === US;
      const pl = team.pl.map(([n, nm, gp, f]) => ({ n, nm, gp, f: [...f], ev: ev.filter(event => event.p === n) }));
      return { ...team, us, ev, pl, col: us ? 'var(--usT)' : 'var(--themT)', hex: us ? 'var(--us)' : 'var(--them)', pts: team.end[3], t3: ev.filter(e => e.pts === 3).length, ft: ev.filter(e => e.pts === 1).length, fl: pl.reduce((sum, p) => sum + p.f.length, 0) };
    });
    return { ...raw, id, t, us: t.find(team => team.us), opponent: t.find(team => !team.us) };
  });
}
export function seasonPlayers(games, key = 'pts') {
  const map = new Map();
  for (const game of games) for (const player of game.us.pl) {
    const row = map.get(player.nm) || { nm: player.nm, gp: 0, pts: 0, t3: 0, ft: 0, f: 0 };
    const s = stats(player.ev);
    row.gp += player.gp; row.pts += s.pts; row.t3 += s.t3; row.ft += s.ft; row.f += player.f.length;
    map.set(player.nm, row);
  }
  return [...map.values()].map(p => ({ ...p, avg: p.gp ? p.pts / p.gp : null })).sort((a, b) => (b[key] ?? -Infinity) - (a[key] ?? -Infinity) || b.pts - a.pts || a.nm.localeCompare(b.nm, 'he'));
}
export function parseQuarter(search) {
  const value = new URLSearchParams(search).get('q');
  return /^[1-4]$/.test(value || '') ? Number(value) : 0;
}
export const quarterSearch = q => q ? `?q=${q}` : '';
export function bestPlayer(game, quarter) {
  return game.t.flatMap(team => team.pl.map(player => ({ team, player, s: stats(player.ev, quarter) }))).reduce((best, p) => !best || p.s.pts > best.s.pts ? p : best, null);
}
export function minuteAt(event, team) {
  const start = event.q > 1 ? team.end[event.q - 2] : 0;
  return (event.q - 1) * 10 + (event.s - start) / (team.end[event.q - 1] - start) * 10;
}
export const scoreAt = (team, minute) => team.ev.reduce((score, event) => minuteAt(event, team) <= minute + 1e-9 ? event.s : score, 0);
// Emits only logical transitions. No tracker is loaded in this review-only pilot.
export function createNavigationTracker(track) {
  let previous = null;
  return ({ game, tab }) => {
    const gameKey = game?.id || '';
    const view = `${gameKey || 'season'}|${tab}`;
    if (previous?.view === view) return;
    const data = { scope: game ? 'game' : 'season', tab };
    if (game) {
      data.game = game.t.map(t => t.n).join(' מול '); data.date = game.d;
      if (previous?.gameKey !== gameKey) track('game_open', { game: data.game, date: data.date });
    }
    track('tab_view', data);
    previous = { view, gameKey };
  };
}

export const gameURL = (game, tab = 'overview', q = 0) => `/games/${game.id}/${tab}${quarterSearch(q)}`;
