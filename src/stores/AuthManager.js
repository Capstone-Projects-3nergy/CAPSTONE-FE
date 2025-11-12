import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/firebaseConfig'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken
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

      const response = await axios.post(
        `${baseURL}/api/auth/login`,
        {}, // ไม่มี body
        {
          headers: { Authorization: `Bearer ${idToken}` }
        }
      )

      const data = response.data
      if (!data || !data.userId || !data.email) {
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

    try {
      const role = String(formData.role || '').toUpperCase()
      if (!['RESIDENT', 'STAFF'].includes(role))
        throw new Error('Invalid role.')

      // 🚩 ทำ payload ให้ "ตรงกับ backend" ตอนนี้ใช้ dormName ไม่ใช่ dormId
      const payload = {
        email: formData.email?.trim(),
        password: formData.password, // backend จะสร้าง Firebase user ให้
        firstName: formData.firstName?.trim(),
        lastName: formData.lastName?.trim(),
        role
      }

      if (role === 'RESIDENT') {
        if (!formData.dormName?.trim())
          throw new Error('Dorm name is required for residents.')
        payload.dorm = { dormName: formData.dormName.trim() }

        // payload.dormName = formData.dormName.trim()
        // ถ้าอยากเก็บห้องด้วย ต้องให้ backend รองรับใน SignUpRequest และ set ลง Users
        if (formData.roomNumber?.trim())
          payload.roomNumber = formData.roomNumber.trim()
      } else if (role === 'STAFF') {
        if (!formData.position?.trim())
          throw new Error('Position is required for staff.')
        payload.position = formData.position.trim()
      }

      const baseURL = import.meta.env.VITE_BASE_URL
      console.log(payload)
      // ❌ ห้ามส่ง Authorization ใน signup (backend ไม่ต้องใช้ และ idToken ก็ไม่มี)
      const res = await axios.post(`${baseURL}/api/auth/signup`, payload)

      status.value = res.status
      console.log('✅ Backend response:', res.data)

      // backend ตอนนี้คืน { FirebaseUid, email, message } → ไม่มี userId
      successMessage.value = 'Account registered successfully! Please login.'

      // จากนั้นให้ผู้ใช้ไปล็อกอิน (ด้วย email/password) → ฟรอนต์จะได้ idToken แล้ว verify ที่ /login
    } catch (error) {
      status.value = error.response?.status || 500
      if (status.value === 409) errorMessage.value = 'อีเมลนี้ถูกใช้แล้ว'
      else
        errorMessage.value =
          error.response?.data?.message ||
          error.message ||
          'Registration failed.'
    } finally {
      isLoading.value = false
    }
  }

  // const registerAccount = async (formData, router) => {
  //   isLoading.value = true
  //   errorMessage.value = ''
  //   successMessage.value = ''
  //   user.value = null
  //   status.value = null

  //   const role = String(formData.role || '').toUpperCase()
  //   if (!['RESIDENT', 'STAFF'].includes(role)) {
  //     errorMessage.value = 'Invalid role.'
  //     isLoading.value = false
  //     return
  //   }

  //   let payload = { ...formData, role }

  //   if (role === 'RESIDENT') {
  //     const dormIdNum = Number(formData.dormId)
  //     if (!Number.isFinite(dormIdNum) || dormIdNum <= 0) {
  //       errorMessage.value = 'Please select a valid dormitory.'
  //       isLoading.value = false
  //       return
  //     }
  //     if (!formData.roomNumber?.trim()) {
  //       errorMessage.value = 'Room number is required.'
  //       isLoading.value = false
  //       return
  //     }
  //     payload = {
  //       ...payload,
  //       dormId: dormIdNum,
  //       roomNumber: formData.roomNumber.trim()
  //     }
  //   } else if (role === 'STAFF') {
  //     if (!formData.position?.trim()) {
  //       errorMessage.value = 'Position is required for staff.'
  //       isLoading.value = false
  //       return
  //     }
  //     payload = { ...payload, position: formData.position.trim() }
  //   }

  //   const baseURL = import.meta.env.VITE_BASE_URL
  //   try {
  //     // const response = await axios.post(`${baseURL}/api/auth/register`, payload)
  //     const response = await axios.post(`${baseURL}/api/auth/signup`, payload, {
  //       headers: {
  //         Authorization: `Bearer ${idToken}`
  //       }
  //     })
  //     status.value = response.status
  //     console.log('✅ Backend response:', response)
  //     console.log('📄 Backend response data:', response.data)

  //     if (!response.data?.userId) {
  //       errorMessage.value = 'Registration failed on backend.'
  //       return
  //     }

  //     successMessage.value = 'Account registered successfully! Please login.'
  //     // ไม่สร้าง Firebase UID ที่นี่
  //   } catch (error) {
  //     status.value = error.response?.status || 500
  //     if (status.value === 409) {
  //       errorMessage.value = 'อีเมลนี้ถูกใช้แล้ว'
  //     } else {
  //       errorMessage.value =
  //         error.response?.data?.message || 'Registration failed.'
  //     }
  //   } finally {
  //     isLoading.value = false
  //   }
  // }

  // -----------------------
  // LOGIN (backend สร้าง Firebase UID)
  // -----------------------
  const loginAccount = async (email, password, router) => {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    user.value = null
    status.value = null

    try {
      if (!email || !password)
        throw new Error('Email and password are required')

      // 1) Firebase sign-in
      const cred = await signInWithEmailAndPassword(auth, email, password)

      // 2) Get ID token
      const idToken = await cred.user.getIdToken()

      // 3) Verify กับ backend
      const baseURL = import.meta.env.VITE_BASE_URL
      const res = await axios.post(
        `${baseURL}/api/auth/login`,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      )

      const data = res.data

      if (!data?.userId || !data?.role) {
        throw new Error('Backend verification failed: missing userId/role')
      }

      // 4) map state ผู้ใช้
      const fullName = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim()
      user.value = {
        id: data.userId,
        uid: data.firebaseUid,
        email: data.email,
        fullName,
        role: data.role,
        accessToken: idToken,
        ...(data.role === 'STAFF' ? { position: data.position ?? null } : {}),
        ...(data.role === 'RESIDENT'
          ? {
              dormName: data.dormName ?? null,
              roomNumber: data.roomNumber ?? null
            }
          : {})
      }

      successMessage.value = data.message || `Login successful as ${data.role}!`

      // 5) Redirect ตาม role (ถ้าต้องการ param id)
      if (router) {
        if (data.role === 'RESIDENT') {
          router.replace({ name: 'home', params: { id: data.userId } })
        } else if (data.role === 'STAFF') {
          router.replace({ name: 'homestaff', params: { id: data.userId } })
        } else {
          router.replace({ name: 'dashboard' }) // สำรองสำหรับ ADMIN/อื่น ๆ
        }
      }

      return user.value
    } catch (err) {
      console.error('❌ Login error:', err)
      const msg =
        err.response?.data?.message ||
        (err.code === 'auth/user-not-found'
          ? 'Account not found. Please sign up first.'
          : null) ||
        err.message ||
        'Login failed.'
      errorMessage.value = msg
      user.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  // const loginAccount = async (email, password, router) => {
  //   isLoading.value = true
  //   errorMessage.value = ''
  //   successMessage.value = ''
  //   user.value = null
  //   status.value = null

  //   if (!email || !password) {
  //     errorMessage.value = 'Email and password are required'
  //     isLoading.value = false
  //     return null
  //   }

  //   const baseURL = import.meta.env.VITE_BASE_URL

  //   try {
  //     // 1️⃣ Login ด้วย Firebase
  //     const firebaseUserCredential = await signInWithEmailAndPassword(
  //       auth,
  //       email,
  //       password
  //     )
  //     console.log('✅ Firebase login successful')

  //     // 2️⃣ ดึง Firebase ID token
  //     const idToken = await firebaseUserCredential.user.getIdToken()

  //     // 3️⃣ ส่ง token ไป backend เพื่อ verify
  //     const response = await axios.post(
  //       `${baseURL}/api/auth/login`,
  //       {}, // ไม่มี body
  //       { headers: { Authorization: `Bearer ${idToken}` } }
  //     )

  //     const data = response.data
  //     if (!data?.FirebaseUid) throw new Error('Backend verification failed')

  //     // 4️⃣ เก็บ user state
  //     user.value = {
  //       id: data.FirebaseUid,
  //       email: data.email,
  //       accessToken: idToken
  //     }

  //     successMessage.value = 'Login successful!'

  //     // 5️⃣ Redirect หลัง login (ตอนนี้ backend ยังไม่ส่ง role → redirect ไปหน้าเดียว)
  //     if (router)
  //       router.replace({ name: 'home', params: { id: data.FirebaseUid } })

  //     return user.value
  //   } catch (err) {
  //     console.error('❌ Login error:', err)
  //     errorMessage.value =
  //       err.response?.data?.message || err.message || 'Login failed.'
  //     user.value = null
  //     return null
  //   } finally {
  //     isLoading.value = false
  //   }
  // }

  // const loginAccount = async (email, password, router) => {
  //   isLoading.value = true
  //   errorMessage.value = ''
  //   successMessage.value = ''
  //   user.value = null
  //   status.value = null

  //   if (!email || !password) {
  //     errorMessage.value = 'Email and password are required'
  //     isLoading.value = false
  //     return null
  //   }

  //   const baseURL = import.meta.env.VITE_BASE_URL

  //   try {
  //     let firebaseUserCredential

  //     // 1️⃣ พยายาม login ด้วย Firebase
  //     try {
  //       firebaseUserCredential = await signInWithEmailAndPassword(
  //         auth,
  //         email,
  //         password
  //       )
  //       console.log('✅ Firebase login successful')
  //     } catch (firebaseErr) {
  //       console.log('🔥 Firebase login failed:', firebaseErr.code)

  //       if (firebaseErr.code) {
  //         // 2️⃣ สร้าง Firebase user ใหม่
  //         firebaseUserCredential = await createUserWithEmailAndPassword(
  //           auth,
  //           email,
  //           password
  //         )
  //         console.log('✅ Created new Firebase user')
  //       } else if (firebaseErr.code === 'auth/wrong-password') {
  //         throw new Error('Incorrect password')
  //       } else {
  //         throw firebaseErr
  //       }
  //     }

  //     // 3️⃣ ดึง Firebase ID token
  //     const idToken = await firebaseUserCredential.user.getIdToken()

  //     // 4️⃣ ส่ง token ไป backend เพื่อ verify user & link Firebase UID
  //     const response = await axios.post(
  //       `${baseURL}/api/auth/login`,
  //       {}, // ไม่มี body
  //       {
  //         headers: { Authorization: `Bearer ${idToken}` }
  //       }
  //     )
  //     const data = response.data
  //     if (!data?.userId) throw new Error('Backend verification failed')

  //     // 5️⃣ เก็บ user state
  //     const role = data.role
  //     user.value = {
  //       id: data.userId,
  //       email: data.email,
  //       fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
  //       role,
  //       accessToken: idToken,
  //       ...(role === 'STAFF' ? { position: data.position ?? null } : {}),
  //       ...(role === 'RESIDENT'
  //         ? {
  //             dormId: data.dormName ?? null,
  //             roomNumber: data.roomNumber ?? null
  //           }
  //         : {})
  //     }

  //     successMessage.value = `Login successful as ${role}!`

  //     // 6️⃣ Redirect ตาม role
  //     if (router) {
  //       if (role === 'RESIDENT')
  //         router.replace({ name: 'home', params: { id: data.userId } })
  //       else if (role === 'STAFF')
  //         router.replace({ name: 'homestaff', params: { id: data.userId } })
  //     }

  //     return user.value
  //   } catch (err) {
  //     console.error('❌ Login error:', err)
  //     errorMessage.value =
  //       err.response?.data?.message || err.message || 'Login failed.'
  //     user.value = null
  //     return null
  //   } finally {
  //     isLoading.value = false
  //   }
  // }

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
// version create firebase in register
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
//       if (!currentUser) return null

//       const idToken = await currentUser.getIdToken()
//       const baseURL = import.meta.env.VITE_BASE_URL

//       const response = await axios.post(`${baseURL}/auth/verify`, {
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
//               dormId: data.dormName ?? null,
//               roomNumber: data.roomNumber ?? ''
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
//           let ok = await loadUserFromBackend()
//           if (!ok) {
//             await new Promise((r) => setTimeout(r, 500))
//             ok = await loadUserFromBackend()
//           }
//           resolve(ok)
//         } else {
//           user.value = null
//           resolve(false)
//         }
//       })
//     })
//   }

//   // -----------------------
//   // REGISTER (สร้าง Firebase แต่ยังไม่เก็บใน backend)
//   // -----------------------
//   const registerAccount = async (formData) => {
//     isLoading.value = true
//     errorMessage.value = ''
//     successMessage.value = ''
//     user.value = null
//     status.value = null

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
//     try {
//       // 1️⃣ สร้าง Firebase user
//       let firebaseUserCredential
//       try {
//         firebaseUserCredential = await createUserWithEmailAndPassword(
//           auth,
//           formData.email,
//           formData.password
//         )
//         console.log('✅ Firebase user created during registration')
//       } catch (firebaseErr) {
//         errorMessage.value =
//           firebaseErr.message || 'Firebase registration failed.'
//         return
//       }

//       // 2️⃣ ส่งข้อมูลไป backend (ยังไม่ส่ง UID)
//       const response = await axios.post(`${baseURL}/auth/register`, payload)
//       status.value = response.status

//       if (!response.data?.userId) {
//         errorMessage.value = 'Registration failed on backend.'
//         return
//       }

//       successMessage.value = 'Account registered successfully! Please login.'
//     } catch (error) {
//       status.value = error.response?.status || 500
//       if (status.value === 409) {
//         errorMessage.value = 'อีเมลนี้ถูกใช้แล้ว'
//       } else {
//         errorMessage.value =
//           error.response?.data?.message || 'Registration failed.'
//       }
//     } finally {
//       isLoading.value = false
//     }
//   }

//   // -----------------------
//   // LOGIN (เชื่อม Firebase UID กับ backend)
//   // -----------------------
//   const loginAccount = async (email, password, router) => {
//     isLoading.value = true
//     errorMessage.value = ''
//     successMessage.value = ''
//     user.value = null
//     status.value = null

//     if (!email || !password) {
//       errorMessage.value = 'Email and password are required'
//       isLoading.value = false
//       return null
//     }

//     const baseURL = import.meta.env.VITE_BASE_URL

//     try {
//       let firebaseUserCredential

//       try {
//         firebaseUserCredential = await signInWithEmailAndPassword(
//           auth,
//           email,
//           password
//         )
//         console.log('✅ Firebase login successful')
//       } catch (firebaseErr) {
//         if (firebaseErr.code === 'auth/user-not-found') {
//           // ตรวจสอบ backend ว่ามี user อีเมลนี้หรือยัง
//           const { data: backendUser } = await axios.post(
//             `${baseURL}/auth/verify`,
//             { params: { email } }
//           )
//           if (!backendUser?.firebaseUid) {
//             // ยังไม่มี UID → สร้าง Firebase user ใหม่
//             firebaseUserCredential = await createUserWithEmailAndPassword(
//               auth,
//               email,
//               password
//             )
//             console.log('✅ Created new Firebase user')

//             // ส่ง UID + email ไป backend เพื่อบันทึก
//             await axios.post(`${baseURL}/auth/verify`, {
//               params: { email, firebaseUid: firebaseUserCredential.user.uid }
//             })
//             console.log('✅ Linked Firebase UID to backend')
//           } else {
//             throw new Error(
//               'User exists in backend but missing in Firebase. Contact admin.'
//             )
//           }
//         } else if (firebaseErr.code === 'auth/wrong-password') {
//           throw new Error('Incorrect password')
//         } else {
//           throw firebaseErr
//         }
//       }

//       // ดึง Firebase ID token
//       const idToken = await firebaseUserCredential.user.getIdToken()

//       // ส่ง token ไป backend เพื่อ verify user & ดึงข้อมูล
//       const response = await axios.post(`${baseURL}/auth/verify`, {
//         headers: { Authorization: `Bearer ${idToken}` }
//       })
//       const data = response.data
//       if (!data?.userId) throw new Error('Backend verification failed')

//       // เก็บ user state
//       const role = data.role
//       user.value = {
//         id: data.userId,
//         email: data.email,
//         fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
//         role,
//         accessToken: idToken,
//         ...(role === 'STAFF' ? { position: data.position ?? null } : {}),
//         ...(role === 'RESIDENT'
//           ? {
//               dormId: data.dormName ?? null,
//               roomNumber: data.roomNumber ?? null
//             }
//           : {})
//       }

//       successMessage.value = `Login successful as ${role}!`

//       // Redirect ตาม role
//       if (router) {
//         if (role === 'RESIDENT')
//           router.replace({ name: 'home', params: { id: data.userId } })
//         else if (role === 'STAFF')
//           router.replace({ name: 'homestaff', params: { id: data.userId } })
//       }

//       return user.value
//     } catch (err) {
//       console.error('❌ Login error:', err)
//       errorMessage.value =
//         err.response?.data?.message || err.message || 'Login failed.'
//       user.value = null
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
//       if (!user.value) await initUser()
//       let token = user.value?.accessToken
//       if (!token) token = await refreshToken()
//       if (!token) throw new Error('No access token available after refresh')

//       const decoded = decodeJWT(token)
//       const now = Math.floor(Date.now() / 1000)
//       if (decoded?.exp && decoded.exp < now) token = await refreshToken()

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

//       const isLoggedIn = user.value || (await initUser())
//       if (!isLoggedIn || !user.value?.accessToken)
//         return next({ name: 'login' })

//       const decoded = decodeJWT(user.value.accessToken)
//       const now = Math.floor(Date.now() / 1000)
//       if (decoded?.exp && decoded.exp < now) {
//         const newToken = await refreshToken()
//         if (!newToken) return next({ name: 'login' })
//       }

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
//       if (!currentUser) {
//         console.warn('⚠️ No Firebase user yet, skipping verify.')
//         return null
//       }

//       const idToken = await currentUser.getIdToken()
//       const baseURL = import.meta.env.VITE_BASE_URL

//       const response = await axios.post(`${baseURL}/auth/verify`, {
//         headers: { Authorization: `Bearer ${idToken}` }
//       })
//       console.log('🔍 verify response:', response.data)
//       const data = response.data
//       if (!data?.authenticated) {
//         console.error('❌ Backend verify failed:', data)
//         throw new Error('User verification failed.')
//       }

//       user.value = {
//         id: data.userId,
//         email: data.email,
//         fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
//         role: data.role,
//         accessToken: idToken,
//         ...(data.role === 'STAFF'
//           ? { position: data.position || '' }
//           : {
//               dormId: data.dormName != null ? data.dormName : null,
//               roomNumber: data.roomNumber || ''
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
//           // 🔁 retry กันกรณี backend verify fail
//           let ok = await loadUserFromBackend()
//           if (!ok) {
//             console.warn('Retry loading user from backend...')
//             await new Promise((r) => setTimeout(r, 500))
//             ok = await loadUserFromBackend()
//           }
//           resolve(ok)
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
//     status.value = null

//     const role = String(formData.role || '').toUpperCase()
//     if (!['RESIDENT', 'STAFF'].includes(role)) {
//       errorMessage.value = 'Invalid role.'
//       isLoading.value = false
//       return
//     }

//     let payload = { ...formData, role }

//     if (role === 'RESIDENT') {
//       const dormIdNum = Number(formData.dormName)
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

//     await axios
//       .post(`${baseURL}/auth/register`, payload)
//       .then(async (response) => {
//         status.value = response.status
//         console.log('✅ Backend response:', response) // แสดง response ทั้ง object
//         console.log('📄 Backend response data:', response.data) // แสดง data ที่ backend ส่งกลับ
//         if (!response.data?.userId) {
//           errorMessage.value = 'Registration failed on backend.'
//           return
//         }

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
//             ? { dormId: formData.dormName, roomNumber: formData.roomNumber }
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
//         status.value = error.response?.status || 500
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

//       const response = await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/auth/verify`,
//         { headers: { Authorization: `Bearer ${idToken}` } }
//       )
//       console.log('🔍 verify response:', response.data)
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
//               dormId: data.dormName != null ? data.dormName : null,
//               roomNumber: data.roomNumber || ''
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
//       if (!user.value) {
//         console.warn('User not ready, waiting for init...')
//         await initUser()
//       }

//       let token = user.value?.accessToken
//       if (!token) {
//         console.warn('No token, fetching new one...')
//         token = await refreshToken()
//         if (!token) throw new Error('No access token available after refresh')
//       }

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

//       const isLoggedIn = user.value || (await initUser())
//       if (!isLoggedIn || !user.value?.accessToken) {
//         console.warn('🔒 No logged-in user or token')
//         return next({ name: 'login' })
//       }

//       const decoded = decodeJWT(user.value.accessToken)
//       const now = Math.floor(Date.now() / 1000)
//       if (decoded?.exp && decoded.exp < now) {
//         const newToken = await refreshToken()
//         if (!newToken) return next({ name: 'login' })
//       }

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
//       const response = await axios.post(`${baseURL}/auth/verify`, {
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

//       const response = await axios.post(
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
