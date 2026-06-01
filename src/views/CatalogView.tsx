import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Package, Search, Filter, Plus, Edit3, Trash2, Tag, Scale, Store } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { Badge } from '../components/Badge'
import { cn } from '../lib/cn'
import { formatUnitPrice } from '../lib/unitPrice'
import type { CatalogItem, SortBy } from '../types'

interface CatalogViewProps {
  catalog: CatalogItem[]
  sortBy: SortBy
  formatCurrency: (v: number) => string
  onSetSortBy: (v: SortBy) => void
  onNavigate: (v: string) => void
  onEdit: (item: any, isCatalog: boolean) => void
  onDelete: (id: number) => void
  onAddNew: () => void
}

export function CatalogView({ catalog, sortBy, formatCurrency, onSetSortBy, onNavigate, onEdit, onDelete, onAddNew }: CatalogViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  const sorted = [...catalog].sort((a, b) => {
    if (sortBy === 'alpha') return a.name.localeCompare(b.name)
    if (sortBy === 'brand') return (a.brand || '').localeCompare(b.brand || '')
    if (sortBy === 'category') return (a.category || 'Geral').localeCompare(b.category || 'Geral')
    return 0
  })
  const filtered = sorted.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-900 overflow-hidden">
      <div className="flex-shrink-0 z-20 bg-white/90 backdrop-blur-md pt-12 px-6 pb-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('home')} className="p-3 bg-white rounded-full shadow-sm text-slate-600 border border-slate-100"><ArrowLeft size={20} /></button>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Catálogo</h2>
          </div>
          <div className="relative">
            <button onClick={() => setShowFilter(!showFilter)} className={cn("p-2 rounded-xl border transition-all", showFilter ? "bg-slate-800 text-white" : "bg-white text-slate-500")}><Filter size={20} /></button>
            {showFilter && (<div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 w-40 z-30">
              {(['alpha', 'brand', 'category'] as SortBy[]).map(key => (
                <button key={key} onClick={() => { onSetSortBy(key); setShowFilter(false) }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl">
                  {key === 'alpha' ? 'A-Z' : key === 'brand' ? 'Marca' : 'Categoria'}
                </button>
              ))}
            </div>)}
            {showFilter && <div className="fixed inset-0 z-20" onClick={() => setShowFilter(false)} />}
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Buscar produto..." className="w-full bg-white border border-slate-200 pl-12 pr-4 py-4 rounded-2xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all focus:shadow-md" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-32 px-6 pt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 opacity-50"><Package size={48} className="mx-auto mb-4 text-slate-300" /><p className="text-slate-400">Nenhum produto encontrado.</p></div>
        ) : (
          filtered.map(item => (
            <GlassCard key={item.id} onLongPress={() => onEdit(item, true)} className="p-4 flex items-center justify-between group bg-white shadow-sm hover:shadow-md">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xl shrink-0">{item.name.charAt(0).toUpperCase()}</div>
                <div className="min-w-0"><p className="font-bold text-slate-800 truncate text-lg">{item.name}</p><div className="flex flex-wrap gap-1 mt-1"><Badge text={item.category} color="purple" icon={Tag} /><Badge text={item.brand} color="blue" /><Badge text={item.size} icon={Scale} color="orange" />{item.store && <Badge text={item.store} color="green" icon={Store} />}</div>{item.lastPrice > 0 && <span className="text-sm font-bold text-slate-500 mt-1 block">{formatCurrency(item.lastPrice)}{item.size && formatUnitPrice(item.lastPrice, item.size) && <span className="text-[10px] font-medium text-slate-400 ml-2">{formatUnitPrice(item.lastPrice, item.size)}</span>}</span>}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onEdit(item, true)} className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-colors"><Edit3 size={20} /></button>
                <button onClick={() => onDelete(item.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><Trash2 size={20} /></button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
      <div className="absolute bottom-8 right-6 z-30">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onAddNew} className="h-16 w-16 bg-orange-500 text-white rounded-2xl shadow-orange-500/40 shadow-xl flex items-center justify-center active:scale-90 hover:scale-105 transition-all"><Plus size={32} strokeWidth={3} /></motion.button>
      </div>
    </motion.div>
  )
}
