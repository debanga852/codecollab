import { LANGUAGE_OPTIONS } from '../types'

interface Props {
  language: string
  onLanguageChange: (lang: string) => void
  onRun: () => void
  onSave: () => void
  executing: boolean
  saveStatus: 'idle' | 'saving' | 'saved'
}

export default function Toolbar({ language, onLanguageChange, onRun, onSave, executing, saveStatus }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[#2d2d2d] border-b border-[#3c3c3c] shrink-0">
      <select
        value={language}
        onChange={e => onLanguageChange(e.target.value)}
        className="bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-1.5 text-sm text-white
                   focus:outline-none focus:border-blue-500 transition cursor-pointer"
      >
        {LANGUAGE_OPTIONS.map(l => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>

      <div className="flex-1" />

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saveStatus === 'saving'}
        className="px-4 py-1.5 text-sm font-medium rounded transition
                   bg-[#3c3c3c] hover:bg-[#4c4c4c] text-gray-200 disabled:opacity-50"
      >
        {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : 'Save'}
      </button>

      {/* Run */}
      <button
        onClick={onRun}
        disabled={executing}
        className="px-5 py-1.5 text-sm font-semibold rounded transition
                   bg-green-700 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-wait"
      >
        {executing ? '⏳ Running…' : '▶ Run'}
      </button>
    </div>
  )
}
