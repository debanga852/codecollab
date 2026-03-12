import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import {
  Room,
  User,
  ChatMessage,
  JoinRoomPayload,
  CodeChangePayload,
  CursorUpdatePayload,
  ChatMessagePayload,
  LanguageChangePayload,
} from './types';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ── In-memory room state ─────────────────────────────────────────────────────
const rooms = new Map<string, Room>();

const COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffcc5c', '#9b59b6', '#e74c3c', '#2ecc71',
];

function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      users: new Map(),
      code: '// Start coding here\n',
      language: 'javascript',
      chatMessages: [],
    });
  }
  return rooms.get(roomId)!;
}

// ── Socket.io event handlers ─────────────────────────────────────────────────
io.on('connection', (socket: Socket) => {
  console.log(`[connect] ${socket.id}`);

  let currentRoomId: string | null = null;
  let currentUser: User | null = null;

  // ── join-room ──────────────────────────────────────────────────────────────
  socket.on('join-room', ({ roomId, username, color }: JoinRoomPayload) => {
    currentRoomId = roomId;
    const room = getOrCreateRoom(roomId);

    const userColor = color || COLORS[Math.floor(Math.random() * COLORS.length)];
    currentUser = { id: socket.id, username, color: userColor };

    room.users.set(socket.id, currentUser);
    socket.join(roomId);

    // Send current room state to the joining user
    socket.emit('room-joined', {
      roomId,
      code: room.code,
      language: room.language,
      users: Array.from(room.users.values()),
      chatHistory: room.chatMessages.slice(-50),
    });

    // Notify everyone else
    socket.to(roomId).emit('user-joined', { user: currentUser });

    // Broadcast updated user list to all (including self)
    io.to(roomId).emit('room-users', { users: Array.from(room.users.values()) });

    console.log(`[join] ${username} → room ${roomId} (${room.users.size} users)`);
  });

  // ── code-change ────────────────────────────────────────────────────────────
  socket.on('code-change', ({ roomId, code }: CodeChangePayload) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.code = code;
    socket.to(roomId).emit('code-updated', { code, userId: socket.id });
  });

  // ── cursor-update ──────────────────────────────────────────────────────────
  socket.on('cursor-update', ({ roomId, line, column }: CursorUpdatePayload) => {
    if (!currentUser) return;
    const room = rooms.get(roomId);
    if (room) {
      const user = room.users.get(socket.id);
      if (user) user.cursor = { line, column };
    }
    socket.to(roomId).emit('cursor-updated', {
      userId: socket.id,
      username: currentUser.username,
      color: currentUser.color,
      line,
      column,
    });
  });

  // ── chat-message ───────────────────────────────────────────────────────────
  socket.on('chat-message', ({ roomId, message }: ChatMessagePayload) => {
    if (!currentUser) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const chatMsg: ChatMessage = {
      userId: socket.id,
      username: currentUser.username,
      color: currentUser.color,
      message,
      timestamp: Date.now(),
    };

    room.chatMessages.push(chatMsg);
    // Broadcast to all in room (including sender)
    io.to(roomId).emit('chat-message', chatMsg);
  });

  // ── language-change ────────────────────────────────────────────────────────
  socket.on('language-change', ({ roomId, language }: LanguageChangePayload) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.language = language;
    io.to(roomId).emit('language-changed', { language, userId: socket.id });
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (currentRoomId && currentUser) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.users.delete(socket.id);
        socket.to(currentRoomId).emit('user-left', { userId: socket.id });
        io.to(currentRoomId).emit('room-users', {
          users: Array.from(room.users.values()),
        });
        // Prune empty rooms
        if (room.users.size === 0) rooms.delete(currentRoomId);
      }
    }
    console.log(`[disconnect] ${socket.id}`);
  });
});

// ── Health endpoint ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`);
});
