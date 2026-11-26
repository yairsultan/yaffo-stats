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
  if (game.id) { if (!/^[a-zA-Z0-9_-]+$/.test(game.id)) throw new Error('Invalid stable game ID'); return game.id; }
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

// League data (league.json, IBBA results). Names differ slightly between the league and fixtures.json, so match on a normalized name.
export const US_ID = 1500181;
export const normTeam = name => String(name).replace(/["״'׳”“]/g, '').replace(/[\/\-–]/g, ' ').replace(/שוהם/g, 'שהם').replace(/\s+/g, ' ').trim();
export function leagueTable(league) {
  if (!league?.teams || !league?.games) return [];
  const rows = new Map(league.teams.map(t => [t.id, { id: t.id, name: t.name, us: t.id === US_ID, w: 0, l: 0, pf: 0, pa: 0, form: [], tech: 0 }]));
  for (const g of league.games) {
    if (g.hs === undefined || g.as === undefined) continue;
    for (const [id, f, a] of [[g.h, g.hs, g.as], [g.a, g.as, g.hs]]) {
      const row = rows.get(id); if (!row) continue;
      const win = f > a; row[win ? 'w' : 'l']++; row.pf += f; row.pa += a; row.form.push(win ? 'W' : 'L'); if (g.tech) row.tech++;
    }
  }
  return [...rows.values()].map(r => { const gp = r.w + r.l; return { ...r, gp, pct: gp ? r.w / gp : 0, ppg: gp ? r.pf / gp : 0, papg: gp ? r.pa / gp : 0, diff: r.pf - r.pa }; })
    .sort((a, b) => b.pct - a.pct || b.diff - a.diff || a.name.localeCompare(b.name, 'he'));
}
export const teamByName = (table, name) => table.find(r => normTeam(r.name) === normTeam(name));
// Tone of a record: green with more wins, red with more losses, neutral when level or no games yet.
export const balanceTone = row => !row || !row.gp || row.w === row.l ? 'even' : row.w > row.l ? 'pos' : 'neg';
export const usTechLosses = league => (league?.games || []).filter(g => g.tech && (g.h === US_ID || g.a === US_ID)).map(g => ({ ...g, win: (g.h === US_ID ? g.hs > g.as : g.as > g.hs) }));

// All played league games of one team, newest first, from that team's point of view.
export function teamGames(league, id) {
  return (league?.games || []).filter(g => g.hs !== undefined && g.as !== undefined && (g.h === id || g.a === id)).map(g => {
    const home = g.h === id, f = home ? g.hs : g.as, a = home ? g.as : g.hs;
    return { d: g.d, t: g.t, hid: g.h, aid: g.a, home, oppId: home ? g.a : g.h, f, a, win: f > a, tech: !!g.tech };
  }).sort((x, y) => `${y.d}T${y.t}`.localeCompare(`${x.d}T${x.t}`));
}

// Per-game team stats from the Swish app (swish.json): [ft made, 2-pointers, 3-pointers, fouls] for home and away.
const statObj = ([ft, p2, p3, fouls]) => ({ ft, p2, p3, fouls });
export function swishStats(swish, g) {
  const s = swish?.games?.[`${g.d}|${g.h}|${g.a}`];
  return s ? { h: statObj(s.h), a: statObj(s.a) } : null;
}
// Average per game for and against one team, from games with Swish stats. Technical results are excluded.
export function teamProfile(league, swish, id) {
  const rows = (league?.games || []).filter(g => !g.tech && g.hs !== undefined && (g.h === id || g.a === id)).map(g => {
    const s = swishStats(swish, g); if (!s) return null;
    const home = g.h === id;
    return { f: home ? s.h : s.a, o: home ? s.a : s.h, pts: home ? g.hs : g.as, ptsA: home ? g.as : g.hs };
  }).filter(Boolean);
  if (!rows.length) return null;
  const avg = pick => rows.reduce((n, r) => n + pick(r), 0) / rows.length;
  return { n: rows.length, pts: avg(r => r.pts), ptsA: avg(r => r.ptsA), p3: avg(r => r.f.p3), p2: avg(r => r.f.p2), ft: avg(r => r.f.ft), fouls: avg(r => r.f.fouls), p3A: avg(r => r.o.p3), p2A: avg(r => r.o.p2), ftA: avg(r => r.o.ft) };
}
// key, label, true when a higher number is worse for the team.
export const PREP_METRICS = [['ptsA', 'נקודות שספגו', true], ['p2A', 'סלי 2 שספגו', true], ['p3A', 'שלשות שספגו', true], ['ftA', 'עונשין שספגו', true], ['fouls', 'עבירות', true], ['pts', 'נקודות שקלעו', false], ['p2', 'סלי 2 שקלעו', false], ['p3', 'שלשות שקלעו', false], ['ft', 'עונשין שקלעו', false]];
// Weak and strong points: biggest gaps from the league average, in percent, among teams that have Swish stats.
export function prepInsights(league, swish, id) {
  const profiles = (league?.teams || []).map(t => teamProfile(league, swish, t.id)).filter(Boolean);
  const mine = teamProfile(league, swish, id);
  if (!mine || profiles.length < 3) return { weak: [], strong: [] };
  const rows = PREP_METRICS.map(([key, label, highBad]) => {
    const mean = profiles.reduce((n, p) => n + p[key], 0) / profiles.length;
    if (!mean) return null;
    const gap = (mine[key] - mean) / mean * (highBad ? 1 : -1);
    return { key, label, value: mine[key], mean, gap };
  }).filter(Boolean).sort((a, b) => b.gap - a.gap);
  return { weak: rows.filter(r => r.gap > 0.05).slice(0, 3), strong: rows.filter(r => r.gap < -0.05).slice(-3).reverse() };
}
export function nextFixture(fixtures, nowText) {
  return [...(fixtures || [])].sort((a, b) => `${a.d}T${a.t}`.localeCompare(`${b.d}T${b.t}`)).find(f => `${f.d}T${f.t}` >= nowText) || null;
}
