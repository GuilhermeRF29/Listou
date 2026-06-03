import { memo } from 'react'
import { motion } from 'motion/react'
import { Trash2, Check, Leaf, Tag, Scale, Percent } from 'lucide-react'
import { formatUnitPrice } from '../lib/unitPrice'
import { calcNutriScore, nutriScoreColors } from '../lib/nutriScore'
import { GlassCard } from './GlassCard'
import { Badge } from './Badge'
import { cn } from '../lib/cn'
import type { Item } from '../types'

interface SwipeableItemProps {
  key?: string | number
  item: Item
  lastPrice?: number
  onToggle: (id: number) => void
  onPriceClick: (item: Item) => void
  onDelete: (id: number) => void
  onViewDetails: (item: Item) => void
  onEdit: (item: Item) => void
}

export const SwipeableItem = memo(function SwipeableItem({ item, lastPrice, onToggle, onPriceClick, onDelete, onViewDetails, onEdit }: SwipeableItemProps) {
  const isOffer = lastPrice && lastPrice > item.price
  const discountPct = isOffer ? Math.round((1 - item.price / lastPrice!) * 100) : 0

  return (
    <motion.div
      layoutDependency={[item.checked, item.price]}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, x: -100 }}
      transition={{ duration: 0.2 }}
      className="relative mb-3 select-none touch-pan-y"
    >
      <div className="absolute inset-0 bg-red-500 rounded-3xl flex items-center justify-end pr-6 shadow-inner">
        <Trash2 className="text-white" size={24} />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0.1 }}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.x < -90 || velocity.x < -600) {
            onDelete(item.id)
          }
        }}
        whileDrag={{ scale: 0.98, cursor: 'grabbing', zIndex: 10 }}
        className="relative z-10 bg-[#F8FAFC] dark:bg-slate-900 rounded-3xl"
      >
        <GlassCard
          onClick={() => onToggle(item.id)}
          onLongPress={() => onEdit(item)}
          className={cn(
            "h-full flex flex-col justify-center p-4 border-l-[6px]",
            item.checked ? "border-l-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/30" : "border-l-transparent bg-white/70 dark:bg-slate-800/70"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 overflow-hidden pointer-events-none">
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 shadow-sm",
                item.checked ? "bg-emerald-500 border-emerald-500" : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              )}>
                {item.checked && <Check size={16} className="text-white" strokeWidth={3} />}
              </div>

              {item.emoji && (
                <div className={cn("w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-xl text-2xl flex-shrink-0 transition-opacity", item.checked && "opacity-50 grayscale")}>
                  {item.emoji}
                </div>
              )}

              <div className={cn("flex-1 min-w-0 transition-all duration-300", item.checked && "opacity-50 grayscale")}>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2 overflow-hidden">
                    <p className="font-bold text-lg truncate leading-tight text-slate-800 dark:text-slate-100">{item.name}</p>
                    {item.brand && <span className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate italic shrink-0">- {item.brand}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <Badge text={item.category} color="purple" icon={Tag} />
                    <Badge text={item.size} icon={Scale} color="orange" />
                    {item.nutrition && Object.keys(item.nutrition.p100 || {}).length > 0 && (
                      <>
                        <span onClick={(e) => { e.stopPropagation(); onViewDetails(item) }} className="pointer-events-auto cursor-pointer bg-green-100/80 dark:bg-green-900/50 text-green-700 dark:text-green-300 p-1 rounded-lg">
                          <Leaf size={10} />
                        </span>
                        {(() => { const s = calcNutriScore(item.nutrition); return s ? <span className={cn("pointer-events-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md cursor-default", nutriScoreColors[s.grade])}>{s.grade}</span> : null })()}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 pointer-events-auto shrink-0" onClick={(e) => e.stopPropagation()}>
              {isOffer && (
                <span className="text-[10px] font-bold text-red-500 line-through">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lastPrice! * item.quantity)}</span>
              )}
              <button onClick={() => onPriceClick(item)} className={cn("font-bold text-lg transition-all px-2 py-1 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-700/50", item.checked ? "text-emerald-600" : "text-slate-700 dark:text-slate-200")}>
                {item.price > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity) : <span className="text-slate-400 text-sm font-medium">R$ --</span>}
              </button>
              {isOffer && (
                <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full"><Percent size={10} /> -{discountPct}%</span>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 justify-end w-full">
                <span className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 px-2 py-0.5 rounded-md font-medium text-xs shadow-sm">{item.quantity}x</span>
              </div>
              {item.price > 0 && item.size && formatUnitPrice(item.price, item.size) && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{formatUnitPrice(item.price, item.size)}</span>}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
})
