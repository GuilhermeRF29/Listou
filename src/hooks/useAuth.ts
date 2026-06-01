import { useState, useEffect } from 'react'
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
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
    return () => unsubscribe()
  }, [])

  const signIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (e) {
      console.error(e)
    }
  }

  const signOutUser = async () => {
    await signOut(auth)
  }

  return { user, loading, signIn, signOut: signOutUser }
}
