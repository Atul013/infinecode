import { ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  min?: number
  style?: React.CSSProperties
}

export default function NumberInput({ value, onChange, placeholder, min = 0, style }: Props) {
  const step = (dir: 1 | -1) => {
    const current = value === '' ? (dir === 1 ? -1 : 1) : parseInt(value, 10)
    const next = current + dir
    if (next < min) return
    onChange(String(next))
  }

  return (
    <div style={{ position: 'relative', display: 'flex', ...style }}>
      <input
        type="number"
        min={min}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: '#0C0C0C',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 7,
          padding: '9px 36px 9px 12px',
          fontSize: 13,
          color: '#F5F0E8',
          fontFamily: 'inherit',
          width: '100%',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = 'rgba(196,168,130,0.30)')}
        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
      />

      {/* Spinner buttons */}
      <div style={{
        position: 'absolute', right: 1, top: 1, bottom: 1,
        display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '0 6px 6px 0',
        overflow: 'hidden',
      }}>
        {([1, -1] as const).map(dir => (
          <button
            key={dir}
            type="button"
            onMouseDown={e => { e.preventDefault(); step(dir) }}
            style={{
              flex: 1,
              width: 28,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#5E5A55',
              borderBottom: dir === 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              transition: 'background 0.12s, color 0.12s',
              padding: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(196,168,130,0.08)'
              e.currentTarget.style.color = '#C4A882'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#5E5A55'
            }}
          >
            {dir === 1 ? <ChevronUp size={11} strokeWidth={2} /> : <ChevronDown size={11} strokeWidth={2} />}
          </button>
        ))}
      </div>
    </div>
  )
}
