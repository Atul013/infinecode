import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './index.css'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#181818',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#F5F0E8',
            fontFamily: '"Inter Variable", system-ui, sans-serif',
            fontSize: '13px',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
)
