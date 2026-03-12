import { useState, useEffect, useRef } from 'react'
import type { ChatMessage } from '../types'

interface Props {
  messages: ChatMessage[]
  currentUserId: string
  onSendMessage: (msg: string) => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatSidebar({ messages, currentUserId, onSendMessage }: Props) {
  const [input,    setInput]    = useState('')
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    onSendMessage(trimmed)
    setInput('')
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500 text-center mt-4">No messages yet</p>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.userId === currentUserId
          return (
            <div key={i} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              {!isOwn && (
                <span className="text-xs font-semibold mb-0.5" style={{ color: msg.color }}>
                  {msg.username}
                </span>
              )}
              <div
                className={`max-w-[90%] px-3 py-2 rounded-2xl text-sm break-words
                  ${isOwn
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-[#3c3c3c] text-gray-100 rounded-bl-sm'}`}
              >
                {msg.message}
              </div>
              <span className="text-xs text-gray-600 mt-0.5">{formatTime(msg.timestamp)}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-[#3c3c3c] flex gap-2 shrink-0">
        <input
          className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg px-3 py-2 text-sm
                     text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          placeholder="Message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white
                     px-3 rounded-lg text-sm transition"
        >
          ↑
        </button>
      </div>
    </div>
  )
}
