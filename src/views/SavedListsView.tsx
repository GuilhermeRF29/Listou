import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, ShoppingBag, Check, ChevronDown, List } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { cn } from '../lib/cn'
import type { SavedList, Item, View } from '../types'

interface SavedListsViewProps {
  savedLists: SavedList[]
  onLoadList: (items: Item[]) => void
  onNavigate: (v: View) => void
}

export function SavedListsView({ savedLists, onLoadList, onNavigate }: SavedListsViewProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const toggleExpand = useCallback((id: number) => {
    setExpandedId(prev => prev === id ? null : id)
  }, [])

  const loadList = useCallback((list: SavedList) => {
    onLoadList(list.items.map((i: Item) => ({ ...i, id: Date.now() + Math.random(), checked: false })))
    onNavigate('shopping')
  }, [onLoadList, onNavigate])

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-900 overflow-hidden">
      <div className="flex-shrink-0 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md pt-12 px-6 pb-6 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700"><ArrowLeft size={20} /></button>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Listas de Compra</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-10 px-6 pt-6 space-y-4">
        {savedLists.length === 0 ? (
          <div className="text-center py-20"><List size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" /><p className="text-slate-400 dark:text-slate-500">Nenhuma lista salva.</p></div>
        ) : (
          savedLists.map(list => {
            const isOpen = expandedId === list.id
            return (
              <GlassCard key={list.id} className="p-5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between" onClick={() => toggleExpand(list.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0"><ShoppingBag size={22} /></div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate">{list.name}</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{list.items.length} {list.items.length === 1 ? 'item' : 'itens'}</p>
                    </div>
                  </div>
                  <ChevronDown size={20} className={cn("text-slate-400 shrink-0 transition-transform duration-300", isOpen && "rotate-180")} />
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="h-px bg-slate-100 dark:bg-slate-700 my-4" />
                      <div className="space-y-2 mb-4">
                        {list.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1.5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0"><Check size={10} className="text-transparent" /></span>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-slate-400 dark:text-slate-500">{item.quantity}x</span>
                              {item.price > 0 && <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => loadList(list)} className="w-full py-3 bg-purple-500 text-white font-bold rounded-2xl hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 text-sm"><ShoppingBag size={16} /> Carregar no Carrinho</button>
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
