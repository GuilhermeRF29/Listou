import { useState, useEffect } from 'react'
import { User, onAuthStateChanged, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

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
      .catch((e) => {
        if (e.code === 'auth/unauthorized-domain') {
          setAuthError('Domínio não autorizado. Adicione este domínio no Firebase Console (Authentication → Sign-in method → Authorized domains).')
        } else if (e.code === 'auth/cancelled-popup-request' || e.code === 'auth/popup-closed-by-user') {
          setAuthError(null)
        } else {
          setAuthError('Erro ao autenticar: ' + (e.message || e.code || 'desconhecido'))
        }
      })

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
      await signInWithRedirect(auth, new GoogleAuthProvider())
    } catch (e: any) {
      setAuthError('Erro ao iniciar login: ' + (e.message || 'tente novamente.'))
      setLoading(false)
    }
  }

  const dismissError = () => setAuthError(null)

  const signOutUser = async () => {
    await signOut(auth)
  }

  return { user, loading, authError, dismissError, signIn, signOut: signOutUser }
}
