import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { ChangeEvent } from 'react'
import type { User } from 'firebase/auth'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db, handleFirestoreError, OperationType } from '../firebase'
import type { Item, CatalogItem, HistoryEntry, SavedList, Nutrition, View, SortBy, AnalyticsType } from '../types'
import { SIZE_PATTERN, COMMON_BRANDS, CATEGORY_PATTERNS } from '../lib/constants'

interface SnapCache {
  catalog: string
  history: string
  savedLists: string
  activeItems: string
  budget: number
}

export interface ShoppingStore {
  user: User | null
  activeItems: Item[]
  savedLists: SavedList[]
  history: HistoryEntry[]
  catalog: CatalogItem[]
  budget: number
  listName: string

  inputName: string
  inputBrand: string
  inputType: string
  inputSize: string
  inputPrice: string
  inputQty: number
  inputEmoji: string
  inputStore: string

  view: View
  showInputModal: boolean
  showKeypad: boolean
  isManualMode: boolean
  editingItemId: number | null
  showNutrition: boolean
  nutrition: Nutrition
  sortBy: SortBy
  suggestions: CatalogItem[]
  viewingItemDetails: Item | null
  showScanner: boolean
  showBudgetModal: boolean

  analyticsType: AnalyticsType
  analyticsSelection: string

  analyzing: boolean
  analyzeError: string | null

  snapCache: SnapCache

  setUser: (u: User | null) => void
  setView: (v: View) => void
  setActiveItems: (items: Item[] | ((prev: Item[]) => Item[])) => void
  setCatalog: (c: CatalogItem[]) => void
  setHistory: (h: HistoryEntry[] | ((prev: HistoryEntry[]) => HistoryEntry[])) => void
  setSavedLists: (s: SavedList[] | ((prev: SavedList[]) => SavedList[])) => void
  setBudget: (v: number) => void
  setListName: (v: string) => void
  setInputName: (v: string) => void
  setInputBrand: (v: string) => void
  setInputType: (v: string) => void
  setInputSize: (v: string) => void
  setInputPrice: (v: string) => void
  setInputQty: (v: number) => void
  setInputEmoji: (v: string) => void
  setInputStore: (v: string) => void
  setShowInputModal: (v: boolean) => void
  setShowKeypad: (v: boolean) => void
  setIsManualMode: (v: boolean) => void
  setEditingItemId: (v: number | null) => void
  setShowNutrition: (v: boolean) => void
  setNutrition: (v: Nutrition) => void
  setSortBy: (v: SortBy) => void
  setSuggestions: (v: CatalogItem[]) => void
  setViewingItemDetails: (v: Item | null) => void
  setShowScanner: (v: boolean) => void
  setShowBudgetModal: (v: boolean) => void
  setAnalyticsType: (v: AnalyticsType) => void
  setAnalyticsSelection: (v: string) => void
  setAnalyzing: (v: boolean) => void
  setAnalyzeError: (v: string | null) => void
  setSnapCache: (k: keyof SnapCache, v: string | number) => void

  formatCurrency: (val: number) => string
  detectCategory: (name: string) => string
  getLastPrice: (name: string) => number | undefined
  calcTotal: (list: Item[]) => number
  calcChecked: (list: Item[]) => number
  parseInput: (text: string) => { name: string; brand: string; type: string; size: string }
  resetInputs: () => void
  updateActiveItems: (newOrFn: Item[] | ((prev: Item[]) => Item[])) => void
  confirmItem: () => void
  closeInputModal: () => void
  openInputModal: () => void
  openForEdit: (item: any, isCatalogMode?: boolean) => void
  finishShopping: () => void
  selectSuggestion: (sug: CatalogItem) => void
  saveAndClose: (shouldSaveList: boolean) => void
  handleKeypadPress: (val: any) => void
  deleteFromCatalog: (id: number) => void
  onPhotoUpload: (e: ChangeEvent<HTMLInputElement>) => void
  onBarcodeScan: (barcode: string) => void
  onContinuousBarcodeScan: (barcode: string) => void
  saveCatalogToFirebase: (item: CatalogItem) => Promise<void>
  deleteFromCatalogFirebase: (id: number) => Promise<void>
}

const EMPTY_NUTRITION: Nutrition = { p100: {}, portion: {}, vd: {} }

