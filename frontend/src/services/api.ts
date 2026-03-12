import { API_BASE_URL } from '../config';
import type { Room, User } from '../types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Users ────────────────────────────────────────────────────────────────────
export const createUser = (username: string, color: string): Promise<User> =>
  request('/users', {
    method: 'POST',
    body: JSON.stringify({ username, color }),
  });

// ── Rooms ────────────────────────────────────────────────────────────────────
export const createRoom = (name: string, language: string): Promise<Room> =>
  request('/rooms', {
    method: 'POST',
    body: JSON.stringify({ name, language }),
  });

export const getRooms = (): Promise<Room[]> => request('/rooms');

export const getRoom = (id: string): Promise<Room> => request(`/rooms/${id}`);

export const saveCode = (id: string, code: string, language: string): Promise<Room> =>
  request(`/rooms/${id}/code`, {
    method: 'PUT',
    body: JSON.stringify({ code, language }),
  });

// ── Code execution ────────────────────────────────────────────────────────────
export interface RunResult {
  run: { stdout: string; stderr: string; code: number };
}

export const runCode = (language: string, code: string): Promise<RunResult> =>
  request('/run', {
    method: 'POST',
    body: JSON.stringify({
      language,
      files: [{ content: code }],
    }),
  });
