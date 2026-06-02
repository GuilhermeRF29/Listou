import { memo } from 'react'
import type { Nutrition } from '../types'

interface NutriInputProps {
  key?: string | number
  label: string
  field: string
  nutrition: Nutrition
  onChange: (nutrition: Nutrition) => void
}

export const NutriInput = memo(function NutriInput({ label, field, nutrition, onChange }: NutriInputProps) {
  return (
    <div className="flex flex-col gap-1 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
      <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wide">{label}</span>
      <div className="flex gap-2">
        <input type="text" placeholder="100g" className="w-full bg-white dark:bg-slate-800 p-1 rounded text-center text-xs border-none outline-none font-bold text-slate-800 dark:text-slate-100"
          value={nutrition.p100[field] || ''}
          onChange={e => onChange({ ...nutrition, p100: { ...nutrition.p100, [field]: e.target.value } })} />
        <input type="text" placeholder="Porção" className="w-full bg-white dark:bg-slate-800 p-1 rounded text-center text-xs border-none outline-none font-bold text-slate-800 dark:text-slate-100"
          value={nutrition.portion[field] || ''}
          onChange={e => onChange({ ...nutrition, portion: { ...nutrition.portion, [field]: e.target.value } })} />
      </div>
    </div>
  )
})
