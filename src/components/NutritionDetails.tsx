import { motion, AnimatePresence } from 'motion/react'
import { X, Leaf, Info, Tag, Scale } from 'lucide-react'
import { Badge } from './Badge'
import { cn } from '../lib/cn'
import { calcNutriScore, nutriScoreColors } from '../lib/nutriScore'
import type { Item } from '../types'

interface NutritionDetailsProps {
  item: Item | null
  onClose: () => void
}

const labels: Record<string, string> = {
  kcal: 'Energia', carb: 'Carboid.', prot: 'Proteína', fat: 'Gorduras',
  sat_fat: 'G. Sat.', fibers: 'Fibras', sodium: 'Sódio', sugars: 'Açúcares'
}
const fields = ['kcal', 'carb', 'prot', 'fat', 'sat_fat', 'fibers', 'sodium', 'sugars']

export function NutritionDetails({ item, onClose }: NutritionDetailsProps) {
  return (
    <AnimatePresence>
      {item && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 relative max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-6 right-6 bg-slate-100 dark:bg-slate-700 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"><X size={20} /></button>
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 leading-tight">{item.name}</h3>
            <div className="flex flex-wrap gap-2 mb-8">
              <Badge text={item.brand} color="blue" />
              <Badge text={item.size} icon={Scale} color="orange" />
              <Badge text={item.category} icon={Tag} color="purple" />
            </div>
            {item.nutrition && Object.keys(item.nutrition.p100 || {}).length > 0 ? (
              <div className="bg-white/50 dark:bg-slate-700/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-600">
                <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2 text-lg"><Leaf size={20} className="text-emerald-500" /> Nutrição{item.nutrition && (() => { const s = calcNutriScore(item.nutrition); return s ? <span className={cn("text-sm font-bold px-2 py-0.5 rounded-md ml-auto", nutriScoreColors[s.grade])}>{s.grade}</span> : null })()}</h4>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 border-b border-slate-200 dark:border-slate-600 pb-2 text-center">
                  <span className="text-left">Item</span><span>100g</span><span>Porção</span>
                </div>
                {fields.map(field => (
                  <div key={field} className="grid grid-cols-3 gap-2 text-sm mb-2 border-b border-slate-100 dark:border-slate-700 pb-2 last:border-0 items-center">
                    <span className="capitalize font-bold text-slate-600 dark:text-slate-300">{labels[field] || field}</span>
                    <span className="text-center font-medium text-slate-800 dark:text-slate-100">{item.nutrition.p100[field] || '-'}</span>
                    <span className="text-center font-medium text-slate-800 dark:text-slate-100">{item.nutrition.portion[field] || '-'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-700/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-600">
                <Info size={40} className="mx-auto mb-3 opacity-30" />
                <p>Sem dados nutricionais.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
