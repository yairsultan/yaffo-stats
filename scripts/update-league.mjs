// Builds league.json from the IBBA SportsPress data (ibasketball.co.il, league 2026-16).
// Usage: node scripts/update-league.mjs raw.json
// raw.json = {"names": {teamId: name}, "games": [{id,d,t,h,a,hs,as,s}]}, fetched in a browser session
// (the site blocks plain server requests). See scripts/README.md.
import { readFileSync, writeFileSync } from 'node:fs';
const TECH_IDS = new Set([1507677]); // technical results (confirmed by Yair): 28.10 Beerot vs Yafo Tzeirim, 42-8
const raw = JSON.parse(readFileSync(process.argv[2], 'utf8'));
if (!raw.names || !Array.isArray(raw.games)) throw new Error('Unexpected input shape');
if (Object.keys(raw.names).length !== 10 || raw.games.length < 80) throw new Error('League looks incomplete, refusing to overwrite');
const teams = Object.entries(raw.names).map(([id, name]) => ({ id: Number(id), name })).sort((a, b) => a.id - b.id);
const games = raw.games.map(g => {
  const done = g.hs !== null && g.as !== null && g.s === 'finished';
  const out = { d: g.d, t: g.t, h: g.h, a: g.a };
  if (done) { out.hs = g.hs; out.as = g.as; if (TECH_IDS.has(g.id)) out.tech = true; }
  return out;
}).sort((x, y) => `${x.d}T${x.t}`.localeCompare(`${y.d}T${y.t}`) || x.h - y.h);
const now = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jerusalem', dateStyle: 'short', timeStyle: 'short' }).format(new Date()).replace(' ', 'T');
writeFileSync(new URL('../league.json', import.meta.url), JSON.stringify({ updated: now, source: 'https://ibasketball.co.il/league/2026-16/', teams, games }) .replace(/\},\{"d"/g, '},\n{"d"').replace('"games":[', '"games":[\n') + '\n');
console.log(`teams ${teams.length}, games ${games.length}, played ${games.filter(g => g.hs !== undefined).length}`);
