import type { ReactNode, ComponentType } from 'react'
import { motion } from 'motion/react'
import { cn } from '../lib/cn'

interface GlassButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'emerald'
  className?: string
  icon?: ComponentType<{ size?: number }>
  disabled?: boolean
}

const variants: Record<string, string> = {
  primary: "bg-slate-900 border border-slate-800 text-white shadow-xl shadow-slate-900/20",
  secondary: "bg-white/50 text-slate-700 border border-white/80 shadow-sm",
  emerald: "bg-emerald-500 border border-emerald-400 text-white shadow-xl shadow-emerald-500/20",
}

export function GlassButton({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false }: GlassButtonProps) {
  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.96 } : {}}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2",
        variants[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {Icon && <Icon size={20} />}
      {children}
    </motion.button>
  )
}
