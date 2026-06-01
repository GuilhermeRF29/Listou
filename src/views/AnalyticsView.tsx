import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip as RechartsTooltip } from 'recharts'
import { cn } from '../lib/cn'
import type { HistoryEntry, AnalyticsType, View } from '../types'

interface AnalyticsViewProps {
  history: HistoryEntry[]
  analyticsType: AnalyticsType
  analyticsSelection: string
  formatCurrency: (v: number) => string
  uniqueStores: string[]
  onSetType: (v: AnalyticsType) => void
  onSetSelection: (v: string) => void
  onNavigate: (v: View) => void
}

export function AnalyticsView({ history, analyticsType, analyticsSelection, formatCurrency, uniqueStores, onSetType, onSetSelection, onNavigate }: AnalyticsViewProps) {
  const allItems = history.flatMap(h => h.items)
  const uniqueCategories = Array.from(new Set(allItems.map(i => i.category || 'Outros'))).sort()
  const uniqueProducts = Array.from(new Set(allItems.map(i => i.name))).sort()
  const uniqueBrands = Array.from(new Set(allItems.map(i => i.brand).filter(b => b))).sort()

  let filteredItems = allItems
  let title = "Gasto Histórico Total"
  let chartTitle = "Últimas Compras"

  if (analyticsType === 'categoria' && analyticsSelection) {
    filteredItems = allItems.filter(i => (i.category || 'Outros') === analyticsSelection)
    title = `Gasto: ${analyticsSelection}`
    chartTitle = `Variação Ref. Categoria`
  } else if (analyticsType === 'produto' && analyticsSelection) {
    filteredItems = allItems.filter(i => i.name === analyticsSelection)
    title = `Gasto: ${analyticsSelection}`
    chartTitle = `Variação do Preço Unitário`
  } else if (analyticsType === 'marca' && analyticsSelection) {
    filteredItems = allItems.filter(i => i.brand === analyticsSelection)
    title = `Gasto: ${analyticsSelection}`
    chartTitle = `Gastos com a Marca`
  } else if (analyticsType === 'mercado' && analyticsSelection) {
    filteredItems = allItems.filter(i => i.store === analyticsSelection)
    title = `Gasto: ${analyticsSelection}`
    chartTitle = `Gastos no Mercado`
  }

  const totalSpent = filteredItems.reduce((acc, i) => acc + (i.price * i.quantity), 0)

  let chartData: any[] = []
  if (analyticsType === 'geral') {
    chartData = history.slice(-7).map(h => {
      const dateObj = new Date(h.date)
      return { name: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`, valor: h.total }
    })
  } else if (analyticsType === 'produto' && analyticsSelection) {
    history.forEach(h => {
      const item = h.items.find(i => i.name === analyticsSelection)
      if (item) {
        const dateObj = new Date(h.date)
        chartData.push({ name: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`, valor: item.price })
      }
    })
  } else {
    history.forEach(h => {
      const sum = h.items.filter(i =>
        (analyticsType === 'categoria' ? (i.category || 'Outros') === analyticsSelection : false) ||
        (analyticsType === 'marca' ? i.brand === analyticsSelection : false) ||
        (analyticsType === 'mercado' ? i.store === analyticsSelection : false)
      ).reduce((acc, i) => acc + (i.price * i.quantity), 0)
      if (sum > 0) {
        const dateObj = new Date(h.date)
        chartData.push({ name: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`, valor: sum })
      }
    })
  }

  const categoryData = filteredItems.reduce((acc: any, item: any) => {
    const cat = item.category || 'Outros'
    acc[cat] = (acc[cat] || 0) + (item.price * item.quantity)
    return acc
  }, {})

  const pieData = Object.keys(categoryData).map(k => ({ name: k, value: categoryData[k] })).sort((a, b) => b.value - a.value)

  let selectorOptions: string[] = []
  if (analyticsType === 'categoria') selectorOptions = uniqueCategories
  if (analyticsType === 'produto') selectorOptions = uniqueProducts
  if (analyticsType === 'marca') selectorOptions = uniqueBrands
  if (analyticsType === 'mercado') selectorOptions = uniqueStores

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-900 overflow-hidden">
      <div className="flex-shrink-0 z-20 bg-white/90 backdrop-blur-md pt-12 px-6 pb-6 border-b border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} className="p-3 bg-white rounded-full shadow-sm text-slate-600 border border-slate-100 hover:bg-slate-50"><ArrowLeft size={20} /></button>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Análise</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {(['geral', 'categoria', 'produto', 'marca', 'mercado'] as AnalyticsType[]).map(type => (
            <button key={type} onClick={() => { onSetType(type); onSetSelection('') }}
              className={cn("px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors", analyticsType === type ? "bg-emerald-500 text-white" : "bg-white text-slate-500 border border-slate-200")}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        {analyticsType !== 'geral' && (
          <div className="bg-white p-2 rounded-2xl border border-slate-200 focus-within:ring-2 ring-emerald-500/20">
            <select className="w-full bg-transparent outline-none font-bold text-slate-700 p-2" value={analyticsSelection} onChange={e => onSetSelection(e.target.value)}>
              <option value="">Selecione um(a) {analyticsType}</option>
              {selectorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto pb-10 px-6 pt-6 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</span>
          <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(analyticsType === 'geral' ? history.reduce((acc, h) => acc + h.total, 0) : totalSpent)}</span>
        </div>
        {chartData.length > 0 && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative">
            <h3 className="font-bold text-lg text-slate-800 mb-6 px-1">{chartTitle}</h3>
            <div className="h-48 w-full -ml-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip formatter={(value: number) => [formatCurrency(value), analyticsType === 'produto' ? 'Preço' : 'Total']} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#cv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {pieData.length > 0 && analyticsType === 'geral' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-4">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Por Categoria</h3>
            <div className="space-y-4">
              {pieData.map((d, i) => {
                const total = pieData.reduce((acc, curr) => acc + curr.value, 0)
                const pct = Math.round((d.value / total) * 100)
                return (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-1 text-sm">
                      <span className="font-bold text-slate-700">{d.name}</span>
                      <span className="font-medium text-slate-500">{formatCurrency(d.value)} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
