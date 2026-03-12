import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser, createRoom, getRooms } from '../services/api'
import type { Room } from '../types'
import { LANGUAGE_OPTIONS } from '../types'

const USER_KEY  = 'cc_user_id'
const NAME_KEY  = 'cc_username'
const COLOR_KEY = 'cc_color'

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffcc5c', '#9b59b6']

export default function LandingPage() {
  const navigate = useNavigate()

  const [username,    setUsername]    = useState(localStorage.getItem(NAME_KEY) ?? '')
  const [roomName,    setRoomName]    = useState('')
  const [roomLang,    setRoomLang]    = useState('javascript')
  const [joinId,      setJoinId]      = useState('')
  const [rooms,       setRooms]       = useState<Room[]>([])
  const [creating,    setCreating]    = useState(false)
  const [joining,     setJoining]     = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    getRooms().then(setRooms).catch(() => setRooms([]))
  }, [])

  async function ensureUser(): Promise<void> {
    if (!username.trim()) { setError('Enter your name first'); return Promise.reject() }
    if (!localStorage.getItem(USER_KEY)) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const user  = await createUser(username.trim(), color)
      localStorage.setItem(USER_KEY,  user.id)
      localStorage.setItem(NAME_KEY,  user.username)
      localStorage.setItem(COLOR_KEY, user.color)
    } else {
      localStorage.setItem(NAME_KEY, username.trim())
    }
  }

  async function handleCreate() {
    setError('')
    if (!roomName.trim()) { setError('Enter a room name'); return }
    try {
      setCreating(true)
      await ensureUser()
      const room = await createRoom(roomName.trim(), roomLang)
      navigate(`/room/${room.id}`)
    } catch { setError('Failed to create room') }
    finally  { setCreating(false) }
  }

  async function handleJoin(id: string) {
    setError('')
    try {
      setJoining(true)
      await ensureUser()
      navigate(`/room/${id.trim().toUpperCase()}`)
    } catch { setError('Failed to join room') }
    finally  { setJoining(false) }
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-gray-100 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold text-white mb-2">
          {'<'}
          <span className="text-blue-400">Code</span>
          <span className="text-purple-400">Collab</span>
          {' />'}
        </h1>
        <p className="text-gray-400 text-lg">Real-time collaborative code editor</p>
      </div>

      {/* Username */}
      <div className="w-full max-w-md mb-8">
        <label className="block text-sm text-gray-400 mb-1">Your name</label>
        <input
          className="w-full bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg px-4 py-3
                     text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          placeholder="Enter your name..."
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
      </div>

      <div className="w-full max-w-md grid grid-cols-1 gap-6">
        {/* Create Room */}
        <div className="bg-[#252526] rounded-xl p-6 border border-[#3c3c3c]">
          <h2 className="text-lg font-semibold text-white mb-4">Create a room</h2>
          <input
            className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg px-4 py-2 mb-3
                       text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            placeholder="Room name..."
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <select
            className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg px-4 py-2 mb-4
                       text-white focus:outline-none focus:border-blue-500 transition"
            value={roomLang}
            onChange={e => setRoomLang(e.target.value)}
          >
            {LANGUAGE_OPTIONS.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-semibold py-2 rounded-lg transition"
          >
            {creating ? 'Creating…' : '+ Create Room'}
          </button>
        </div>

        {/* Join Room */}
        <div className="bg-[#252526] rounded-xl p-6 border border-[#3c3c3c]">
          <h2 className="text-lg font-semibold text-white mb-4">Join a room</h2>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg px-4 py-2
                         text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition
                         uppercase"
              placeholder="Room ID (e.g. A1B2C3D4)"
              value={joinId}
              onChange={e => setJoinId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinId.trim() && handleJoin(joinId)}
            />
            <button
              onClick={() => handleJoin(joinId)}
              disabled={joining || !joinId.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                         text-white font-semibold px-5 rounded-lg transition"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Recent rooms */}
      {rooms.length > 0 && (
        <div className="w-full max-w-md mt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Recent Rooms
          </h2>
          <div className="space-y-2">
            {rooms.slice(0, 6).map(room => (
              <button
                key={room.id}
                onClick={() => handleJoin(room.id)}
                className="w-full flex items-center justify-between bg-[#252526] border border-[#3c3c3c]
                           rounded-lg px-4 py-3 hover:border-blue-500 hover:bg-[#2a2d2e] transition text-left"
              >
                <div>
                  <span className="text-white font-medium">{room.name}</span>
                  <span className="ml-2 text-xs text-gray-500 font-mono">{room.id}</span>
                </div>
                <span className="text-xs bg-[#1e1e1e] text-gray-400 px-2 py-1 rounded">
                  {room.language}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
