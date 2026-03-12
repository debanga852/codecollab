import Editor, { type OnMount, type OnChange } from '@monaco-editor/react'

interface Props {
  code: string
  language: string
  onChange: (value: string) => void
  onMount: OnMount
}

export default function CodeEditor({ code, language, onChange, onMount }: Props) {
  const handleChange: OnChange = (value) => {
    onChange(value ?? '')
  }

  return (
    <Editor
      height="100%"
      width="100%"
      language={language}
      value={code}
      theme="vs-dark"
      onChange={handleChange}
      onMount={onMount}
      options={{
        fontSize: 14,
        fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
        padding: { top: 12 },
        cursorBlinking: 'smooth',
        smoothScrolling: true,
      }}
    />
  )
}
