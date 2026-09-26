// API client — REST endpoints
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  health: () => get('/health'),
  droneState: () => get('/drone/state'),
  mission: () => get('/mission'),
  environment: () => get('/environment'),
  vehicleHealth: () => get('/vehicle/health'),
  energy: () => get('/energy'),
  prediction: () => get('/prediction'),
  safetyEnvelope: () => get('/safety/envelope'),
  decision: () => get('/decision'),

  missionStart: () => post('/mission/start'),
  missionPause: () => post('/mission/pause'),
  missionResume: () => post('/mission/resume'),
  missionReset: () => post('/mission/reset'),
  missionReturnToBase: () => post('/mission/return-to-base'),
  missionAbort: () => post('/mission/abort'),

  changeScenario: (type: string, parameters?: Record<string, number>) =>
    post('/scenario', { type, parameters }),
};
