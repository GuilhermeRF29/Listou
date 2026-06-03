import { lazy, Suspense, useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from './hooks/useAuth'
import { useFirebaseSync } from './hooks/useFirebaseSync'
import { useShoppingStore, useTotal, useCheckedTotal, useUniqueStores } from './store/useShoppingStore'

const HomeView = lazy(() => import('./views/HomeView').then(m => ({ default: m.HomeView })))
const ShoppingView = lazy(() => import('./views/ShoppingView').then(m => ({ default: m.ShoppingView })))
const CatalogView = lazy(() => import('./views/CatalogView').then(m => ({ default: m.CatalogView })))
const AnalyticsView = lazy(() => import('./views/AnalyticsView').then(m => ({ default: m.AnalyticsView })))
const HistoryView = lazy(() => import('./views/HistoryView').then(m => ({ default: m.HistoryView })))
const SavedListsView = lazy(() => import('./views/SavedListsView').then(m => ({ default: m.SavedListsView })))
const FinishSaveView = lazy(() => import('./views/FinishSaveView').then(m => ({ default: m.FinishSaveView })))
const SuccessView = lazy(() => import('./views/SuccessView').then(m => ({ default: m.SuccessView })))
const InputModal = lazy(() => import('./components/InputModal').then(m => ({ default: m.InputModal })))
const NutritionDetails = lazy(() => import('./components/NutritionDetails').then(m => ({ default: m.NutritionDetails })))
const BarcodeScanner = lazy(() => import('./components/BarcodeScanner'))

export default function App() {
  const { user, loading: authLoading, authError, dismissError, signIn, signOut } = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === 'true')
  const [splashDone, setSplashDone] = useState(false)

  useFirebaseSync(user)

  const view = useShoppingStore(s => s.view)
  const activeItems = useShoppingStore(s => s.activeItems)
  const catalog = useShoppingStore(s => s.catalog)
  const savedLists = useShoppingStore(s => s.savedLists)
  const history = useShoppingStore(s => s.history)
  const budget = useShoppingStore(s => s.budget)
  const sortBy = useShoppingStore(s => s.sortBy)
  const showInputModal = useShoppingStore(s => s.showInputModal)
  const showScanner = useShoppingStore(s => s.showScanner)
  const viewingItemDetails = useShoppingStore(s => s.viewingItemDetails)
  const listName = useShoppingStore(s => s.listName)
  const analyticsType = useShoppingStore(s => s.analyticsType)
  const analyticsSelection = useShoppingStore(s => s.analyticsSelection)
  const total = useTotal()
  const checkedTotal = useCheckedTotal()
  const uniqueStores = useUniqueStores()

  const formatCurrency = useShoppingStore(s => s.formatCurrency)
  const getLastPrice = useShoppingStore(s => s.getLastPrice)
  const setView = useShoppingStore(s => s.setView)
  const setBudget = useShoppingStore(s => s.setBudget)
  const setSortBy = useShoppingStore(s => s.setSortBy)
  const setListName = useShoppingStore(s => s.setListName)
  const updateActiveItems = useShoppingStore(s => s.updateActiveItems)
  const openForEdit = useShoppingStore(s => s.openForEdit)
  const setViewingItemDetails = useShoppingStore(s => s.setViewingItemDetails)
  const finishShopping = useShoppingStore(s => s.finishShopping)
  const openInputModal = useShoppingStore(s => s.openInputModal)
  const deleteFromCatalog = useShoppingStore(s => s.deleteFromCatalog)
  const setAnalyticsType = useShoppingStore(s => s.setAnalyticsType)
  const setAnalyticsSelection = useShoppingStore(s => s.setAnalyticsSelection)

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dark', String(dark))
  }, [dark])

  const resetInputs = useShoppingStore(s => s.resetInputs)

  useEffect(() => {
    const isMobile = 'ontouchstart' in window
    window.scrollTo({ top: 0, behavior: isMobile ? 'auto' : 'smooth' })
    useShoppingStore.getState().setShowInputModal(false)
    useShoppingStore.getState().setShowScanner(false)
    useShoppingStore.getState().setShowKeypad(false)
    resetInputs()
  }, [view])

  useEffect(() => {
    const onPopState = () => {
      const st = useShoppingStore.getState()
      if (st.showInputModal || st.showScanner || st.showBudgetModal || st.viewingItemDetails) {
        st.setShowInputModal(false)
        st.setShowScanner(false)
        st.setShowBudgetModal(false)
        st.setViewingItemDetails(null)
        resetInputs()
      } else if (st.view !== 'home' && st.view !== 'shopping' && st.view !== 'catalog') {
        st.setView('home')
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const totalSpent = useMemo(() => history.reduce((acc, h) => acc + h.total, 0), [history])

  const handleToggleDark = useCallback(() => setDark(d => !d), [])
  const handleOpenEdit = useCallback((item: any) => openForEdit(item, false), [openForEdit])
  const handleCatalogEdit = useCallback((item: any, isCatalog: boolean) => openForEdit(item, isCatalog), [openForEdit])
  const handleLoadList = useCallback((items: any[]) => updateActiveItems(items), [updateActiveItems])
  const handleCloseDetails = useCallback(() => setViewingItemDetails(null), [setViewingItemDetails])
  const handleCloseScanner = useCallback(() => useShoppingStore.getState().setShowScanner(false), [])

  const exportData = useMemo(() => ({
    activeItems, catalog, savedLists, history, budget
  }), [activeItems, catalog, savedLists, history, budget])

  return (
    <>
      <AnimatePresence>
        {!splashDone && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-gradient-to-br from-emerald-400 to-teal-600 flex flex-col items-center justify-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16M4 12h16M4 18h7" />
                  <path d="M14 15l3 3 4-4" />
                </svg>
              </div>
              <h1 className="text-6xl font-black text-white tracking-tighter">Listou<span className="text-emerald-200">.</span></h1>
              <p className="text-white/70 font-medium mt-2 text-lg">Organize, economize, repita.</p>
              <div className="mt-10 w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden bg-[#F8FAFC] dark:bg-slate-900 font-sans selection:bg-emerald-200">
      <style>{`* { -ms-overflow-style: none; scrollbar-width: none; } *::-webkit-scrollbar { display: none; }`}</style>

      {authLoading && !user && splashDone && (
        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /><p className="text-sm font-medium text-slate-500">Autenticando...</p></div>
        </div>
      )}

      {authError && (
        <div className="absolute top-20 left-4 right-4 z-50 bg-red-50 dark:bg-red-900/80 border border-red-200 dark:border-red-700 rounded-2xl p-4 shadow-xl flex items-start gap-3 max-w-md mx-auto">
          <div className="text-red-500 text-lg leading-none mt-0.5">⚠</div>
          <div className="flex-1"><p className="text-sm font-bold text-red-700 dark:text-red-200">Erro de autenticação</p><p className="text-xs text-red-600 dark:text-red-300 mt-1 leading-relaxed">{authError}</p></div>
          <button onClick={dismissError} className="text-red-400 hover:text-red-600 p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
      )}

      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[60%] bg-emerald-100/50 rounded-full blur-[120px] animate-pulse duration-[8000ms]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[50%] bg-blue-100/50 rounded-full blur-[120px] animate-pulse duration-[10000ms] delay-1000"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[30%] bg-purple-100/30 rounded-full blur-[100px] animate-pulse duration-[12000ms] delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto h-full w-full flex flex-col">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-400 font-medium">Carregando...</div>}>
        {view === 'home' && (
          <HomeView
            user={user}
            activeCount={activeItems.length}
            catalogCount={catalog.length}
            savedListsCount={savedLists.length}
            historyCount={history.length}
            totalSpent={totalSpent}
            formatCurrency={formatCurrency}
            onSignIn={signIn}
            onSignOut={signOut}
            onNavigate={setView}
            dark={dark}
            onToggleDark={handleToggleDark}
            exportData={exportData}
          />
        )}
        {view === 'shopping' && (
          <ShoppingView
            activeItems={activeItems}
            budget={budget}
            catalog={catalog}
            sortBy={sortBy}
            checkedTotal={checkedTotal}
            total={total}
            formatCurrency={formatCurrency}
            getLastPrice={getLastPrice}
            onNavigate={setView}
            onUpdateItems={updateActiveItems}
            onSetBudget={setBudget}
            onSetSortBy={setSortBy}
            onOpenEdit={handleOpenEdit}
            onViewDetails={setViewingItemDetails}
            onFinishShopping={finishShopping}
            onOpenInputModal={openInputModal}
            uniqueStores={uniqueStores}
          />
        )}
        {view === 'catalog' && (
          <CatalogView
            catalog={catalog}
            sortBy={sortBy}
            onSetSortBy={setSortBy}
            onNavigate={setView}
            formatCurrency={formatCurrency}
            onEdit={handleCatalogEdit}
            onDelete={deleteFromCatalog}
            onAddNew={openInputModal}
          />
        )}
        {view === 'saved-lists' && (
          <SavedListsView
            savedLists={savedLists}
            onLoadList={handleLoadList}
            onNavigate={setView}
          />
        )}
        {view === 'finish-save' && (
          <FinishSaveView
            activeItems={activeItems}
            getLastPrice={getLastPrice}
            checkedTotal={checkedTotal}
            formatCurrency={formatCurrency}
            listName={listName}
            onSetListName={setListName}
            onSaveAndClose={useShoppingStore.getState().saveAndClose}
          />
        )}
        {view === 'success' && <SuccessView />}
        {view === 'analytics' && (
          <AnalyticsView
            history={history}
            analyticsType={analyticsType}
            analyticsSelection={analyticsSelection}
            formatCurrency={formatCurrency}
            onSetType={setAnalyticsType}
            onSetSelection={setAnalyticsSelection}
            onNavigate={setView}
            uniqueStores={uniqueStores}
          />
        )}
        {view === 'history' && (
          <HistoryView
            history={history}
            formatCurrency={formatCurrency}
            onNavigate={setView}
          />
        )}

        <Suspense fallback={null}>
          {showInputModal && <InputModal />}
        </Suspense>

        <Suspense fallback={null}>
          {viewingItemDetails && <NutritionDetails item={viewingItemDetails} onClose={handleCloseDetails} />}
        </Suspense>

        {showScanner && (
          <Suspense fallback={null}>
            <BarcodeScanner onScan={useShoppingStore.getState().onBarcodeScan} onContinuousAdd={useShoppingStore.getState().onContinuousBarcodeScan} onClose={handleCloseScanner} />
          </Suspense>
        )}
        </Suspense>
      </div>
    </div>
    </>
  )
}
