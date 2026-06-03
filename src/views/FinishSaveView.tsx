import { useMemo, memo } from 'react'
import { motion } from 'motion/react'
import { Sparkles, TrendingDown, TrendingUp, Save } from 'lucide-react'
import { GlassButton } from '../components/GlassButton'
import { cn } from '../lib/cn'
import type { Item } from '../types'

interface FinishSaveViewProps {
  activeItems: Item[]
  getLastPrice: (name: string) => number | undefined
  checkedTotal: number
  formatCurrency: (v: number) => string
  listName: string
  onSetListName: (v: string) => void
  onSaveAndClose: (saveList: boolean) => void
}

export const FinishSaveView = memo(function FinishSaveView({ activeItems, getLastPrice, checkedTotal, formatCurrency, listName, onSetListName, onSaveAndClose }: FinishSaveViewProps) {
  const { boughtItems, savings, comparisonAvailable, expensive } = useMemo(() => {
    const items = activeItems.filter(i => i.checked)
    let totalSavings = 0
    let hasComparison = false
    items.forEach(item => {
      const prevPrice = getLastPrice(item.name)
      if (prevPrice && prevPrice > 0) { hasComparison = true; totalSavings += (prevPrice - item.price) * item.quantity }
    })
    return { boughtItems: items, savings: totalSavings, comparisonAvailable: hasComparison, expensive: totalSavings < 0 }
  }, [activeItems, getLastPrice])

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-900 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 pt-24 flex flex-col justify-start">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-6 bg-emerald-100 text-emerald-600 rounded-3xl mb-6 shadow-emerald-200 shadow-2xl"><Sparkles size={40} fill="currentColor" /></div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">Compra Finalizada!</h2>
          <div className="my-8 relative"><p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Total Pago</p><p className="text-7xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{formatCurrency(checkedTotal)}</p><p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-2 bg-slate-100 dark:bg-slate-700 w-fit mx-auto px-3 py-1 rounded-full">{boughtItems.length} itens no carrinho</p></div>
          {comparisonAvailable && (
            <div className={cn("p-4 rounded-3xl border flex items-center justify-center gap-4 mb-6", expensive ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-600")}>
              <div className={cn("p-2 rounded-full", expensive ? "bg-red-100" : "bg-emerald-100")}>{expensive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}</div>
              <div className="text-left"><p className="font-bold leading-none text-lg">{expensive ? 'Mais caro que o habitual' : 'Economia nesta compra!'}</p><p className="text-sm opacity-80 mt-1">Diferença de {formatCurrency(Math.abs(savings))}</p></div>
            </div>
          )}
        </div>
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white dark:border-slate-700 mb-24">
          <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3"><div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-xl text-purple-600 dark:text-purple-300"><Save size={20} /></div>Salvar Modelo?</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Gostaria de salvar os itens desta compra como um modelo para usar depois?</p>
          <input type="text" placeholder="Nome da Lista (ex: Feira Semanal)" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-5 rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg text-slate-800 dark:text-slate-100" value={listName} onChange={e => onSetListName(e.target.value)} />
          <GlassButton variant={listName.trim() ? "primary" : "secondary"} disabled={!listName.trim()} onClick={() => onSaveAndClose(true)} className="w-full mb-3 shadow-xl">Salvar Lista e Sair</GlassButton>
          <button onClick={() => onSaveAndClose(false)} className="w-full py-4 text-slate-400 dark:text-slate-500 font-bold hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Não salvar modelo, apenas sair</button>
        </div>
      </div>
    </motion.div>
  )
})
