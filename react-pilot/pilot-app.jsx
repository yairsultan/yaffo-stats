import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { prepareGames, leagueTable } from './pilot-data.js';
import { Data, AppShell, NotFound } from './pilot-ui.jsx';
import { Prep } from './pilot-prep.jsx';
import { SeasonGames, SeasonPlayers, SeasonTeam, SeasonLeague, LeagueTeam } from './pilot-season.jsx';
import { GameLayout, Overview, GamePlayers, GameFlow, GameCourt } from './pilot-game.jsx';
import './pilot.css';
import { installAnalytics } from './analytics.js';
installAnalytics();
const palettes = [['זהב וכחול','#ffc233','#4d9bff','#0a1730','#10264d'],['כתום יפו','#ff7a1a','#38bdf8','#1c1108','#3b1d09'],['ירוק מגרש','#34d399','#f472b6','#041a14','#0b3b2e'],['אדום וסגול','#f43f5e','#a78bfa','#16081a','#2d1038'],['טורקיז ופחם','#22d3ee','#94a3b8','#0b1116','#1a2733']];
try { const selected = Number(localStorage.getItem('pal')); if (Number.isInteger(selected) && palettes[selected]) { const p = palettes[selected]; ['--us', '--them', '--h1', '--h2'].forEach((key, i) => document.documentElement.style.setProperty(key, p[i + 1])); } } catch { /* Storage may be disabled. Default colors remain usable. */ }
function GameIndex() { const location = useLocation(); return <Navigate to={`overview${location.search}`} replace />; }
function Application() {
  const [data, setData] = useState(null), [failed, setFailed] = useState(false), [attempt, retry] = useState(0);
  useEffect(() => { const abort = new AbortController(); setFailed(false); Promise.all(['games.json', 'fixtures.json', 'league.json', 'swish.json'].map(async name => { try { const response = await fetch(`${import.meta.env.BASE_URL}${name}`, { cache: 'no-store', signal: abort.signal }); if (!response.ok) throw new Error('Data unavailable'); return await response.json(); } catch (error) { if (name === 'fixtures.json' && error.name !== 'AbortError') return [];
 if ((name === 'league.json' || name === 'swish.json') && error.name !== 'AbortError') return null; throw error; } })).then(([games, fixtures, league, swish]) => setData({ games: prepareGames(games), fixtures, league, swish, table: leagueTable(league) })).catch(error => { if (error.name !== 'AbortError') setFailed(true); }); return () => abort.abort(); }, [attempt]);
  if (failed) return <main className="card"><h1>לא ניתן לטעון את הנתונים</h1><button className="chip" onClick={() => retry(n => n + 1)}>נסו שוב</button></main>;
  if (!data) return <main className="card" role="status">טוען נתוני משחקים…</main>;
  return <Data.Provider value={data}><HashRouter><Routes><Route element={<AppShell />}><Route index element={<Navigate to="/games" replace />} /><Route path="games" element={<SeasonGames />} /><Route path="full" element={<Navigate to="/games?schedule=full" replace />} /><Route path="players" element={<SeasonPlayers />} /><Route path="team" element={<SeasonTeam />} /><Route path="league" element={<SeasonLeague />} /><Route path="league/:teamId" element={<LeagueTeam />} /><Route path="prep" element={<Prep />} /><Route path="prep/:teamId" element={<Prep />} /><Route path="games/:gameId" element={<GameLayout />}><Route index element={<GameIndex />} /><Route path="overview" element={<Overview />} /><Route path="players" element={<GamePlayers />} /><Route path="flow" element={<GameFlow />} /><Route path="court" element={<GameCourt />} /><Route path="*" element={<NotFound />} /></Route><Route path="*" element={<NotFound />} /></Route></Routes></HashRouter></Data.Provider>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Application /></React.StrictMode>);
