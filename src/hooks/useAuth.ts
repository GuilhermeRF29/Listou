import { useState, useEffect } from 'react'
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut, getRedirectResult } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'desconhecido'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          setUser(result.user)
        }
      })
      .catch(() => {})

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setAuthError(null)
      setLoading(false)

      if (u) {
        try {
          const userDocRef = doc(db, 'users', u.uid)
          const userDoc = await getDoc(userDocRef)

          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              email: u.email,
              budget: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          }
        } catch (e) {
          console.error(e)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  const signIn = async () => {
    setAuthError(null)
    setLoading(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (e: any) {
      if (e.code === 'auth/unauthorized-domain') {
        setAuthError(
          `Domínio "${currentDomain}" não autorizado. ` +
          `Adicione este domínio no Firebase Console → Authentication → Settings → Authorized domains.`
        )
        setLoading(false)
        return
      }

      if (
        e.code === 'auth/popup-blocked' ||
        e.code === 'auth/cancelled-popup-request' ||
        e.code === 'auth/popup-closed-by-user'
      ) {
        try {
          await signInWithRedirect(auth, new GoogleAuthProvider())
        } catch (e2: any) {
          if (e2.code === 'auth/unauthorized-domain') {
            setAuthError(
              `Domínio "${currentDomain}" não autorizado. ` +
              `Adicione este domínio no Firebase Console → Authentication → Settings → Authorized domains.`
            )
          } else {
            setAuthError('Erro ao autenticar: ' + (e2.message || e2.code || 'tente novamente.'))
          }
          setLoading(false)
        }
        return
      }

      setAuthError('Erro ao fazer login: ' + (e.message || e.code || 'tente novamente.'))
      setLoading(false)
    }
  }

  const dismissError = () => setAuthError(null)

  const signOutUser = async () => {
    await signOut(auth)
  }

  return { user, loading, authError, dismissError, signIn, signOut: signOutUser }
}
