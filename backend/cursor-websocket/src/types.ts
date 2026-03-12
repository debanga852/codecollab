export interface CursorPosition {
  line: number;
  column: number;
}

export interface User {
  id: string;
  username: string;
  color: string;
  cursor?: CursorPosition;
}

export interface ChatMessage {
  userId: string;
  username: string;
  color: string;
  message: string;
  timestamp: number;
}

export interface Room {
  id: string;
  users: Map<string, User>;
  code: string;
  language: string;
  chatMessages: ChatMessage[];
}

// ── Client → Server events ───────────────────────────────────────────────────
export interface JoinRoomPayload {
  roomId: string;
  username: string;
  color: string;
}

export interface CodeChangePayload {
  roomId: string;
  code: string;
}

export interface CursorUpdatePayload {
  roomId: string;
  line: number;
  column: number;
}

export interface ChatMessagePayload {
  roomId: string;
  message: string;
}

export interface LanguageChangePayload {
  roomId: string;
  language: string;
}
