import React, { createContext, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { TABS, round1, createNavigationTracker } from './pilot-data.js';
export const Data = createContext(null);
export const useData = () => useContext(Data);
const savedScroll = new Map();
try { for (const [key, value] of JSON.parse(sessionStorage.getItem('yaffo-pilot-scroll') || '[]')) if (typeof key === 'string' && Number.isFinite(value) && value >= 0) savedScroll.set(key, value); } catch { /* Refresh restoration is optional when storage is unavailable. */ }
window.addEventListener('pagehide', () => { try { sessionStorage.setItem('yaffo-pilot-scroll', JSON.stringify([...savedScroll].slice(-100))); } catch { /* Navigation still works with storage blocked. */ } });
let pendingScroll = null;
const gamePart = pathname => pathname.match(/^\/games\/([^/]+)\//)?.[1];
const recordNavigation = createNavigationTracker((name, data) => window.dispatchEvent(new CustomEvent('pilot:navigation', { detail: { name, data } })));

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
    const y = type === 'POP' ? savedScroll.get(location.key) || 0 : sameGame ? pendingScroll ?? window.scrollY : 0;
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
    const tab = game ? TABS.find(([key]) => key === last)?.[1] : ({ games: 'משחקים', players: 'שחקני העונה', team: 'קבוצה' }[last]);
    if (tab && (!id || game)) { document.title = `${tab}${game ? ` · מול ${game.opponent.n} · ${game.d}` : ' · הפועל יפו צעירים'} · פיילוט`; recordNavigation({ game, tab }); }
    return () => window.removeEventListener('scroll', onScroll);
  }, [location, type, games]);
  useEffect(() => { const old = history.scrollRestoration; history.scrollRestoration = 'manual'; return () => { history.scrollRestoration = old; }; }, []);
  return null;
}
export function AppShell() {
  const location = useLocation();
  return <><NavigationEffects /><div className="pilot-note">פיילוט לבדיקה · React וניווט חדש · ללא שליחת נתוני מדידה</div><div id="route-body"><Outlet /></div><nav className="nav" aria-label="ניווט העונה">{[['games', '📅', 'משחקים'], ['players', '👥', 'שחקני העונה'], ['team', '📊', 'קבוצה']].map(([path, icon, label]) => <ScreenLink key={path} to={`/${path}`} aria-current={location.pathname.startsWith(`/${path}`) ? 'page' : undefined}><span aria-hidden="true">{icon}</span>{label}</ScreenLink>)}</nav></>;
}
export function Comparison({ label, a, b, teamA, teamB, displayA, displayB, low = false }) {
  const total = a + b || 1, winner = a === b ? 0 : (a > b) !== low ? 1 : 2;
  return <div className="cmp"><div className="l" style={{ color: winner === 1 ? teamA.col : 'var(--mut)' }}>{displayA ?? round1(a)}</div><div><div className="c">{label}</div><div className="bar"><span style={{ width: `${a / total * 100}%`, background: teamA.hex }} /><span style={{ width: `${b / total * 100}%`, background: teamB.hex }} /></div></div><div className="l" style={{ color: winner === 2 ? teamB.col : 'var(--mut)' }}>{displayB ?? round1(b)}</div></div>;
}
export function HowCalculated() { return <details className="how"><summary>איך זה מחושב</summary>הנתונים נקראים מטופס סיום המשחק. סוג הסל (1, 2 או 3 נקודות) נגזר מהפרש הנקודות בין קליעות עוקבות. החטאות לא מתועדות בטופס, ולכן אין אחוזי קליעה מהשדה. מספר זריקות העונשין משוחזר מסימוני העבירות בטופס, ומוצג כחישוב מותנה כשהוא אינו נתון רשמי מלא. אין שעון בטופס: סוף כל רבע מדויק, והזמן בתוך הרבע משוער. מפת המגרש מראה סוג קליעה ולא מיקום. "משחקים" לשחקן = משחקים שבהם נרשם כמי שעלה לפרקט.</details>; }
export function NotFound() { return <main className="card"><h1 id="screen-heading" tabIndex={-1}>המסך לא נמצא</h1><p>הקישור אינו מזהה משחק או מסך קיים.</p><ScreenLink to="/games">חזרה למשחקים</ScreenLink></main>; }
