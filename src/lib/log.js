// Tiny in-app log so the debug panel (and automated screenshot tests) can read
// what happened without opening devtools.
const listeners = new Set();

window.APP_LOGS = window.APP_LOGS || [];
window.APP_ERRORS = window.APP_ERRORS || [];

export function logApp(msg, level = 'info') {
  const entry = `[${new Date().toLocaleTimeString()}] ${level.toUpperCase()}: ${msg}`;
  window.APP_LOGS.push(entry);
  if (level === 'error') window.APP_ERRORS.push({ msg });
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](entry);
  listeners.forEach((fn) => fn(window.APP_LOGS));
}

export function subscribeLogs(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getLogs() {
  return window.APP_LOGS;
}
