export interface Nutrition {
  p100: Record<string, string>
  portion: Record<string, string>
  vd: Record<string, string>
}

export interface Item {
  id: number
  name: string
  brand: string
  type: string
  size: string
  category: string
  emoji: string
  store: string
  quantity: number
  price: number
  checked: boolean
  nutrition: Nutrition
}

export interface CatalogItem {
  id: number
  name: string
  brand: string
  type: string
  size: string
  category: string
  emoji: string
  store: string
  lastPrice: number
  nutrition: Nutrition
}

export interface HistoryEntry {
  id: number
  date: string
  items: Item[]
  total: number
}

export interface SavedList {
  id: number
  name: string
  items: Item[]
}

export type View = 'home' | 'shopping' | 'catalog' | 'finish-save' | 'success' | 'saved-lists' | 'analytics' | 'history'
export type SortBy = 'alpha' | 'brand' | 'category' | 'price' | 'store'
export type AnalyticsType = 'geral' | 'categoria' | 'produto' | 'marca' | 'mercado'
