import { memo } from 'react'
import type { ComponentType } from 'react'
import { cn } from '../lib/cn'

interface BadgeProps {
  icon?: ComponentType<{ size?: number }>
  text?: string
  color?: 'slate' | 'emerald' | 'orange' | 'blue' | 'purple'
}

const colors: Record<string, string> = {
  slate: "bg-slate-100/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600",
  emerald: "bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  orange: "bg-orange-100/80 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  blue: "bg-blue-100/80 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  purple: "bg-purple-100/80 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
}

export const Badge = memo(function Badge({ icon: Icon, text, color = "slate" }: BadgeProps) {
  if (!text) return null

  return (
    <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg border backdrop-blur-sm flex items-center gap-1 whitespace-nowrap", colors[color])}>
      {Icon && <Icon size={10} />} {text}
    </span>
  )
})
