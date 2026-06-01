import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import type { SavedList, Item, View } from '../types'

interface SavedListsViewProps {
  savedLists: SavedList[]
  onLoadList: (items: Item[]) => void
  onNavigate: (v: View) => void
}

export function SavedListsView({ savedLists, onLoadList, onNavigate }: SavedListsViewProps) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-900 overflow-hidden">
      <div className="flex-shrink-0 z-20 bg-white/90 backdrop-blur-md pt-12 px-6 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} className="p-3 bg-white rounded-full shadow-sm text-slate-600 border border-slate-100"><ArrowLeft size={20} /></button>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Modelos</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-10 px-6 pt-6 space-y-4">
        {savedLists.length === 0 ? <p className="text-slate-400 text-center mt-10">Nenhum modelo salvo.</p> :
          savedLists.map(list => (
            <GlassCard key={list.id} onClick={() => { onLoadList(list.items.map((i: Item) => ({ ...i, id: Date.now() + Math.random(), checked: false }))); onNavigate('shopping') }} className="p-6 mb-4 flex justify-between items-center group bg-white shadow-sm">
              <div><h3 className="font-bold text-xl text-slate-800">{list.name}</h3><p className="text-slate-400 mt-1">{list.items.length} itens salvos</p></div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-2xl group-hover:bg-purple-100 transition-colors"><ArrowRight size={20} /></div>
            </GlassCard>
          ))}
      </div>
    </motion.div>
  )
}
