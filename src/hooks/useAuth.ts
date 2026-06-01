import { useState, useEffect } from 'react'
import { User, onAuthStateChanged, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
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

    getRedirectResult(auth).catch((e) => {
      if (e.code === 'auth/unauthorized-domain') {
        console.warn('Domínio não autorizado no Firebase Console.')
      }
    })

    return () => unsubscribe()
  }, [])

  const signIn = async () => {
    await signInWithRedirect(auth, new GoogleAuthProvider())
  }

  const signOutUser = async () => {
    await signOut(auth)
  }

  return { user, loading, signIn, signOut: signOutUser }
}
