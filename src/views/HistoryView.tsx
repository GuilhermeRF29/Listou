import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, ChevronDown, ShoppingBag, TrendingDown, TrendingUp, FileSpreadsheet, Calendar, Check } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { cn } from '../lib/cn'
import type { HistoryEntry, Item, View } from '../types'

interface HistoryViewProps {
  history: HistoryEntry[]
  formatCurrency: (v: number) => string
  onNavigate: (v: View) => void
}

export function HistoryView({ history, formatCurrency, onNavigate }: HistoryViewProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const handleExportExcel = async () => {
    const { exportExcel } = await import('../lib/exportExcel')
    exportExcel({ activeItems: [], catalog: [], history })
  }

  const toggleExpand = useCallback((id: number) => {
    setExpandedId(prev => prev === id ? null : id)
  }, [])

  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-900 overflow-hidden">
      <div className="flex-shrink-0 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md pt-12 px-6 pb-6 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('home')} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700"><ArrowLeft size={20} /></button>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Histórico</h2>
          </div>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-200 dark:border-emerald-800">
            <FileSpreadsheet size={18} /> Excel
          </button>
        </div>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 ml-1">{history.length} compra{history.length !== 1 ? 's' : ''} registrada{history.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 overflow-y-auto pb-10 px-6 pt-6 space-y-4">
        {sorted.length === 0 ? (
          <div className="text-center py-20"><ShoppingBag size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" /><p className="text-slate-400 dark:text-slate-500">Nenhuma compra registrada.</p></div>
        ) : (
          sorted.map(entry => {
            const isOpen = expandedId === entry.id
            const totalItems = entry.items.length
            const checkedItems = entry.items.filter(i => i.checked).length
            const dateLabel = new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

            return (
              <GlassCard key={entry.id} onClick={() => toggleExpand(entry.id)} className="p-5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Calendar size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{dateLabel}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><ShoppingBag size={12} /> {totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                        {checkedItems > 0 && <span className="flex items-center gap-1"><Check size={12} /> {checkedItems}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-black text-lg text-slate-800 dark:text-slate-100">{formatCurrency(entry.total)}</span>
                    <ChevronDown size={20} className={cn("text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
                  </div>
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="h-px bg-slate-100 dark:bg-slate-700 my-4" />
                      <div className="space-y-3">
                        {entry.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0", item.checked ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600")}>
                                {item.checked && <Check size={12} className="text-white" strokeWidth={3} />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate">{item.name}</p>
                                {item.brand && <p className="text-xs text-slate-400 dark:text-slate-500">{item.brand}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-slate-400 dark:text-slate-500">{item.quantity}x</span>
                              {item.price > 0 && <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{formatCurrency(item.price * item.quantity)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Total da compra</span>
                        <span className="font-black text-lg text-emerald-600">{formatCurrency(entry.total)}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            )
          })
        )}
      </div>
    </motion.div>
  )
}
