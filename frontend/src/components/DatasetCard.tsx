import { useState } from 'react'
import { motion } from 'motion/react'
import { Trash2, Pencil, Database, Image, FileText, Mic } from 'lucide-react'
import type { Dataset } from '../types'
import StatusBadge from './StatusBadge'

const TYPE_ICON = { Tabular: Database, Image, Text: FileText, Audio: Mic }

interface Props {
  dataset: Dataset
  index: number
  onView: (d: Dataset) => void
  onEdit: (d: Dataset) => void
  onDelete: (d: Dataset) => void
}

export default function DatasetCard({ dataset, index, onView, onEdit, onDelete }: Props) {
  const Icon = TYPE_ICON[dataset.type]
  const [hovered, setHovered] = useState(false)

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={() => onView(dataset)}
      style={{
        background: '#181818',
        border: `1px solid ${hovered ? 'rgba(196,168,130,0.22)' : 'rgba(255,255,255,0.055)'}`,
        borderRadius: 14,
        padding: 20,
        position: 'relative',
        transition: 'border-color 0.25s',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Actions — appear on hover */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        display: 'flex', gap: 4,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.15s',
      }}>
        {[
        { icon: Pencil, action: (e: React.MouseEvent) => { e.stopPropagation(); onEdit(dataset) }, hoverColor: '#F5F0E8' },
          { icon: Trash2, action: (e: React.MouseEvent) => { e.stopPropagation(); onDelete(dataset) }, hoverColor: '#c0504a' },
        ].map(({ icon: Ic, action, hoverColor }, i) => (
          <button
            key={i}
            onClick={(e) => action(e)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 7, padding: '5px 7px',
              color: '#787068', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = hoverColor)}
            onMouseLeave={e => (e.currentTarget.style.color = '#787068')}
          >
            <Ic size={13} />
          </button>
        ))}
      </div>

      {/* Name + description */}
      <div style={{ paddingRight: 56, marginBottom: 14 }}>
        <h3 style={{
          fontSize: 15, fontWeight: 500, color: '#F5F0E8',
          letterSpacing: '-0.01em', lineHeight: 1.3,
          margin: '0 0 5px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {dataset.name}
        </h3>
        {dataset.description && (
          <p style={{
            fontSize: 13, color: '#5E5A55', lineHeight: 1.55, margin: 0,
            overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {dataset.description}
          </p>
        )}
      </div>

      {/* Type tag */}
      <div style={{ marginBottom: 16 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(196,168,130,0.08)', border: '1px solid rgba(196,168,130,0.15)',
          color: '#C4A882', fontSize: 11, letterSpacing: '0.02em',
          padding: '3px 9px', borderRadius: 5,
        }}>
          <Icon size={10} />
          {dataset.type}
        </span>
      </div>

      {/* Metrics */}
      {(dataset.rows !== null || dataset.features !== null) && (
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          {[
            { label: 'Rows', val: dataset.rows },
            { label: 'Features', val: dataset.features },
          ].filter(m => m.val !== null).map(({ label, val }) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: '#5E5A55', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ fontSize: 14, color: '#F5F0E8', fontWeight: 500 }}>
                {val!.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StatusBadge status={dataset.status} />
        <span style={{ fontSize: 11, color: '#5E5A55' }}>
          {new Date(dataset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </motion.article>
  )
}