export const useShoppingStore = create<ShoppingStore>((set, get) => ({
  user: null,
  activeItems: [],
  savedLists: [],
  history: [],
  catalog: [],
  budget: 0,
  listName: '',

  inputName: '',
  inputBrand: '',
  inputType: '',
  inputSize: '',
  inputPrice: '',
  inputQty: 1,
  inputEmoji: '',
  inputStore: '',

  view: 'home',
  showInputModal: false,
  showKeypad: false,
  isManualMode: false,
  editingItemId: null,
  showNutrition: false,
  nutrition: { p100: {}, portion: {}, vd: {} },
  sortBy: 'alpha',
  suggestions: [],
  viewingItemDetails: null,
  showScanner: false,
  showBudgetModal: false,

  analyticsType: 'geral',
  analyticsSelection: '',

  analyzing: false,
  analyzeError: null,

  snapCache: { catalog: '', history: '', savedLists: '', activeItems: '', budget: 0 },

  setUser: (u) => set({ user: u }),
  setView: (v) => set({ view: v }),
  setActiveItems: (items) => set(s => ({ activeItems: typeof items === 'function' ? items(s.activeItems) : items })),
  setCatalog: (c) => set({ catalog: c }),
  setHistory: (h) => set(s => ({ history: typeof h === 'function' ? h(s.history) : h })),
  setSavedLists: (s) => set(st => ({ savedLists: typeof s === 'function' ? s(st.savedLists) : s })),
  setBudget: (v) => set({ budget: v }),
  setListName: (v) => set({ listName: v }),
  setInputName: (v) => set({ inputName: v }),
  setInputBrand: (v) => set({ inputBrand: v }),
  setInputType: (v) => set({ inputType: v }),
  setInputSize: (v) => set({ inputSize: v }),
  setInputPrice: (v) => set({ inputPrice: v }),
  setInputQty: (v) => set({ inputQty: v }),
  setInputEmoji: (v) => set({ inputEmoji: v }),
  setInputStore: (v) => set({ inputStore: v }),
  setShowInputModal: (v) => set({ showInputModal: v }),
  setShowKeypad: (v) => set({ showKeypad: v }),
  setIsManualMode: (v) => set({ isManualMode: v }),
  setEditingItemId: (v) => set({ editingItemId: v }),
  setShowNutrition: (v) => set({ showNutrition: v }),
  setNutrition: (v) => set({ nutrition: v }),
  setSortBy: (v) => set({ sortBy: v }),
  setSuggestions: (v) => set({ suggestions: v }),
  setViewingItemDetails: (v) => set({ viewingItemDetails: v }),
  setShowScanner: (v) => set({ showScanner: v }),
  setShowBudgetModal: (v) => set({ showBudgetModal: v }),
  setAnalyticsType: (v) => set({ analyticsType: v }),
  setAnalyticsSelection: (v) => set({ analyticsSelection: v }),
  setAnalyzing: (v) => set({ analyzing: v }),
  setAnalyzeError: (v) => set({ analyzeError: v }),
  setSnapCache: (k, v) => set(s => ({ snapCache: { ...s.snapCache, [k]: v } })),

  formatCurrency: (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val),
  detectCategory: (name) => {
    const n = name.toLowerCase()
    for (const [pattern, category] of CATEGORY_PATTERNS) {
      if (n.match(pattern)) return category
    }
    return 'Geral'
  },
  getLastPrice: (name) => get().catalog.find(c => c.name.toLowerCase() === name.toLowerCase())?.lastPrice,

  calcTotal: (list) => list.reduce((acc, i) => acc + (i.price * i.quantity), 0),
  calcChecked: (list) => list.filter(i => i.checked).reduce((acc, i) => acc + (i.price * i.quantity), 0),

  parseInput: (text) => {
    let parsed = { name: text, brand: '', type: '', size: '' }
    const sizeMatches = Array.from(text.matchAll(SIZE_PATTERN))
    if (sizeMatches.length > 0) {
      parsed.size = sizeMatches.map(m => m[1]).join(', ').toUpperCase()
      sizeMatches.forEach(m => { parsed.name = parsed.name.replace(m[0], ' ') })
    }

    const { catalog } = get()
    const currentBrands = catalog.map(c => c.brand).filter(Boolean).map(b => b!.toLowerCase())
    const knownBrands = new Set([...COMMON_BRANDS, ...currentBrands])
    const parts = parsed.name.split(/[-,\. ]+/).map(s => s.trim()).filter(Boolean)
    let nameParts: string[] = []
    let foundBrand = ''
    parts.forEach((part) => {
      if (!foundBrand && knownBrands.has(part.toLowerCase())) {
        foundBrand = part
      } else {
        nameParts.push(part)
      }
    })
    if (foundBrand) parsed.brand = foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1)
    parsed.name = nameParts.join(' ').replace(/\s+/g, ' ').trim()
    return parsed
  },

  resetInputs: () => set({
    inputName: '', inputBrand: '', inputType: '', inputSize: '',
    inputQty: 1, inputPrice: '', nutrition: { p100: {}, portion: {}, vd: {} },
    inputEmoji: '', inputStore: '',
    showNutrition: false, isManualMode: false, showKeypad: false,
    showInputModal: false, editingItemId: null, showScanner: false,
  }),

  updateActiveItems: (newOrFn) => {
    set(s => ({
      activeItems: typeof newOrFn === 'function' ? newOrFn(s.activeItems) : newOrFn
    }))
  },

  confirmItem: () => {
    const state = get()
    const { inputPrice, inputName, inputBrand, inputType, inputSize, inputStore,
      isManualMode, editingItemId, catalog, activeItems, view, nutrition,
      detectCategory, parseInput, resetInputs, updateActiveItems } = state

    const finalPrice = parseFloat(inputPrice) || 0
    let cleanName = inputName.trim()
    let cleanBrand = inputBrand.trim()
    let cleanType = inputType.trim()
    let cleanSize = inputSize.trim()

    if (!isManualMode && cleanName) {
      const parsed = parseInput(cleanName)
      if (parsed.name) cleanName = parsed.name
      if (parsed.brand) cleanBrand = parsed.brand
      if (parsed.type) cleanType = parsed.type
      if (parsed.size) cleanSize = parsed.size
    }

    if (!cleanName) return
    const finalCategory = (isManualMode && inputType.trim()) ? inputType.trim() : detectCategory(cleanName)

    let newCatalog = [...catalog]
    const catIndex = newCatalog.findIndex(c =>
      c.id === editingItemId || c.name.toLowerCase() === cleanName.toLowerCase()
    )

    const newItemData: CatalogItem = {
      id: editingItemId || Date.now(),
      name: cleanName, brand: cleanBrand, type: cleanType, size: cleanSize, store: inputStore,
      category: finalCategory, emoji: state.inputEmoji,
      lastPrice: finalPrice > 0 ? finalPrice : (catIndex >= 0 ? newCatalog[catIndex].lastPrice : 0),
      nutrition
    }

    if (catIndex >= 0) newCatalog[catIndex] = { ...newCatalog[catIndex], ...newItemData }
    else newCatalog.push(newItemData)
    set({ catalog: newCatalog })
    state.saveCatalogToFirebase(newCatalog[catIndex >= 0 ? catIndex : newCatalog.length - 1])

    if (view !== 'catalog') {
      const itemPayload: Item = {
        id: editingItemId || Date.now(),
        name: cleanName, brand: cleanBrand, type: cleanType, size: cleanSize, store: inputStore,
        category: finalCategory, emoji: state.inputEmoji,
        quantity: state.inputQty, price: finalPrice,
        checked: editingItemId ? activeItems.find(i => i.id === editingItemId)?.checked || false : true,
        nutrition
      }
      if (editingItemId) {
        updateActiveItems(activeItems.map(i => i.id === editingItemId ? itemPayload : i))
      } else {
        updateActiveItems((prev: Item[]) => [...prev, itemPayload])
      }
    }
    resetInputs()
  },

  closeInputModal: () => set({ showInputModal: false, editingItemId: null, showScanner: false }),

  openInputModal: () => {
    window.history.pushState({ modal: true }, '')
    get().resetInputs()
    set({ showInputModal: true })
  },

  openForEdit: (item, isCatalogMode = false) => {
    window.history.pushState({ modal: true }, '')
    get().resetInputs()
    setTimeout(() => {
      set({
        editingItemId: item.id,
        inputName: item.name,
        inputBrand: item.brand || '',
        inputType: item.type || '',
        inputSize: item.size || '',
        inputEmoji: item.emoji || '',
        inputStore: item.store || '',
        nutrition: item.nutrition || EMPTY_NUTRITION,
        inputPrice: isCatalogMode ? (item.lastPrice ? item.lastPrice.toString() : '') : (item.price ? item.price.toString() : ''),
        inputQty: isCatalogMode ? 1 : item.quantity,
        isManualMode: !!(item.brand || item.type || item.size || (item.nutrition && Object.keys(item.nutrition.p100 || {}).length > 0)),
        showInputModal: true,
      })
    }, 50)
  },

  finishShopping: () => {
    const { activeItems } = get()
    if (activeItems.filter(i => i.checked).length === 0 && activeItems.length > 0) {
      alert("Marque itens no carrinho primeiro.")
      return
    }
    set({ view: 'finish-save' })
  },

  selectSuggestion: (sug) => {
    set({
      inputName: sug.name,
      inputBrand: sug.brand || '',
      inputSize: sug.size || '',
      inputType: sug.category || '',
      inputEmoji: sug.emoji || '',
      inputPrice: sug.lastPrice ? sug.lastPrice.toString() : '',
      inputStore: sug.store || '',
      nutrition: sug.nutrition || EMPTY_NUTRITION,
      showNutrition: !!sug.nutrition,
      isManualMode: true,
    })
  },

  saveAndClose: (shouldSaveList) => {
    const state = get()
    const { activeItems, user, calcChecked, setHistory, setSavedLists,
      updateActiveItems, listName } = state

    const cartItems = activeItems.filter(i => i.checked)
    if (cartItems.length > 0) {
      const purchase: HistoryEntry = {
        id: Date.now(), date: new Date().toISOString(),
        items: [...cartItems], total: calcChecked(activeItems)
      }
      setHistory(prev => {
        const next = [...prev, purchase]
        if (user) {
          setDoc(doc(db, 'users', user.uid, 'history', purchase.id.toString()), {
            userId: user.uid, ...purchase, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
          }).catch(e => console.error(e))
        }
        return next
      })
    }

    if (shouldSaveList && listName.trim()) {
      const newList: SavedList = {
        id: Date.now(), name: listName,
        items: activeItems.map(i => ({ ...i, checked: false }))
      }
      setSavedLists(prev => {
        const next = [...prev, newList]
        if (user) {
          setDoc(doc(db, 'users', user.uid, 'savedLists', newList.id.toString()), {
            userId: user.uid, ...newList, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
          }).catch(e => console.error(e))
        }
        return next
      })
    }

    updateActiveItems([])
    set({ listName: '', view: 'success' })
    setTimeout(() => set({ view: 'home' }), 2000)
  },

  handleKeypadPress: (val) => {
    const { inputPrice } = get()
    if (val === 'del') {
      set({ inputPrice: inputPrice.slice(0, -1) || '' })
    } else if (val === '.') {
      if (!inputPrice.includes('.')) set({ inputPrice: inputPrice === '' ? '0.' : inputPrice + '.' })
    } else {
      set(s => {
        if (s.inputPrice === '0' && val !== '.') return { inputPrice: String(val) }
        if (s.inputPrice.includes('.')) {
          const [, dec] = s.inputPrice.split('.')
          if (dec && dec.length >= 2) return {}
        }
        return { inputPrice: s.inputPrice + val }
      })
    }
  },

  deleteFromCatalog: (id) => {
    if (window.confirm('Excluir do catálogo?')) {
      set(s => ({ catalog: s.catalog.filter(c => c.id !== id) }))
      get().deleteFromCatalogFirebase(id)
    }
  },

  onPhotoUpload: async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64str = reader.result as string
      const state = get()
      state.setShowScanner(false)
      state.openInputModal()
      state.setIsManualMode(true)
      state.setAnalyzing(true)
      state.setAnalyzeError(null)
      try {
        const res = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64str })
        })
        if (res.status === 429) {
          state.setAnalyzeError("Limite diário da IA atingido. Tente novamente amanhã.")
          return
        }
        if (!res.ok) {
          state.setAnalyzeError("Erro ao analisar imagem. Tente novamente.")
          return
        }
        const data = await res.json()
        if (data.result && data.result.name) {
          const p = data.result
          set({
            inputName: p.name,
            inputBrand: p.brand || '',
            inputSize: p.size || '',
            inputType: p.category || '',
            inputEmoji: p.emoji || '',
          })
          const hasNutrition = p.nutrition && Object.values(p.nutrition).some((v: any) => v !== '' && v !== undefined && v !== null)
          if (hasNutrition) {
            set({
              nutrition: {
                p100: {
                  kcal: p.nutrition['energy-kcal_100g'] || '',
                  carb: p.nutrition['carbohydrates_100g'] || '',
                  prot: p.nutrition['proteins_100g'] || '',
                  fat: p.nutrition['fat_100g'] || '',
                  sat_fat: p.nutrition['saturated-fat_100g'] || '',
                  fibers: p.nutrition['fiber_100g'] || '',
                  sodium: p.nutrition['sodium_100g'] || '',
                  sugars: p.nutrition['sugars_100g'] || ''
                },
                portion: {}, vd: {}
              },
              showNutrition: true,
            })
          }
        } else {
          state.setAnalyzeError("IA não conseguiu identificar o produto. Tire outra foto ou preencha manualmente.")
        }
      } catch (err) {
        console.error(err)
        state.setAnalyzeError("Erro de conexão ao analisar imagem.")
      } finally {
        state.setAnalyzing(false)
      }
    }
    reader.readAsDataURL(file)
  },

  onBarcodeScan: async (barcode) => {
    set({ showScanner: false })
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
      const data = await res.json()
      if (data.status === 1 && data.product) {
        const p = data.product
        const nutrition: Nutrition = p.nutriments ? {
          p100: {
            kcal: p.nutriments['energy-kcal_100g'] || '',
            carb: p.nutriments['carbohydrates_100g'] || '',
            prot: p.nutriments['proteins_100g'] || '',
            fat: p.nutriments['fat_100g'] || '',
            sat_fat: p.nutriments['saturated-fat_100g'] || '',
            fibers: p.nutriments['fiber_100g'] || '',
            sodium: p.nutriments['sodium_100g'] || '',
            sugars: p.nutriments['sugars_100g'] || ''
          },
          portion: {}, vd: {}
        } : { p100: {}, portion: {}, vd: {} }
        set({
          inputName: p.product_name || p.product_name_pt || p.generic_name || '',
          inputBrand: p.brands || '',
          inputSize: p.quantity || '',
          nutrition,
          isManualMode: true,
          showNutrition: true,
        })
      } else {
        alert("Produto não encontrado na base de dados (OpenFoodFacts).")
      }
    } catch (e) {
      console.error(e)
      alert("Erro ao buscar dados do produto.")
    }
  },

  onContinuousBarcodeScan: async (barcode) => {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
      const data = await res.json()
      if (data.status === 1 && data.product) {
        const p = data.product
        const newItem: Item = {
          id: Date.now() + Math.random(),
          name: p.product_name || p.product_name_pt || p.generic_name || barcode,
          brand: p.brands || '',
          type: '',
          size: p.quantity || '',
          category: '',
          emoji: '',
          store: '',
          quantity: 1,
          price: 0,
          checked: false,
          nutrition: { p100: {}, portion: {}, vd: {} }
        }
        if (p.nutriments) {
          newItem.nutrition.p100 = {
            kcal: p.nutriments['energy-kcal_100g'] || '',
            carb: p.nutriments['carbohydrates_100g'] || '',
            prot: p.nutriments['proteins_100g'] || '',
            fat: p.nutriments['fat_100g'] || '',
            sat_fat: p.nutriments['saturated-fat_100g'] || '',
            fibers: p.nutriments['fiber_100g'] || '',
            sodium: p.nutriments['sodium_100g'] || '',
            sugars: p.nutriments['sugars_100g'] || ''
          }
        }
        get().updateActiveItems((prev: Item[]) => [...prev, newItem])
      }
    } catch (e) {
      console.error(e)
    }
  },

  saveCatalogToFirebase: async (item) => {
    const { user } = get()
    if (!user) return
    try {
      await setDoc(doc(db, 'users', user.uid, 'catalog', item.id.toString()), {
        userId: user.uid, ...item, updatedAt: new Date().toISOString()
      })
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'users/catalog') }
  },

  deleteFromCatalogFirebase: async (id) => {
    const { user } = get()
    if (!user) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'catalog', id.toString()))
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'users/catalog') }
  },
}))

export const useTotal = () => useShoppingStore(s => s.activeItems.reduce((acc, i) => acc + (i.price * i.quantity), 0))
export const useCheckedTotal = () => useShoppingStore(s => s.activeItems.filter(i => i.checked).reduce((acc, i) => acc + (i.price * i.quantity), 0))
export const useUniqueStores = () => useShoppingStore(
  useShallow(s => {
    const stores = new Set<string>()
    s.catalog.forEach(c => c.store && stores.add(c.store))
    s.activeItems.forEach(i => i.store && stores.add(i.store))
    return [...stores]
  })
)
