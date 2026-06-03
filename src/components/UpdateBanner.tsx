import { useRegisterSW } from 'virtual:pwa-register/react'
import { motion, AnimatePresence } from 'motion/react'
import { RefreshCw } from 'lucide-react'

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 border border-white/10">
            <div className="flex items-center gap-3">
              <RefreshCw size={20} className="text-emerald-400 shrink-0" />
              <p className="text-sm font-medium">Nova versão disponível</p>
            </div>
            <button
              onClick={() => updateServiceWorker()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shrink-0"
            >
              Atualizar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
