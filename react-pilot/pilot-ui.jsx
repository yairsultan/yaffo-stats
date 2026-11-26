import React, { createContext, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { production, trackNavigation } from './analytics.js';
import { TABS, round1, createNavigationTracker, balanceTone } from './pilot-data.js';
export const Data = createContext(null);
export const useData = () => useContext(Data);
const savedScroll = new Map();
try { for (const [key, value] of JSON.parse(sessionStorage.getItem('yaffo-pilot-scroll') || '[]')) if (typeof key === 'string' && Number.isFinite(value) && value >= 0) savedScroll.set(key, value); } catch { /* Refresh restoration is optional when storage is unavailable. */ }
window.addEventListener('pagehide', () => { try { sessionStorage.setItem('yaffo-pilot-scroll', JSON.stringify([...savedScroll].slice(-100))); } catch { /* Navigation still works with storage blocked. */ } });
let pendingScroll = null;
const gamePart = pathname => pathname.match(/^\/games\/([^/]+)\//)?.[1];
const recordNavigation = createNavigationTracker(trackNavigation);

export function ScreenLink({ to, children, ...props }) {
  const location = useLocation();
  function prepare(event) {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    savedScroll.set(location.key, window.scrollY);
    pendingScroll = window.scrollY;
    const root = document.getElementById('route-body');
    if (root) root.style.minHeight = `${window.scrollY + innerHeight}px`;
  }
  return <Link to={to} onClick={prepare} {...props}>{children}</Link>;
}
function NavigationEffects() {
  const location = useLocation(), type = useNavigationType(), { games } = useData();
  const previous = useRef(null);
  useLayoutEffect(() => {
    const before = previous.current;
    const sameGame = gamePart(before?.pathname || '') && gamePart(before.pathname) === gamePart(location.pathname);
    const y = type === 'POP' ? savedScroll.get(location.key) || 0 : (sameGame || before?.pathname === location.pathname) ? pendingScroll ?? window.scrollY : 0;
    const root = document.getElementById('route-body');
    root.style.minHeight = y ? `${y + innerHeight}px` : '';
    window.scrollTo(0, y);
    if (!sameGame && type !== 'POP') document.getElementById('screen-heading')?.focus({ preventScroll: true });
    pendingScroll = null;
    previous.current = location;
    savedScroll.set(location.key, y);
    const onScroll = () => savedScroll.set(location.key, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    const id = gamePart(location.pathname), game = games.find(g => g.id === id);
    const last = location.pathname.split('/').filter(Boolean).at(-1);
    const tab = game ? TABS.find(([key]) => key === last)?.[1] : ({ games: 'משחקים', players: 'שחקני העונה', team: 'קבוצה', league: 'מצב הליגה' }[last]);
    if (tab && (!id || game)) { document.title = `${tab}${game ? ` · מול ${game.opponent.n} · ${game.d}` : ' · הפועל יפו צעירים'}${production ? '' : ' · פיילוט'}`; recordNavigation({ game, tab }); }
    return () => window.removeEventListener('scroll', onScroll);
  }, [location, type, games]);
  useEffect(() => { const old = history.scrollRestoration; history.scrollRestoration = 'manual'; return () => { history.scrollRestoration = old; }; }, []);
  return null;
}
export function AppShell() {
  const location = useLocation();
  return <><NavigationEffects />{!production && <div className="pilot-note">פיילוט לבדיקה · React וניווט חדש · ללא שליחת נתוני מדידה</div>}<div id="route-body"><Outlet /></div><nav className="nav" aria-label="ניווט העונה">{[['games', '📅', 'משחקים'], ['players', '👥', 'שחקני העונה'], ['team', '📊', 'קבוצה'], ['league', '🏆', 'ליגה']].map(([path, icon, label]) => <ScreenLink key={path} to={`/${path}`} aria-current={location.pathname.startsWith(`/${path}`) ? 'page' : undefined}><span aria-hidden="true">{icon}</span>{label}</ScreenLink>)}</nav></>;
}
export function Comparison({ label, a, b, teamA, teamB, displayA, displayB, low = false }) {
  const total = a + b || 1, winner = a === b ? 0 : (a > b) !== low ? 1 : 2;
  return <div className="cmp"><div className="l" style={{ color: winner === 1 ? teamA.col : 'var(--mut)', fontWeight: winner === 1 ? 900 : undefined, fontSize: winner === 1 ? 19 : undefined }}>{displayA ?? round1(a)}</div><div><div className="c">{label}</div><div className="bar"><span style={{ width: `${a / total * 100}%`, background: teamA.hex }} /><span style={{ width: `${b / total * 100}%`, background: teamB.hex }} /></div></div><div className="l" style={{ color: winner === 2 ? teamB.col : 'var(--mut)', fontWeight: winner === 2 ? 900 : undefined, fontSize: winner === 2 ? 19 : undefined }}>{displayB ?? round1(b)}</div></div>;
}
export function NotFound() { return <main className="card"><h1 id="screen-heading" tabIndex={-1}>המסך לא נמצא</h1><p>הקישור אינו מזהה משחק או מסך קיים.</p><ScreenLink to="/games">חזרה למשחקים</ScreenLink></main>; }

// Win/loss balance: green with more wins, red with more losses, grey when level or no games. Text always shows the record, color is not the only signal.
export function Balance({ row }) {
  if (!row) return null;
  const tone = balanceTone(row);
  return <span className={`bal ${tone}`} dir="ltr" aria-label={`${row.w} ניצחונות, ${row.l} הפסדים`}>{row.w}-{row.l}</span>;
}
export function Form({ form, max = 5 }) {
  const last = (form || []).slice(-max);
  if (!last.length) return null;
  return <span className="fm" dir="ltr" aria-label={`${last.filter(x => x === 'W').length} ניצחונות מתוך ${last.length} האחרונים`}>{last.map((x, i) => <i key={i} className={x}>{x}</i>)}</span>;
}
