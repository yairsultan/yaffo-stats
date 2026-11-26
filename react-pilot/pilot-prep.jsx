import React from 'react';
import { useParams } from 'react-router-dom';
import { US, US_ID, round1, teamByName, teamProfile, prepInsights, nextFixture } from './pilot-data.js';
import { useData, NotFound, ScreenLink, Comparison, Balance, Form } from './pilot-ui.jsx';
const A = { col: 'var(--usT)', hex: 'var(--us)' }, B = { col: 'var(--themT)', hex: 'var(--them)' };
function nowText() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
function Points({ title, rows }) {
  if (!rows.length) return null;
  return <section className="card"><h2>{title}</h2>{rows.map(r => <div className="pt-row" key={r.key}><b>{r.label}</b><span className="num">{round1(r.value)}</span><span className="mini">ליגה {round1(r.mean)}</span></div>)}</section>;
}
export function Prep() {
  const { table, league, swish, fixtures } = useData();
  const { teamId } = useParams();
  const next = nextFixture(fixtures, nowText());
  const row = teamId ? table.find(r => String(r.id) === teamId) : next && teamByName(table, next.o);
  if (!row || row.us) return <NotFound />;
  const mine = teamProfile(league, swish, US_ID), them = teamProfile(league, swish, row.id), { weak, strong } = prepInsights(league, swish, row.id);
  return <><header className="hero"><div className="top">הכנה למשחק</div><h1 id="screen-heading" tabIndex={-1}>{row.name}</h1><div className="rec tm"><Balance row={row} /><Form form={row.form} /></div></header><main>
    {them ? <section className="card"><h2>ממוצע למשחק</h2><div className="team-labels"><b style={{ color: A.col }}>{US}</b><b style={{ color: B.col }}>{row.name}</b></div>{[['pts', 'נקודות קלעו'], ['ptsA', 'נקודות ספגו'], ['p3', 'שלשות'], ['p2', 'סלי 2'], ['ft', 'עונשין'], ['fouls', 'עבירות']].map(([k, label]) => mine ? <Comparison key={k} label={label} a={mine[k]} b={them[k]} teamA={A} teamB={B} low={k === 'ptsA' || k === 'fouls'} /> : null)}<div className="mini">{them.n} משחקים שלה · {mine?.n ?? 0} שלנו</div></section> : <section className="card"><p className="empty">עדיין אין נתוני משחק לקבוצה.</p></section>}
    <Points title="נקודות תורפה" rows={weak} /><Points title="חוזקות" rows={strong} />
    <section className="card"><ScreenLink className="wbtn" to={`/league/${row.id}`}>כל משחקי הקבוצה</ScreenLink></section></main></>;
}
