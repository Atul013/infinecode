import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { Plus, Search } from 'lucide-react'

import { api } from './lib/api'
import type { Dataset, DatasetCreate, DatasetUpdate } from './types'
import ParticleField from './components/ParticleField'
import DatasetCard from './components/DatasetCard'
import DatasetDetail from './components/DatasetDetail'
import DatasetForm from './components/DatasetForm'
import DeleteDialog from './components/DeleteDialog'
import StatsBar from './components/StatsBar'

type FormState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; dataset: Dataset }

export default function App() {
  const qc = useQueryClient()
  const [formState, setFormState] = useState<FormState>({ open: false })
  const [deleteTarget, setDeleteTarget] = useState<Dataset | null>(null)
  const [detailDataset, setDetailDataset] = useState<Dataset | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: datasets, isLoading } = useQuery({
    queryKey: ['datasets', debouncedSearch],
    queryFn: () => api.getAll(debouncedSearch || undefined),
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: api.stats,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['datasets'] })
    qc.invalidateQueries({ queryKey: ['stats'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: DatasetCreate) => api.create(payload),
    onSuccess: () => { invalidate(); setFormState({ open: false }); toast.success('Dataset created') },
    onError: () => toast.error('Failed to create dataset'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DatasetUpdate }) => api.update(id, payload),
    onSuccess: () => { invalidate(); setFormState({ open: false }); toast.success('Dataset updated') },
    onError: () => toast.error('Failed to update dataset'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); toast.success('Dataset deleted') },
    onError: () => toast.error('Failed to delete dataset'),
  })

  const handleSubmit = (data: DatasetCreate | DatasetUpdate) => {
    if (formState.open && formState.mode === 'edit') {
      updateMutation.mutate({ id: formState.dataset.id, payload: data as DatasetUpdate })
    } else {
      createMutation.mutate(data as DatasetCreate)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <ParticleField />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '28px 0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          marginBottom: 24,
        }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 11, color: '#5E5A55', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              ML Explorer
            </p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: '#F5F0E8', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Dataset Library
            </h1>
          </div>
          <button
            onClick={() => setFormState({ open: true, mode: 'create' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#F5F0E8', border: 'none', borderRadius: 7,
              padding: '9px 16px', fontSize: 13, fontWeight: 500,
              color: '#0C0C0C', cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '0.01em', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add dataset
          </button>
        </header>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
          <StatsBar stats={stats} />
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#5E5A55', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search datasets…"
              style={{
                background: '#181818', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 7, padding: '8px 12px 8px 32px',
                fontSize: 13, color: '#F5F0E8', fontFamily: 'inherit',
                width: 220, transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(196,168,130,0.30)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{ fontSize: 13, color: '#5E5A55' }}
            >
              Loading…
            </motion.div>
          </div>
        ) : datasets && datasets.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}>
            {datasets.map((d, i) => (
              <DatasetCard
                key={d.id}
                dataset={d}
                index={i}
                onView={ds => setDetailDataset(ds)}
                onEdit={ds => setFormState({ open: true, mode: 'edit', dataset: ds })}
                onDelete={ds => setDeleteTarget(ds)}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', paddingTop: 100 }}
          >
            <p style={{ fontSize: 13, color: '#5E5A55', marginBottom: 16 }}>
              {debouncedSearch ? `No datasets matching "${debouncedSearch}"` : 'No datasets yet.'}
            </p>
            {!debouncedSearch && (
              <button
                onClick={() => setFormState({ open: true, mode: 'create' })}
                style={{
                  background: 'rgba(196,168,130,0.08)', border: '1px solid rgba(196,168,130,0.20)',
                  borderRadius: 7, padding: '8px 18px', fontSize: 13,
                  color: '#C4A882', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Add your first dataset
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {formState.open && (
          <DatasetForm
            key="form"
            {...(formState.mode === 'edit' ? { mode: 'edit', dataset: formState.dataset } : { mode: 'create' })}
            isPending={isPending}
            onSubmit={handleSubmit}
            onClose={() => setFormState({ open: false })}
          />
        )}
      </AnimatePresence>

      <DatasetDetail
        dataset={detailDataset}
        onClose={() => setDetailDataset(null)}
        onEdit={ds => { setDetailDataset(null); setFormState({ open: true, mode: 'edit', dataset: ds }) }}
        onDelete={ds => { setDetailDataset(null); setDeleteTarget(ds) }}
      />

      <DeleteDialog
        dataset={deleteTarget}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
