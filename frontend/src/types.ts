export type DatasetType = 'Tabular' | 'Image' | 'Text' | 'Audio'
export type DatasetStatus = 'Not Explored' | 'Exploring' | 'Ready for Training' | 'Trained'

export interface Dataset {
  id: number
  name: string
  description: string | null
  type: DatasetType
  rows: number | null
  features: number | null
  status: DatasetStatus
  created_at: string
}

export interface DatasetCreate {
  name: string
  description?: string
  type: DatasetType
  rows?: number
  features?: number
}

export interface DatasetUpdate {
  description?: string
  type?: DatasetType
  rows?: number
  features?: number
  status?: DatasetStatus
}

export interface Stats {
  total: number
  tabular: number
  image: number
  text: number
  audio: number
  by_status: Record<string, number>
}
