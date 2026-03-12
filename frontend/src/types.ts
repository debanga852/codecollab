export interface User {
  id: string;
  username: string;
  color: string;
  cursor?: { line: number; column: number };
}

export interface Room {
  id: string;
  name: string;
  language: string;
  code: string;
  createdAt: string;
}

export interface ChatMessage {
  userId: string;
  username: string;
  color: string;
  message: string;
  timestamp: number;
}

export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'rust' | 'go';

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python',     label: 'Python' },
  { value: 'java',       label: 'Java' },
  { value: 'cpp',        label: 'C++' },
  { value: 'rust',       label: 'Rust' },
  { value: 'go',         label: 'Go' },
];
