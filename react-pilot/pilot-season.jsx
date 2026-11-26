import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { US, average, round1, seasonPlayers, gameURL, teamByName, usTechLosses, teamGames, leagueTable, swishStats } from './pilot-data.js';
import { useData, NotFound, ScreenLink, Comparison, Balance, Form } from './pilot-ui.jsx';
function SeasonHeader({ title }) {
  const { games, league } = useData();
  const tech = usTechLosses(league);
  const total = games.length + tech.length;
  const wins = games.filter(g => g.us.pts > g.opponent.pts).length + tech.filter(g => g.win).length;
  return <header className="hero"><div className="top">ליגה ב׳ · עונת 2026/27</div><h1 id="screen-heading" tabIndex={-1}>{title}</h1><div className="rec"><div><b>{total}</b><span>משחקים</span></div><div><b dir="ltr" aria-label={`${wins} ניצחונות, ${total - wins} הפסדים`}>{wins}–{total - wins}</b><span>ניצחונות–הפסדים</span></div><div><b dir="ltr">{round1(average(games, g => g.us.pts - g.opponent.pts))}</b><span>הפרש ממוצע</span></div></div></header>;
}
function Fixtures() {
  const { fixtures, table } = useData();
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
  function Waze({ fixture, small = false }) { return fixture.a ? <a className={small ? 'wic' : 'wbtn'} href={`https://waze.com/ul?q=${encodeURIComponent(fixture.a)}&navigate=yes`} target="_blank" rel="noreferrer" aria-label={`ניווט ב־Waze אל ${fixture.v}`}>{small ? <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2 4.5 21l7.5-4.2 7.5 4.2z" transform="rotate(30 12 12)" /></svg> : <>🧭 ניווט ב־Waze</>}</a> : <span className="wic off" aria-hidden="true" />; }
  return <section className="card"><div className="nx"><span>המשחק הבא · מחזור {next.r}</span><span className="pill">{soon}</span></div><div className="who">{next.o} <span className={`pill ha${next.h ? '' : ' away'}`}>{next.h ? 'בית' : 'חוץ'}</span></div>{teamByName(table, next.o)?.gp > 0 && <div className="opp-bal"><Balance row={teamByName(table, next.o)} /><Form form={teamByName(table, next.o).form} /></div>}<div className="when">יום {dayNames[nd.getUTCDay()]}, {nd.getUTCDate()} ב{monthNames[nd.getUTCMonth()]} · {next.t} · {next.v}</div><div className="acts">{teamByName(table, next.o) && <ScreenLink className="prep-cta" to="/prep"><span className="pc-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></svg></span><span className="pc-t">הכנה למשחק</span><svg className="pc-ch" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m14 6-6 6 6 6" /></svg></ScreenLink>}<Waze fixture={next} /></div><details className="fx" open={open} onToggle={e => setOpen(e.currentTarget.open)}><summary><span>לוח המשחקים המלא · {upcoming.length} משחקים נותרו</span><span>▾</span></summary>{ordered.map(f => { const date = dateOf(f), row = teamByName(table, f.o); return <div className={`fxr${f === next ? ' next' : ''}`} key={`${f.d}-${f.o}`}><div className="fd"><b>{date.getUTCDate()}/{date.getUTCMonth() + 1}</b><span>{dayNames[date.getUTCDay()]}</span></div><div className="fm-main"><div className="fn">{f.o}</div><div className="fs"><span className={`pill ha${f.h ? '' : ' away'}`}>{f.h ? 'בית' : 'חוץ'}</span><span className="ft2">{f.t}<span className="fv"> · {f.v}</span></span></div></div><div className="fb">{row ? <Balance row={row} /> : null}</div><Waze fixture={f} small /></div>; })}</details></section>;
}
export function SeasonGames() {
  const { games, league } = useData();
  const toISO = d => d.split('/').reverse().join('-');
  const chronological = [...games].sort((a, b) => toISO(a.d).localeCompare(toISO(b.d)));
  const tech = usTechLosses(league);
  const latestId = [...chronological].reverse()[0]?.id;
  const items = [...chronological.map(g => ({ key: g.id, date: toISO(g.d), game: g })), ...tech.map(g => ({ key: `tech-${g.d}`, date: g.d, tech: g }))].sort((a, b) => b.date.localeCompare(a.date));
  const nameOf = id => league.teams.find(t => t.id === id)?.name;
  return <><SeasonHeader title={US} /><Fixtures /><main><section className="card"><h2>משחקים</h2>{!items.length && <p className="empty">עדיין אין משחקים.</p>}{items.map(item => {
    if (item.tech) {
      const t = item.tech, [y, m, d] = t.d.split('-');
      return <div className="gm tech" key={item.key}><div className={`bdg ${t.win ? 'W' : 'L'}`} dir="ltr" aria-label={t.win ? 'ניצחון' : 'הפסד'}>{t.win ? 'W' : 'L'}</div><div><div className="t">{nameOf(t.h)} {t.hs} · {nameOf(t.a)} {t.as}</div><div className="s">{d}/{m}/{y}</div></div></div>;
    }
    const g = item.game, win = g.us.pts > g.opponent.pts;
    return <ScreenLink className={`gm ${g.id === latestId ? 'latest' : ''}`} key={g.id} to={gameURL(g)}><div className={`bdg ${win ? 'W' : 'L'}`} dir="ltr" aria-label={win ? 'ניצחון' : 'הפסד'}>{win ? 'W' : 'L'}</div><div>{g.id === latestId && <span className="latest-label">המשחק האחרון</span>}<div className="t">{g.us.sh} {g.us.pts} · {g.opponent.sh} {g.opponent.pts}</div><div className="s">{g.d} · מול {g.opponent.n}</div></div><div className="game-action"><span><span className="cta">לנתוני המשחק המלאים</span></span><span className="arrow-disc" aria-hidden="true"><svg className="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><path d="m14 6-6 6 6 6" /></svg></span></div></ScreenLink>;
  })}</section><section className="card"><h2>הפרש בכל משחק</h2><div className="sc"><svg viewBox={`0 0 ${Math.max(games.length * 70, 280)} 176`} width={Math.max(games.length * 70, 280)} style={{ direction: 'ltr' }} role="img" aria-label="הפרש בכל משחק בסדר כרונולוגי"><line x1="0" x2={Math.max(games.length * 70, 280)} y1="80" y2="80" stroke="var(--line)" />{chronological.map((g, i) => { const d = g.us.pts - g.opponent.pts, h = Math.min(Math.abs(d), 30) * 2.2; return <g key={g.id}><rect x={i * 70 + 18} y={d >= 0 ? 80 - h : 80} width="34" height={h} rx="4" fill={d >= 0 ? 'var(--win)' : 'var(--loss)'} /><text x={i * 70 + 35} y={d >= 0 ? 74 - h : 96 + h} fontSize="11" textAnchor="middle" fill="currentColor">{d > 0 ? '+' : ''}{d}</text><text x={i * 70 + 35} y="170" fontSize="10" textAnchor="middle" fill="var(--mut)">{g.d.slice(0, 5)}</text></g>; })}</svg></div></section></main></>;
}
export function SeasonPlayers() {
  const { games } = useData();
  const [search, setSearch] = useSearchParams();
  const key = ['gp','pts','avg','t3','ft','f'].includes(search.get('sort')) ? search.get('sort') : 'pts';
  const setKey = value => setSearch({sort:value}, {replace:true});
  const columns = [['gp', 'מש׳'], ['pts', 'נק׳'], ['avg', 'ממוצע'], ['t3', 'שלשות'], ['ft', 'עונשין'], ['f', 'עבירות']];
  return <><SeasonHeader title="שחקני העונה" /><main className="card"><div className="sc"><table><thead><tr><th className="p">שחקן</th>{columns.map(([k, label]) => <th key={k} aria-sort={key === k ? 'descending' : undefined}><button onClick={() => setKey(k)}>{label}{key === k ? ' ▾' : ''}</button></th>)}</tr></thead><tbody>{seasonPlayers(games, key).map(p => <tr key={p.nm}><td className="p"><b>{p.nm}</b></td>{columns.map(([k]) => <td className={k === 'pts' ? 'bg' : ''} key={k}>{p[k] === null ? '–' : round1(p[k])}</td>)}</tr>)}</tbody></table></div></main></>;
}
export function SeasonTeam() {
  const { games } = useData();
  const teamA = { col: 'var(--usT)', hex: 'var(--us)' }, teamB = { col: 'var(--themT)', hex: 'var(--them)' };
  return <><SeasonHeader title="נתוני הקבוצה" /><main className="card"><h2>ממוצע למשחק</h2><div className="team-labels"><b style={{ color: teamA.col }}>{US}</b><b style={{ color: teamB.col }}>יריבות</b></div>{[['pts', 'נקודות'], ['t3', 'שלשות'], ['ft', 'עונשין שנקלעו'], ['fl', 'עבירות אישיות']].map(([k, label]) => <Comparison key={k} label={label} a={average(games, g => g.us[k])} b={average(games, g => g.opponent[k])} teamA={teamA} teamB={teamB} low={k === 'fl'} />)}</main></>;
                                                    }

export function SeasonLeague() {
  const { table, league } = useData();
  if (!table.length) return <><SeasonHeader title="מצב הליגה" /><main className="card"><p className="empty">נתוני הליגה אינם זמינים כרגע.</p></main></>;
  return <><SeasonHeader title="מצב הליגה" /><main><section className="card lt-card"><h2>טבלה ומאזן</h2><div className="lt-head" aria-hidden="true"><span /><span>קבוצה</span><span className="c-gp">מש׳</span><span className="c-avg">קלעה</span><span className="c-avg">ספגה</span><span>מאזן</span><span>הפרש</span><span /></div>{table.map((r, i) => <ScreenLink className={`tr${r.us ? ' us' : ''}`} key={r.id} to={`/league/${r.id}`}><span className="no">{i + 1}</span><span className="tn"><span className="nm">{r.name}</span><span className="tf"><Form form={r.form} /></span></span><span className="c-gp num">{r.gp}</span><span className="c-avg num">{round1(r.ppg)}</span><span className="c-avg num">{round1(r.papg)}</span><span className="c-bal"><Balance row={r} /></span><span className={`diff num ${r.diff > 0 ? 'pos' : r.diff < 0 ? 'neg' : ''}`} dir="ltr">{r.diff > 0 ? '+' : ''}{r.diff}</span><svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><path d="m14 6-6 6 6 6" /></svg></ScreenLink>)}</section></main></>;
}
export function LeagueTeam() {
  const { table, league, games, swish } = useData();
  const { teamId } = useParams();
  const row = table.find(r => String(r.id) === teamId);
  if (!row) return <NotFound />;
  const nameOf = id => league.teams.find(t => t.id === id)?.name;
  const toISO = d => d.split('/').reverse().join('-');
  const list = teamGames(league, row.id);
  return <><header className="hero"><div className="top">ליגה ב׳ · עונת 2026/27</div><h1 id="screen-heading" tabIndex={-1}>{row.name}</h1><div className="rec tm"><Balance row={row} /><Form form={row.form} /></div></header><main><section className="card">{list.map(g => {
    const [y, m, d] = g.d.split('-');
    const ours = row.us ? games.find(x => toISO(x.d) === g.d) : null;
    const chev = <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">{ours ? <path d="m14 6-6 6 6 6" /> : swishStats(swish, { d: g.d, h: g.hid, a: g.aid }) ? <path d="m6 9 6 6 6-6" /> : null}</svg>;
    const body = <><div className={`bdg ${g.win ? 'W' : 'L'}`} dir="ltr" aria-label={g.win ? 'ניצחון' : 'הפסד'}>{g.win ? 'W' : 'L'}</div><div className="tm-main"><div className="t">{nameOf(g.oppId)}</div><div className="s"><span className="dt2" dir="ltr">{d}/{m}/{y}</span><span className={`pill ha${g.home ? '' : ' away'}`}>{g.home ? 'בית' : 'חוץ'}</span></div></div><div className="sc2" dir="ltr">{g.f}–{g.a}</div>{chev}</>;
    if (ours) return <ScreenLink className="tg link" key={`${g.d}-${g.oppId}`} to={gameURL(ours)}>{body}</ScreenLink>;
    const st = swishStats(swish, { d: g.d, h: g.hid, a: g.aid });
    if (!st) return <div className="tg" key={`${g.d}-${g.oppId}`}>{body}</div>;
    const mine = g.home ? st.h : st.a, theirs = g.home ? st.a : st.h;
    return <details className="tgd" key={`${g.d}-${g.oppId}`}><summary className="tg">{body}</summary><div className="tgs"><div className="tgs-h"><b style={{ color: 'var(--usT)' }}>{row.name}</b><b style={{ color: 'var(--themT)' }}>{nameOf(g.oppId)}</b></div>{[['p3', 'שלשות'], ['p2', 'סלי 2'], ['ft', 'עונשין'], ['fouls', 'עבירות']].map(([k, label]) => <Comparison key={k} label={label} a={mine[k]} b={theirs[k]} teamA={{ col: 'var(--usT)', hex: 'var(--us)' }} teamB={{ col: 'var(--themT)', hex: 'var(--them)' }} low={k === 'fouls'} />)}</div></details>;
  })}{!list.length && <p className="empty">עדיין אין משחקים.</p>}</section></main></>;
}
