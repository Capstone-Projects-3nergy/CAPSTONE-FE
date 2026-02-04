import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/firebaseConfig'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth'
import { jwtDecode } from 'jwt-decode'
import { useNotificationManager } from './NotificationManager'

export const useAuthManager = defineStore('authManager', () => {
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
  const fetchUserFromBackend = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        return null
      }

      const idToken = await currentUser.getIdToken()
      const baseURL = import.meta.env.VITE_BASE_URL

      const response = await axios.post(
        `${baseURL}/api/auth/login`,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      )

      const data = response.data
      if (!data || !data.userId || !data.email) {
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
              dormId: data.dormId ?? null,
              roomNumber: data.roomNumber || ''
            })
      }

      return user.value
    } catch (err) {
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
      return false
    }
  }

  const initUser = () => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          let ok = await loadUserFromBackend()
          if (!ok) {
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

      const payload = {
        email: formData.email?.trim(),
        password: formData.password,
        firstName: formData.firstName?.trim(),
        lastName: formData.lastName?.trim(),
        role
      }

      if (role === 'RESIDENT') {
        if (!formData.dormId)
          throw new Error('Dormitory selection is required.')
        payload.dormId = formData.dormId
        if (formData.roomNumber?.trim())
          payload.roomNumber = formData.roomNumber.trim()
      } else if (role === 'STAFF') {
        if (!formData.position?.trim())
          throw new Error('Position is required for staff.')
        payload.position = formData.position.trim()
      }

      const baseURL = import.meta.env.VITE_BASE_URL
      const res = await axios.post(`${baseURL}/api/auth/signup`, payload)
      // 🔽 ADD ตรงนี้ // login Firebase เพื่อให้ได้ currentUser
      const cred = await signInWithEmailAndPassword(
        auth,
        payload.email,
        payload.password
      )
      // ส่ง verify email
      await sendEmailVerification(cred.user)

      successMessage.value =
        'Account registered successfully. Please check your email to verify your account.'
      status.value = res.status
      successMessage.value = 'Account registered successfully! Please login.'

      return { status: res.status, message: successMessage.value }
    } catch (error) {
      if (error.response) {
        status.value = error.response.status
        errorMessage.value =
          error.response.data?.message ||
          error.message ||
          'Registration failed.'
      } else if (error.request) {
        status.value = null
        errorMessage.value = 'Network error. Please try again.'
      } else {
        status.value = null
        errorMessage.value = error.message
      }

      return { status: status.value, error: errorMessage.value }
    } finally {
      isLoading.value = false
    }
  }
  const loginAccount = async (email, password, router) => {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    user.value = null
    status.value = null

    try {
      if (!email || !password) {
        throw {
          response: {
            status: 400,
            data: { message: 'Email and password are required' }
          }
        }
      }

      let cred
      try {
        cred = await signInWithEmailAndPassword(auth, email, password)
        if (!cred.user.emailVerified) {
          throw {
            response: {
              status: 401,
              data: { message: 'Please verify your email before login.' }
            }
          }
        }
      } catch (firebaseErr) {
        const firebaseCodes = [
          'auth/invalid-credential',
          'auth/wrong-password',
          'auth/user-not-found',
          'auth/invalid-email'
        ]

        if (firebaseCodes.includes(firebaseErr.code)) {
          throw {
            response: {
              status: 400,
              data: { message: 'Invalid email or password.' }
            }
          }
        }

        throw firebaseErr
      }

      const idToken = await cred.user.getIdToken()
      const baseURL = import.meta.env.VITE_BASE_URL

      const res = await axios.post(
        `${baseURL}/api/auth/login`,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      )

      const data = res.data

      if (!data?.userId || !data?.role) {
        throw {
          response: {
            status: 500,
            data: {
              message: 'Backend verification failed: missing userId/role'
            }
          }
        }
      }

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
              dormId: data.dormId ?? null,
              roomNumber: data.roomNumber ?? null
            }
          : {})
      }

      status.value = res.status
      successMessage.value = data.message || `Login successful as ${data.role}!`

      if (router) {
        switch (data.role) {
          case 'RESIDENT':
            router.replace({
              name: 'home',
              params: { id: data.userId }
            })
            break

          case 'STAFF':
            router.replace({
              name: 'homestaff',
              params: { id: data.userId }
            })
            break

          case 'SHIPPING':
            router.replace({
              name: 'parcelscannershipping',
              params: { id: data.userId }
            })
            break

          default:
            router.replace({
              name: 'parcelscanner'
            })
            break
        }
      }

      return {
        status: res.status,
        user: user.value,
        message: successMessage.value
      }
    } catch (err) {
      if (err.response) {
        status.value = err.response.status
        errorMessage.value =
          err.response.data?.message || err.message || 'Login failed.'
      } else if (err.request) {
        status.value = 500
        errorMessage.value = 'Network error. Please check your connection.'
      } else {
        status.value = 500
        errorMessage.value = err.message || 'Login failed.'
      }

      user.value = null

      return {
        status: status.value,
        error: errorMessage.value
      }
    } finally {
      isLoading.value = false
    }
  }
  const logoutAccount = async (router) => {
  try {
    const token = user.value?.accessToken
    const baseURL = import.meta.env.VITE_BASE_URL

    // 🔹 เรียก backend logout เฉพาะกรณีมี token และออนไลน์
    if (token && navigator.onLine) {
      try {
        await axios.post(
          `${baseURL}/api/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            timeout: 5000 // กันค้าง
          }
        )
      } catch (apiErr) {
        // ❗ ไม่ต้อง console.error
        console.warn('Backend logout failed, continue frontend logout')
      }
    }

    // 🔹 logout Firebase
    await signOut(auth)
  } finally {
    // ✅ เคลียร์ notification state & localStorage
    useNotificationManager().clearNotifications()
    
    // ✅ เคลียร์ state เสมอ
    user.value = null
    await router?.replace({ name: 'login' })
  }
}

  // const logoutAccount = async (router) => {
  //   try {
  //     if (user.value?.accessToken) {
  //       const baseURL = import.meta.env.VITE_BASE_URL

  //       await axios.post(
  //         `${baseURL}/api/auth/logout`,
  //         {},
  //         {
  //           headers: {
  //             Authorization: `Bearer ${user.value.accessToken}`
  //           }
  //         }
  //       )
  //     }

  //     await signOut(auth)
  //   } catch (err) {
  //     console.error('Logout error:', err)
  //   } finally {
  //     user.value = null
  //     await router?.replace({ name: 'login' })
  //   }
  // }

  // const logoutAccount = async (router) => {
  //   try {
  //     await signOut(auth)
  //   } catch (err) {
  //   } finally {
  //     user.value = null
  //     await router?.replace({ name: 'login' })
  //   }
  // }

  const refreshToken = async () => {
    try {
      if (auth.currentUser) {
        const newToken = await auth.currentUser.getIdToken(true)
        if (user.value) user.value.accessToken = newToken
        return newToken
      }
      return null
    } catch (err) {
      await logoutAccount()
      return null
    }
  }

  const apiRequest = async (url, options = {}) => {
    try {
      if (!user.value) await initUser()

      let token = user.value?.accessToken
      if (!token) token = await refreshToken()
      if (!token) throw new Error('No access token available after refresh')

      const decoded = decodeJWT(token)
      const now = Math.floor(Date.now() / 1000)
      if (decoded?.exp && decoded.exp < now) token = await refreshToken()

      const headers = { ...options.headers, Authorization: `Bearer ${token}` }
      const response = await axios({ url, ...options, headers })
      return response.data
    } catch (err) {
      throw err
    }
  }
  const useAuthGuard = (router) => {
    router.beforeEach(async (to, from, next) => {
      const publicPages = [
        'login',
        'register',
        'resetpassword',
        'parcelscannershipping'
      ]
      if (publicPages.includes(to.name)) return next()

      const isLoggedIn = user.value || (await initUser())
      if (!isLoggedIn || !user.value?.accessToken)
        return next({ name: 'login' })

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
  const updateUser = (updatedProfile) => {
    if (!user.value || !updatedProfile) return

    // update name
    if (updatedProfile.firstName || updatedProfile.lastName) {
      user.value.fullName =
        `${updatedProfile.firstName ?? ''} ${updatedProfile.lastName ?? ''}`.trim()
    }

    // update email
    if (updatedProfile.email) {
      user.value.email = updatedProfile.email
    }

    // role specific
    if (user.value.role === 'STAFF') {
      if ('position' in updatedProfile) {
        user.value.position = updatedProfile.position
      }
    }

    if (user.value.role === 'RESIDENT') {
      if ('roomNumber' in updatedProfile) {
        user.value.roomNumber = updatedProfile.roomNumber
      }
    }

    // avatar (ถ้ามี)
    if (updatedProfile.avatar) {
      user.value.avatar = updatedProfile.avatar
    }
  }

  return {
    user,
    isLoading,
    errorMessage,
    successMessage,
    status,
    updateUser,
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
