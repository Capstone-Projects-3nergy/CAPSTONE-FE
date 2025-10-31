import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import * as jwtDecodeModule from 'jwt-decode'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase/firebaseConfig'

export const useLoginManager = defineStore('loginManager', () => {
  const user = ref(null)
  const isLoading = ref(false)
  const errorMessage = ref(null)
  const successMessage = ref(null)

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
  // 🔹 Login: Firebase หรือ backend custom
  // -----------------------
  const loginAccount = async (email, password, router, useFirebase = true) => {
    isLoading.value = true
    errorMessage.value = null
    successMessage.value = null

    try {
      let accessToken = null
      let role = null
      let name = null
      let id = null

      if (useFirebase) {
        // ✅ Firebase login
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        )
        const firebaseUser = userCredential.user

        accessToken = await firebaseUser.getIdToken()
        name = firebaseUser.displayName || ''
        role = 'resident' // หรือดึงจาก Firestore ถ้ามี
        id = firebaseUser.uid
      } else {
        // ✅ Backend login
        const response = await axios.post('http://localhost:3000/api/login', {
          email,
          password
        })
        const data = response.data
        if (!data.success) throw new Error(data.message || 'Login failed')

        accessToken = data.accessToken
        name = data.name
        role = data.role
        id = data.id
      }

      // Decode JWT ถ้ามี token
      if (accessToken) {
        const decoded = decodeJWT(accessToken)
        console.log('Decoded JWT payload:', decoded)
      }

      // ✅ บันทึกข้อมูลผู้ใช้
      user.value = { id, email, name, role, accessToken }
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('userRole', role)
      localStorage.setItem('userName', name)

      successMessage.value = `Login successful as ${role}!`

      // ✅ Routing ตาม role
      if (router) {
        if (role === 'resident') router.replace({ name: 'home' })
        else if (role === 'staff') router.replace({ name: 'homestaff' })
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
  // 🔹 Logout
  // -----------------------
  const logoutAccount = async (router, useFirebase = true) => {
    try {
      if (useFirebase) {
        await auth.signOut()
      } else if (user.value?.accessToken) {
        await axios.post(
          'http://localhost:3000/api/logout',
          {},
          { headers: { Authorization: `Bearer ${user.value.accessToken}` } }
        )
      }

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
  // 🔹 Refresh token
  // -----------------------
  const refreshToken = async () => {
    if (!user.value) return null

    try {
      if (auth.currentUser) {
        const newToken = await auth.currentUser.getIdToken(true)
        user.value.accessToken = newToken
        localStorage.setItem('accessToken', newToken)
        return newToken
      }
    } catch (err) {
      console.error('Refresh token error:', err)
      await logoutAccount()
      return null
    }
  }

  // -----------------------
  // 🔹 Protected API Request
  // -----------------------
  const apiRequest = async (url, options = {}) => {
    try {
      const token =
        user.value?.accessToken || localStorage.getItem('accessToken')
      if (!token) throw new Error('No access token available')

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
