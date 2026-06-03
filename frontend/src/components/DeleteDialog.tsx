import { motion, AnimatePresence } from 'motion/react'
import type { Dataset } from '../types'

interface Props {
  dataset: Dataset | null
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteDialog({ dataset, isPending, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {dataset && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancel}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#181818', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: 28, width: '100%', maxWidth: 380,
            }}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 500, color: '#F5F0E8', letterSpacing: '-0.01em' }}>
              Delete dataset?
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#5E5A55', lineHeight: 1.6 }}>
              <span style={{ color: '#C4A882' }}>{dataset.name}</span> will be permanently removed. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onCancel} style={ghostBtn}>Cancel</button>
              <button onClick={onConfirm} disabled={isPending} style={dangerBtn}>
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 7, padding: '7px 16px',
  fontSize: 13, color: '#787068', cursor: 'pointer',
  fontFamily: 'inherit',
}

const dangerBtn: React.CSSProperties = {
  background: 'rgba(192,80,74,0.15)',
  border: '1px solid rgba(192,80,74,0.30)',
  borderRadius: 7, padding: '7px 16px',
  fontSize: 13, color: '#e07070', cursor: 'pointer',
  fontFamily: 'inherit',
}
