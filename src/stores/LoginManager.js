import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/firebase/firebaseConfig'
import { jwtDecode } from 'jwt-decode'
import { useRegisterManager } from '@/stores/RegisterManager.js'

export const useLoginManager = defineStore('loginManager', () => {
  const registerStore = useRegisterManager()
  const user = ref(null)
  const isLoading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  const decodeJWT = (token) => {
    try {
      return jwtDecode(token)
    } catch (err) {
      console.error('Invalid token:', err)
      return null
    }
  }

  const loginAccount = async (email, password, router) => {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const firebaseUser = userCredential.user
      const idToken = await firebaseUser.getIdToken()

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/auth/verify`,
        {
          headers: { Authorization: `Bearer ${idToken}` }
        }
      )
      const data = response.data
      if (!data?.authenticated) throw new Error('Verify failed')

      user.value = {
        id: data.userId,
        email: data.email,
        name: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
        role: data.role,
        accessToken: idToken
      }

      // เก็บ localStorage
      localStorage.setItem('accessToken', idToken)
      localStorage.setItem('userRole', data.role)
      localStorage.setItem(
        'userName',
        `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim()
      )

      successMessage.value = `Login successful as ${data.role}!`

      if (router) {
        if (data.role === 'RESIDENT')
          router.replace({ name: 'home', params: { id: data.userId } })
        else if (data.role === 'STAFF')
          router.replace({ name: 'homestaff', params: { id: data.userId } })
        else router.replace({ name: 'home', params: { id: data.userId } })
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
  // Logout ต้องล้างค่า Pinia และ router
  const logoutAccount = async (router) => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      registerStore.userData = null
      localStorage.clear() // ล้างทั้งหมดเพื่อป้องกัน leak
      router.replace({ name: 'login' })
      window.location.reload() // optional
    }
  }

  const refreshToken = async () => {
    try {
      if (auth.currentUser) {
        const newToken = await auth.currentUser.getIdToken(true)
        if (user.value) user.value.accessToken = newToken
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

  const apiRequest = async (url, options = {}) => {
    try {
      let token = user.value?.accessToken || localStorage.getItem('accessToken')
      if (!token) throw new Error('No access token available')

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

  const restoreUserFromLocalStorage = () => {
    const token = localStorage.getItem('accessToken')
    const role = localStorage.getItem('userRole')
    const name = localStorage.getItem('userName')

    if (!token || !role) return false

    const decoded = decodeJWT(token)
    user.value = {
      id: decoded?.user_id || decoded?.uid || null,
      email: decoded?.email || '',
      name: name ?? '',
      role: role,
      accessToken: token
    }

    return true
  }

  const useAuthGuard = (router) => {
    router.beforeEach(async (to, from, next) => {
      const publicPages = ['login', 'register', 'resetpassword']

      // ถ้า public page → ผ่าน
      if (publicPages.includes(to.name)) return next()

      // ตรวจ user จาก store
      if (!user.value) {
        // ไม่มี user → redirect login
        return next({ name: 'login' })
      }

      // ตรวจ token หมดอายุ
      const decoded = decodeJWT(user.value.accessToken)
      const now = Math.floor(Date.now() / 1000)
      if (decoded?.exp && decoded.exp < now) {
        const newToken = await refreshToken()
        if (!newToken) return next({ name: 'login' })
      }

      // ตรวจ role
      if (
        (to.name === 'home' && user.value.role !== 'RESIDENT') ||
        (to.name === 'homestaff' && user.value.role !== 'STAFF')
      ) {
        return next({ name: 'login' })
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
    useAuthGuard,
    restoreUserFromLocalStorage
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
