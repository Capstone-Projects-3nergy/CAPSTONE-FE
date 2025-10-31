// src/stores/LoginManager.js
import { defineStore } from 'pinia'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '@/firebase/firebaseConfig'
import { ref } from 'vue'
import * as jwtDecodeModule from 'jwt-decode'

export const useLoginManager = defineStore('loginManager', () => {
  const user = ref(null)
  const isLoading = ref(false)
  const errorMessage = ref(null)
  const successMessage = ref(null)

  // 🧩 ฟังก์ชันเข้าสู่ระบบ
  const loginAccount = async (email, password, router) => {
    isLoading.value = true
    errorMessage.value = null
    successMessage.value = null

    try {
      // 1️⃣ เข้าสู่ระบบ Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const firebaseUser = userCredential.user

      // 2️⃣ ดึง Token จาก Firebase
      const idToken = await firebaseUser.getIdToken()

      // 3️⃣ ส่ง Token ไป Backend
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Login failed')

      // 4️⃣ เก็บข้อมูลผู้ใช้
      user.value = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: data.name,
        role: data.role // "resident" หรือ "staff"
      }

      // (optional) decode JWT backend ถ้ามี
      if (data.accessToken) {
        const decoded = jwtDecodeModule.default(data.accessToken)
        console.log('Decoded JWT payload:', decoded)
      }

      successMessage.value = `Login successful as ${data.role}!`

      // 5️⃣ Route ตาม role
      if (data.role === 'resident') {
        router.replace({ name: 'home' })
      } else if (data.role === 'staff') {
        router.replace({ name: 'homestaff' })
      } else {
        router.replace({ name: 'home' })
      }

      return user.value
    } catch (err) {
      console.error('Login error:', err)
      errorMessage.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 🧹 ออกจากระบบ
  const logoutAccount = async (router) => {
    try {
      await signOut(auth)
      user.value = null
      router.replace({ name: 'login' })
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // 👁️‍🗨️ ตรวจสอบสถานะล็อกอิน (เช็ค role จาก backend)
  const monitorAuthState = (router) => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken()
        const response = await fetch('http://localhost:3000/api/verifyToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken })
        })

        const data = await response.json()

        user.value = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: data.name,
          role: data.role
        }

        console.log('✅ User still logged in:', user.value)

        // ✅ route ตาม role (กัน refresh หน้า)
        if (router) {
          if (data.role === 'staff') router.replace({ name: 'staffDashboard' })
          else router.replace({ name: 'home' })
        }
      } else {
        user.value = null
        console.log('🚫 User logged out')
        if (router) router.replace({ name: 'login' })
      }
    })
  }

  return {
    user,
    isLoading,
    errorMessage,
    successMessage,
    loginAccount,
    logoutAccount,
    monitorAuthState
  }
})
