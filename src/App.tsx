import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, ShoppingBag, History, BarChart3, 
  ArrowRight, Minus, Check, X, Home, ChevronDown, 
  Delete, List, Save, ArrowLeft, MoreHorizontal,
  Calendar, TrendingUp, Sparkles, Search, TrendingDown,
  Package, Edit3, Tag, Scale, Leaf, Info, Filter, 
  SortAsc, Share2, Wallet, AlertTriangle, Copy, LayoutGrid, LogIn, LogOut, Camera, ArrowDown
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip as RechartsTooltip 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, query, writeBatch, getDoc, deleteDoc } from 'firebase/firestore';
import BarcodeScanner from './components/BarcodeScanner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- DESIGN SYSTEM ---

const GlassCard = ({ children, className = "", onClick, onLongPress, activeScale = true }: any) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    if (onLongPress) {
      timerRef.current = setTimeout(() => {
        onLongPress();
      }, 500);
    }
  };

  const handleEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

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
        "bg-white/70 backdrop-blur-xl border border-white/40",
        "shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl",
        "transition-[background-color,shadow] duration-200 ease-out relative overflow-hidden select-none",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none opacity-50"></div>
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
};

const GlassButton = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false }: any) => {
  const variants: any = {
    primary: "bg-slate-900 border border-slate-800 text-white shadow-xl shadow-slate-900/20",
    secondary: "bg-white/50 text-slate-700 border border-white/80 shadow-sm",
    emerald: "bg-emerald-500 border border-emerald-400 text-white shadow-xl shadow-emerald-500/20",
  };

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
  );
};

const Badge = ({ icon: Icon, text, color = "slate" }: any) => {
  const colors: any = {
    slate: "bg-slate-100/80 text-slate-600 border-slate-200",
    emerald: "bg-emerald-100/80 text-emerald-700 border-emerald-200",
    orange: "bg-orange-100/80 text-orange-700 border-orange-200",
    blue: "bg-blue-100/80 text-blue-700 border-blue-200",
    purple: "bg-purple-100/80 text-purple-700 border-purple-200",
  };
  
  if (!text) return null;

  return (
    <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg border backdrop-blur-sm flex items-center gap-1 whitespace-nowrap", colors[color])}>
      {Icon && <Icon size={10} />} {text}
    </span>
  );
};

const KeypadButton = ({ value, onClick, icon, className = "" }: any) => (
  <motion.button 
    whileTap={{ scale: 0.9 }}
    onClick={(e) => { e.stopPropagation(); onClick(value); }}
    className={cn(
      "h-16 rounded-2xl font-medium text-2xl flex items-center justify-center",
      "bg-white/80 backdrop-blur-sm border border-white/80 text-slate-700 shadow-sm",
      className
    )}
  >
    {icon || value}
  </motion.button>
);

const SwipeableItem = ({ item, lastPrice, onToggle, onPriceClick, onDelete, onViewDetails, onEdit }: any) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, x: -100 }}
      transition={{ duration: 0.2 }}
      className="relative mb-3 select-none touch-pan-y"
    >
      {/* Background Action Area (Delete) */}
      <div className="absolute inset-0 bg-red-500 rounded-3xl flex items-center justify-end pr-6 shadow-inner">
        <Trash2 className="text-white" size={24} />
      </div>

      {/* Swipeable Container */}
      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0.1 }}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.x < -90 || velocity.x < -600) {
            onDelete(item.id);
          }
        }}
        whileDrag={{ scale: 0.98, cursor: 'grabbing', zIndex: 10 }}
        className="relative z-10 bg-[#F8FAFC] rounded-3xl"
      >
        <GlassCard 
          onClick={() => onToggle(item.id)}
          onLongPress={() => onEdit(item)}
          className={cn(
            "h-full flex flex-col justify-center p-4 border-l-[6px]",
            item.checked ? "border-l-emerald-400 bg-emerald-50/50" : "border-l-transparent bg-white/70"
          )}
        >
          <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 overflow-hidden pointer-events-none">
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 shadow-sm",
                  item.checked ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-200"
                )}>
                  {item.checked && <Check size={16} className="text-white" strokeWidth={3} />}
                </div>
                
                {item.emoji && (
                   <div className={cn("w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl text-2xl flex-shrink-0 transition-opacity", item.checked && "opacity-50 grayscale")}>
                       {item.emoji}
                   </div>
                )}
                
                <div className={cn("flex-1 min-w-0 transition-all duration-300", item.checked && "opacity-50 grayscale")}>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2 overflow-hidden">
                        <p className="font-bold text-lg truncate leading-tight text-slate-800">{item.name}</p>
                        {item.brand && <span className="text-sm font-medium text-slate-500 truncate italic shrink-0">- {item.brand}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <Badge text={item.category} color="purple" icon={Tag} />
                      <Badge text={item.size} icon={Scale} color="orange" />
                      {item.nutrition && Object.keys(item.nutrition.p100 || {}).length > 0 && (
                          <span onClick={(e) => { e.stopPropagation(); onViewDetails(item); }} className="pointer-events-auto cursor-pointer bg-green-100/80 text-green-700 p-1 rounded-lg">
                             <Leaf size={10}/>
                          </span>
                      )}
                    </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1 pointer-events-auto shrink-0" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onPriceClick(item)} className={cn("font-bold text-lg transition-all px-2 py-1 rounded-lg hover:bg-slate-100/50", item.checked ? "text-emerald-600" : "text-slate-700")}>
                {item.price > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity) : <span className="text-slate-400 text-sm font-medium">R$ --</span>}
              </button>
               <div className="flex items-center gap-2 text-sm text-slate-500 justify-end w-full">
                  <span className="bg-white border border-slate-100 px-2 py-0.5 rounded-md font-medium text-xs shadow-sm">{item.quantity}x</span>
                </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

const detectCategory = (name: string) => {
    const n = name.toLowerCase();
    if (n.match(/arroz|feijão|macarrão|óleo|açúcar|farinha|café/)) return 'Mercearia';
    if (n.match(/leite|queijo|iogurte|manteiga|requeijão/)) return 'Laticínios';
    if (n.match(/carne|frango|bife|peixe|linguiça/)) return 'Açougue';
    if (n.match(/shampoo|sabonete|papel|creme|pasta|desodorante/)) return 'Higiene';
    if (n.match(/detergente|sabão|água sanitária|limpador|bucha/)) return 'Limpeza';
    if (n.match(/banana|maçã|tomate|cebola|batata|cenoura|alface/)) return 'Hortifruti';
    if (n.match(/pão|bolo|biscoito|bolacha/)) return 'Padaria';
    if (n.match(/cerveja|refrigerante|suco|água/)) return 'Bebidas';
    return 'Geral';
};

