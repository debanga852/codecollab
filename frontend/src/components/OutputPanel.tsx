import { useState } from 'react'

interface Props {
  output: string
  error: string
  executing: boolean
}

export default function OutputPanel({ output, error, executing }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={`bg-[#1e1e1e] border-t border-[#3c3c3c] shrink-0 transition-all duration-200
                  ${collapsed ? 'h-8' : 'h-40'}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-8 bg-[#252526] border-b border-[#3c3c3c]
                   cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          Output {executing && <span className="text-yellow-400">● running</span>}
        </span>
        <span className="text-gray-500 text-xs">{collapsed ? '▲' : '▼'}</span>
      </div>

      {!collapsed && (
        <div className="h-32 overflow-y-auto p-3 font-mono text-sm">
          {executing && (
            <span className="text-yellow-400">Running…</span>
          )}
          {output && (
            <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
          )}
          {error && (
            <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>
          )}
          {!executing && !output && !error && (
            <span className="text-gray-600">Output will appear here after you run the code</span>
          )}
        </div>
      )}
    </div>
  )
}
