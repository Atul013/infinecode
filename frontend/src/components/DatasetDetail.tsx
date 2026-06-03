import { motion, AnimatePresence } from 'motion/react'
import { X, Pencil, Trash2, Database, Image, FileText, Mic } from 'lucide-react'
import type { Dataset, DatasetStatus } from '../types'
import StatusBadge from './StatusBadge'

const TYPE_ICON = { Tabular: Database, Image, Text: FileText, Audio: Mic }

const STATUS_STEPS: DatasetStatus[] = ['Not Explored', 'Exploring', 'Ready for Training', 'Trained']
const STATUS_COLORS: Record<DatasetStatus, string> = {
  'Not Explored': '#5E5A55',
  'Exploring': '#A07850',
  'Ready for Training': '#C4A882',
  'Trained': '#F5F0E8',
}

interface Props {
  dataset: Dataset | null
  onClose: () => void
  onEdit: (d: Dataset) => void
  onDelete: (d: Dataset) => void
}

export default function DatasetDetail({ dataset, onClose, onEdit, onDelete }: Props) {
  const Icon = dataset ? TYPE_ICON[dataset.type] : Database
  const currentStep = dataset ? STATUS_STEPS.indexOf(dataset.status) : 0

  return (
    <AnimatePresence>
      {dataset && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
            }}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 41,
              width: '100%', maxWidth: 420,
              background: '#181818',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Panel header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              position: 'sticky', top: 0, background: '#181818', zIndex: 1,
            }}>
              <span style={{ fontSize: 11, color: '#5E5A55', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Dataset
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionBtn icon={Pencil} onClick={() => { onEdit(dataset); onClose() }} hoverColor="#F5F0E8" />
                <ActionBtn icon={Trash2} onClick={() => { onDelete(dataset); onClose() }} hoverColor="#c0504a" />
                <ActionBtn icon={X} onClick={onClose} hoverColor="#F5F0E8" />
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '28px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Title + type */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(196,168,130,0.08)', border: '1px solid rgba(196,168,130,0.15)',
                    color: '#C4A882', fontSize: 11, letterSpacing: '0.02em',
                    padding: '3px 9px', borderRadius: 5,
                  }}>
                    <Icon size={10} /> {dataset.type}
                  </span>
                </div>
                <h2 style={{
                  margin: '0 0 10px', fontSize: 22, fontWeight: 500,
                  color: '#F5F0E8', letterSpacing: '-0.02em', lineHeight: 1.2,
                }}>
                  {dataset.name}
                </h2>
                {dataset.description ? (
                  <p style={{ margin: 0, fontSize: 13, color: '#787068', lineHeight: 1.7 }}>
                    {dataset.description}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: '#3A3835', fontStyle: 'italic' }}>
                    No description added.
                  </p>
                )}
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 1, borderRadius: 10, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                {[
                  { label: 'Rows', value: dataset.rows },
                  { label: 'Features', value: dataset.features },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '16px 18px', background: '#0C0C0C' }}>
                    <div style={{ fontSize: 10, color: '#5E5A55', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 500, color: value !== null ? '#F5F0E8' : '#2A2826', letterSpacing: '-0.02em' }}>
                      {value !== null ? value.toLocaleString() : '—'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Status progression */}
              <div>
                <div style={{ fontSize: 10, color: '#5E5A55', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                  Lifecycle
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {STATUS_STEPS.map((step, i) => {
                    const isActive = i === currentStep
                    const isDone = i < currentStep
                    const color = isDone || isActive ? STATUS_COLORS[step] : '#2A2826'
                    return (
                      <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        {/* Line + dot */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                            background: isActive ? color : 'transparent',
                            border: `1.5px solid ${color}`,
                            boxShadow: isActive ? `0 0 8px ${color}55` : 'none',
                            transition: 'all 0.3s',
                          }} />
                          {i < STATUS_STEPS.length - 1 && (
                            <div style={{
                              width: 1, flex: 1, minHeight: 20,
                              background: i < currentStep ? STATUS_COLORS[STATUS_STEPS[i + 1]] : 'rgba(255,255,255,0.06)',
                              margin: '3px 0',
                              transition: 'background 0.3s',
                            }} />
                          )}
                        </div>
                        {/* Label */}
                        <div style={{ paddingBottom: i < STATUS_STEPS.length - 1 ? 16 : 0 }}>
                          <span style={{
                            fontSize: 13,
                            color: isActive ? '#F5F0E8' : isDone ? '#787068' : '#3A3835',
                            fontWeight: isActive ? 500 : 400,
                            transition: 'color 0.3s',
                          }}>
                            {step}
                          </span>
                          {isActive && (
                            <div style={{ marginTop: 3 }}>
                              <StatusBadge status={step} />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Meta */}
              <div style={{
                padding: '14px 16px',
                background: '#0C0C0C',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <Row label="Created" value={new Date(dataset.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <Row label="ID" value={`#${dataset.id}`} last />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function ActionBtn({ icon: Icon, onClick, hoverColor }: { icon: any; onClick: () => void; hoverColor: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 7, padding: '5px 7px', color: '#5E5A55',
        cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={e => (e.currentTarget.style.color = '#5E5A55')}
    >
      <Icon size={13} />
    </button>
  )
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: last ? 0 : 10, marginBottom: last ? 0 : 10,
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: 12, color: '#5E5A55' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#787068' }}>{value}</span>
    </div>
  )
}
