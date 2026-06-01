import { memo } from 'react'
import type { ComponentType } from 'react'
import { cn } from '../lib/cn'

interface BadgeProps {
  icon?: ComponentType<{ size?: number }>
  text?: string
  color?: 'slate' | 'emerald' | 'orange' | 'blue' | 'purple'
}

const colors: Record<string, string> = {
  slate: "bg-slate-100/80 text-slate-600 border-slate-200",
  emerald: "bg-emerald-100/80 text-emerald-700 border-emerald-200",
  orange: "bg-orange-100/80 text-orange-700 border-orange-200",
  blue: "bg-blue-100/80 text-blue-700 border-blue-200",
  purple: "bg-purple-100/80 text-purple-700 border-purple-200",
}

export const Badge = memo(function Badge({ icon: Icon, text, color = "slate" }: BadgeProps) {
  if (!text) return null

  return (
    <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg border backdrop-blur-sm flex items-center gap-1 whitespace-nowrap", colors[color])}>
      {Icon && <Icon size={10} />} {text}
    </span>
  )
})