// --- APP PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState('home'); 
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [savedLists, setSavedLists] = useState<any[]>([]); 
  const [history, setHistory] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]); 
  
  // Inputs
  const [inputName, setInputName] = useState('');
  const [inputBrand, setInputBrand] = useState('');
  const [inputType, setInputType] = useState('');
  const [inputSize, setInputSize] = useState('');
  const [inputPrice, setInputPrice] = useState('');
  const [inputQty, setInputQty] = useState(1);
  const [budget, setBudget] = useState(0); 
  const [listName, setListName] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); 
  
  // States Aux
  const [showNutrition, setShowNutrition] = useState(false);
  const [nutrition, setNutrition] = useState<any>({ p100: {}, portion: {}, vd: {} }); 
  const [sortBy, setSortBy] = useState('alpha'); 
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number|null>(null); 
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [viewingItemDetails, setViewingItemDetails] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [analyticsType, setAnalyticsType] = useState('geral');
  const [analyticsSelection, setAnalyticsSelection] = useState('');

  const [inputEmoji, setInputEmoji] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const onPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64str = reader.result as string;
          setShowScanner(false);
          openInputModal(); // Open modal first
          setIsManualMode(true);
          try {
             // Let user know it's loading (could add a spinner state)
             const res = await fetch('/api/analyze-image', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ imageBase64: base64str })
             });
             const data = await res.json();
             if (data.result) {
                const p = data.result;
                if(p.name) setInputName(p.name);
                if(p.brand) setInputBrand(p.brand);
                if(p.size) setInputSize(p.size);
                if(p.category) setInputType(p.category);
                if(p.emoji) setInputEmoji(p.emoji);
                
                if (p.nutrition) {
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
                  });
                  setShowNutrition(true);
                }
             } else {
                alert("Não foi possível analisar a imagem.");
             }
          } catch(err) {
             console.error(err);
             alert("Erro na análise.");
          }
      };
      reader.readAsDataURL(file);
  };

  const onBarcodeScan = async (barcode: string) => {
      setShowScanner(false);
      try {
          const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
          const data = await res.json();
          if (data.status === 1 && data.product) {
              const p = data.product;
              setInputName(p.product_name || p.product_name_pt || p.generic_name || '');
              setInputBrand(p.brands || '');
              setInputSize(p.quantity || '');
              
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
                  });
              }
              setIsManualMode(true);
              setShowNutrition(true);
          } else {
              alert("Produto não encontrado na base de dados (OpenFoodFacts).");
          }
      } catch (e) {
          console.error(e);
          alert("Erro ao buscar dados do produto.");
      }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u) {
        try {
          const userDocRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
             // Create user profile
             await setDoc(userDocRef, {
               email: u.email,
               budget: 0,
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString()
             });
             // Push local to Firebase as initial data
             const sItems = localStorage.getItem('listou_items');
             const sLists = localStorage.getItem('listou_saved_lists');
             const sHistory = localStorage.getItem('listou_history');
             const sCatalog = localStorage.getItem('listou_catalog');
             
             if (sItems && JSON.parse(sItems).length > 0) {
                 await setDoc(doc(db, 'users', u.uid, 'activeList', 'current'), {
                     userId: u.uid,
                     items: JSON.parse(sItems),
                     createdAt: new Date().toISOString(),
                     updatedAt: new Date().toISOString()
                 });
             }
             
             // More pushes can be done if needed...
          } else {
             setBudget(userDoc.data().budget || 0);
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q1 = query(collection(db, 'users', user.uid, 'catalog'));
    const unsub1 = onSnapshot(q1, (snap) => {
        setCatalog(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, error => handleFirestoreError(error, OperationType.LIST, 'users/catalog'));
    
    const q2 = query(collection(db, 'users', user.uid, 'history'));
    const unsub2 = onSnapshot(q2, (snap) => {
        setHistory(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, error => handleFirestoreError(error, OperationType.LIST, 'users/history'));
    
    const q3 = query(collection(db, 'users', user.uid, 'savedLists'));
    const unsub3 = onSnapshot(q3, (snap) => {
        setSavedLists(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, error => handleFirestoreError(error, OperationType.LIST, 'users/savedLists'));

    const unsub4 = onSnapshot(doc(db, 'users', user.uid, 'activeList', 'current'), (snap) => {
        if (snap.exists()) {
           setActiveItems(snap.data().items || []);
        } else {
           setActiveItems([]);
        }
    }, error => handleFirestoreError(error, OperationType.GET, 'users/activeList'));
    
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
       if (snap.exists() && snap.data().budget) {
          setBudget(snap.data().budget);
       }
    }, error => handleFirestoreError(error, OperationType.GET, 'users'));

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsubUser(); };
  }, [user]);

  useEffect(() => {
    if (!user) {
      const sItems = localStorage.getItem('listou_items');
      const sLists = localStorage.getItem('listou_saved_lists');
      const sHistory = localStorage.getItem('listou_history');
      const sCatalog = localStorage.getItem('listou_catalog');
      const sBudget = localStorage.getItem('listou_budget');
      if (sItems) setActiveItems(JSON.parse(sItems));
      if (sLists) setSavedLists(JSON.parse(sLists));
      if (sHistory) setHistory(JSON.parse(sHistory));
      if (sCatalog) setCatalog(JSON.parse(sCatalog));
      if (sBudget) setBudget(parseFloat(sBudget));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('listou_items', JSON.stringify(activeItems));
      localStorage.setItem('listou_saved_lists', JSON.stringify(savedLists));
      localStorage.setItem('listou_history', JSON.stringify(history));
      localStorage.setItem('listou_catalog', JSON.stringify(catalog));
      localStorage.setItem('listou_budget', budget.toString());
    }
  }, [activeItems, savedLists, history, catalog, budget, user]);

  const saveActiveItemsToFirebase = async (newItems: any[]) => {
      if (!user) return;
      try {
          await setDoc(doc(db, 'users', user.uid, 'activeList', 'current'), {
              userId: user.uid,
              items: newItems,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
          });
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'users/activeList'); }
  };
  
  const saveCatalogToFirebase = async (item: any) => {
      if (!user) return;
      try {
          await setDoc(doc(db, 'users', user.uid, 'catalog', item.id.toString()), {
              userId: user.uid,
              ...item,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
          });
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'users/catalog'); }
  };

  const deleteFromCatalogFirebase = async (id: number) => {
      if (!user) return;
      try {
          await deleteDoc(doc(db, 'users', user.uid, 'catalog', id.toString()));
      } catch(e) { handleFirestoreError(e, OperationType.DELETE, 'users/catalog'); }
  };

  useEffect(() => {
    if (inputName.trim().length > 1 && !isManualMode) {
       const matched = catalog.filter(p => p.name.toLowerCase().includes(inputName.toLowerCase())).slice(0, 3);
       setSuggestions(matched);
    } else setSuggestions([]);
  }, [inputName, catalog, isManualMode]);

  const updateActiveItems = (newOrFn: any) => {
      setActiveItems(prev => {
          const next = typeof newOrFn === 'function' ? newOrFn(prev) : newOrFn;
          if (user) {
              setDoc(doc(db, 'users', user.uid, 'activeList', 'current'), {
                  userId: user.uid,
                  items: next,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
              }).catch(e => console.error(e));
          }
          return next;
      });
  };

  const updateCatalog = (newOrFn: any) => {
      setCatalog(prev => {
          const next = typeof newOrFn === 'function' ? newOrFn(prev) : newOrFn;
          if (user) {
              // Only update latest changes. For full sync we might need a robust diff, but here it's fine 
              // wait, doing batch might be heavy, we'll rely on explicitly adding/removing.
          }
          return next;
      });
  };

  const updateHistory = (newOrFn: any, addedItem?: any) => {
      setHistory(prev => {
          const next = typeof newOrFn === 'function' ? newOrFn(prev) : newOrFn;
          if (user && addedItem) {
             setDoc(doc(db, 'users', user.uid, 'history', addedItem.id.toString()), {
                userId: user.uid,
                ...addedItem,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
             }).catch(e => console.error(e));
          }
          return next;
      });
  };
  
  const updateSavedLists = (newOrFn: any, addedItem?: any) => {
      setSavedLists(prev => {
          const next = typeof newOrFn === 'function' ? newOrFn(prev) : newOrFn;
          if (user && addedItem) {
             setDoc(doc(db, 'users', user.uid, 'savedLists', addedItem.id.toString()), {
                userId: user.uid,
                ...addedItem,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
             }).catch(e => console.error(e));
          }
           return next;
      });
  };

  const calculateCartTotal = (list: any[]) => list.filter(i => i.checked).reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const calculateFullTotal = (list: any[]) => list.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const getLastPrice = (name: string) => catalog.find(c => c.name.toLowerCase() === name.toLowerCase())?.lastPrice;

  const sortItems = (items: any[]) => {
      let sorted = [...items];
      if (sortBy === 'alpha') sorted.sort((a, b) => a.name.localeCompare(b.name));
      if (sortBy === 'brand') sorted.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
      if (sortBy === 'category') sorted.sort((a, b) => (a.category || 'Geral').localeCompare(b.category || 'Geral'));
      if (sortBy === 'price') sorted.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
      return sorted;
  };

  const handleShareList = () => {
      const text = activeItems.map(i => `${i.checked ? '✅' : '⬜'} ${i.quantity}x ${i.name} ${i.brand ? '- ' + i.brand : ''}`).join('\n');
      const header = `🛒 Minha Lista de Compras - Listou\nTotal Estimado: ${formatCurrency(calculateFullTotal(activeItems))}\n\n`;
      navigator.clipboard.writeText(header + text).then(() => {
         alert("Lista copiada para a área de transferência!");
      }).catch(() => alert("Erro ao copiar."));
  };

  const handleKeypadPress = (val: any) => {
    if (val === 'del') {
      setInputPrice(prev => prev.slice(0, -1) || '');
    } else if (val === '.') { 
      if (!inputPrice.includes('.')) setInputPrice(prev => (prev === '' ? '0.' : prev + '.')); 
    } else {
      setInputPrice(prev => {
        if (prev === '0' && val !== '.') return String(val);
        if (prev.includes('.')) {
          const [, dec] = prev.split('.');
          if (dec && dec.length >= 2) return prev;
        }
        return prev + val;
      });
    }
  };

  const selectSuggestion = (sug: any) => {
    setInputName(sug.name);
    setInputBrand(sug.brand || '');
    setInputSize(sug.size || '');
    if (sug.lastPrice) setInputPrice(sug.lastPrice.toString());
    setSuggestions([]);
  };

  const parseInput = (text: string) => {
      let parsed = { name: text, brand: '', type: '', size: '' };
      
      const sizePattern = /\b(?:de\s+|com\s+)?(\d+[\.,]?\d*\s*(?:kg|g|mg|l|ml|un|pcts?|cxs?|caixas?|pacotes?|rolo|rolos|unidade|unidades|folhas?|m|cm|mm))\b/ig;
      const sizeMatches = Array.from(text.matchAll(sizePattern));
      
      if (sizeMatches && sizeMatches.length > 0) {
          parsed.size = sizeMatches.map(m => m[1]).join(', ').toUpperCase();
          sizeMatches.forEach(m => {
              parsed.name = parsed.name.replace(m[0], ' ');
          });
      }

      const commonBrands = ['camil', 'neve', 'ypê', 'ype', 'omo', 'nestlé', 'nestle', 'garoto', 'lacta', 'bauducco', 'sazon', 'maggi', 'sadia', 'perdigão', 'perdigao', 'seara', 'friboi', 'aurora', 'elegê', 'elege', 'parmalat', 'itambé', 'itambe', 'vigor', 'danone', 'batavo', 'piracanjuba', 'coca-cola', 'coca', 'pepsi', 'guaraná', 'guarana', 'fanta', 'sprite', 'sukita', 'schin', 'brahma', 'skol', 'antarctica', 'heineken', 'amstel', 'itaipava', 'qualitá', 'qualita', 'carrefour', 'extra', 'tixan', 'brilhante', 'ariel', 'downy', 'comfort', 'fofo', 'limpol', 'minuano', 'bombril', 'assolan', 'veja', 'cif', 'ajax', 'lysol', 'pinho sol', 'raid', 'sbp', 'baygon', 'pampers', 'huggies', 'cremer', 'personal', 'chamex', 'bic', 'colgate', 'sorriso', 'close up', 'oral-b', 'sensodyne', 'listerine', 'rexona', 'dove', 'nivea', 'suave', 'seda', 'pantene', 'gillette', 'palmolive', 'lux', 'francis', 'phebo', 'granado', 'hellmanns', 'heinz', 'quero', 'cepêra', 'fugini', 'cica', 'elefante', 'gallo', 'andorinha', 'soya', 'liza', 'primor', 'delícia', 'qualy', 'claybom', 'doriana', 'zero cal', 'linea', 'adria', 'piraquê', 'elma chips', 'ruffles', 'doritos', 'kelloggs', 'sucrilhos', 'nescau', 'toddy', 'pilão', 'melitta', 'três corações', 'suvinil', 'coral'];
      const currentBrands = catalog.map(c => c.brand).filter(Boolean).map(b => b?.toLowerCase());
      const knownBrands = new Set([...commonBrands, ...currentBrands]);
      
      const parts = parsed.name.split(/[-,\. ]+/).map(s => s.trim()).filter(Boolean);
      let nameParts: string[] = [];
      let foundBrand = '';
      
      parts.forEach((part) => {
          if (!foundBrand && knownBrands.has(part.toLowerCase())) {
              foundBrand = part;
          } else {
              nameParts.push(part);
          }
      });
      
      if (foundBrand) parsed.brand = foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1);
      parsed.name = nameParts.join(' ').replace(/\s+/g, ' ').trim();
      
      return parsed;
  };

  const confirmItem = () => {
    const finalPrice = parseFloat(inputPrice) || 0;
    let cleanName = inputName.trim();
    let cleanBrand = inputBrand.trim();
    let cleanType = inputType.trim();
    let cleanSize = inputSize.trim();

    if (!isManualMode && cleanName) {
        const parsed = parseInput(cleanName);
        if (parsed.name) cleanName = parsed.name; // Keep user input if parser strips too much
        if (parsed.brand) cleanBrand = parsed.brand;
        if (parsed.type) cleanType = parsed.type;
        if (parsed.size) cleanSize = parsed.size;
    }

    if (!cleanName) return;
    const finalCategory = (isManualMode && inputType.trim()) ? inputType.trim() : detectCategory(cleanName);
    
    // Atualiza Catálogo
    let newCatalog = [...catalog];
    const catIndex = newCatalog.findIndex(c => 
      c.id === editingItemId || c.name.toLowerCase() === cleanName.toLowerCase()
    );
    
    const newItemData = { 
        name: cleanName, brand: cleanBrand, type: cleanType, size: cleanSize, category: finalCategory, emoji: inputEmoji,
        lastPrice: finalPrice > 0 ? finalPrice : (catIndex >= 0 ? newCatalog[catIndex].lastPrice : 0),
        nutrition: nutrition 
    };

    if (catIndex >= 0) newCatalog[catIndex] = { ...newCatalog[catIndex], ...newItemData };
    else newCatalog.push({ id: Date.now(), ...newItemData });
    setCatalog(newCatalog);
    
    // Save explicitly to Catalog
    const savedCatItem = catIndex >= 0 ? newCatalog[catIndex] : newCatalog[newCatalog.length - 1];
    saveCatalogToFirebase(savedCatItem);

    if (view !== 'catalog') {
        const itemPayload: any = {
            id: editingItemId || Date.now(),
            name: cleanName, brand: cleanBrand, type: cleanType, size: cleanSize, category: finalCategory, emoji: inputEmoji,
            quantity: inputQty, price: finalPrice, 
            checked: editingItemId ? activeItems.find(i => i.id === editingItemId)?.checked || false : true,
            nutrition: nutrition
        };
        if (editingItemId) {
            updateActiveItems(activeItems.map(i => i.id === editingItemId ? itemPayload : i));
        } else {
            updateActiveItems((prev: any[]) => [...prev, itemPayload]);
        }
    }

    resetInputs();
  };

  const closeInputModal = () => {
    setShowInputModal(false);
    resetInputs();
    if(window.history.state?.modal) window.history.back();
  };

  const handleSetView = (v: string) => {
      setShowInputModal(false);
      setShowScanner(false);
      setShowKeypad(false);
      resetInputs();
      setView(v);
  };

  const openInputModal = () => {
    window.history.pushState({ modal: true }, '');
    resetInputs();
    setShowInputModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  useEffect(() => {
     window.scrollTo({ top: 0, behavior: 'smooth' });
     setShowInputModal(false);
     setShowScanner(false);
     setShowKeypad(false);
     resetInputs();
  }, [view]);

  useEffect(() => {
     const onPopState = (e: PopStateEvent) => {
         if (showInputModal || showScanner || showBudgetModal || viewingItemDetails) {
            setShowInputModal(false);
            setShowScanner(false);
            setShowBudgetModal(false);
            setViewingItemDetails(null);
            resetInputs();
         } else if (view !== 'home' && view !== 'shopping' && view !== 'catalog') {
            setView('home');
         }
     };
     window.addEventListener('popstate', onPopState);
     return () => window.removeEventListener('popstate', onPopState);
  }, [showInputModal, showScanner, showBudgetModal, viewingItemDetails, view]);

  const resetInputs = () => {
    setInputName(''); setInputBrand(''); setInputType(''); setInputSize('');
    setInputQty(1); setInputPrice(''); setNutrition({ p100: {}, portion: {}, vd: {} }); setInputEmoji('');
    setShowNutrition(false); setIsManualMode(false); setShowKeypad(false); setShowInputModal(false);
    setEditingItemId(null); setShowScanner(false);
  };

  const openForEdit = (item: any, isCatalogMode = false) => {
    window.history.pushState({ modal: true }, '');
    resetInputs();
    setTimeout(() => {
        setEditingItemId(item.id);
        setInputName(item.name);
        setInputBrand(item.brand || '');
        setInputType(item.type || '');
        setInputSize(item.size || '');
        setInputEmoji(item.emoji || '');
        setNutrition(item.nutrition || { p100: {}, portion: {}, vd: {} });
        
        if (isCatalogMode) {
            setInputPrice(item.lastPrice ? item.lastPrice.toString() : '');
            setInputQty(1); 
        } else {
            setInputQty(item.quantity);
            setInputPrice(item.price ? item.price.toString() : '');
        }
        
        if (item.brand || item.type || item.size || (item.nutrition && Object.keys(item.nutrition.p100 || {}).length > 0)) {
            setIsManualMode(true);
        }
        setShowInputModal(true);
    }, 50);
  };

  const finishShopping = () => {
    if (activeItems.filter(i => i.checked).length === 0 && activeItems.length > 0) {
        alert("Marque itens no carrinho primeiro.");
        return;
    }
    setView('finish-save');
  };

  const saveAndClose = (shouldSaveList: boolean) => {
    const cartItems = activeItems.filter(i => i.checked);
    if (cartItems.length > 0) {
        const purchase = { id: Date.now(), date: new Date().toISOString(), items: [...cartItems], total: calculateCartTotal(activeItems) };
        updateHistory((prev: any[]) => [...prev, purchase], purchase);
    }
    if (shouldSaveList && listName.trim()) {
      const newList = { id: Date.now(), name: listName, items: activeItems.map(i => ({ ...i, checked: false })) };
      updateSavedLists((prev: any[]) => [...prev, newList], newList);
    }
    updateActiveItems([]); setListName(''); setView('success');
    setTimeout(() => setView('home'), 2000);
  };

  const deleteFromCatalog = (id: number) => {
     if(window.confirm('Excluir do catálogo?')) {
        setCatalog(catalog.filter(c => c.id !== id));
        deleteFromCatalogFirebase(id);
     }
  };

  // --- RENDERS ---

  const renderHome = () => {
    const totalSpent = history.reduce((acc, h) => acc + h.total, 0);
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col pt-12 px-6 pb-24 overflow-y-auto space-y-6">
         <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0 transform -rotate-6">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                   <path d="M4 6h16M4 12h16M4 18h7" />
                   <path d="M14 15l3 3 4-4" />
                 </svg>
              </div>
              <div>
                <h1 className="text-5xl font-black text-slate-800 tracking-tighter flex items-center gap-1">
                   Listou<span className="text-emerald-500">.</span>
                </h1>
                <p className="text-slate-400 font-medium ml-1">Organize, economize, repita.</p>
              </div>
             </div>
            <div className="flex flex-col items-end gap-2">
               {user ? (
                   <button onClick={() => signOut(auth)} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors">
                     <LogOut size={12}/> Sair
                   </button>
               ) : (
                   <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-emerald-200 transition-colors">
                     <LogIn size={12}/> Entrar (Sincronizar)
                   </button>
               )}
            </div>
         </div>

         <GlassCard onClick={() => { setView('shopping'); }} className="p-8 min-h-[220px] flex flex-col justify-between group border-white/50 bg-gradient-to-br from-white/80 to-emerald-50/20">
             <div className="absolute right-[-40px] top-[-40px] w-64 h-64 bg-emerald-300/20 rounded-full blur-[80px] group-hover:bg-emerald-300/30 transition-all duration-700"></div>
             <div className="relative z-10 flex justify-between items-start">
                <div className="bg-white/80 backdrop-blur-sm w-fit p-4 rounded-2xl shadow-sm text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                   <Plus size={32} strokeWidth={3} />
                </div>
                <div className="bg-emerald-100/50 px-3 py-1 rounded-full text-emerald-700 text-xs font-bold border border-emerald-200/50">Modo Rápido</div>
             </div>
             <div className="relative z-10">
                <h3 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Nova Compra</h3>
                <p className="text-slate-500 font-medium leading-relaxed w-full pr-4">{activeItems.length > 0 ? 'Continuar lista em andamento.' : 'Crie uma lista inteligente do zero e controle seus gastos.'}</p>
             </div>
         </GlassCard>

         <div className="grid grid-cols-2 gap-4">
            <GlassCard onClick={() => setView('catalog')} className="p-6 flex flex-col justify-between h-44 hover:bg-orange-50/30 transition-colors">
               <div className="bg-orange-100/80 text-orange-600 w-fit p-3 rounded-2xl mb-4"><Package size={24} /></div>
               <div><span className="block text-4xl font-bold text-slate-800 mb-1 tracking-tighter">{catalog.length}</span><span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Meus Produtos</span></div>
            </GlassCard>
            <GlassCard onClick={() => setView('saved-lists')} className="p-6 flex flex-col justify-between h-44 hover:bg-purple-50/30 transition-colors">
               <div className="bg-purple-100/80 text-purple-600 w-fit p-3 rounded-2xl mb-4"><List size={24} /></div>
               <div><span className="block text-4xl font-bold text-slate-800 mb-1 tracking-tighter">{savedLists.length}</span><span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Modelos Prontos</span></div>
            </GlassCard>
            <GlassCard onClick={() => setView('analytics')} className="p-6 flex flex-col justify-between h-44 hover:bg-blue-50/30 transition-colors col-span-2">
               <div className="flex justify-between items-start"><div className="bg-blue-100/80 text-blue-600 w-fit p-3 rounded-2xl"><BarChart3 size={24} /></div><div className="bg-blue-50 px-3 py-1 rounded-lg text-blue-600 text-xs font-bold flex items-center gap-1"><TrendingUp size={12}/> Análise</div></div>
               <div><span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Acumulado</span><span className="block text-3xl font-black text-slate-800 leading-tight tracking-tight">{formatCurrency(totalSpent)}</span></div>
            </GlassCard>
         </div>
      </motion.div>
    );
  };

  const renderShopping = () => {
    const cartTotal = calculateCartTotal(activeItems);
    const fullTotal = calculateFullTotal(activeItems);
    const sortedItems = sortItems(activeItems);
    const cartItems = sortedItems.filter(i => i.checked);
    const pendingItems = sortedItems.filter(i => !i.checked);
    const progress = budget > 0 ? Math.min((cartTotal / budget) * 100, 100) : 0;
    const isOverBudget = budget > 0 && cartTotal > budget;

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
         <div className="flex-shrink-0 z-20 bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-sm relative pt-12 pb-2 px-6">
             <div className="flex items-start justify-between mb-4">
                <button onClick={() => setView('home')} className="p-3 -ml-3 hover:bg-white/50 rounded-full text-slate-600 transition-colors"><Home size={26} /></button>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Total Carrinho</span>
                   <div className="flex items-baseline gap-2"><span className={cn("text-4xl font-black tracking-tighter", isOverBudget ? "text-red-500" : "text-emerald-600")}>{formatCurrency(cartTotal)}</span></div>
                   {budget > 0 && <div className="flex items-center gap-1 mt-1 text-xs font-medium text-slate-400"><Wallet size={10} /> Meta: {formatCurrency(budget)}</div>}
                </div>
             </div>
             {budget > 0 && <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden"><div className={cn("h-full transition-all duration-500", isOverBudget ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${progress}%` }} /></div>}
             <div className="flex justify-between items-center relative">
                 <div className="flex gap-2 relative">
                     <button onClick={() => setShowFilterMenu(!showFilterMenu)} className={cn("text-xs font-bold px-4 py-2 rounded-xl border flex items-center gap-2 transition-all", showFilterMenu ? "bg-slate-800 text-white" : "bg-white/60 text-slate-600 hover:bg-white")}>
                         <Filter size={14} /> {sortBy === 'alpha' ? 'A-Z' : sortBy === 'brand' ? 'Marca' : sortBy === 'category' ? 'Categ' : 'Preço'} <ChevronDown size={12} />
                     </button>
                     <button onClick={() => setShowBudgetModal(true)} className="p-2 bg-white/60 rounded-xl border border-slate-200/50 text-slate-600 hover:bg-white"><Wallet size={18} /></button>
                     {showFilterMenu && (
                         <div className="absolute top-12 left-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 w-48 z-50">
                             <p className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Ordenar por</p>
                             <button onClick={() => { setSortBy('alpha'); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50/50 rounded-xl flex gap-2"><SortAsc size={14}/> A-Z</button>
                             <button onClick={() => { setSortBy('brand'); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50/50 rounded-xl flex gap-2"><Tag size={14}/> Marca</button>
                             <button onClick={() => { setSortBy('category'); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50/50 rounded-xl flex gap-2"><List size={14}/> Categoria</button>
                             <button onClick={() => { setSortBy('price'); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50/50 rounded-xl flex gap-2"><TrendingDown size={14}/> Preço</button>
                         </div>
                     )}
                     {showFilterMenu && <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />}
                 </div>
                 <div className="flex gap-2 items-center">
                     <span className="text-xs font-medium text-slate-400 min-w-max mr-1">Prev: {formatCurrency(fullTotal)}</span>
                     <button onClick={() => { if(window.confirm('Esvaziar carrinho inteiro?')) updateActiveItems([]); }} 
                             className="p-2 bg-white/60 rounded-xl border border-red-100 text-red-500 hover:bg-red-50" title="Apagar tudo">
                        <Trash2 size={16} />
                     </button>
                 </div>
             </div>
         </div>

         <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 pb-40 space-y-6 relative">
            <AnimatePresence>
                {activeItems.length === 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center pt-20 text-slate-400 opacity-60">
                      <div className="bg-white p-6 rounded-full mb-4 shadow-sm"><ShoppingBag size={48} className="text-slate-300" /></div>
                      <p className="font-bold text-lg">Carrinho vazio</p><p className="text-sm">Comece a adicionar itens</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {pendingItems.length > 0 && (
                   <motion.div layout className="space-y-6">
                      {sortBy === 'category' ? (
                          Object.entries(pendingItems.reduce((acc: any, item: any) => {
                              const cat = item.category || 'Geral';
                              if (!acc[cat]) acc[cat] = [];
                              acc[cat].push(item);
                              return acc;
                          }, {})).sort((a: any, b: any) => a[0].localeCompare(b[0])).map(([cat, items]: any) => (
                              <div key={cat} className="space-y-2">
                                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">{cat} ({(items as any[]).length})</h3>
                                  <AnimatePresence>
                                      {(items as any[]).map((item: any) => (
                                         <SwipeableItem key={item.id} item={item} lastPrice={getLastPrice(item.name)} onToggle={(id: number) => updateActiveItems((items: any[]) => items.map(i => i.id === id ? { ...i, checked: !i.checked } : i))} onPriceClick={(i: any) => openForEdit(i, false)} onEdit={(i: any) => openForEdit(i, false)} onDelete={(id: number) => updateActiveItems((items: any[]) => items.filter(i => i.id !== id))} onViewDetails={(i: any) => setViewingItemDetails(i)} />
                                      ))}
                                  </AnimatePresence>
                              </div>
                          ))
                      ) : (
                          <div className="space-y-2">
                             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Pendente ({pendingItems.length})</h3>
                             <AnimatePresence>
                                 {pendingItems.map((item) => (
                                    <SwipeableItem key={item.id} item={item} lastPrice={getLastPrice(item.name)} onToggle={(id: number) => updateActiveItems((items: any[]) => items.map(i => i.id === id ? { ...i, checked: !i.checked } : i))} onPriceClick={(i: any) => openForEdit(i, false)} onEdit={(i: any) => openForEdit(i, false)} onDelete={(id: number) => updateActiveItems((items: any[]) => items.filter(i => i.id !== id))} onViewDetails={(i: any) => setViewingItemDetails(i)} />
                                 ))}
                             </AnimatePresence>
                          </div>
                      )}
                   </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {cartItems.length > 0 && (
                   <motion.div layout className="space-y-2 pt-4">
                       <div className="flex items-center gap-2 mb-3 ml-1 opacity-80"><div className="h-[1px] flex-1 bg-emerald-200/50"></div><span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1"><Check size={10} /> Concluídos ({cartItems.length})</span><div className="h-[1px] flex-1 bg-emerald-200/50"></div></div>
                       <AnimatePresence>
                           {cartItems.map((item) => (
                              <SwipeableItem key={item.id} item={item} lastPrice={getLastPrice(item.name)} onToggle={(id: number) => updateActiveItems((items: any[]) => items.map(i => i.id === id ? { ...i, checked: !i.checked } : i))} onPriceClick={(i: any) => openForEdit(i, false)} onEdit={(i: any) => openForEdit(i, false)} onDelete={(id: number) => updateActiveItems((items: any[]) => items.filter(i => i.id !== id))} onViewDetails={(i: any) => setViewingItemDetails(i)} />
                           ))}
                       </AnimatePresence>
                   </motion.div>
                )}
            </AnimatePresence>
         </div>

         <div className={cn("absolute bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-white via-white/95 to-transparent z-30 transition-all duration-300", showInputModal ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100")}>
            <div className="flex items-end justify-between gap-4">
                <div className="pointer-events-auto flex-1">
                   {activeItems.filter(i => i.checked).length > 0 && (<GlassButton onClick={finishShopping} className="w-full">Finalizar <ArrowRight size={18} /></GlassButton>)}
                </div>
                <motion.button 
                   whileTap={{ scale: 0.9 }} 
                   onClick={() => { openInputModal(); }} 
                   className="pointer-events-auto h-16 w-16 bg-emerald-500 text-white rounded-2xl shadow-emerald-500/40 shadow-xl flex items-center justify-center hover:scale-105 transition-all shrink-0"
                >
                    <Plus size={32} strokeWidth={3} />
                </motion.button>
            </div>
         </div>
         {showInputModal && <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 transition-opacity duration-300" onClick={closeInputModal} />}
         
         {showBudgetModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl relative">
                    <button onClick={() => setShowBudgetModal(false)} className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X size={18}/></button>
                    <h3 className="font-bold text-lg mb-4">Definir Orçamento</h3>
                    <input type="number" placeholder="0.00" className="w-full text-4xl font-black text-center border-b-2 border-slate-100 pb-2 mb-6 outline-none focus:border-emerald-500" value={budget || ''} onChange={e => setBudget(parseFloat(e.target.value) || 0)} />
                    <GlassButton onClick={() => setShowBudgetModal(false)} className="w-full">Salvar Meta</GlassButton>
                </motion.div>
            </div>
         )}
      </motion.div>
    );
  };

  const renderCatalog = () => {
    const sortedCatalog = sortItems(catalog);
    const filteredCatalog = sortedCatalog.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
            <div className="flex-shrink-0 z-20 bg-white/90 backdrop-blur-md pt-12 px-6 pb-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4"><button onClick={() => setView('home')} className="p-3 bg-white rounded-full shadow-sm text-slate-600 border border-slate-100"><ArrowLeft size={20}/></button><h2 className="text-3xl font-bold text-slate-800 tracking-tight">Catálogo</h2></div>
                    <div className="relative">
                         <button onClick={() => setShowFilterMenu(!showFilterMenu)} className={cn("p-2 rounded-xl border transition-all", showFilterMenu ? "bg-slate-800 text-white" : "bg-white text-slate-500")}><Filter size={20} /></button>
                         {showFilterMenu && (<div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 w-40 z-30"><button onClick={() => { setSortBy('alpha'); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl">A-Z</button><button onClick={() => { setSortBy('brand'); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl">Marca</button><button onClick={() => { setSortBy('category'); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl">Categoria</button></div>)}
                         {showFilterMenu && <div className="fixed inset-0 z-20" onClick={() => setShowFilterMenu(false)} />}
                    </div>
                </div>
                <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="text" placeholder="Buscar produto..." className="w-full bg-white border border-slate-200 pl-12 pr-4 py-4 rounded-2xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all focus:shadow-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            </div>
            <div className="flex-1 overflow-y-auto pb-32 px-6 pt-6 space-y-3">
                {filteredCatalog.length === 0 ? (<div className="text-center py-20 opacity-50"><Package size={48} className="mx-auto mb-4 text-slate-300" /><p className="text-slate-400">Nenhum produto encontrado.</p></div>) : (
                    filteredCatalog.map(item => (
                        <GlassCard key={item.id} onLongPress={() => openForEdit(item, true)} className="p-4 flex items-center justify-between group bg-white shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xl shrink-0">{item.name.charAt(0).toUpperCase()}</div>
                                <div className="min-w-0"><p className="font-bold text-slate-800 truncate text-lg">{item.name}</p><div className="flex flex-wrap gap-1 mt-1"><Badge text={item.category} color="purple" icon={Tag}/><Badge text={item.brand} color="blue" /><Badge text={item.size} icon={Scale} color="orange" /></div></div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0"><button onClick={() => openForEdit(item, true)} className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-colors"><Edit3 size={20} /></button><button onClick={() => deleteFromCatalog(item.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><Trash2 size={20} /></button></div>
                        </GlassCard>
                    ))
                )}
            </div>
            <div className="absolute bottom-8 right-6 z-30"><motion.button whileTap={{scale: 0.9}} onClick={() => openInputModal()} className="h-16 w-16 bg-orange-500 text-white rounded-2xl shadow-orange-500/40 shadow-xl flex items-center justify-center active:scale-90 hover:scale-105 transition-all"><Plus size={32} strokeWidth={3} /></motion.button></div>
        </motion.div>
    );
  };

  const renderSavedListsView = () => (
     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
        <div className="flex-shrink-0 z-20 bg-white/90 backdrop-blur-md pt-12 px-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4"><button onClick={() => setView('home')} className="p-3 bg-white rounded-full shadow-sm text-slate-600 border border-slate-100"><ArrowLeft size={20}/></button><h2 className="text-3xl font-bold text-slate-800 tracking-tight">Modelos</h2></div>
        </div>
        <div className="flex-1 overflow-y-auto pb-10 px-6 pt-6 space-y-4">
            {savedLists.length === 0 ? <p className="text-slate-400 text-center mt-10">Nenhum modelo salvo.</p> : 
                savedLists.map(list => (
                <GlassCard key={list.id} onClick={() => { updateActiveItems(list.items.map((i: any) => ({...i, id: Date.now()+Math.random(), checked: false}))); setView('shopping'); }} className="p-6 mb-4 flex justify-between items-center group bg-white shadow-sm">
                    <div><h3 className="font-bold text-xl text-slate-800">{list.name}</h3><p className="text-slate-400 mt-1">{list.items.length} itens salvos</p></div>
                    <div className="bg-purple-50 text-purple-600 p-3 rounded-2xl group-hover:bg-purple-100 transition-colors"><ArrowRight size={20}/></div>
                </GlassCard>
            ))}
        </div>
     </motion.div>
  );

  const renderFinishSave = () => {
    const cartTotal = calculateCartTotal(activeItems);
    const boughtItems = activeItems.filter(i => i.checked);
    let savings = 0; let comparisonAvailable = false; let expensive = false;
    boughtItems.forEach(item => { const prevPrice = getLastPrice(item.name); if (prevPrice && prevPrice > 0) { comparisonAvailable = true; savings += (prevPrice - item.price) * item.quantity; } });
    expensive = savings < 0;

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
           <div className="flex-1 overflow-y-auto p-6 pt-24 flex flex-col justify-start">
               <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center p-6 bg-emerald-100 text-emerald-600 rounded-3xl mb-6 shadow-emerald-200 shadow-2xl"><Sparkles size={40} fill="currentColor" /></div>
                  <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Compra Finalizada!</h2>
                  <div className="my-8 relative"><p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Total Pago</p><p className="text-7xl font-black text-slate-900 tracking-tighter">{formatCurrency(cartTotal)}</p><p className="text-sm font-medium text-slate-400 mt-2 bg-slate-100 w-fit mx-auto px-3 py-1 rounded-full">{boughtItems.length} itens no carrinho</p></div>
                  {comparisonAvailable && (<div className={cn("p-4 rounded-3xl border flex items-center justify-center gap-4 mb-6", expensive ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-600")}><div className={cn("p-2 rounded-full", expensive ? "bg-red-100" : "bg-emerald-100")}>{expensive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}</div><div className="text-left"><p className="font-bold leading-none text-lg">{expensive ? 'Mais caro que o habitual' : 'Economia nesta compra!'}</p><p className="text-sm opacity-80 mt-1">Diferença de {formatCurrency(Math.abs(savings))}</p></div></div>)}
               </div>
               <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white mb-24">
                  <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center gap-3"><div className="bg-purple-100 p-2 rounded-xl text-purple-600"><Save size={20}/></div>Salvar Modelo?</h3>
                  <p className="text-slate-500 mb-6 leading-relaxed">Gostaria de salvar os itens desta compra como um modelo para usar depois?</p>
                  <input type="text" placeholder="Nome da Lista (ex: Feira Semanal)" className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg" value={listName} onChange={e => setListName(e.target.value)} />
                  <GlassButton variant={listName.trim() ? "primary" : "secondary"} disabled={!listName.trim()} onClick={() => saveAndClose(true)} className="w-full mb-3 shadow-xl">Salvar Lista e Sair</GlassButton>
                  <button onClick={() => saveAndClose(false)} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors">Não salvar modelo, apenas sair</button>
               </div>
           </div>
        </motion.div>
      );
  };

  const renderSuccess = () => <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center"><div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-8 shadow-2xl shadow-emerald-500/40"><Check size={64} strokeWidth={4} /></div><h2 className="text-3xl font-black text-slate-800">Tudo Pronto!</h2></motion.div>;
  
  const renderAnalyticsView = () => {
    const allItems = history.flatMap(h => h.items);
    const uniqueCategories = Array.from(new Set(allItems.map(i => i.category || 'Outros'))).sort();
    const uniqueProducts = Array.from(new Set(allItems.map(i => i.name))).sort();
    const uniqueBrands = Array.from(new Set(allItems.map(i => i.brand).filter(b => b))).sort();

    let filteredItems = allItems;
    let title = "Gasto Histórico Total";
    let chartTitle = "Últimas Compras";

    if (analyticsType === 'categoria' && analyticsSelection) {
        filteredItems = allItems.filter(i => (i.category || 'Outros') === analyticsSelection);
        title = `Gasto: ${analyticsSelection}`;
        chartTitle = `Variação Ref. Categoria`;
    } else if (analyticsType === 'produto' && analyticsSelection) {
        filteredItems = allItems.filter(i => i.name === analyticsSelection);
        title = `Gasto: ${analyticsSelection}`;
        chartTitle = `Variação do Preço Unitário`;
    } else if (analyticsType === 'marca' && analyticsSelection) {
        filteredItems = allItems.filter(i => i.brand === analyticsSelection);
        title = `Gasto: ${analyticsSelection}`;
        chartTitle = `Gastos com a Marca`;
    }

    const totalSpent = filteredItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    let chartData: any[] = [];
    if (analyticsType === 'geral') {
        const histTotal = history.reduce((acc, h) => acc + h.total, 0); // show all
        chartData = history.slice(-7).map(h => {
             const dateObj = new Date(h.date);
             return { name: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`, valor: h.total };
        });
    } else if (analyticsType === 'produto' && analyticsSelection) {
        history.forEach(h => {
            const item = h.items.find(i => i.name === analyticsSelection);
            if (item) {
                const dateObj = new Date(h.date);
                chartData.push({ name: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`, valor: item.price });
            }
        });
    } else {
        history.forEach(h => {
            const sum = h.items.filter(i => 
                (analyticsType === 'categoria' ? (i.category || 'Outros') === analyticsSelection : false) ||
                (analyticsType === 'marca' ? i.brand === analyticsSelection : false)
            ).reduce((acc, i) => acc + (i.price * i.quantity), 0);
            
            if (sum > 0) {
                 const dateObj = new Date(h.date);
                 chartData.push({ name: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`, valor: sum });
            }
        });
    }

    const categoryData = filteredItems.reduce((acc: any, item: any) => {
        const cat = item.category || 'Outros';
        acc[cat] = (acc[cat] || 0) + (item.price * item.quantity);
        return acc;
    }, {});
    
    const pieData = Object.keys(categoryData).map(k => ({ name: k, value: categoryData[k] })).sort((a,b) => b.value - a.value);

    let selectorOptions: string[] = [];
    if (analyticsType === 'categoria') selectorOptions = uniqueCategories as string[];
    if (analyticsType === 'produto') selectorOptions = uniqueProducts as string[];
    if (analyticsType === 'marca') selectorOptions = uniqueBrands as string[];

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
            <div className="flex-shrink-0 z-20 bg-white/90 backdrop-blur-md pt-12 px-6 pb-6 border-b border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('home')} className="p-3 bg-white rounded-full shadow-sm text-slate-600 border border-slate-100 hover:bg-slate-50">
                        <ArrowLeft size={20}/>
                    </button>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Análise</h2>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {['geral', 'categoria', 'produto', 'marca'].map(type => (
                        <button key={type} onClick={() => { setAnalyticsType(type); setAnalyticsSelection(''); }}
                            className={cn("px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors", analyticsType === type ? "bg-emerald-500 text-white" : "bg-white text-slate-500 border border-slate-200")}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>

                {analyticsType !== 'geral' && (
                    <div className="bg-white p-2 rounded-2xl border border-slate-200 focus-within:ring-2 ring-emerald-500/20">
                        <select 
                             className="w-full bg-transparent outline-none font-bold text-slate-700 p-2"
                             value={analyticsSelection}
                             onChange={e => setAnalyticsSelection(e.target.value)}
                        >
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
                                        <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                    <RechartsTooltip 
                                      formatter={(value: number) => [formatCurrency(value), analyticsType === 'produto' ? 'Preço' : 'Total']}
                                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} 
                                    />
                                    <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
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
                                 const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
                                 const pct = Math.round((d.value / total) * 100);
                                 return (
                                     <div key={i}>
                                         <div className="flex justify-between items-end mb-1 text-sm">
                                             <span className="font-bold text-slate-700">{d.name}</span>
                                             <span className="font-medium text-slate-500">{formatCurrency(d.value)} ({pct}%)</span>
                                         </div>
                                         <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                             <div className="h-full bg-indigo-500 rounded-full" style={{width: `${pct}%`}}></div>
                                         </div>
                                     </div>
                                 )
                             })}
                         </div>
                     </div>
                )}
            </div>
        </motion.div>
    );
  };

  const NutriInput = ({ label, field }: any) => (
      <div className="flex flex-col gap-1 p-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wide">{label}</span>
          <div className="flex gap-2">
             <input type="text" placeholder="100g" className="w-full bg-white p-1 rounded text-center text-xs border-none outline-none font-bold text-slate-800" value={nutrition.p100[field] || ''} onChange={e => setNutrition({...nutrition, p100: {...nutrition.p100, [field]: e.target.value}})} />
             <input type="text" placeholder="Porção" className="w-full bg-white p-1 rounded text-center text-xs border-none outline-none font-bold text-slate-800" value={nutrition.portion[field] || ''} onChange={e => setNutrition({...nutrition, portion: {...nutrition.portion, [field]: e.target.value}})} />
          </div>
      </div>
  );

  return (
    <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden bg-[#F8FAFC] font-sans selection:bg-emerald-200">
      <style>{`* { -ms-overflow-style: none; scrollbar-width: none; } *::-webkit-scrollbar { display: none; }`}</style>

      {/* BACKGROUND DINÂMICO */}
      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[60%] bg-emerald-100/50 rounded-full blur-[120px] animate-pulse duration-[8000ms]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[50%] bg-blue-100/50 rounded-full blur-[120px] animate-pulse duration-[10000ms] delay-1000"></div>
         <div className="absolute top-[40%] left-[30%] w-[40%] h-[30%] bg-purple-100/30 rounded-full blur-[100px] animate-pulse duration-[12000ms] delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto h-full w-full flex flex-col">
        {view === 'home' && renderHome()}
        {view === 'shopping' && renderShopping()}
        {view === 'catalog' && renderCatalog()}
        {view === 'finish-save' && renderFinishSave()}
        {view === 'success' && renderSuccess()}
        {view === 'saved-lists' && renderSavedListsView()}
        {view === 'analytics' && renderAnalyticsView()}
        
        {/* --- MODAL DETALHES --- */}
        <AnimatePresence>
        {viewingItemDetails && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setViewingItemDetails(null)}>
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white/95 backdrop-blur-xl w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white/50 relative max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setViewingItemDetails(null)} className="absolute top-6 right-6 bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button>
                    <h3 className="text-3xl font-black text-slate-800 mb-2 leading-tight">{viewingItemDetails.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-8">
                        <Badge text={viewingItemDetails.brand} color="blue" />
                        <Badge text={viewingItemDetails.size} icon={Scale} color="orange" />
                        <Badge text={viewingItemDetails.category} icon={Tag} color="purple" />
                    </div>

                    {viewingItemDetails.nutrition && Object.keys(viewingItemDetails.nutrition.p100 || {}).length > 0 ? (
                        <div className="bg-white/50 rounded-3xl p-6 border border-slate-100">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg"><Leaf size={20} className="text-emerald-500"/> Nutrição</h4>
                            <div className="grid grid-cols-3 gap-2 text-xs font-bold text-slate-400 mb-3 border-b border-slate-200 pb-2 text-center">
                                <span className="text-left">Item</span><span>100g</span><span>Porção</span>
                            </div>
                            {['kcal', 'carb', 'prot', 'fat', 'sat_fat', 'fibers', 'sodium', 'sugars'].map(field => {
                                const labels: any = { kcal: 'Energia', carb: 'Carboid.', prot: 'Proteína', fat: 'Gorduras', sat_fat: 'G. Sat.', fibers: 'Fibras', sodium: 'Sódio', sugars: 'Açúcares' };
                                return (
                                    <div key={field} className="grid grid-cols-3 gap-2 text-sm mb-2 border-b border-slate-100 pb-2 last:border-0 items-center">
                                        <span className="capitalize font-bold text-slate-600">{labels[field] || field}</span>
                                        <span className="text-center font-medium text-slate-800">{viewingItemDetails.nutrition.p100[field] || '-'}</span>
                                        <span className="text-center font-medium text-slate-800">{viewingItemDetails.nutrition.portion[field] || '-'}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                            <Info size={40} className="mx-auto mb-3 opacity-30"/>
                            <p>Sem dados nutricionais.</p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

        {/* --- MODAL DE ADIÇÃO UNIFICADO (GLASS) --- */}
        <div className={cn("fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-3xl rounded-t-[2.5rem] z-40 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white", showInputModal ? "translate-y-0" : "translate-y-[120%]")}>
             <div className="px-6 pt-6 pb-8 overflow-hidden relative max-h-[85vh] overflow-y-auto no-scrollbar">
                 <motion.div 
                    className="w-full flex justify-center mb-6 pt-2 pb-6 -mt-2 -mb-6"
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(e, info) => {
                        if (info.offset.y > 50) closeInputModal();
                    }}
                    onClick={closeInputModal}
                 >
                    <div className="w-16 h-1.5 bg-slate-300/50 rounded-full cursor-pointer hover:bg-slate-400 pointer-events-none" />
                 </motion.div>

                 <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="font-bold text-slate-800 text-2xl tracking-tight">{editingItemId ? 'Editar Item' : 'Novo Item'}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">{isManualMode ? 'Preenchimento Manual' : 'Preenchimento Rápido'}</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="file" accept="image/*" capture="environment" id="photo-upload" className="hidden" onChange={onPhotoUpload} />
                        <button 
                            onClick={() => document.getElementById('photo-upload')?.click()}
                            className="p-3 rounded-2xl transition-all shadow-sm bg-indigo-50 text-indigo-500 border border-indigo-100 hover:bg-indigo-100"
                            title="Descrever por Foto (IA)"
                        >
                            <Sparkles size={20} />
                        </button>
                        <button 
                            onClick={() => setShowScanner(true)}
                            className="p-3 rounded-2xl transition-all shadow-sm bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                        >
                            <Camera size={20} />
                        </button>
                        <button 
                            onClick={() => setIsManualMode(!isManualMode)}
                            className={cn("p-3 rounded-2xl transition-all shadow-sm", isManualMode ? "bg-slate-800 text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50")}
                        >
                            <Edit3 size={20} />
                        </button>
                    </div>
                 </div>

                 <div className="space-y-6">
                    {/* INPUT PRINCIPAL */}
                    {!editingItemId && (
                      <div className="relative z-50 group">
                          <input 
                            ref={nameInputRef}
                            type="text" 
                            placeholder={isManualMode ? "Nome do Produto" : "Ex: Arroz Camil 5kg"}
                            className="w-full bg-white/80 border-2 border-slate-200 focus:border-emerald-500 p-6 rounded-3xl text-xl font-bold text-slate-800 outline-none transition-all shadow-sm focus:shadow-lg focus:bg-white placeholder:text-slate-300"
                            value={inputName}
                            onFocus={() => setShowKeypad(false)}
                            onChange={e => setInputName(e.target.value)}
                            autoComplete="off"
                          />
                          {suggestions.length > 0 && !editingItemId && !isManualMode && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                                  <div className="p-3 bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">Sugestões</div>
                                  {suggestions.map((sug, idx) => (
                                      <div key={idx} onClick={() => selectSuggestion(sug)} className="p-4 hover:bg-emerald-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 transition-colors">
                                              <div className="flex items-center gap-3">
                                                  {sug.emoji && <span className="text-2xl">{sug.emoji}</span>}
                                                  <div className="flex flex-col">
                                                      <span className="font-bold text-slate-800 text-lg">{sug.name}</span>
                                                      {sug.brand && <span className="text-xs font-medium text-slate-500 bg-slate-100 w-fit px-2 py-0.5 rounded-md mt-1">{sug.brand}</span>}
                                                  </div>
                                              </div>
                                          {sug.lastPrice && <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-xl">R$ {sug.lastPrice}</span>}
                                      </div>
                                  ))}
                              </motion.div>
                          )}
                      </div>
                    )}

                    {/* FORMULÁRIO MANUAL */}
                    <AnimatePresence>
                    {isManualMode && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/80 p-4 rounded-3xl border border-slate-200 focus-within:ring-2 ring-emerald-500/20 transition-all col-span-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Categoria</label>
                                    <input type="text" placeholder="Ex: Bebidas, Laticínios" className="w-full bg-transparent outline-none font-bold text-slate-700 text-lg placeholder:font-normal" value={inputType} onChange={e => setInputType(e.target.value)}/>
                                </div>
                                <div className="bg-white/80 p-4 rounded-3xl border border-slate-200 focus-within:ring-2 ring-emerald-500/20 transition-all">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Marca</label>
                                    <input type="text" placeholder="Ex: Nestle" className="w-full bg-transparent outline-none font-bold text-slate-700 text-lg placeholder:font-normal" value={inputBrand} onChange={e => setInputBrand(e.target.value)}/>
                                </div>
                                <div className="bg-white/80 p-4 rounded-3xl border border-slate-200 focus-within:ring-2 ring-emerald-500/20 transition-all">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Tamanho</label>
                                    <input type="text" placeholder="Ex: 200g" className="w-full bg-transparent outline-none font-bold text-slate-700 text-lg placeholder:font-normal" value={inputSize} onChange={e => setInputSize(e.target.value)}/>
                                </div>
                            </div>
                            
                            <div className="pt-2">
                                <button onClick={() => setShowNutrition(!showNutrition)} className="w-full flex items-center justify-between p-4 bg-emerald-50/80 text-emerald-800 rounded-2xl font-bold text-sm hover:bg-emerald-100/80 transition-colors border border-emerald-100">
                                    <span className="flex items-center gap-2"><Leaf size={18} className="text-emerald-500"/> Tabela Nutricional</span>
                                    <ChevronDown size={18} className={cn("transition-transform duration-300", showNutrition ? "rotate-180" : "")}/>
                                </button>
                                <AnimatePresence>
                                {showNutrition && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, height: 0 }} className="mt-4 bg-white border border-slate-100 shadow-sm rounded-3xl p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 overflow-hidden">
                                        <NutriInput label="Kcal" field="kcal" />
                                        <NutriInput label="Carb" field="carb" />
                                        <NutriInput label="Prot" field="prot" />
                                        <NutriInput label="Gord Totais" field="fat" />
                                        <NutriInput label="Gord Sat" field="sat_fat" />
                                        <NutriInput label="Fibras" field="fibers" />
                                        <NutriInput label="Sódio (mg)" field="sodium" />
                                        <NutriInput label="Açúcares" field="sugars" />
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>

                    <div className="flex gap-4 items-stretch">
                        {view !== 'catalog' && (
                            <div className="flex flex-col justify-center items-center bg-white border-2 border-slate-200 rounded-3xl px-2 py-2 shadow-sm w-20">
                                <button onClick={() => setInputQty(inputQty + 1)} className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"><Plus size={20} strokeWidth={3}/></button>
                                <span className="font-black text-2xl text-slate-800 my-1">{inputQty}</span>
                                <button onClick={() => setInputQty(Math.max(1, inputQty - 1))} className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"><Minus size={20} strokeWidth={3}/></button>
                            </div>
                        )}

                        <div onClick={() => setShowKeypad(!showKeypad)} className={cn("flex-1 flex flex-col justify-center items-end px-8 py-4 rounded-3xl transition-all cursor-pointer relative overflow-hidden shadow-sm hover:scale-[1.02] active:scale-[0.98]", showKeypad ? "bg-slate-900 border-transparent shadow-lg text-white" : "bg-white border-2 border-slate-200 text-slate-800")}>
                           <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", showKeypad ? "text-slate-400" : "text-slate-400")}>{view === 'catalog' ? 'Ref. Preço' : 'Preço Unitário'}</span>
                           <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold opacity-60">R$</span>
                              <span className="text-4xl font-black tracking-tighter">{inputPrice || '0.00'}</span>
                           </div>
                        </div>
                    </div>
                 </div>

                 {/* KEYPAD OVERLAY */}
                 <AnimatePresence>
                 {showKeypad && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
                        {/* Dim Backdrop specifically for Keypad */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/10 pointer-events-auto backdrop-blur-[2px]" onClick={() => setShowKeypad(false)} />
                        
                        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full bg-slate-100/90 backdrop-blur-3xl p-6 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-white pointer-events-auto relative">
                            
                            {/* Price display inside keypad */}
                            <div className="flex justify-between items-center mb-6 px-4">
                               <div className="flex flex-col">
                                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{view === 'catalog' ? 'Ref. Preço' : 'Preço Unitário'}</span>
                                   <div className="flex items-baseline gap-1 text-slate-800">
                                      <span className="text-xl font-bold opacity-60">R$</span>
                                      <span className="text-5xl font-black tracking-tighter">{inputPrice || '0.00'}</span>
                                   </div>
                               </div>
                               <button onClick={() => setShowKeypad(false)} className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-600 transition-colors">
                                  <ArrowDown size={24} />
                               </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-6">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(k => <KeypadButton key={k} value={k} onClick={handleKeypadPress} />)}
                              <KeypadButton value="del" onClick={() => handleKeypadPress('del')} icon={<Delete size={28} className="text-red-400"/>} className="text-red-500 bg-red-50/80 border-red-100" />
                            </div>
                            <div className="flex gap-4">
                               <button onClick={confirmItem} disabled={!inputName.trim()} className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/30 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
                                 {view === 'catalog' ? 'Salvar Produto' : 'Adicionar à Lista'} <Check size={24} />
                               </button>
                            </div>
                        </motion.div>
                    </div>
                 )}
                 </AnimatePresence>

                 {!showKeypad && (
                    <motion.button 
                       layout
                       onClick={confirmItem} 
                       disabled={!inputName.trim()}
                       className="w-full mt-8 bg-slate-900 border border-slate-800 text-white font-bold py-6 rounded-3xl shadow-2xl shadow-slate-900/20 active:scale-95 transition-transform flex items-center justify-center gap-3 text-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {view === 'catalog' ? 'Salvar Produto' : 'Adicionar à Lista'} <Plus size={24} />
                    </motion.button>
                 )}
             </div>
         </div>
         {showScanner && (
             <BarcodeScanner onScan={onBarcodeScan} onClose={() => setShowScanner(false)} />
         )}
      </div>
    </div>
  );
}
