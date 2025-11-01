import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/firebase/firebaseConfig'
import * as jwtDecodeModule from 'jwt-decode'

export const useLoginManager = defineStore('loginManager', () => {
  // -----------------------
  // 🔹 STATE
  // -----------------------
  const user = ref(null)
  const isLoading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  // -----------------------
  // 🔹 ฟังก์ชันถอดรหัส JWT
  // -----------------------
  const decodeJWT = (token) => {
    try {
      return jwtDecodeModule.default(token)
    } catch (err) {
      console.error('Invalid token:', err)
      return null
    }
  }

  // -----------------------
  // 🔹 LOGIN (Firebase Frontend + ส่ง token ไป Backend)
  // -----------------------
  const loginAccount = async (email, password, router) => {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      // 1️⃣ ล็อกอินด้วย Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const firebaseUser = userCredential.user

      // 2️⃣ ขอ ID Token
      const idToken = await firebaseUser.getIdToken()

      // 3️⃣ ส่ง token ไป backend
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/public/auth/login`, // <-- backtick
        {}, // body ว่าง
        {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        }
      )

      const data = response.data
      if (!data.success) throw new Error(data.message || 'Login failed')

      // 4️⃣ เก็บข้อมูลผู้ใช้
      user.value = {
        id: data.id,
        email,
        name: data.name,
        role: data.role,
        accessToken: idToken
      }

      // 5️⃣ เก็บลง localStorage
      localStorage.setItem('accessToken', idToken)
      localStorage.setItem('userRole', data.role)
      localStorage.setItem('userName', data.name)

      successMessage.value = `Login successful as ${data.role}!`

      // 6️⃣ Routing ตาม role
      if (router) {
        if (data.role === 'resident') router.replace({ name: 'home' })
        else if (data.role === 'staff') router.replace({ name: 'homestaff' })
        else router.replace({ name: 'home' })
      }

      return user.value
    } catch (err) {
      console.error('Login error:', err)
      errorMessage.value =
        err.response?.data?.message || err.message || 'Login failed'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // -----------------------
  // 🔹 LOGOUT
  // -----------------------
  const logoutAccount = async (router) => {
    try {
      await signOut(auth)
      user.value = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userName')
      if (router) router.replace({ name: 'login' })
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // -----------------------
  // 🔹 Refresh Token (ถ้า token หมดอายุ)
  // -----------------------
  const refreshToken = async () => {
    try {
      if (auth.currentUser) {
        const newToken = await auth.currentUser.getIdToken(true)
        user.value.accessToken = newToken
        localStorage.setItem('accessToken', newToken)
        return newToken
      }
      return null
    } catch (err) {
      console.error('Refresh token error:', err)
      await logoutAccount()
      return null
    }
  }

  // -----------------------
  // 🔹 Protected API Request (แนบ Bearer token และ auto refresh)
  // -----------------------
  const apiRequest = async (url, options = {}) => {
    try {
      let token = user.value?.accessToken || localStorage.getItem('accessToken')
      if (!token) throw new Error('No access token available')

      // ตรวจสอบ token หมดอายุ
      const decoded = decodeJWT(token)
      const currentTime = Math.floor(Date.now() / 1000)
      if (decoded?.exp && decoded.exp < currentTime) {
        token = await refreshToken()
        if (!token) throw new Error('Token expired')
      }

      const headers = { ...options.headers, Authorization: `Bearer ${token}` }
      const response = await axios({ url, ...options, headers })
      return response.data
    } catch (err) {
      console.error('API request error:', err)
      throw err
    }
  }

  // -----------------------
  // 🔹 Navigation Guard
  // -----------------------
  const useAuthGuard = (router) => {
    router.beforeEach(async (to, from, next) => {
      const token =
        user.value?.accessToken || localStorage.getItem('accessToken')

      if (!to.meta?.requiresAuth) return next()
      if (!token) return next({ name: 'login' })

      const decoded = decodeJWT(token)
      const currentTime = Math.floor(Date.now() / 1000)

      if (decoded?.exp && decoded.exp < currentTime) {
        const newToken = await refreshToken()
        if (newToken) return next()
        else return next({ name: 'login' })
      }

      next()
    })
  }

  return {
    user,
    isLoading,
    errorMessage,
    successMessage,
    loginAccount,
    logoutAccount,
    apiRequest,
    decodeJWT,
    refreshToken,
    useAuthGuard
  }
})

// import { defineStore } from 'pinia'
// import {
//   signInWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged
// } from 'firebase/auth'
// import { auth } from '@/firebase/firebaseConfig'
// import { ref } from 'vue'
// import * as jwtDecodeModule from 'jwt-decode'

// export const useLoginManager = defineStore('loginManager', () => {
//   const user = ref(null)
//   const isLoading = ref(false)
//   const errorMessage = ref(null)
//   const successMessage = ref(null)

//   // 🧩 ฟังก์ชันเข้าสู่ระบบ
//   const loginAccount = async (email, password, router) => {
//     isLoading.value = true
//     errorMessage.value = null
//     successMessage.value = null

//     try {
//       // 1️⃣ เข้าสู่ระบบ Firebase
//       const userCredential = await signInWithEmailAndPassword(
//         auth,
//         email,
//         password
//       )
//       const firebaseUser = userCredential.user

//       // 2️⃣ ดึง Token จาก Firebase
//       const idToken = await firebaseUser.getIdToken()

//       // 3️⃣ ส่ง Token ไป Backend
//       const response = await fetch('http://localhost:3000/api/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ token: idToken })
//       })

//       const data = await response.json()
//       if (!response.ok) throw new Error(data.message || 'Login failed')

//       // 4️⃣ เก็บข้อมูลผู้ใช้
//       user.value = {
//         uid: firebaseUser.uid,
//         email: firebaseUser.email,
//         name: data.name,
//         role: data.role // "resident" หรือ "staff"
//       }

//       // (optional) decode JWT backend ถ้ามี
//       if (data.accessToken) {
//         const decoded = jwtDecodeModule.default(data.accessToken)
//         console.log('Decoded JWT payload:', decoded)
//       }

//       successMessage.value = `Login successful as ${data.role}!`

//       // 5️⃣ Route ตาม role
//       if (data.role === 'resident') {
//         router.replace({ name: 'home' })
//       } else if (data.role === 'staff') {
//         router.replace({ name: 'homestaff' })
//       } else {
//         router.replace({ name: 'home' })
//       }

//       return user.value
//     } catch (err) {
//       console.error('Login error:', err)
//       errorMessage.value = err.message
//       return null
//     } finally {
//       isLoading.value = false
//     }
//   }

//   // 🧹 ออกจากระบบ
//   const logoutAccount = async (router) => {
//     try {
//       await signOut(auth)
//       user.value = null
//       router.replace({ name: 'login' })
//     } catch (err) {
//       console.error('Logout error:', err)
//     }
//   }

//   // 👁️‍🗨️ ตรวจสอบสถานะล็อกอิน (เช็ค role จาก backend)
//   const monitorAuthState = (router) => {
//     onAuthStateChanged(auth, async (firebaseUser) => {
//       if (firebaseUser) {
//         const idToken = await firebaseUser.getIdToken()
//         const response = await fetch('http://localhost:3000/api/verifyToken', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ token: idToken })
//         })

//         const data = await response.json()

//         user.value = {
//           uid: firebaseUser.uid,
//           email: firebaseUser.email,
//           name: data.name,
//           role: data.role
//         }

//         console.log('✅ User still logged in:', user.value)

//         // ✅ route ตาม role (กัน refresh หน้า)
//         if (router) {
//           if (data.role === 'staff') router.replace({ name: 'staffDashboard' })
//           else router.replace({ name: 'home' })
//         }
//       } else {
//         user.value = null
//         console.log('🚫 User logged out')
//         if (router) router.replace({ name: 'login' })
//       }
//     })
//   }

//   return {
//     user,
//     isLoading,
//     errorMessage,
//     successMessage,
//     loginAccount,
//     logoutAccount,
//     monitorAuthState
//   }
// })
