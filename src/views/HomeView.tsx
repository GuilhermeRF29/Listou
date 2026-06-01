import { motion } from 'motion/react'
import { LogIn, LogOut, Plus, Package, List, BarChart3, Moon, Sun, Download, FileSpreadsheet } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { cn } from '../lib/cn'
import type { View, Item, CatalogItem, SavedList, HistoryEntry } from '../types'

interface HomeViewProps {
  user: any
  activeCount: number
  catalogCount: number
  savedListsCount: number
  totalSpent: number
  formatCurrency: (v: number) => string
  onSignIn: () => void
  onSignOut: () => void
  onNavigate: (v: View) => void
  dark?: boolean
  onToggleDark?: () => void
  exportData?: { activeItems: Item[]; catalog: CatalogItem[]; savedLists: SavedList[]; history: HistoryEntry[]; budget: number }
}

export function HomeView({ user, activeCount, catalogCount, savedListsCount, totalSpent, formatCurrency, onSignIn, onSignOut, onNavigate, dark, onToggleDark, exportData }: HomeViewProps) {
  const handleExport = () => {
    if (!exportData) return
    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `listou_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportExcel = async () => {
    if (!exportData) return
    const { exportExcel } = await import('../lib/exportExcel')
    exportExcel({ activeItems: exportData.activeItems, catalog: exportData.catalog, history: exportData.history })
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col pt-12 px-6 pb-24 overflow-y-auto space-y-6 dark:[--bg-page:#0f172a]">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0 transform -rotate-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M4 6h16M4 12h16M4 18h7" />
              <path d="M14 15l3 3 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tighter flex items-center gap-1">
              Listou<span className="text-emerald-500">.</span>
            </h1>
            <p className="text-slate-400 font-medium ml-1">Organize, economize, repita.</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {onToggleDark && (
            <button onClick={onToggleDark} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              {dark ? <Sun size={12} /> : <Moon size={12} />} {dark ? 'Claro' : 'Escuro'}
            </button>
          )}
          {user ? (
            <button onClick={onSignOut} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              <LogOut size={12} /> Sair
            </button>
          ) : (
            <button onClick={onSignIn} className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-emerald-200 transition-colors">
              <LogIn size={12} /> Entrar (Sincronizar)
            </button>
          )}
        </div>
      </div>

      <GlassCard onClick={() => onNavigate('shopping')} className="p-8 min-h-[220px] flex flex-col justify-between group border-white/50 dark:border-slate-700/50 bg-gradient-to-br from-white/80 to-emerald-50/20 dark:from-slate-800/80 dark:to-emerald-900/20">
        <div className="absolute right-[-40px] top-[-40px] w-64 h-64 bg-emerald-300/20 rounded-full blur-[80px] group-hover:bg-emerald-300/30 transition-all duration-700"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm w-fit p-4 rounded-2xl shadow-sm text-emerald-600 group-hover:scale-110 transition-transform duration-300">
            <Plus size={32} strokeWidth={3} />
          </div>
          <div className="bg-emerald-100/50 dark:bg-emerald-900/50 px-3 py-1 rounded-full text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/50 dark:border-emerald-700/50">Modo Rápido</div>
        </div>
        <div className="relative z-10">
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">Nova Compra</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed w-full pr-4">{activeCount > 0 ? 'Continuar lista em andamento.' : 'Crie uma lista inteligente do zero e controle seus gastos.'}</p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard onClick={() => onNavigate('catalog')} className="p-6 flex flex-col justify-between h-44 hover:bg-orange-50/30 dark:hover:bg-orange-900/20 transition-colors">
          <div className="bg-orange-100/80 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 w-fit p-3 rounded-2xl mb-4"><Package size={24} /></div>
          <div><span className="block text-4xl font-bold text-slate-800 dark:text-slate-100 mb-1 tracking-tighter">{catalogCount}</span><span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Meus Produtos</span></div>
        </GlassCard>
        <GlassCard onClick={() => onNavigate('saved-lists')} className="p-6 flex flex-col justify-between h-44 hover:bg-purple-50/30 dark:hover:bg-purple-900/20 transition-colors">
          <div className="bg-purple-100/80 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 w-fit p-3 rounded-2xl mb-4"><List size={24} /></div>
          <div><span className="block text-4xl font-bold text-slate-800 dark:text-slate-100 mb-1 tracking-tighter">{savedListsCount}</span><span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Modelos Prontos</span></div>
        </GlassCard>
        <GlassCard onClick={() => onNavigate('analytics')} className="p-6 flex flex-col justify-between h-44 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors col-span-2">
          <div className="flex justify-between items-start"><div className="bg-blue-100/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 w-fit p-3 rounded-2xl"><BarChart3 size={24} /></div><div className="bg-blue-50 dark:bg-blue-900/50 px-3 py-1 rounded-lg text-blue-600 dark:text-blue-300 text-xs font-bold flex items-center gap-1"><BarChart3 size={12} /> Análise</div></div>
          <div><span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Total Acumulado</span><span className="block text-3xl font-black text-slate-800 dark:text-slate-100 leading-tight tracking-tight">{formatCurrency(totalSpent)}</span></div>
        </GlassCard>
        {exportData && (
          <>
            <button onClick={handleExport} className="col-span-1 flex items-center justify-center gap-2 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <Download size={16} /> JSON
            </button>
            <button onClick={handleExportExcel} className="col-span-1 flex items-center justify-center gap-2 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 cursor-pointer">
              <FileSpreadsheet size={16} /> Excel
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}
