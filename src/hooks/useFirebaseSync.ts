import { useEffect, useRef } from 'react'
import type { User } from 'firebase/auth'
import { doc, setDoc, onSnapshot, collection, query } from 'firebase/firestore'
import { db, handleFirestoreError, OperationType } from '../firebase'
import { useShoppingStore } from '../store/useShoppingStore'

export function useFirebaseSync(user: User | null) {
  const setUser = useShoppingStore(s => s.setUser)
  const activeItems = useShoppingStore(s => s.activeItems)
  const snapCache = useRef({ catalog: '', history: '', savedLists: '', activeItems: '', budget: 0 })

  useEffect(() => {
    setUser(user)
  }, [user, setUser])

  useEffect(() => {
    if (!user) return

    const unsub1 = onSnapshot(query(collection(db, 'users', user.uid, 'catalog')), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
      const key = JSON.stringify(data)
      if (key !== snapCache.current.catalog) {
        snapCache.current.catalog = key
        useShoppingStore.getState().setCatalog(data)
      }
    }, error => handleFirestoreError(error, OperationType.LIST, 'users/catalog'))

    const unsub2 = onSnapshot(query(collection(db, 'users', user.uid, 'history')), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
      const key = JSON.stringify(data)
      if (key !== snapCache.current.history) {
        snapCache.current.history = key
        useShoppingStore.getState().setHistory(data)
      }
    }, error => handleFirestoreError(error, OperationType.LIST, 'users/history'))

    const unsub3 = onSnapshot(query(collection(db, 'users', user.uid, 'savedLists')), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
      const key = JSON.stringify(data)
      if (key !== snapCache.current.savedLists) {
        snapCache.current.savedLists = key
        useShoppingStore.getState().setSavedLists(data)
      }
    }, error => handleFirestoreError(error, OperationType.LIST, 'users/savedLists'))

    const unsub4 = onSnapshot(doc(db, 'users', user.uid, 'activeList', 'current'), (snap) => {
      const data = snap.exists() ? (snap.data().items || []) : []
      const key = JSON.stringify(data)
      if (key !== snapCache.current.activeItems) {
        snapCache.current.activeItems = key
        useShoppingStore.getState().setActiveItems(data)
      }
    }, error => handleFirestoreError(error, OperationType.GET, 'users/activeList'))

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists() && snap.data().budget !== undefined) {
        useShoppingStore.getState().setBudget(snap.data().budget)
      }
    }, error => handleFirestoreError(error, OperationType.GET, 'users'))

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsubUser() }
  }, [user])

  useEffect(() => {
    if (user) return
    try {
      const sItems = localStorage.getItem('listou_items')
      const sLists = localStorage.getItem('listou_saved_lists')
      const sHistory = localStorage.getItem('listou_history')
      const sCatalog = localStorage.getItem('listou_catalog')
      const sBudget = localStorage.getItem('listou_budget')
      if (sItems) useShoppingStore.getState().setActiveItems(JSON.parse(sItems))
      if (sLists) useShoppingStore.getState().setSavedLists(JSON.parse(sLists))
      if (sHistory) useShoppingStore.getState().setHistory(JSON.parse(sHistory))
      if (sCatalog) useShoppingStore.getState().setCatalog(JSON.parse(sCatalog))
      if (sBudget) useShoppingStore.getState().setBudget(parseFloat(sBudget))
    } catch (e) { console.error('Error reading localStorage', e) }
  }, [user])

  const lsActiveItems = useShoppingStore(s => s.activeItems)
  const lsSavedLists = useShoppingStore(s => s.savedLists)
  const lsHistory = useShoppingStore(s => s.history)
  const lsCatalog = useShoppingStore(s => s.catalog)
  const lsBudget = useShoppingStore(s => s.budget)

  useEffect(() => {
    if (user) return
    localStorage.setItem('listou_items', JSON.stringify(lsActiveItems))
    localStorage.setItem('listou_saved_lists', JSON.stringify(lsSavedLists))
    localStorage.setItem('listou_history', JSON.stringify(lsHistory))
    localStorage.setItem('listou_catalog', JSON.stringify(lsCatalog))
    localStorage.setItem('listou_budget', lsBudget.toString())
  }, [lsActiveItems, lsSavedLists, lsHistory, lsCatalog, lsBudget, user])

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

  useEffect(() => {
    if (user) {
      const sItems = localStorage.getItem('listou_items')
      if (sItems && JSON.parse(sItems).length > 0) {
        useShoppingStore.getState().setActiveItems(JSON.parse(sItems))
        localStorage.removeItem('listou_items')
        localStorage.removeItem('listou_saved_lists')
        localStorage.removeItem('listou_history')
        localStorage.removeItem('listou_catalog')
        localStorage.removeItem('listou_budget')
      }
    }
  }, [user])
}
