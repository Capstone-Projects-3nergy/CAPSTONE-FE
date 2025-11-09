import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/firebaseConfig'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { jwtDecode } from 'jwt-decode'

export const useAuthManager = defineStore('authManager', () => {
  // -----------------------
  // STATE
  // -----------------------
  const user = ref(null)
  const isLoading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const status = ref(null)

  const decodeJWT = (token) => {
    try {
      return jwtDecode(token)
    } catch {
      return null
    }
  }

  // -----------------------
  // FETCH USER จาก backend
  // -----------------------
  const fetchUserFromBackend = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        console.warn('⚠️ No Firebase user yet, skipping verify.')
        return null
      }

      const idToken = await currentUser.getIdToken()
      const baseURL = import.meta.env.VITE_BASE_URL

      const response = await axios.get(`${baseURL}/auth/verify`, {
        headers: { Authorization: `Bearer ${idToken}` }
      })
      console.log('🔍 verify response:', response.data)
      const data = response.data
      if (!data?.authenticated) {
        console.error('❌ Backend verify failed:', data)
        throw new Error('User verification failed.')
      }

      user.value = {
        id: data.userId,
        email: data.email,
        fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
        role: data.role,
        accessToken: idToken,
        ...(data.role === 'STAFF'
          ? { position: data.position || '' }
          : {
              dormId: data.dormName != null ? data.dormName : null,
              roomNumber: data.roomNumber || ''
            })
      }

      return user.value
    } catch (err) {
      console.error('fetchUserFromBackend error:', err)
      user.value = null
      return null
    }
  }

  const loadUserFromBackend = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) return false
      const userData = await fetchUserFromBackend()
      return !!userData
    } catch (err) {
      console.error('loadUserFromBackend error:', err)
      return false
    }
  }

  const initUser = () => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // 🔁 retry กันกรณี backend verify fail
          let ok = await loadUserFromBackend()
          if (!ok) {
            console.warn('Retry loading user from backend...')
            await new Promise((r) => setTimeout(r, 500))
            ok = await loadUserFromBackend()
          }
          resolve(ok)
        } else {
          user.value = null
          resolve(false)
        }
      })
    })
  }

  // -----------------------
  // REGISTER
  // -----------------------
  const registerAccount = async (formData, router) => {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    user.value = null
    status.value = null

    const role = String(formData.role || '').toUpperCase()
    if (!['RESIDENT', 'STAFF'].includes(role)) {
      errorMessage.value = 'Invalid role.'
      isLoading.value = false
      return
    }

    let payload = { ...formData, role }

    if (role === 'RESIDENT') {
      const dormIdNum = Number(formData.dormName)
      if (!Number.isFinite(dormIdNum) || dormIdNum <= 0) {
        errorMessage.value = 'Please select a valid dormitory.'
        isLoading.value = false
        return
      }
      if (!formData.roomNumber?.trim()) {
        errorMessage.value = 'Room number is required.'
        isLoading.value = false
        return
      }
      payload = {
        ...payload,
        dormId: dormIdNum,
        roomNumber: formData.roomNumber.trim()
      }
    } else if (role === 'STAFF') {
      if (!formData.position?.trim()) {
        errorMessage.value = 'Position is required for staff.'
        isLoading.value = false
        return
      }
      payload = { ...payload, position: formData.position.trim() }
    }

    const baseURL = import.meta.env.VITE_BASE_URL

    await axios
      .post(`${baseURL}/auth/register`, payload)
      .then(async (response) => {
        status.value = response.status
        console.log('✅ Backend response:', response) // แสดง response ทั้ง object
        console.log('📄 Backend response data:', response.data) // แสดง data ที่ backend ส่งกลับ
        if (!response.data?.userId) {
          errorMessage.value = 'Registration failed on backend.'
          return
        }

        const cred = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        )
        const idToken = await cred.user.getIdToken()

        user.value = {
          id: response.data.userId,
          email: formData.email,
          fullName: formData.fullName,
          role,
          accessToken: idToken,
          ...(role === 'STAFF' ? { position: formData.position } : {}),
          ...(role === 'RESIDENT'
            ? { dormId: formData.dormName, roomNumber: formData.roomNumber }
            : {})
        }

        successMessage.value = 'Account created successfully!'

        if (router) {
          if (role === 'RESIDENT')
            router.replace({
              name: 'home',
              params: { id: response.data.userId }
            })
          else if (role === 'STAFF')
            router.replace({
              name: 'homestaff',
              params: { id: response.data.userId }
            })
        }
      })
      .catch((error) => {
        status.value = error.response?.status || 500
        if (status.value === 409) {
          errorMessage.value = 'อีเมลนี้ถูกใช้แล้ว'
        } else {
          errorMessage.value =
            error.response?.data?.message || 'Registration failed.'
        }
      })
      .finally(() => {
        isLoading.value = false
      })
  }

  // -----------------------
  // LOGIN
  // -----------------------
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
        `${import.meta.env.VITE_BASE_URL}/auth/verify`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      )
      console.log('🔍 verify response:', response.data)
      const data = response.data
      if (!data?.authenticated) throw new Error('Verify failed')

      user.value = {
        id: data.userId,
        email: data.email,
        fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
        role: data.role,
        accessToken: idToken,
        ...(data.role === 'STAFF'
          ? { position: data.position || '' }
          : {
              dormId: data.dormName != null ? data.dormName : null,
              roomNumber: data.roomNumber || ''
            })
      }

      successMessage.value = `Login successful as ${data.role}!`

      if (router) {
        if (data.role === 'RESIDENT')
          router.replace({ name: 'home', params: { id: data.userId } })
        else if (data.role === 'STAFF')
          router.replace({ name: 'homestaff', params: { id: data.userId } })
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
  // LOGOUT
  // -----------------------
  const logoutAccount = async (router) => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      await router?.replace({ name: 'login' })
    }
  }

  // -----------------------
  // REFRESH TOKEN
  // -----------------------
  const refreshToken = async () => {
    try {
      if (auth.currentUser) {
        const newToken = await auth.currentUser.getIdToken(true)
        if (user.value) user.value.accessToken = newToken
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
  // API REQUEST
  // -----------------------
  const apiRequest = async (url, options = {}) => {
    try {
      if (!user.value) {
        console.warn('User not ready, waiting for init...')
        await initUser()
      }

      let token = user.value?.accessToken
      if (!token) {
        console.warn('No token, fetching new one...')
        token = await refreshToken()
        if (!token) throw new Error('No access token available after refresh')
      }

      const decoded = decodeJWT(token)
      const now = Math.floor(Date.now() / 1000)
      if (decoded?.exp && decoded.exp < now) {
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
  // NAVIGATION GUARD
  // -----------------------
  const useAuthGuard = (router) => {
    router.beforeEach(async (to, from, next) => {
      const publicPages = ['login', 'register', 'resetpassword']
      if (publicPages.includes(to.name)) return next()

      const isLoggedIn = user.value || (await initUser())
      if (!isLoggedIn || !user.value?.accessToken) {
        console.warn('🔒 No logged-in user or token')
        return next({ name: 'login' })
      }

      const decoded = decodeJWT(user.value.accessToken)
      const now = Math.floor(Date.now() / 1000)
      if (decoded?.exp && decoded.exp < now) {
        const newToken = await refreshToken()
        if (!newToken) return next({ name: 'login' })
      }

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
    status,
    registerAccount,
    loginAccount,
    logoutAccount,
    refreshToken,
    apiRequest,
    useAuthGuard,
    fetchUserFromBackend,
    loadUserFromBackend
  }
})
// import { defineStore } from 'pinia'
// import { ref } from 'vue'
// import axios from 'axios'
// import { auth } from '@/firebase/firebaseConfig'
// import {
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged
// } from 'firebase/auth'
// import { jwtDecode } from 'jwt-decode'

// export const useAuthManager = defineStore('authManager', () => {
//   // -----------------------
//   // STATE
//   // -----------------------
//   const user = ref(null)
//   const isLoading = ref(false)
//   const errorMessage = ref('')
//   const successMessage = ref('')
//   const status = ref(null)

//   const decodeJWT = (token) => {
//     try {
//       return jwtDecode(token)
//     } catch {
//       return null
//     }
//   }

//   // -----------------------
//   // FETCH USER จาก backend
//   // -----------------------
//   const fetchUserFromBackend = async () => {
//     try {
//       const currentUser = auth.currentUser
//       if (!currentUser) throw new Error('No authenticated Firebase user.')

//       const idToken = await currentUser.getIdToken()
//       const baseURL = import.meta.env.VITE_BASE_URL
//       const response = await axios.get(`${baseURL}/auth/verify`, {
//         headers: { Authorization: `Bearer ${idToken}` }
//       })

//       const data = response.data
//       if (!data?.authenticated) throw new Error('User verification failed.')

//       user.value = {
//         id: data.userId,
//         email: data.email,
//         fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
//         role: data.role,
//         accessToken: idToken,
//         ...(data.role === 'STAFF'
//           ? { position: data.position || '' }
//           : {
//               dormId: data.dorm_id != null ? Number(data.dorm_id) : null,
//               roomNumber: data.room_number || ''
//             })
//       }

//       return user.value
//     } catch (err) {
//       console.error('fetchUserFromBackend error:', err)
//       user.value = null
//       return null
//     }
//   }

//   const loadUserFromBackend = async () => {
//     try {
//       const currentUser = auth.currentUser
//       if (!currentUser) return false
//       const userData = await fetchUserFromBackend()
//       return !!userData
//     } catch (err) {
//       console.error('loadUserFromBackend error:', err)
//       return false
//     }
//   }
//   const initUser = () => {
//     return new Promise((resolve) => {
//       onAuthStateChanged(auth, async (firebaseUser) => {
//         if (firebaseUser) {
//           await loadUserFromBackend() // โหลดข้อมูล user จาก backend
//           resolve(true)
//         } else {
//           user.value = null
//           resolve(false)
//         }
//       })
//     })
//   }
//   // -----------------------
//   // REGISTER
//   // -----------------------
//   const registerAccount = async (formData, router) => {
//     isLoading.value = true
//     errorMessage.value = ''
//     successMessage.value = ''
//     user.value = null
//     status.value = null // ✅ reset ทุกครั้งก่อนเริ่ม

//     const role = String(formData.role || '').toUpperCase()
//     if (!['RESIDENT', 'STAFF'].includes(role)) {
//       errorMessage.value = 'Invalid role.'
//       isLoading.value = false
//       return
//     }

//     let payload = { ...formData, role }

//     if (role === 'RESIDENT') {
//       const dormIdNum = Number(formData.dormId)
//       if (!Number.isFinite(dormIdNum) || dormIdNum <= 0) {
//         errorMessage.value = 'Please select a valid dormitory.'
//         isLoading.value = false
//         return
//       }
//       if (!formData.roomNumber?.trim()) {
//         errorMessage.value = 'Room number is required.'
//         isLoading.value = false
//         return
//       }
//       payload = {
//         ...payload,
//         dormId: dormIdNum,
//         roomNumber: formData.roomNumber.trim()
//       }
//     } else if (role === 'STAFF') {
//       if (!formData.position?.trim()) {
//         errorMessage.value = 'Position is required for staff.'
//         isLoading.value = false
//         return
//       }
//       payload = { ...payload, position: formData.position.trim() }
//     }

//     const baseURL = import.meta.env.VITE_BASE_URL

//     // ✅ ใช้ then/catch เพื่อเก็บ status (ไม่โยน error)
//     await axios
//       .post(`${baseURL}/auth/register`, payload)
//       .then(async (response) => {
//         status.value = response.status // ✅ บันทึกสถานะ 200 หรือ 201
//         if (!response.data?.userId) {
//           errorMessage.value = 'Registration failed on backend.'
//           return
//         }

//         // ✅ Register Firebase
//         const cred = await createUserWithEmailAndPassword(
//           auth,
//           formData.email,
//           formData.password
//         )
//         const idToken = await cred.user.getIdToken()

//         user.value = {
//           id: response.data.userId,
//           email: formData.email,
//           fullName: formData.fullName,
//           role,
//           accessToken: idToken,
//           ...(role === 'STAFF' ? { position: formData.position } : {}),
//           ...(role === 'RESIDENT'
//             ? { dormId: formData.dormId, roomNumber: formData.roomNumber }
//             : {})
//         }

//         successMessage.value = 'Account created successfully!'

//         if (router) {
//           if (role === 'RESIDENT')
//             router.replace({
//               name: 'home',
//               params: { id: response.data.userId }
//             })
//           else if (role === 'STAFF')
//             router.replace({
//               name: 'homestaff',
//               params: { id: response.data.userId }
//             })
//         }
//       })
//       .catch((error) => {
//         status.value = error.response?.status || 500 // ✅ เก็บ status จาก backend
//         if (status.value === 409) {
//           errorMessage.value = 'อีเมลนี้ถูกใช้แล้ว'
//         } else {
//           errorMessage.value =
//             error.response?.data?.message || 'Registration failed.'
//         }
//       })
//       .finally(() => {
//         isLoading.value = false
//       })
//   }

//   // -----------------------
//   // LOGIN
//   // -----------------------
//   const loginAccount = async (email, password, router) => {
//     isLoading.value = true
//     errorMessage.value = ''
//     successMessage.value = ''

//     try {
//       const userCredential = await signInWithEmailAndPassword(
//         auth,
//         email,
//         password
//       )
//       const firebaseUser = userCredential.user
//       const idToken = await firebaseUser.getIdToken()

//       const response = await axios.get(
//         `${import.meta.env.VITE_BASE_URL}/auth/verify`,
//         {
//           headers: { Authorization: `Bearer ${idToken}` }
//         }
//       )

//       const data = response.data
//       if (!data?.authenticated) throw new Error('Verify failed')

//       user.value = {
//         id: data.userId,
//         email: data.email,
//         fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
//         role: data.role,
//         accessToken: idToken,
//         ...(data.role === 'STAFF'
//           ? { position: data.position || '' }
//           : {
//               dormId: data.dorm_id != null ? Number(data.dorm_id) : null,
//               roomNumber: data.room_number || ''
//             })
//       }

//       successMessage.value = `Login successful as ${data.role}!`

//       if (router) {
//         if (data.role === 'RESIDENT')
//           router.replace({ name: 'home', params: { id: data.userId } })
//         else if (data.role === 'STAFF')
//           router.replace({ name: 'homestaff', params: { id: data.userId } })
//       }

//       return user.value
//     } catch (err) {
//       console.error('Login error:', err)
//       errorMessage.value =
//         err.response?.data?.message || err.message || 'Login failed'
//       return null
//     } finally {
//       isLoading.value = false
//     }
//   }

//   // -----------------------
//   // LOGOUT
//   // -----------------------
//   const logoutAccount = async (router) => {
//     try {
//       await signOut(auth)
//     } catch (err) {
//       console.error('Logout error:', err)
//     } finally {
//       user.value = null
//       await router?.replace({ name: 'login' })
//     }
//   }

//   // -----------------------
//   // REFRESH TOKEN
//   // -----------------------
//   const refreshToken = async () => {
//     try {
//       if (auth.currentUser) {
//         const newToken = await auth.currentUser.getIdToken(true)
//         if (user.value) user.value.accessToken = newToken
//         return newToken
//       }
//       return null
//     } catch (err) {
//       console.error('Refresh token error:', err)
//       await logoutAccount()
//       return null
//     }
//   }

//   // -----------------------
//   // API REQUEST
//   // -----------------------
//   const apiRequest = async (url, options = {}) => {
//     try {
//       let token = user.value?.accessToken
//       if (!token) throw new Error('No access token available')

//       const decoded = decodeJWT(token)
//       const now = Math.floor(Date.now() / 1000)
//       if (decoded?.exp && decoded.exp < now) {
//         token = await refreshToken()
//         if (!token) throw new Error('Token expired')
//       }

//       const headers = { ...options.headers, Authorization: `Bearer ${token}` }
//       const response = await axios({ url, ...options, headers })
//       return response.data
//     } catch (err) {
//       console.error('API request error:', err)
//       throw err
//     }
//   }

//   // -----------------------
//   // NAVIGATION GUARD
//   // -----------------------
//   const useAuthGuard = (router) => {
//     router.beforeEach(async (to, from, next) => {
//       const publicPages = ['login', 'register', 'resetpassword']
//       if (publicPages.includes(to.name)) return next()

//       // รอ Firebase initialize
//       const isLoggedIn = user.value || (await initUser())
//       if (!isLoggedIn) return next({ name: 'login' })

//       // ตรวจสอบ token หมดอายุ
//       const decoded = decodeJWT(user.value.accessToken)
//       const now = Math.floor(Date.now() / 1000)
//       if (decoded?.exp && decoded.exp < now) {
//         const newToken = await refreshToken()
//         if (!newToken) return next({ name: 'login' })
//       }

//       // ตรวจสอบ role
//       if (
//         (to.name === 'home' && user.value.role !== 'RESIDENT') ||
//         (to.name === 'homestaff' && user.value.role !== 'STAFF')
//       ) {
//         return next({ name: 'login' })
//       }

//       next()
//     })
//   }

//   return {
//     user,
//     isLoading,
//     errorMessage,
//     successMessage,
//     status,
//     registerAccount,
//     loginAccount,
//     logoutAccount,
//     refreshToken,
//     apiRequest,
//     useAuthGuard,
//     fetchUserFromBackend,
//     loadUserFromBackend
//   }
// })
