/**
 * Admin-side WebSocket singleton.
 * Connects to the same /ws/notifications endpoint using the admin's JWT token.
 * Automatically reconnects on disconnect.
 */
const WS_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080')
  .replace(/\/+$/, '')
  .replace(/^http/i, 'ws') + '/ws/notifications';

type WsPayload = { type: string; data: unknown };
type Callback = (payload: WsPayload) => void;

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let callback: Callback | null = null;
let stopped = false;

function connect() {
  if (stopped) return;
  const token = localStorage.getItem('token');
  if (!token) return;

  socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

  socket.onopen = () => {
    pingTimer = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) socket.send('ping');
    }, 30_000);
  };

  socket.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data) as WsPayload;
      if (payload.type === 'pong' || payload.type === 'connected') return;
      callback?.(payload);
    } catch { /* ignore non-JSON */ }
  };

  socket.onclose = () => {
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
    if (!stopped) reconnectTimer = setTimeout(connect, 5_000);
  };

  socket.onerror = () => { socket?.close(); };
}

export function connectAdminWs(cb: Callback) {
  stopped = false;
  callback = cb;
  if (socket && socket.readyState === WebSocket.OPEN) return;
  connect();
}

export function disconnectAdminWs() {
  stopped = true;
  callback = null;
  if (pingTimer)     { clearInterval(pingTimer);  pingTimer = null; }
  if (reconnectTimer){ clearTimeout(reconnectTimer); reconnectTimer = null; }
  socket?.close();
  socket = null;
}
