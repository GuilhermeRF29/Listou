import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { doc, setDoc, onSnapshot, collection, query, deleteDoc } from 'firebase/firestore'
import { db, handleFirestoreError, OperationType } from '../firebase'
import type { Item, CatalogItem, HistoryEntry, SavedList, Nutrition, View, SortBy, AnalyticsType } from '../types'

export function useShoppingList(user: any) {
  const [view, setView] = useState<View>('home')
  const [activeItems, setActiveItems] = useState<Item[]>([])
  const [savedLists, setSavedLists] = useState<SavedList[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])

  const [inputName, setInputName] = useState('')
  const [inputBrand, setInputBrand] = useState('')
  const [inputType, setInputType] = useState('')
  const [inputSize, setInputSize] = useState('')
  const [inputPrice, setInputPrice] = useState('')
  const [inputQty, setInputQty] = useState(1)
  const [inputEmoji, setInputEmoji] = useState('')
  const [inputStore, setInputStore] = useState('')
  const [budget, setBudget] = useState(0)
  const [listName, setListName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [showNutrition, setShowNutrition] = useState(false)
  const [nutrition, setNutrition] = useState<Nutrition>({ p100: {}, portion: {}, vd: {} })
  const [sortBy, setSortBy] = useState<SortBy>('alpha')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showInputModal, setShowInputModal] = useState(false)
  const [showKeypad, setShowKeypad] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([])
  const [viewingItemDetails, setViewingItemDetails] = useState<Item | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [analyticsType, setAnalyticsType] = useState<AnalyticsType>('geral')
  const [analyticsSelection, setAnalyticsSelection] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  const snapCache = useRef({ catalog: '', history: '', savedLists: '', activeItems: '', budget: 0 })

  useEffect(() => {
    if (!user) return

    const q1 = query(collection(db, 'users', user.uid, 'catalog'))
    const unsub1 = onSnapshot(q1, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
      const key = JSON.stringify(data)
      if (key !== snapCache.current.catalog) {
        snapCache.current.catalog = key
        setCatalog(data)
      }
    }, error => handleFirestoreError(error, OperationType.LIST, 'users/catalog'))

    const q2 = query(collection(db, 'users', user.uid, 'history'))
    const unsub2 = onSnapshot(q2, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
      const key = JSON.stringify(data)
      if (key !== snapCache.current.history) {
        snapCache.current.history = key
        setHistory(data)
      }
    }, error => handleFirestoreError(error, OperationType.LIST, 'users/history'))

    const q3 = query(collection(db, 'users', user.uid, 'savedLists'))
    const unsub3 = onSnapshot(q3, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
      const key = JSON.stringify(data)
      if (key !== snapCache.current.savedLists) {
        snapCache.current.savedLists = key
        setSavedLists(data)
      }
    }, error => handleFirestoreError(error, OperationType.LIST, 'users/savedLists'))

    const unsub4 = onSnapshot(doc(db, 'users', user.uid, 'activeList', 'current'), (snap) => {
      const data = snap.exists() ? (snap.data().items || []) : []
      const key = JSON.stringify(data)
      if (key !== snapCache.current.activeItems) {
        snapCache.current.activeItems = key
        setActiveItems(data)
      }
    }, error => handleFirestoreError(error, OperationType.GET, 'users/activeList'))

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists() && snap.data().budget !== undefined) {
        setBudget(snap.data().budget)
      }
    }, error => handleFirestoreError(error, OperationType.GET, 'users'))

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsubUser() }
  }, [user])

  useEffect(() => {
    if (!user) {
      const sItems = localStorage.getItem('listou_items')
      const sLists = localStorage.getItem('listou_saved_lists')
      const sHistory = localStorage.getItem('listou_history')
      const sCatalog = localStorage.getItem('listou_catalog')
      const sBudget = localStorage.getItem('listou_budget')
      if (sItems) setActiveItems(JSON.parse(sItems))
      if (sLists) setSavedLists(JSON.parse(sLists))
      if (sHistory) setHistory(JSON.parse(sHistory))
      if (sCatalog) setCatalog(JSON.parse(sCatalog))
      if (sBudget) setBudget(parseFloat(sBudget))
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      localStorage.setItem('listou_items', JSON.stringify(activeItems))
      localStorage.setItem('listou_saved_lists', JSON.stringify(savedLists))
      localStorage.setItem('listou_history', JSON.stringify(history))
      localStorage.setItem('listou_catalog', JSON.stringify(catalog))
      localStorage.setItem('listou_budget', budget.toString())
    }
  }, [activeItems, savedLists, history, catalog, budget, user])

  useEffect(() => {
    if (inputName.trim().length > 1 && !isManualMode) {
      const matched = catalog.filter(p => p.name.toLowerCase().includes(inputName.toLowerCase())).slice(0, 3)
      setSuggestions(matched)
    } else setSuggestions([])
  }, [inputName, catalog, isManualMode])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setShowInputModal(false)
    setShowScanner(false)
    setShowKeypad(false)
    resetInputs()
  }, [view])

  useEffect(() => {
    const onPopState = () => {
      if (showInputModal || showScanner || showBudgetModal || viewingItemDetails) {
        setShowInputModal(false)
        setShowScanner(false)
        setShowBudgetModal(false)
        setViewingItemDetails(null)
        resetInputs()
      } else if (view !== 'home' && view !== 'shopping' && view !== 'catalog') {
        setView('home')
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [showInputModal, showScanner, showBudgetModal, viewingItemDetails, view])

  const calcTotal = (list: Item[]) => list.reduce((acc, i) => acc + (i.price * i.quantity), 0)
  const calcChecked = (list: Item[]) => list.filter(i => i.checked).reduce((acc, i) => acc + (i.price * i.quantity), 0)
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const updateActiveItems = useCallback((newOrFn: any) => {
    setActiveItems(prev => {
      const next = typeof newOrFn === 'function' ? newOrFn(prev) : newOrFn
      return next
    })
  }, [])

  useEffect(() => {
    if (!user || !activeItems.length) return
    const timer = setTimeout(() => {
      setDoc(doc(db, 'users', user.uid, 'activeList', 'current'), {
        userId: user.uid,
        items: activeItems,
        updatedAt: new Date().toISOString()
      }).catch(e => console.error(e))
    }, 300)
    return () => clearTimeout(timer)
  }, [activeItems, user])

  const saveCatalogToFirebase = async (item: CatalogItem) => {
    if (!user) return
    try {
      await setDoc(doc(db, 'users', user.uid, 'catalog', item.id.toString()), {
        userId: user.uid, ...item, updatedAt: new Date().toISOString()
      })
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'users/catalog') }
  }

  const deleteFromCatalogFirebase = async (id: number) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'catalog', id.toString()))
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'users/catalog') }
  }

  const detectCategory = (name: string) => {
    const n = name.toLowerCase()
    if (n.match(/arroz|feijão|macarrão|óleo|açúcar|farinha|café/)) return 'Mercearia'
    if (n.match(/leite|queijo|iogurte|manteiga|requeijão/)) return 'Laticínios'
    if (n.match(/carne|frango|bife|peixe|linguiça/)) return 'Açougue'
    if (n.match(/shampoo|sabonete|papel|creme|pasta|desodorante/)) return 'Higiene'
    if (n.match(/detergente|sabão|água sanitária|limpador|bucha/)) return 'Limpeza'
    if (n.match(/banana|maçã|tomate|cebola|batata|cenoura|alface/)) return 'Hortifruti'
    if (n.match(/pão|bolo|biscoito|bolacha/)) return 'Padaria'
    if (n.match(/cerveja|refrigerante|suco|água/)) return 'Bebidas'
    return 'Geral'
  }

  const getLastPrice = (name: string) => catalog.find(c => c.name.toLowerCase() === name.toLowerCase())?.lastPrice

  const sortItems = (items: any[]) => {
    let sorted = [...items]
    if (sortBy === 'alpha') sorted.sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'brand') sorted.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''))
    if (sortBy === 'category') sorted.sort((a, b) => (a.category || 'Geral').localeCompare(b.category || 'Geral'))
    if (sortBy === 'price') sorted.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
    if (sortBy === 'store') sorted.sort((a, b) => (a.store || '').localeCompare(b.store || ''))
    return sorted
  }

  const parseInput = (text: string) => {
    let parsed = { name: text, brand: '', type: '', size: '' }
    const sizePattern = /\b(?:de\s+|com\s+)?(\d+[\.,]?\d*\s*(?:kg|g|mg|l|ml|un|pcts?|cxs?|caixas?|pacotes?|rolo|rolos|unidade|unidades|folhas?|m|cm|mm))\b/ig
    const sizeMatches = Array.from(text.matchAll(sizePattern))
    if (sizeMatches.length > 0) {
      parsed.size = sizeMatches.map(m => m[1]).join(', ').toUpperCase()
      sizeMatches.forEach(m => { parsed.name = parsed.name.replace(m[0], ' ') })
    }

    const commonBrands = ['camil', 'neve', 'ypê', 'ype', 'omo', 'nestlé', 'nestle', 'garoto', 'lacta', 'bauducco', 'sazon', 'maggi', 'sadia', 'perdigão', 'perdigao', 'seara', 'friboi', 'aurora', 'elegê', 'elege', 'parmalat', 'itambé', 'itambe', 'vigor', 'danone', 'batavo', 'piracanjuba', 'coca-cola', 'coca', 'pepsi', 'guaraná', 'guarana', 'fanta', 'sprite', 'sukita', 'schin', 'brahma', 'skol', 'antarctica', 'heineken', 'amstel', 'itaipava', 'qualitá', 'qualita', 'carrefour', 'extra', 'tixan', 'brilhante', 'ariel', 'downy', 'comfort', 'fofo', 'limpol', 'minuano', 'bombril', 'assolan', 'veja', 'cif', 'ajax', 'lysol', 'pinho sol', 'raid', 'sbp', 'baygon', 'pampers', 'huggies', 'cremer', 'personal', 'chamex', 'bic', 'colgate', 'sorriso', 'close up', 'oral-b', 'sensodyne', 'listerine', 'rexona', 'dove', 'nivea', 'suave', 'seda', 'pantene', 'gillette', 'palmolive', 'lux', 'francis', 'phebo', 'granado', 'hellmanns', 'heinz', 'quero', 'cepêra', 'fugini', 'cica', 'elefante', 'gallo', 'andorinha', 'soya', 'liza', 'primor', 'delícia', 'qualy', 'claybom', 'doriana', 'zero cal', 'linea', 'adria', 'piraquê', 'elma chips', 'ruffles', 'doritos', 'kelloggs', 'sucrilhos', 'nescau', 'toddy', 'pilão', 'melitta', 'três corações', 'suvinil', 'coral']
    const currentBrands = catalog.map(c => c.brand).filter(Boolean).map(b => b?.toLowerCase())
    const knownBrands = new Set([...commonBrands, ...currentBrands])
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
  }

  const resetInputs = () => {
    setInputName(''); setInputBrand(''); setInputType(''); setInputSize('')
    setInputQty(1); setInputPrice(''); setNutrition({ p100: {}, portion: {}, vd: {} }); setInputEmoji(''); setInputStore('')
    setShowNutrition(false); setIsManualMode(false); setShowKeypad(false); setShowInputModal(false)
    setEditingItemId(null); setShowScanner(false)
  }

  const confirmItem = () => {
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
      category: finalCategory, emoji: inputEmoji,
      lastPrice: finalPrice > 0 ? finalPrice : (catIndex >= 0 ? newCatalog[catIndex].lastPrice : 0),
      nutrition
    }

    if (catIndex >= 0) newCatalog[catIndex] = { ...newCatalog[catIndex], ...newItemData }
    else newCatalog.push(newItemData)
    setCatalog(newCatalog)
    saveCatalogToFirebase(newCatalog[catIndex >= 0 ? catIndex : newCatalog.length - 1])

    if (view !== 'catalog') {
      const itemPayload: Item = {
        id: editingItemId || Date.now(),
        name: cleanName, brand: cleanBrand, type: cleanType, size: cleanSize, store: inputStore,
        category: finalCategory, emoji: inputEmoji,
        quantity: inputQty, price: finalPrice,
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
  }

  const closeInputModal = () => {
    setShowInputModal(false)
    resetInputs()
    if (window.history.state?.modal) window.history.back()
  }

  const openInputModal = () => {
    window.history.pushState({ modal: true }, '')
    resetInputs()
    setShowInputModal(true)
  }

  const openForEdit = (item: any, isCatalogMode = false) => {
    window.history.pushState({ modal: true }, '')
    resetInputs()
    setTimeout(() => {
      setEditingItemId(item.id)
      setInputName(item.name)
      setInputBrand(item.brand || '')
      setInputType(item.type || '')
      setInputSize(item.size || '')
      setInputEmoji(item.emoji || '')
      setInputStore(item.store || '')
      setNutrition(item.nutrition || { p100: {}, portion: {}, vd: {} })
      if (isCatalogMode) {
        setInputPrice(item.lastPrice ? item.lastPrice.toString() : '')
        setInputQty(1)
      } else {
        setInputQty(item.quantity)
        setInputPrice(item.price ? item.price.toString() : '')
      }
      if (item.brand || item.type || item.size || (item.nutrition && Object.keys(item.nutrition.p100 || {}).length > 0)) {
        setIsManualMode(true)
      }
      setShowInputModal(true)
    }, 50)
  }

  const finishShopping = () => {
    if (activeItems.filter(i => i.checked).length === 0 && activeItems.length > 0) {
      alert("Marque itens no carrinho primeiro.")
      return
    }
    setView('finish-save')
  }

  const saveAndClose = (shouldSaveList: boolean) => {
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
    setListName('')
    setView('success')
    setTimeout(() => setView('home'), 2000)
  }

  const handleKeypadPress = (val: any) => {
    if (val === 'del') {
      setInputPrice(prev => prev.slice(0, -1) || '')
    } else if (val === '.') {
      if (!inputPrice.includes('.')) setInputPrice(prev => (prev === '' ? '0.' : prev + '.'))
    } else {
      setInputPrice(prev => {
        if (prev === '0' && val !== '.') return String(val)
        if (prev.includes('.')) {
          const [, dec] = prev.split('.')
          if (dec && dec.length >= 2) return prev
        }
        return prev + val
      })
    }
  }

  const selectSuggestion = (sug: CatalogItem) => {
    setInputName(sug.name)
    setInputBrand(sug.brand || '')
    setInputSize(sug.size || '')
    if (sug.lastPrice) setInputPrice(sug.lastPrice.toString())
    setSuggestions([])
  }

  const deleteFromCatalog = (id: number) => {
    if (window.confirm('Excluir do catálogo?')) {
      setCatalog(catalog.filter(c => c.id !== id))
      deleteFromCatalogFirebase(id)
    }
  }

  const handleShareList = () => {
    const text = activeItems.map(i => `${i.checked ? '✅' : '⬜'} ${i.quantity}x ${i.name} ${i.brand ? '- ' + i.brand : ''}`).join('\n')
    const header = `🛒 Minha Lista de Compras - Listou\nTotal Estimado: ${formatCurrency(calcTotal(activeItems))}\n\n`
    navigator.clipboard.writeText(header + text).then(() => {
      alert("Lista copiada para a área de transferência!")
    }).catch(() => alert("Erro ao copiar."))
  }

  const onPhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64str = reader.result as string
      setShowScanner(false)
      openInputModal()
      setIsManualMode(true)
      setAnalyzing(true)
      setAnalyzeError(null)
      try {
        const res = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64str })
        })
        if (res.status === 429) {
          setAnalyzeError("Limite diário da IA atingido. Tente novamente amanhã.")
          return
        }
        if (!res.ok) {
          setAnalyzeError("Erro ao analisar imagem. Tente novamente.")
          return
        }
        const data = await res.json()
        if (data.result && data.result.name) {
          const p = data.result
          setInputName(p.name)
          if (p.brand) setInputBrand(p.brand)
          if (p.size) setInputSize(p.size)
          if (p.category) setInputType(p.category)
          if (p.emoji) setInputEmoji(p.emoji)
          const hasNutrition = p.nutrition && Object.values(p.nutrition).some((v: any) => v !== '' && v !== undefined && v !== null)
          if (hasNutrition) {
            setNutrition({
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
            })
            setShowNutrition(true)
          }
        } else {
          setAnalyzeError("IA não conseguiu identificar o produto. Tire outra foto ou preencha manualmente.")
        }
      } catch (err) {
        console.error(err)
        setAnalyzeError("Erro de conexão ao analisar imagem.")
      } finally {
        setAnalyzing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const onBarcodeScan = async (barcode: string) => {
    setShowScanner(false)
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
      const data = await res.json()
      if (data.status === 1 && data.product) {
        const p = data.product
        setInputName(p.product_name || p.product_name_pt || p.generic_name || '')
        setInputBrand(p.brands || '')
        setInputSize(p.quantity || '')
        if (p.nutriments) {
          setNutrition({
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
          })
        }
        setIsManualMode(true)
        setShowNutrition(true)
      } else {
        alert("Produto não encontrado na base de dados (OpenFoodFacts).")
      }
    } catch (e) {
      console.error(e)
      alert("Erro ao buscar dados do produto.")
    }
  }

  const onContinuousBarcodeScan = async (barcode: string) => {
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
        updateActiveItems(prev => [...prev, newItem])
      }
    } catch (e) {
      console.error(e)
    }
  }

  return {
    // State
    view, activeItems, savedLists, history, catalog,
    inputName, inputBrand, inputType, inputSize, inputPrice, inputQty, inputEmoji, inputStore,
    budget, listName, searchTerm,
    showNutrition, nutrition, sortBy, showFilterMenu,
    showInputModal, showKeypad, showBudgetModal,
    isManualMode, editingItemId, suggestions,
    viewingItemDetails, showScanner,
    analyticsType, analyticsSelection,
    analyzing, analyzeError,

    // Derived
    total: calcTotal(activeItems),
    checkedTotal: calcChecked(activeItems),
    formatCurrency,
    getLastPrice,
    uniqueStores: [...new Set([...catalog.map(c => c.store), ...activeItems.map(i => i.store)].filter(Boolean))],

    // Setters
    setView, setBudget, setListName, setSearchTerm,
    setInputName, setInputBrand, setInputType, setInputSize,
    setInputPrice, setInputQty, setInputEmoji, setInputStore,
    setSortBy, setShowFilterMenu, setShowNutrition,
    setNutrition, setIsManualMode, setShowKeypad,
    setShowBudgetModal, setShowScanner,
    setViewingItemDetails,
    setAnalyticsType, setAnalyticsSelection,

    // Actions
    updateActiveItems, confirmItem, closeInputModal,
    openInputModal, openForEdit, finishShopping, saveAndClose,
    handleKeypadPress, selectSuggestion, deleteFromCatalog,
    handleShareList, onPhotoUpload, onBarcodeScan, onContinuousBarcodeScan,
    sortItems, resetInputs, detectCategory,
  }
}
