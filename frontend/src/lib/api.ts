import axios from 'axios'
import type { Dataset, DatasetCreate, DatasetUpdate, Stats } from '../types'

const http = axios.create({ baseURL: 'http://localhost:8000' })

export const api = {
  getAll: (search?: string) =>
    http.get<Dataset[]>('/datasets', { params: search ? { search } : {} }).then(r => r.data),

  create: (payload: DatasetCreate) =>
    http.post<Dataset>('/datasets', payload).then(r => r.data),

  update: (id: number, payload: DatasetUpdate) =>
    http.put<Dataset>(`/datasets/${id}`, payload).then(r => r.data),

  remove: (id: number) =>
    http.delete(`/datasets/${id}`),

  stats: () =>
    http.get<Stats>('/datasets/stats').then(r => r.data),
}
