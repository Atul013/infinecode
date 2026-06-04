import type { DatasetStatus } from '../types'

const CFG: Record<DatasetStatus, { color: string; bg: string; border: string }> = {
  'Not Explored':       { color: '#5E5A55', bg: 'rgba(94,90,85,0.10)',    border: 'rgba(94,90,85,0.20)' },
  'Exploring':          { color: '#A07850', bg: 'rgba(160,120,80,0.10)',   border: 'rgba(160,120,80,0.20)' },
  'Ready for Training': { color: '#C4A882', bg: 'rgba(196,168,130,0.10)', border: 'rgba(196,168,130,0.15)' },
  'Trained':            { color: '#F5F0E8', bg: 'rgba(245,240,232,0.08)', border: 'rgba(245,240,232,0.14)' },
}

export default function StatusBadge({ status }: { status: DatasetStatus }) {
  const c = CFG[status]
  return (
    <span style={{
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
      fontSize: 11, letterSpacing: '0.02em', padding: '3px 10px',
      borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
      {status}
    </span>
  )
}
