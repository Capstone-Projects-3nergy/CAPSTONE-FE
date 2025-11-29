import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/firebaseConfig'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { jwtDecode } from 'jwt-decode'

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

  // const loginAccount = async (email, password, router) => {
  //   isLoading.value = true
  //   errorMessage.value = ''
  //   successMessage.value = ''
  //   user.value = null
  //   status.value = null

  //   try {
  //     if (!email || !password) {
  //       throw {
  //         response: {
  //           status: 400,
  //           data: { message: 'Email and password are required' }
  //         }
  //       }
  //     }

  //     let cred
  //     try {
  //       cred = await signInWithEmailAndPassword(auth, email, password)
  //     } catch (firebaseErr) {
  //       const firebaseCodes = [
  //         'auth/invalid-credential',
  //         'auth/wrong-password',
  //         'auth/user-not-found',
  //         'auth/invalid-email'
  //       ]

  //       if (firebaseCodes.includes(firebaseErr.code)) {
  //         throw {
  //           response: {
  //             status: 400,
  //             data: { message: 'Invalid email or password.' }
  //           }
  //         }
  //       }

  //       throw firebaseErr
  //     }

  //     const idToken = await cred.user.getIdToken()
  //     const baseURL = import.meta.env.VITE_BASE_URL

  //     const res = await axios.post(
  //       `${baseURL}/api/auth/login`,
  //       {},
  //       { headers: { Authorization: `Bearer ${idToken}` } }
  //     )

  //     const data = res.data

  //     if (!data?.userId || !data?.role) {
  //       throw {
  //         response: {
  //           status: 500,
  //           data: {
  //             message: 'Backend verification failed: missing userId/role'
  //           }
  //         }
  //       }
  //     }

  //     const fullName = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim()
  //     user.value = {
  //       id: data.userId,
  //       uid: data.firebaseUid,
  //       email: data.email,
  //       fullName,
  //       role: data.role,
  //       accessToken: idToken,
  //       ...(data.role === 'STAFF' ? { position: data.position ?? null } : {}),
  //       ...(data.role === 'RESIDENT'
  //         ? {
  //             dormId: data.dormId ?? null,
  //             roomNumber: data.roomNumber ?? null
  //           }
  //         : {})
  //     }

  //     status.value = res.status
  //     successMessage.value = data.message || `Login successful as ${data.role}!`

  //     if (router) {
  //       if (data.role === 'RESIDENT')
  //         router.replace({ name: 'home', params: { id: data.userId } })
  //       else if (data.role === 'STAFF')
  //         router.replace({ name: 'homestaff', params: { id: data.userId } })
  //       else router.replace({ name: 'parcelscanner' })
  //     }

  //     return {
  //       status: res.status,
  //       user: user.value,
  //       message: successMessage.value
  //     }
  //   } catch (err) {
  //     if (err.response) {
  //       status.value = err.response.status
  //       errorMessage.value =
  //         err.response.data?.message || err.message || 'Login failed.'
  //     } else if (err.request) {
  //       status.value = 500
  //       errorMessage.value = 'Network error. Please check your connection.'
  //     } else {
  //       status.value = 500
  //       errorMessage.value = err.message || 'Login failed.'
  //     }

  //     user.value = null

  //     return {
  //       status: status.value,
  //       error: errorMessage.value
  //     }
  //   } finally {
  //     isLoading.value = false
  //   }
  // }

  const logoutAccount = async (router) => {
    try {
      await signOut(auth)
    } catch (err) {
    } finally {
      user.value = null
      await router?.replace({ name: 'login' })
    }
  }

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
      const publicPages = ['login', 'register', 'resetpassword']
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
