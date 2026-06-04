import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import type { Dataset, DatasetCreate, DatasetUpdate, DatasetType, DatasetStatus } from '../types'
import NumberInput from './NumberInput'

const TYPES: DatasetType[] = ['Tabular', 'Image', 'Text', 'Audio']
const STATUSES: DatasetStatus[] = ['Not Explored', 'Exploring', 'Ready for Training', 'Trained']

type CreateMode = { mode: 'create' }
type EditMode   = { mode: 'edit'; dataset: Dataset }
type Props = (CreateMode | EditMode) & {
  isPending: boolean
  onSubmit: (data: DatasetCreate | DatasetUpdate) => void
  onClose: () => void
}

const empty = { name: '', description: '', type: 'Tabular' as DatasetType, rows: '', features: '', status: 'Not Explored' as DatasetStatus }

export default function DatasetForm(props: Props) {
  const { mode, isPending, onSubmit, onClose } = props
  const isEdit = mode === 'edit'
  const dataset = isEdit ? (props as EditMode).dataset : null

  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (dataset) {
      setForm({
        name: dataset.name,
        description: dataset.description ?? '',
        type: dataset.type,
        rows: dataset.rows?.toString() ?? '',
        features: dataset.features?.toString() ?? '',
        status: dataset.status,
      })
    } else {
      setForm(empty)
    }
    setErrors({})
  }, [dataset])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!isEdit && !form.name.trim()) errs.name = 'Required'
    if (form.rows && (isNaN(+form.rows) || +form.rows < 0)) errs.rows = 'Must be a positive number'
    if (form.features && (isNaN(+form.features) || +form.features < 0)) errs.features = 'Must be a positive number'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (isEdit) {
      const payload: DatasetUpdate = {
        description: form.description || undefined,
        type: form.type,
        rows: form.rows ? +form.rows : undefined,
        features: form.features ? +form.features : undefined,
        status: form.status,
      }
      onSubmit(payload)
    } else {
      const payload: DatasetCreate = {
        name: form.name.trim(),
        description: form.description || undefined,
        type: form.type,
        rows: form.rows ? +form.rows : undefined,
        features: form.features ? +form.features : undefined,
      }
      onSubmit(payload)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#181818', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 28, width: '100%', maxWidth: 480,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#F5F0E8', letterSpacing: '-0.01em' }}>
            {isEdit ? 'Edit dataset' : 'New dataset'}
          </h2>
          <button onClick={onClose} style={{ ...iconBtn, color: '#5E5A55' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5E5A55')}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Name — create only */}
          {!isEdit && (
            <Field label="Dataset name" error={errors.name} required>
              <input value={form.name} onChange={set('name')} placeholder="e.g. Iris Dataset"
                style={{ ...inputStyle, borderColor: errors.name ? 'rgba(192,80,74,0.5)' : 'rgba(255,255,255,0.08)' }}
              />
            </Field>
          )}

          {/* Description */}
          <Field label="Description">
            <textarea value={form.description} onChange={set('description')}
              placeholder="What is this dataset about?"
              rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
            />
          </Field>

          {/* Type */}
          <Field label="Dataset type">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TYPES.map(t => (
                <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                  style={{
                    ...pillBtn,
                    background: form.type === t ? 'rgba(196,168,130,0.12)' : 'rgba(255,255,255,0.03)',
                    border: form.type === t ? '1px solid rgba(196,168,130,0.30)' : '1px solid rgba(255,255,255,0.07)',
                    color: form.type === t ? '#C4A882' : '#787068',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          {/* Rows + Features */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Rows" error={errors.rows}>
              <NumberInput value={form.rows} onChange={v => setForm(f => ({ ...f, rows: v }))} placeholder="150" />
            </Field>
            <Field label="Features" error={errors.features}>
              <NumberInput value={form.features} onChange={v => setForm(f => ({ ...f, features: v }))} placeholder="4" />
            </Field>
          </div>

          {/* Status — edit only */}
          {isEdit && (
            <Field label="Status">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))}
                    style={{
                      ...pillBtn,
                      background: form.status === s ? 'rgba(196,168,130,0.10)' : 'rgba(255,255,255,0.03)',
                      border: form.status === s ? '1px solid rgba(196,168,130,0.25)' : '1px solid rgba(255,255,255,0.07)',
                      color: form.status === s ? '#C4A882' : '#787068',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={ghostBtn}>Cancel</button>
            <button type="submit" disabled={isPending} style={primaryBtn}>
              {isPending ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create dataset')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 11, color: '#787068', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: '#C4A882', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#e07070' }}>{error}</span>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0C0C0C', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 7, padding: '9px 12px', fontSize: 13, color: '#F5F0E8',
  fontFamily: 'inherit', transition: 'border-color 0.15s',
}

const pillBtn: React.CSSProperties = {
  borderRadius: 5, padding: '5px 12px', fontSize: 12,
  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
}

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', padding: 4, borderRadius: 5,
  transition: 'color 0.15s',
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 7, padding: '8px 18px', fontSize: 13, color: '#787068',
  cursor: 'pointer', fontFamily: 'inherit',
}

const primaryBtn: React.CSSProperties = {
  background: '#F5F0E8', border: '1px solid #F5F0E8',
  borderRadius: 7, padding: '8px 18px', fontSize: 13,
  fontWeight: 500, color: '#0C0C0C', cursor: 'pointer',
  fontFamily: 'inherit', letterSpacing: '0.01em',
}
