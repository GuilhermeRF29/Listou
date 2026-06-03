import { useState, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Home, Plus, Wallet, Trash2, ShoppingBag, ArrowRight, Check, ChevronDown, SortAsc, Tag, List, TrendingDown, Filter, X, Store } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { GlassButton } from '../components/GlassButton'
import { SwipeableItem } from '../components/SwipeableItem'
import { Badge } from '../components/Badge'
import { cn } from '../lib/cn'
import type { Item, SortBy } from '../types'

interface ShoppingViewProps {
  activeItems: Item[]
  budget: number
  catalog: any[]
  sortBy: SortBy
  checkedTotal: number
  total: number
  formatCurrency: (v: number) => string
  getLastPrice: (name: string) => number | undefined
  uniqueStores: string[]
  onNavigate: (v: string) => void
  onUpdateItems: (fn: any) => void
  onSetBudget: (v: number) => void
  onSetSortBy: (v: SortBy) => void
  onOpenEdit: (item: any) => void
  onViewDetails: (item: any) => void
  onFinishShopping: () => void
  onOpenInputModal: () => void
}

export const ShoppingView = memo(function ShoppingView({
  activeItems, budget, catalog, sortBy, checkedTotal, total, formatCurrency, getLastPrice, uniqueStores,
  onNavigate, onUpdateItems, onSetBudget, onSetSortBy,
  onOpenEdit, onViewDetails, onFinishShopping, onOpenInputModal,
}: ShoppingViewProps) {
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [storeFilter, setStoreFilter] = useState('')

  const progress = useMemo(() => budget > 0 ? Math.min((checkedTotal / budget) * 100, 100) : 0, [budget, checkedTotal])
  const isOverBudget = budget > 0 && checkedTotal > budget

  const filteredItems = useMemo(
    () => storeFilter ? activeItems.filter(i => i.store === storeFilter) : activeItems,
    [activeItems, storeFilter]
  )

  const sortedItems = useMemo(() => {
    let sorted = [...filteredItems]
    if (sortBy === 'alpha') sorted.sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'brand') sorted.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''))
    if (sortBy === 'category') sorted.sort((a, b) => (a.category || 'Geral').localeCompare(b.category || 'Geral'))
    if (sortBy === 'price') sorted.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
    if (sortBy === 'store') sorted.sort((a, b) => (a.store || '').localeCompare(b.store || ''))
    return sorted
  }, [filteredItems, sortBy])

  const cartItems = useMemo(() => sortedItems.filter(i => i.checked), [sortedItems])
  const pendingItems = useMemo(() => sortedItems.filter(i => !i.checked), [sortedItems])

  const handleToggle = useCallback((id: number) => {
    onUpdateItems((items: Item[]) => items.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }, [onUpdateItems])

  const handleEdit = useCallback((item: Item) => {
    onOpenEdit(item)
  }, [onOpenEdit])

  const handleDelete = useCallback((id: number) => {
    onUpdateItems((items: Item[]) => items.filter(i => i.id !== id))
  }, [onUpdateItems])

  const handleViewDetails = useCallback((item: Item) => {
    onViewDetails(item)
  }, [onViewDetails])

  const renderItem = useCallback((item: Item) => (
    <SwipeableItem key={item.id} item={item} lastPrice={getLastPrice(item.name)} onToggle={handleToggle} onPriceClick={handleEdit} onEdit={handleEdit} onDelete={handleDelete} onViewDetails={handleViewDetails} />
  ), [getLastPrice, handleToggle, handleEdit, handleDelete, handleViewDetails])

  const groupedByCategory = useMemo(() => {
    if (sortBy !== 'category') return null
    return Object.entries(pendingItems.reduce((acc: any, item: any) => {
      const cat = item.category || 'Geral'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {})).sort()
  }, [pendingItems, sortBy])

  const groupedByStore = useMemo(() => {
    if (sortBy !== 'store') return null
    return Object.entries(pendingItems.reduce((acc: any, item: any) => {
      const s = item.store || 'Sem mercado'
      if (!acc[s]) acc[s] = []
      acc[s].push(item)
      return acc
    }, {})).sort()
  }, [pendingItems, sortBy])

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-900 overflow-hidden">
      <div className="flex-shrink-0 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-white/50 dark:border-slate-700/50 shadow-sm relative pt-12 pb-2 px-6">
        <div className="flex items-start justify-between mb-4">
          <button onClick={() => onNavigate('home')} className="p-3 -ml-3 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-full text-slate-600 dark:text-slate-300 transition-colors"><Home size={26} /></button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1">Total Carrinho</span>
            <div className="flex items-baseline gap-2"><span className={cn("text-4xl font-black tracking-tighter", isOverBudget ? "text-red-500" : "text-emerald-600")}>{formatCurrency(checkedTotal)}</span></div>
            {budget > 0 && <div className="flex items-center gap-1 mt-1 text-xs font-medium text-slate-400 dark:text-slate-500"><Wallet size={10} /> Meta: {formatCurrency(budget)}</div>}
          </div>
        </div>
        {budget > 0 && <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mb-4 overflow-hidden"><div className={cn("h-full transition-all duration-500", isOverBudget ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${progress}%` }} /></div>}
        <div className="flex justify-between items-center relative">
          <div className="flex gap-2 relative">
            <button onClick={() => setShowFilterMenu(!showFilterMenu)} className={cn("text-xs font-bold px-4 py-2 rounded-xl border flex items-center gap-2 transition-all", showFilterMenu ? "bg-slate-800 text-white" : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700")}>
              <Filter size={14} /> {sortBy === 'alpha' ? 'A-Z' : sortBy === 'brand' ? 'Marca' : sortBy === 'category' ? 'Categ' : sortBy === 'store' ? 'Mercado' : 'Preço'} <ChevronDown size={12} />
            </button>
            <button onClick={() => setShowBudgetModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-600/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 text-xs font-bold"><Wallet size={18} />{budget > 0 ? `Meta: ${formatCurrency(budget)}` : 'Meta'}</button>
              {showFilterMenu && (
                <div className="absolute top-12 left-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 dark:border-slate-700/50 p-2 w-56 z-50">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2 py-1">Ordenar por</p>
                  {(['alpha', 'brand', 'category', 'store', 'price'] as SortBy[]).map(key => (
                    <button key={key} onClick={() => { onSetSortBy(key); setShowFilterMenu(false) }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 rounded-xl flex gap-2">
                      {key === 'alpha' && <SortAsc size={14} />}{key === 'brand' && <Tag size={14} />}{key === 'category' && <List size={14} />}{key === 'store' && <Store size={14} />}{key === 'price' && <TrendingDown size={14} />}
                      {key === 'alpha' ? 'A-Z' : key === 'brand' ? 'Marca' : key === 'category' ? 'Categoria' : key === 'store' ? 'Mercado' : 'Preço'}
                    </button>
                  ))}
                  {uniqueStores.length > 0 && (
                    <>
                      <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2 py-1">Filtrar por mercado</p>
                      <button onClick={() => { setStoreFilter(''); setShowFilterMenu(false) }}
                        className={cn("w-full text-left px-3 py-2 text-sm font-medium rounded-xl flex gap-2", !storeFilter ? "bg-emerald-50 text-emerald-700" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-700/50")}>
                        <Store size={14} /> Todos
                      </button>
                      {uniqueStores.map(s => (
                        <button key={s} onClick={() => { setStoreFilter(s); setShowFilterMenu(false) }}
                          className={cn("w-full text-left px-3 py-2 text-sm font-medium rounded-xl flex gap-2", storeFilter === s ? "bg-emerald-50 text-emerald-700" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-700/50")}>
                          <Store size={14} /> {s}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            {showFilterMenu && <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 min-w-max mr-1">Prev: {formatCurrency(total)}</span>
            <button onClick={() => { if (window.confirm('Esvaziar carrinho inteiro?')) onUpdateItems([]); }}
              className="p-2 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-red-100 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30" title="Apagar tudo">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 pb-40 space-y-6 relative">
        <AnimatePresence>
          {activeItems.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center pt-20 text-slate-400 dark:text-slate-500 opacity-60">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-full mb-4 shadow-sm"><ShoppingBag size={48} className="text-slate-300 dark:text-slate-600" /></div>
              <p className="font-bold text-lg">Carrinho vazio</p><p className="text-sm">Comece a adicionar itens</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pendingItems.length > 0 && (
            <motion.div className="space-y-6">
              {groupedByCategory ? (
                groupedByCategory.map(([cat, items]: any) => (
                  <div key={cat} className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2">{cat} ({items.length})</h3>
                    <AnimatePresence initial={false}>{items.map((item: any) => renderItem(item))}</AnimatePresence>
                  </div>
                ))
              ) : groupedByStore ? (
                groupedByStore.map(([storeName, items]: any) => (
                  <div key={storeName} className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2"><Store size={12} className="inline mr-1" />{storeName} ({items.length})</h3>
                    <AnimatePresence initial={false}>{items.map((item: any) => renderItem(item))}</AnimatePresence>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2">Pendente ({pendingItems.length})</h3>
                  <AnimatePresence initial={false}>{pendingItems.map(renderItem)}</AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {cartItems.length > 0 && (
            <motion.div className="space-y-2 pt-4">
              <div className="flex items-center gap-2 mb-3 ml-1 opacity-80"><div className="h-[1px] flex-1 bg-emerald-200/50"></div><span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1"><Check size={10} /> Concluídos ({cartItems.length})</span><div className="h-[1px] flex-1 bg-emerald-200/50"></div></div>
              <AnimatePresence initial={false}>{cartItems.map(renderItem)}</AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-white via-white/95 dark:from-slate-900 dark:via-slate-900/95 to-transparent z-30">
        <div className="flex items-end justify-between gap-4">
          <div className="pointer-events-auto flex-1">
            {activeItems.filter(i => i.checked).length > 0 && (<GlassButton onClick={onFinishShopping} className="w-full">Finalizar <ArrowRight size={18} /></GlassButton>)}
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenInputModal}
            className="pointer-events-auto h-16 w-16 bg-emerald-500 text-white rounded-2xl shadow-emerald-500/40 shadow-xl flex items-center justify-center hover:scale-105 transition-all shrink-0">
            <Plus size={32} strokeWidth={3} />
          </motion.button>
        </div>
      </div>

      {showBudgetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-xs shadow-2xl relative">
            <button onClick={() => setShowBudgetModal(false)} className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-700 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600"><X size={18} /></button>
            <h3 className="font-bold text-lg mb-4">Definir Orçamento</h3>
            <input type="number" placeholder="0.00" className="w-full text-4xl font-black text-center border-b-2 border-slate-100 dark:border-slate-600 pb-2 mb-6 outline-none focus:border-emerald-500 bg-transparent text-slate-800 dark:text-slate-100" value={budget || ''} onChange={e => onSetBudget(parseFloat(e.target.value) || 0)} />
            <GlassButton onClick={() => setShowBudgetModal(false)} className="w-full">Salvar Meta</GlassButton>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
})
