import { lazy, Suspense, useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from './hooks/useAuth'
import { useShoppingList } from './hooks/useShoppingList'
import { InputModal } from './components/InputModal'
import { NutritionDetails } from './components/NutritionDetails'
import BarcodeScanner from './components/BarcodeScanner'

const HomeView = lazy(() => import('./views/HomeView').then(m => ({ default: m.HomeView })))
const ShoppingView = lazy(() => import('./views/ShoppingView').then(m => ({ default: m.ShoppingView })))
const CatalogView = lazy(() => import('./views/CatalogView').then(m => ({ default: m.CatalogView })))
const AnalyticsView = lazy(() => import('./views/AnalyticsView').then(m => ({ default: m.AnalyticsView })))
const SavedListsView = lazy(() => import('./views/SavedListsView').then(m => ({ default: m.SavedListsView })))
const FinishSaveView = lazy(() => import('./views/FinishSaveView').then(m => ({ default: m.FinishSaveView })))
const SuccessView = lazy(() => import('./views/SuccessView').then(m => ({ default: m.SuccessView })))

export default function App() {
  const { user, signIn, signOut } = useAuth()
  const s = useShoppingList(user)
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === 'true')
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dark', String(dark))
  }, [dark])

  useEffect(() => {
    if (user) {
      const sItems = localStorage.getItem('listou_items')
      if (sItems && JSON.parse(sItems).length > 0) {
        s.updateActiveItems(JSON.parse(sItems))
        localStorage.removeItem('listou_items')
        localStorage.removeItem('listou_saved_lists')
        localStorage.removeItem('listou_history')
        localStorage.removeItem('listou_catalog')
        localStorage.removeItem('listou_budget')
      }
    }
  }, [user])

  const handleToggleDark = useCallback(() => setDark(d => !d), [])
  const handleOpenEdit = useCallback((item: any) => s.openForEdit(item, false), [s.openForEdit])
  const handleCatalogEdit = useCallback((item: any, isCatalog: boolean) => s.openForEdit(item, isCatalog), [s.openForEdit])
  const handleLoadList = useCallback((items: any[]) => s.updateActiveItems(items), [s.updateActiveItems])
  const handleToggleNutrition = useCallback(() => s.setShowNutrition(!s.showNutrition), [s.showNutrition, s.setShowNutrition])
  const handleToggleManual = useCallback(() => s.setIsManualMode(!s.isManualMode), [s.isManualMode, s.setIsManualMode])
  const handleToggleKeypad = useCallback(() => s.setShowKeypad(!s.showKeypad), [s.showKeypad, s.setShowKeypad])
  const handleScannerOpen = useCallback(() => s.setShowScanner(true), [s.setShowScanner])
  const handleCloseDetails = useCallback(() => s.setViewingItemDetails(null), [s.setViewingItemDetails])
  const handleCloseScanner = useCallback(() => s.setShowScanner(false), [s.setShowScanner])
  const exportData = useMemo(() => ({
    activeItems: s.activeItems, catalog: s.catalog,
    savedLists: s.savedLists, history: s.history, budget: s.budget
  }), [s.activeItems, s.catalog, s.savedLists, s.history, s.budget])

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

      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[60%] bg-emerald-100/50 rounded-full blur-[120px] animate-pulse duration-[8000ms]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[50%] bg-blue-100/50 rounded-full blur-[120px] animate-pulse duration-[10000ms] delay-1000"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[30%] bg-purple-100/30 rounded-full blur-[100px] animate-pulse duration-[12000ms] delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto h-full w-full flex flex-col">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-400 font-medium">Carregando...</div>}>
        {s.view === 'home' && (
          <HomeView
            user={user}
            activeCount={s.activeItems.length}
            catalogCount={s.catalog.length}
            savedListsCount={s.savedLists.length}
            totalSpent={s.history.reduce((acc, h) => acc + h.total, 0)}
            formatCurrency={s.formatCurrency}
            onSignIn={signIn}
            onSignOut={signOut}
            onNavigate={s.setView}
            dark={dark}
            onToggleDark={handleToggleDark}
            exportData={exportData}
          />
        )}
        {s.view === 'shopping' && (
          <ShoppingView
            activeItems={s.activeItems}
            budget={s.budget}
            catalog={s.catalog}
            sortBy={s.sortBy}
            checkedTotal={s.checkedTotal}
            total={s.total}
            formatCurrency={s.formatCurrency}
            getLastPrice={s.getLastPrice}
            onNavigate={s.setView}
            onUpdateItems={s.updateActiveItems}
            onSetBudget={s.setBudget}
            onSetSortBy={s.setSortBy}
            onOpenEdit={handleOpenEdit}
            onViewDetails={s.setViewingItemDetails}
            onFinishShopping={s.finishShopping}
            onOpenInputModal={s.openInputModal}
            uniqueStores={s.uniqueStores}
          />
        )}
        {s.view === 'catalog' && (
          <CatalogView
            catalog={s.catalog}
            sortBy={s.sortBy}
            onSetSortBy={s.setSortBy}
            onNavigate={s.setView}
            formatCurrency={s.formatCurrency}
            onEdit={handleCatalogEdit}
            onDelete={s.deleteFromCatalog}
            onAddNew={s.openInputModal}
          />
        )}
        {s.view === 'saved-lists' && (
          <SavedListsView
            savedLists={s.savedLists}
            onLoadList={handleLoadList}
            onNavigate={s.setView}
          />
        )}
        {s.view === 'finish-save' && (
          <FinishSaveView
            activeItems={s.activeItems}
            getLastPrice={s.getLastPrice}
            checkedTotal={s.checkedTotal}
            formatCurrency={s.formatCurrency}
            listName={s.listName}
            onSetListName={s.setListName}
            onSaveAndClose={s.saveAndClose}
          />
        )}
        {s.view === 'success' && <SuccessView />}
        {s.view === 'analytics' && (
          <AnalyticsView
            history={s.history}
            analyticsType={s.analyticsType}
            analyticsSelection={s.analyticsSelection}
            formatCurrency={s.formatCurrency}
            onSetType={s.setAnalyticsType}
            onSetSelection={s.setAnalyticsSelection}
            onNavigate={s.setView}
            uniqueStores={s.uniqueStores}
          />
        )}

        <InputModal
          show={s.showInputModal}
          view={s.view}
          isManualMode={s.isManualMode}
          editingItemId={s.editingItemId}
          inputName={s.inputName}
          inputBrand={s.inputBrand}
          inputType={s.inputType}
          inputSize={s.inputSize}
          inputPrice={s.inputPrice}
          inputQty={s.inputQty}
          inputEmoji={s.inputEmoji}
          inputStore={s.inputStore}
          nutrition={s.nutrition}
          showNutrition={s.showNutrition}
          showKeypad={s.showKeypad}
          suggestions={s.suggestions}
          analyzing={s.analyzing}
          analyzeError={s.analyzeError}
          onNameChange={s.setInputName}
          onBrandChange={s.setInputBrand}
          onTypeChange={s.setInputType}
          onSizeChange={s.setInputSize}
          onQtyChange={s.setInputQty}
          onPriceChange={s.setInputPrice}
          onEmojiChange={s.setInputEmoji}
          onStoreChange={s.setInputStore}
          onNutritionChange={s.setNutrition}
            onToggleNutrition={handleToggleNutrition}
            onToggleManual={handleToggleManual}
            onToggleKeypad={handleToggleKeypad}
          onKeypadPress={s.handleKeypadPress}
          onSelectSuggestion={s.selectSuggestion}
          onPhotoUpload={s.onPhotoUpload}
            onScannerOpen={handleScannerOpen}
          onConfirm={s.confirmItem}
          onClose={s.closeInputModal}
        />
        </Suspense>

        <NutritionDetails item={s.viewingItemDetails} onClose={handleCloseDetails} />

        {s.showScanner && (
          <BarcodeScanner onScan={s.onBarcodeScan} onContinuousAdd={s.onContinuousBarcodeScan} onClose={handleCloseScanner} />
        )}
      </div>
    </div>
    </>
  )
}
