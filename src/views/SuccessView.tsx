import { motion } from 'motion/react'
import { Check } from 'lucide-react'

export function SuccessView() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-8 shadow-2xl shadow-emerald-500/40"><Check size={64} strokeWidth={4} /></div>
      <h2 className="text-3xl font-black text-slate-800">Tudo Pronto!</h2>
    </motion.div>
  )
}
