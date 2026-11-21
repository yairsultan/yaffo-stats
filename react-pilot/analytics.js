// Preserve the existing aggregate-navigation scope. No duration, identity, or replay data.
export const production = import.meta.env.VITE_APP_MODE === 'production';
const queue = [];
function allowed() { return production && location.hostname === 'yairsultan.github.io' && navigator.doNotTrack !== '1'; }
export function flushAnalytics() {
  if (!allowed() || typeof window.umami?.track !== 'function') return;
  for (const event of queue.splice(0)) try { const result = window.umami.track(event.name, event.data); result?.catch?.(() => {}); } catch { /* Analytics never blocks the site. */ }
}
export function trackNavigation(name, data) {
  window.dispatchEvent(new CustomEvent('pilot:navigation', { detail: { name, data } }));
  if (!allowed()) return;
  queue.push({ name, data });
  if (queue.length > 100) queue.splice(0, queue.length - 100);
  flushAnalytics();
}
export function installAnalytics() {
  if (!allowed() || document.getElementById('site-analytics')) return;
  const script = document.createElement('script');
  script.id = 'site-analytics'; script.defer = true; script.src = 'https://cloud.umami.is/script.js';
  Object.assign(script.dataset, { websiteId: 'fd4d8192-b382-4a33-b00a-f80a6b740e05', domains: 'yairsultan.github.io', excludeSearch: 'true', excludeHash: 'true', doNotTrack: 'true' });
  script.addEventListener('load', flushAnalytics);
  document.head.append(script);
}
