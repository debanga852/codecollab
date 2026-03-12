import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type * as Monaco from 'monaco-editor'
import { getRoom, saveCode, runCode } from '../services/api'
import { connectSocket, disconnectSocket } from '../services/socket'
import type { User, ChatMessage } from '../types'
import CodeEditor from '../components/CodeEditor'
import Toolbar from '../components/Toolbar'
import UserList from '../components/UserList'
import ChatSidebar from '../components/ChatSidebar'
import OutputPanel from '../components/OutputPanel'

const USER_KEY  = 'cc_user_id'
const NAME_KEY  = 'cc_username'
const COLOR_KEY = 'cc_color'

type SidebarTab = 'users' | 'chat'

export default function RoomPage() {
  const { id: roomId = '' } = useParams<{ id: string }>()
  const navigate             = useNavigate()

  const username = localStorage.getItem(NAME_KEY) ?? 'Anonymous'
  const color    = localStorage.getItem(COLOR_KEY) ?? '#4ecdc4'

  const [code,        setCode]        = useState('// Loading…')
  const [language,    setLanguage]    = useState('javascript')
  const [users,       setUsers]       = useState<User[]>([])
  const [messages,    setMessages]    = useState<ChatMessage[]>([])
  const [output,      setOutput]      = useState('')
  const [runError,    setRunError]    = useState('')
  const [executing,   setExecuting]   = useState(false)
  const [roomName,    setRoomName]    = useState(roomId)
  const [sideTab,     setSideTab]     = useState<SidebarTab>('users')
  const [unread,      setUnread]      = useState(0)
  const [copied,      setCopied]      = useState(false)
  const [saveStatus,  setSaveStatus]  = useState<'idle' | 'saving' | 'saved'>('idle')

  const editorRef      = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef      = useRef<typeof import('monaco-editor') | null>(null)
  const decorationsRef = useRef<Map<string, Monaco.editor.IEditorDecorationsCollection>>(new Map())

  // ── Load room from Spring Boot on mount ─────────────────────────────────
  useEffect(() => {
    getRoom(roomId)
      .then(room => {
        setCode(room.code ?? '// Start coding here\n')
        setLanguage(room.language)
        setRoomName(room.name)
      })
      .catch(() => {
        // Room doesn't exist in DB yet — Socket.io will init it
        setCode('// Start coding here\n')
      })
  }, [roomId])

  // ── Socket.io connection ─────────────────────────────────────────────────
  useEffect(() => {
    const socket = connectSocket()

    socket.emit('join-room', { roomId, username, color })

    socket.on('room-joined', ({ code: c, language: l, users: u, chatHistory }) => {
      setCode(c)
      setLanguage(l)
      setUsers(u)
      setMessages(chatHistory ?? [])
    })

    socket.on('room-users', ({ users: u }: { users: User[] }) => setUsers(u))

    socket.on('user-joined', ({ user }: { user: User }) => {
      setUsers(prev => [...prev.filter(x => x.id !== user.id), user])
    })

    socket.on('user-left', ({ userId }: { userId: string }) => {
      setUsers(prev => prev.filter(u => u.id !== userId))
      // Remove that user's cursor decoration
      const col = decorationsRef.current.get(userId)
      if (col) { col.clear(); decorationsRef.current.delete(userId) }
    })

    socket.on('code-updated', ({ code: c }: { code: string }) => {
      setCode(c)
    })

    socket.on('cursor-updated', ({ userId, username: un, line, column }: { userId: string; username: string; color: string; line: number; column: number }) => {
      const editor = editorRef.current
      const monaco = monacoRef.current
      if (!editor || !monaco) return

      const existing = decorationsRef.current.get(userId)
      const decorations: Monaco.editor.IModelDeltaDecoration[] = [{
        range: new monaco.Range(line, column, line, column + 1),
        options: {
          className: 'remote-cursor',
          after: {
            content: ` ${un}`,
            inlineClassName: 'remote-cursor-label',
          },
        },
      }]

      if (existing) {
        existing.set(decorations)
      } else {
        const col = editor.createDecorationsCollection(decorations)
        decorationsRef.current.set(userId, col)
      }
    })

    socket.on('chat-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg])
      if (sideTab !== 'chat') setUnread(n => n + 1)
    })

    socket.on('language-changed', ({ language: l }: { language: string }) => {
      setLanguage(l)
    })

    return () => {
      socket.off('room-joined')
      socket.off('room-users')
      socket.off('user-joined')
      socket.off('user-left')
      socket.off('code-updated')
      socket.off('cursor-updated')
      socket.off('chat-message')
      socket.off('language-changed')
      disconnectSocket()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  const handleEditorChange = useCallback((value: string) => {
    setCode(value)
    const socket = connectSocket()
    socket.emit('code-change', { roomId, code: value })
  }, [roomId])

  const handleEditorMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
      editorRef.current  = editor
      monacoRef.current  = monaco

      editor.onDidChangeCursorPosition((e: Monaco.editor.ICursorPositionChangedEvent) => {
        const socket = connectSocket()
        socket.emit('cursor-update', {
          roomId,
          line:   e.position.lineNumber,
          column: e.position.column,
        })
      })
    },
    [roomId],
  )

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang)
    const socket = connectSocket()
    socket.emit('language-change', { roomId, language: lang })
  }, [roomId])

  const handleRun = async () => {
    setExecuting(true)
    setOutput('')
    setRunError('')
    try {
      const result = await runCode(language, code)
      const { stdout, stderr } = result.run
      if (stdout) setOutput(stdout)
      if (stderr) setRunError(stderr)
      if (!stdout && !stderr) setOutput('Program exited with no output.')
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Execution failed')
    } finally {
      setExecuting(false)
    }
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      await saveCode(roomId, code, language)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('idle')
    }
  }

  const handleSendMessage = useCallback((message: string) => {
    const socket = connectSocket()
    socket.emit('chat-message', { roomId, message })
  }, [roomId])

  const handleCopyId = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const switchTab = (tab: SidebarTab) => {
    setSideTab(tab)
    if (tab === 'chat') setUnread(0)
  }

  const currentUserId = localStorage.getItem(USER_KEY) ?? ''

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition text-sm"
          >
            ← Home
          </button>
          <span className="text-gray-600">|</span>
          <span className="font-semibold text-white">{roomName}</span>
          <button
            onClick={handleCopyId}
            className="flex items-center gap-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5
                       text-xs font-mono text-gray-400 hover:text-white hover:border-gray-400 transition"
          >
            {roomId}
            <span className="ml-1">{copied ? '✓' : '⎘'}</span>
          </button>
        </div>

        {/* User avatars */}
        <div className="flex items-center gap-1">
          {users.slice(0, 5).map(u => (
            <div
              key={u.id}
              title={u.username}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: u.color }}
            >
              {u.username.charAt(0).toUpperCase()}
            </div>
          ))}
          {users.length > 5 && (
            <div className="w-7 h-7 rounded-full bg-[#3c3c3c] flex items-center justify-center text-xs text-gray-400">
              +{users.length - 5}
            </div>
          )}
        </div>
      </header>

      {/* ── Toolbar ── */}
      <Toolbar
        language={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        onSave={handleSave}
        executing={executing}
        saveStatus={saveStatus}
      />

      {/* ── Main ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            code={code}
            language={language}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
          />
        </div>

        {/* Sidebar */}
        <aside className="w-64 flex flex-col bg-[#252526] border-l border-[#3c3c3c] shrink-0">
          {/* Tab headers */}
          <div className="flex border-b border-[#3c3c3c] shrink-0">
            {(['users', 'chat'] as SidebarTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`flex-1 py-2 text-sm font-medium transition relative
                  ${sideTab === tab
                    ? 'text-white border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'chat' && unread > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">
                    {unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {sideTab === 'users'
            ? <UserList users={users} currentUserId={currentUserId} />
            : <ChatSidebar
                messages={messages}
                currentUserId={currentUserId}
                onSendMessage={handleSendMessage}
              />
          }
        </aside>
      </div>

      {/* ── Output Panel ── */}
      <OutputPanel output={output} error={runError} executing={executing} />
    </div>
  )
}
