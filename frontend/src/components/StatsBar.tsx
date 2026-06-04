import { Database, Image, FileText, Mic, Layers } from 'lucide-react'
import type { Stats } from '../types'

const ITEMS = [
  { key: 'total',   label: 'Total',   icon: Layers   },
  { key: 'tabular', label: 'Tabular', icon: Database  },
  { key: 'image',   label: 'Image',   icon: Image     },
  { key: 'text',    label: 'Text',    icon: FileText  },
  { key: 'audio',   label: 'Audio',   icon: Mic       },
] as const

export default function StatsBar({ stats }: { stats: Stats | undefined }) {
  return (
    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {ITEMS.map(({ key, label, icon: Icon }) => (
        <div key={key} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 14px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 999,
        }}>
          <Icon size={12} color="#5E5A55" />
          <span style={{ fontSize: 12, color: '#787068', letterSpacing: '0.01em' }}>{label}</span>
          <span style={{ fontSize: 13, color: '#F5F0E8', fontWeight: 500, minWidth: 16, textAlign: 'right' }}>
            {stats ? stats[key] : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}
