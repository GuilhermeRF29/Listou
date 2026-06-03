import { useRef, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, Camera, Edit3, Plus, Minus, Delete, Check, ChevronDown, Leaf, Loader2, AlertCircle, Mic, MicOff, ArrowDown } from 'lucide-react'
import { KeypadButton } from './KeypadButton'
import { NutriInput } from './NutriInput'
import { GlassButton } from './GlassButton'
import { useShoppingStore } from '../store/useShoppingStore'
import { cn } from '../lib/cn'

export function InputModal() {
  const show = useShoppingStore(s => s.showInputModal)
  const view = useShoppingStore(s => s.view)
  const isManualMode = useShoppingStore(s => s.isManualMode)
  const editingItemId = useShoppingStore(s => s.editingItemId)
  const inputName = useShoppingStore(s => s.inputName)
  const inputBrand = useShoppingStore(s => s.inputBrand)
  const inputType = useShoppingStore(s => s.inputType)
  const inputSize = useShoppingStore(s => s.inputSize)
  const inputPrice = useShoppingStore(s => s.inputPrice)
  const inputQty = useShoppingStore(s => s.inputQty)
  const inputEmoji = useShoppingStore(s => s.inputEmoji)
  const inputStore = useShoppingStore(s => s.inputStore)
  const nutrition = useShoppingStore(s => s.nutrition)
  const showNutrition = useShoppingStore(s => s.showNutrition)
  const showKeypad = useShoppingStore(s => s.showKeypad)
  const suggestions = useShoppingStore(s => s.suggestions)
  const analyzing = useShoppingStore(s => s.analyzing)
  const analyzeError = useShoppingStore(s => s.analyzeError)

  const setInputName = useShoppingStore(s => s.setInputName)
  const setInputBrand = useShoppingStore(s => s.setInputBrand)
  const setInputType = useShoppingStore(s => s.setInputType)
  const setInputSize = useShoppingStore(s => s.setInputSize)
  const setInputQty = useShoppingStore(s => s.setInputQty)
  const setInputPrice = useShoppingStore(s => s.setInputPrice)
  const setInputEmoji = useShoppingStore(s => s.setInputEmoji)
  const setInputStore = useShoppingStore(s => s.setInputStore)
  const setNutrition = useShoppingStore(s => s.setNutrition)
  const setShowNutrition = useShoppingStore(s => s.setShowNutrition)
  const setIsManualMode = useShoppingStore(s => s.setIsManualMode)
  const setShowKeypad = useShoppingStore(s => s.setShowKeypad)
  const onKeypadPress = useShoppingStore(s => s.handleKeypadPress)
  const onSelectSuggestion = useShoppingStore(s => s.selectSuggestion)
  const onPhotoUpload = useShoppingStore(s => s.onPhotoUpload)
  const onConfirm = useShoppingStore(s => s.confirmItem)
  const onClose = useShoppingStore(s => s.closeInputModal)
  const onScannerOpen = useShoppingStore(s => () => s.setShowScanner(true))
  const onToggleManual = useShoppingStore(s => () => s.setIsManualMode(!s.isManualMode))
  const onToggleNutrition = useShoppingStore(s => () => s.setShowNutrition(!s.showNutrition))
  const onToggleKeypad = useShoppingStore(s => () => s.setShowKeypad(!s.showKeypad))

  const nameInputRef = useRef<HTMLInputElement>(null)
  const [listening, setListening] = useState(false)

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.interimResults = false
    recognition.continuous = false
    setListening(true)
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setInputName(text.charAt(0).toUpperCase() + text.slice(1))
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
  }

  const catalog = useShoppingStore(s => s.catalog)
  const setSuggestions = useShoppingStore(s => s.setSuggestions)

  useEffect(() => {
    if (inputName.trim().length > 1 && !isManualMode) {
      const matched = catalog.filter(p => p.name.toLowerCase().includes(inputName.toLowerCase())).slice(0, 3)
      setSuggestions(matched)
    } else setSuggestions([])
  }, [inputName, catalog, isManualMode, setSuggestions])

  useEffect(() => {
    if (show) {
      setTimeout(() => nameInputRef.current?.focus(), 150)
    }
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30"
            onClick={onClose}
          />
          <motion.div
            initial={{ translateY: '100%' }}
            animate={{ translateY: 0 }}
            exit={{ translateY: '120%' }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-3xl rounded-t-[2.5rem] z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white dark:border-slate-700"
          >
            <div className="px-6 pt-6 pb-8 overflow-hidden relative max-h-[85vh] overflow-y-auto no-scrollbar">
              <motion.div
                className="w-full flex justify-center mb-6 pt-2 pb-6 -mt-2 -mb-6"
                drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.4}
                onDragEnd={(e, info) => { if (info.offset.y > 50) onClose() }}
                onClick={onClose}
              >
                <div className="w-16 h-1.5 bg-slate-300/50 dark:bg-slate-600/50 rounded-full cursor-pointer hover:bg-slate-400 dark:hover:bg-slate-500 pointer-events-none" />
              </motion.div>

              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-2xl tracking-tight">{editingItemId ? 'Editar Item' : 'Novo Item'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{isManualMode ? 'Preenchimento Manual' : 'Preenchimento Rápido'}</p>
                </div>
                <div className="flex gap-2">
                  <input type="file" accept="image/*" capture="environment" id="photo-upload" className="hidden" onChange={onPhotoUpload} />
                  <button onClick={() => document.getElementById('photo-upload')?.click()} disabled={analyzing} className={cn("p-3 rounded-2xl transition-all shadow-sm border", analyzing ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600" : "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/70")} title="Descrever por Foto (IA)">
                    {analyzing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  </button>
                  <button onClick={onScannerOpen} className="p-3 rounded-2xl transition-all shadow-sm bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <Camera size={20} />
                  </button>
                  <button onClick={onToggleManual} className={cn("p-3 rounded-2xl transition-all shadow-sm", isManualMode ? "bg-slate-800 text-white" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700")}>
                    <Edit3 size={20} />
                  </button>
                </div>
              </div>

              {analyzeError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-2xl text-sm font-medium text-red-700 dark:text-red-300 mb-4">
                  <AlertCircle size={16} className="shrink-0" />
                  {analyzeError}
                </div>
              )}

              <div className="space-y-6">
                {!editingItemId && (
                  <div className="relative z-50 group">
                    <input ref={nameInputRef} type="text" placeholder={isManualMode ? "Nome do Produto" : "Ex: Arroz Camil 5kg"}
                      className="w-full bg-white/80 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-600 focus:border-emerald-500 p-6 pr-14 rounded-3xl text-xl font-bold text-slate-800 dark:text-slate-100 outline-none transition-all shadow-sm focus:shadow-lg focus:bg-white dark:focus:bg-slate-800 placeholder:text-slate-300 dark:placeholder:text-slate-500"
                      value={inputName} onFocus={() => { if (showKeypad) onToggleKeypad() }} onChange={e => setInputName(e.target.value)} autoComplete="off" />
                    <button type="button" onClick={startVoice}
                      className={cn("absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all", listening ? "bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-500/40" : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300")}>
                      {listening ? <Mic size={18} /> : <MicOff size={18} />}
                    </button>
                    {suggestions.length > 0 && !editingItemId && !isManualMode && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                        <div className="p-3 bg-slate-50/80 dark:bg-slate-700/80 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider border-b border-slate-100 dark:border-slate-700">Sugestões</div>
                        {suggestions.map((sug, idx) => (
                          <div key={idx} onClick={() => onSelectSuggestion(sug)} className="p-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer flex justify-between items-center border-b border-slate-50 dark:border-slate-700 last:border-0 transition-colors">
                            <div className="flex items-center gap-3">
                              {sug.emoji && <span className="text-2xl">{sug.emoji}</span>}
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">{sug.name}</span>
                                {sug.brand && <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 w-fit px-2 py-0.5 rounded-md mt-1">{sug.brand}</span>}
                              </div>
                            </div>
                            {sug.lastPrice && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1.5 rounded-xl">R$ {sug.lastPrice}</span>}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {isManualMode && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/80 dark:bg-slate-800/80 p-4 rounded-3xl border border-slate-200 dark:border-slate-600 focus-within:ring-2 ring-emerald-500/20 transition-all col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Categoria</label>
                          <input type="text" placeholder="Ex: Bebidas, Laticínios" className="w-full bg-transparent outline-none font-bold text-slate-700 dark:text-slate-200 text-lg placeholder:font-normal" value={inputType} onChange={e => setInputType(e.target.value)} />
                        </div>
                        <div className="bg-white/80 dark:bg-slate-800/80 p-4 rounded-3xl border border-slate-200 dark:border-slate-600 focus-within:ring-2 ring-emerald-500/20 transition-all">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Marca</label>
                          <input type="text" placeholder="Ex: Nestle" className="w-full bg-transparent outline-none font-bold text-slate-700 dark:text-slate-200 text-lg placeholder:font-normal" value={inputBrand} onChange={e => setInputBrand(e.target.value)} />
                        </div>
                        <div className="bg-white/80 dark:bg-slate-800/80 p-4 rounded-3xl border border-slate-200 dark:border-slate-600 focus-within:ring-2 ring-emerald-500/20 transition-all">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Tamanho</label>
                          <input type="text" placeholder="Ex: 200g" className="w-full bg-transparent outline-none font-bold text-slate-700 dark:text-slate-200 text-lg placeholder:font-normal" value={inputSize} onChange={e => setInputSize(e.target.value)} />
                        </div>
                        <div className="bg-white/80 dark:bg-slate-800/80 p-4 rounded-3xl border border-slate-200 dark:border-slate-600 focus-within:ring-2 ring-emerald-500/20 transition-all">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Mercado</label>
                          <input type="text" placeholder="Ex: Assaí, Extra" className="w-full bg-transparent outline-none font-bold text-slate-700 dark:text-slate-200 text-lg placeholder:font-normal" value={inputStore} onChange={e => setInputStore(e.target.value)} />
                        </div>
                      </div>
                      <div className="pt-2">
                        <button onClick={onToggleNutrition} className="w-full flex items-center justify-between p-4 bg-emerald-50/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded-2xl font-bold text-sm hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-100 dark:border-emerald-800">
                          <span className="flex items-center gap-2"><Leaf size={18} className="text-emerald-500" /> Tabela Nutricional</span>
                          <ChevronDown size={18} className={cn("transition-transform duration-300", showNutrition ? "rotate-180" : "")} />
                        </button>
                        <AnimatePresence>
                          {showNutrition && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, height: 0 }} className="mt-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-3xl p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 overflow-hidden">
                              {[['Kcal', 'kcal'], ['Carb', 'carb'], ['Prot', 'prot'], ['Gord Totais', 'fat'], ['Gord Sat', 'sat_fat'], ['Fibras', 'fibers'], ['Sódio (mg)', 'sodium'], ['Açúcares', 'sugars']].map(([label, field]) => (
                                <NutriInput key={field} label={label} field={field} nutrition={nutrition} onChange={setNutrition} />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4 items-stretch">
                  {view !== 'catalog' && (
                    <div className="flex flex-col justify-center items-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-3xl px-2 py-2 shadow-sm w-20">
                      <button onClick={() => setInputQty(inputQty + 1)} className="p-3 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 rounded-xl transition-colors"><Plus size={20} strokeWidth={3} /></button>
                      <span className="font-black text-2xl text-slate-800 dark:text-slate-100 my-1">{inputQty}</span>
                      <button onClick={() => setInputQty(Math.max(1, inputQty - 1))} className="p-3 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"><Minus size={20} strokeWidth={3} /></button>
                    </div>
                  )}
                  <div onClick={onToggleKeypad} className={cn("flex-1 flex flex-col justify-center items-end px-8 py-4 rounded-3xl transition-all cursor-pointer relative overflow-hidden shadow-sm hover:scale-[1.02] active:scale-[0.98]", showKeypad ? "bg-slate-900 border-transparent shadow-lg text-white" : "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100")}>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", showKeypad ? "text-slate-400" : "text-slate-400")}>{view === 'catalog' ? 'Ref. Preço' : 'Preço Unitário'}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold opacity-60">R$</span>
                      <span className="text-4xl font-black tracking-tighter">{inputPrice || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {showKeypad && (
                  <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/10 pointer-events-auto backdrop-blur-[2px]" onClick={onToggleKeypad} />
                    <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-3xl p-6 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-white dark:border-slate-700 pointer-events-auto relative">
                      <div className="flex justify-between items-center mb-6 px-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{view === 'catalog' ? 'Ref. Preço' : 'Preço Unitário'}</span>
                          <div className="flex items-baseline gap-1 text-slate-800 dark:text-slate-100">
                            <span className="text-xl font-bold opacity-60">R$</span>
                            <span className="text-5xl font-black tracking-tighter">{inputPrice || '0.00'}</span>
                          </div>
                        </div>
                        <button onClick={onToggleKeypad} className="h-12 w-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><ArrowDown size={24} /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(k => <KeypadButton key={k} value={k} onClick={onKeypadPress} />)}
                        <KeypadButton value="del" onClick={() => onKeypadPress('del')} icon={<Delete size={28} className="text-red-400" />} className="text-red-500 bg-red-50/80 dark:bg-red-900/50 border-red-100 dark:border-red-800" />
                      </div>
                      <div className="flex gap-4">
                        <button onClick={onConfirm} disabled={!inputName.trim()} className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/30 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
                          {view === 'catalog' ? 'Salvar Produto' : 'Adicionar à Lista'} <Check size={24} />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {!showKeypad && (
                <motion.button layout onClick={onConfirm} disabled={!inputName.trim()}
                  className="w-full mt-8 bg-slate-900 border border-slate-800 text-white font-bold py-6 rounded-3xl shadow-2xl shadow-slate-900/20 active:scale-95 transition-transform flex items-center justify-center gap-3 text-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
                  {view === 'catalog' ? 'Salvar Produto' : 'Adicionar à Lista'} <Plus size={24} />
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
