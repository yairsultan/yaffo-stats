import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { US, average, round1, seasonPlayers, gameURL } from './pilot-data.js';
import { useData, ScreenLink, Comparison } from './pilot-ui.jsx';
function SeasonHeader({ title }) {
  const { games } = useData();
  const wins = games.filter(g => g.us.pts > g.opponent.pts).length;
  return <header className="hero"><div className="top">ליגה ב׳ · עונת 2026/27</div><h1 id="screen-heading" tabIndex={-1}>{title}</h1><div className="rec"><div><b>{games.length}</b><span>משחקים</span></div><div><b dir="ltr" aria-label={`${wins} ניצחונות, ${games.length - wins} הפסדים`}>{wins}–{games.length - wins}</b><span>ניצחונות–הפסדים</span></div><div><b dir="ltr">{round1(average(games, g => g.us.pts - g.opponent.pts))}</b><span>הפרש ממוצע</span></div></div></header>;
}
function Fixtures() {
  const { fixtures } = useData();
  const location = useLocation();
  const [open, setOpen] = useState(new URLSearchParams(location.search).get('schedule') === 'full');
  useEffect(() => setOpen(new URLSearchParams(location.search).get('schedule') === 'full'), [location.search]);
  if (!fixtures.length) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(p => [p.type, p.value]));
  const now = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  const ordered = [...fixtures].sort((a, b) => `${a.d}T${a.t}`.localeCompare(`${b.d}T${b.t}`));
  const upcoming = ordered.filter(f => `${f.d}T${f.t}` >= now);
  const next = upcoming[0];
  if (!next) return null;
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const dateOf = f => new Date(`${f.d}T12:00:00Z`);
  const days = Math.round((Date.parse(`${next.d}T00:00:00Z`) - Date.parse(`${parts.year}-${parts.month}-${parts.day}T00:00:00Z`)) / 864e5);
  const soon = days <= 0 ? 'היום' : days === 1 ? 'מחר' : `בעוד ${days} ימים`;
  const nd = dateOf(next);
  function Waze({ fixture, small = false }) { return fixture.a ? <a className={`wbtn${small ? ' sm' : ''}`} href={`https://waze.com/ul?q=${encodeURIComponent(fixture.a)}&navigate=yes`} target="_blank" rel="noreferrer">🧭 {small ? 'ניווט' : 'ניווט ב־Waze'}</a> : null; }
  return <section className="card"><div className="nx"><span>המשחק הבא · מחזור {next.r}</span><span className="pill">{soon}</span></div><div className="who">{next.o} <span className="pill ha">{next.h ? 'בית' : 'חוץ'}</span></div><div className="when">יום {dayNames[nd.getUTCDay()]}, {nd.getUTCDate()} ב{monthNames[nd.getUTCMonth()]} · {next.t} · {next.v}</div><Waze fixture={next} /><details className="fx" open={open} onToggle={e => setOpen(e.currentTarget.open)}><summary><span>לוח המשחקים המלא · {upcoming.length} משחקים נותרו</span><span>▾</span></summary>{ordered.map(f => { const date = dateOf(f); return <div className="fxr" key={`${f.d}-${f.o}`}><div className="fd">{date.getUTCDate()}/{date.getUTCMonth() + 1}</div><div><b>{f.o}</b><div className="ft2">{dayNames[date.getUTCDay()]} · {f.t} · {f.v}</div></div><div className="fxc"><span className={`pill${f === next ? ' ha' : ''}`}>{f.h ? 'בית' : 'חוץ'}</span><Waze fixture={f} small /></div></div>; })}</details></section>;
}
export function SeasonGames() {
  const { games } = useData();
  const chronological = [...games].sort((a, b) => a.d.split('/').reverse().join('-').localeCompare(b.d.split('/').reverse().join('-')));
  return <><SeasonHeader title={US} /><Fixtures /><main><section className="card"><h2>משחקים</h2>{!games.length && <p className="empty">עדיין אין משחקים.</p>}{[...chronological].reverse().map((g, i) => {
    const win = g.us.pts > g.opponent.pts;
    return <ScreenLink className={`gm ${!i ? 'latest' : ''}`} key={g.id} to={gameURL(g)}><div className={`bdg ${win ? 'W' : 'L'}`}>{win ? 'ניצחון' : 'הפסד'}</div><div>{!i && <span className="latest-label">המשחק האחרון</span>}<div className="t">{g.us.sh} {g.us.pts} · {g.opponent.sh} {g.opponent.pts}</div><div className="s">{g.d} · מול {g.opponent.n}</div></div><div className="game-action"><span><span className="cta">לנתוני המשחק המלאים</span><span className="hint">קלעים · רבעים · השוואת קבוצות</span></span><span className="arrow-disc" aria-hidden="true"><svg className="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><path d="m14 6-6 6 6 6" /></svg></span></div></ScreenLink>;
  })}</section><section className="card"><h2>הפרש בכל משחק</h2><div className="sc"><svg viewBox={`0 0 ${Math.max(games.length * 70, 280)} 176`} width={Math.max(games.length * 70, 280)} style={{ direction: 'ltr' }} role="img" aria-label="הפרש בכל משחק בסדר כרונולוגי"><line x1="0" x2={Math.max(games.length * 70, 280)} y1="80" y2="80" stroke="var(--line)" />{chronological.map((g, i) => { const d = g.us.pts - g.opponent.pts, h = Math.min(Math.abs(d), 30) * 2.2; return <g key={g.id}><rect x={i * 70 + 18} y={d >= 0 ? 80 - h : 80} width="34" height={h} rx="4" fill={d >= 0 ? 'var(--win)' : 'var(--loss)'} /><text x={i * 70 + 35} y={d >= 0 ? 74 - h : 96 + h} fontSize="11" textAnchor="middle" fill="currentColor">{d > 0 ? '+' : ''}{d}</text><text x={i * 70 + 35} y="170" fontSize="10" textAnchor="middle" fill="var(--mut)">{g.d.slice(0, 5)}</text></g>; })}</svg></div></section></main></>;
}
export function SeasonPlayers() {
  const { games } = useData();
  const [search, setSearch] = useSearchParams();
  const key = ['gp','pts','avg','t3','ft','f'].includes(search.get('sort')) ? search.get('sort') : 'pts';
  const setKey = value => setSearch({sort:value}, {replace:true});
  const columns = [['gp', 'מש׳'], ['pts', 'נק׳'], ['avg', 'ממוצע'], ['t3', 'שלשות'], ['ft', 'עונשין'], ['f', 'עבירות']];
  return <><SeasonHeader title="שחקני העונה" /><main className="card"><h2>שחקני העונה · סיכומים וממוצעים</h2><div className="sc"><table><thead><tr><th className="p">שחקן</th>{columns.map(([k, label]) => <th key={k} aria-sort={key === k ? 'descending' : undefined}><button onClick={() => setKey(k)}>{label}{key === k ? ' ▾' : ''}</button></th>)}</tr></thead><tbody>{seasonPlayers(games, key).map(p => <tr key={p.nm}><td className="p"><b>{p.nm}</b></td>{columns.map(([k]) => <td className={k === 'pts' ? 'bg' : ''} key={k}>{p[k] === null ? 'לא זמין' : round1(p[k])}</td>)}</tr>)}</tbody></table></div><p className="data-note">כל השחקנים הרשומים בטפסי המשחק מוצגים. מש׳ = משחקים שבהם סומנה השתתפות. ממוצע מחושב רק למי ששיחק. לחצו על כותרת עמודה כדי למיין.</p></main></>;
}
export function SeasonTeam() {
  const { games } = useData();
  const teamA = { col: 'var(--usT)', hex: 'var(--us)' }, teamB = { col: 'var(--themT)', hex: 'var(--them)' };
  return <><SeasonHeader title="נתוני הקבוצה" /><main className="card"><h2>ממוצע למשחק</h2><div className="team-labels"><b style={{ color: teamA.col }}>{US}</b><b style={{ color: teamB.col }}>יריבות</b></div>{[['pts', 'נקודות'], ['t3', 'שלשות'], ['ft', 'עונשין שנקלעו'], ['fl', 'עבירות אישיות']].map(([k, label]) => <Comparison key={k} label={label} a={average(games, g => g.us[k])} b={average(games, g => g.opponent[k])} teamA={teamA} teamB={teamB} low={k === 'fl'} />)}</main></>;
                                                    }
