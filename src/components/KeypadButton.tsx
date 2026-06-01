import { memo } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '../lib/cn'

interface KeypadButtonProps {
  key?: string | number
  value: string | number
  onClick: (value: string | number) => void
  icon?: ReactNode
  className?: string
}

export const KeypadButton = memo(function KeypadButton({ value, onClick, icon, className = "" }: KeypadButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={(e) => { e.stopPropagation(); onClick(value) }}
      className={cn(
        "h-16 rounded-2xl font-medium text-2xl flex items-center justify-center",
        "bg-white/80 backdrop-blur-sm border border-white/80 text-slate-700 shadow-sm",
        className
      )}
    >
      {icon || value}
    </motion.button>
  );
})
