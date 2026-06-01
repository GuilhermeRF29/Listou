import { memo, useRef } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '../lib/cn'

interface GlassCardProps {
  key?: string | number
  children: ReactNode
  className?: string
  onClick?: () => void
  onLongPress?: () => void
  activeScale?: boolean
}

export const GlassCard = memo(function GlassCard({ children, className = "", onClick, onLongPress, activeScale = true }: GlassCardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleStart = () => {
    if (onLongPress) {
      timerRef.current = setTimeout(() => onLongPress(), 500)
    }
  }

  const handleEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  return (
    <motion.div
      whileTap={activeScale && onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchMove={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      className={cn(
        "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/40 dark:border-slate-700/40",
        "shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl",
        "transition-[background-color,shadow] duration-200 ease-out relative overflow-hidden select-none",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-slate-700/20 to-transparent pointer-events-none opacity-50" />
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  )
})
