import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/firebaseConfig'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import { jwtDecode } from 'jwt-decode'

export const useAuthManager = defineStore('authManager', () => {
  // 🟦 State
  const user = ref(null)
  const isLoading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  // 🧩 ฟังก์ชัน decode JWT
  const decodeJWT = (token) => {
    try {
      return jwtDecode(token)
    } catch {
      return null
    }
  }

  // 🟢 Register (สมัครสมาชิก)
  const registerAccount = async (formData) => {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    user.value = null

    try {
      const role = String(formData.role || '').toUpperCase()
      if (!['RESIDENT', 'STAFF'].includes(role))
        throw new Error('Invalid role.')

      let payload = { ...formData, role }

      if (role === 'RESIDENT') {
        const dormIdNum = Number(formData.dormId)
        if (!Number.isFinite(dormIdNum) || dormIdNum <= 0)
          throw new Error('Please select a valid dormitory.')
        if (!formData.roomNumber?.trim())
          throw new Error('Room number is required.')
        payload = {
          ...payload,
          dormId: dormIdNum,
          roomNumber: formData.roomNumber.trim()
        }
      } else if (role === 'STAFF') {
        if (!formData.position?.trim())
          throw new Error('Position is required for staff.')
        payload = { ...payload, position: formData.position.trim() }
      }

      const baseURL = import.meta.env.VITE_BASE_URL
      const response = await axios.post(
        `${baseURL}/public/auth/register`,
        payload
      )
      if (!response.data?.userId)
        throw new Error('Registration failed on backend.')

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
          ? { dormId: formData.dormId, roomNumber: formData.roomNumber }
          : {})
      }

      saveUserToLocalStorage(user.value)
      successMessage.value = 'Account created successfully!'
    } catch (error) {
      errorMessage.value =
        error?.response?.data?.message ||
        error.message ||
        'Registration failed.'
    } finally {
      isLoading.value = false
    }
  }

  // 🟣 Login (เข้าสู่ระบบ)
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
        { headers: { Authorization: `Bearer ${idToken}` } }
      )
      const data = response.data
      if (!data?.authenticated) throw new Error('Verify failed')

      user.value = {
        id: data.userId,
        email: data.email,
        fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
        role: data.role,
        accessToken: idToken,
        ...(data.role === 'STAFF' ? { position: data.position ?? '' } : {}),
        ...(data.role === 'RESIDENT'
          ? {
              dormId: Number(
                (data.dormId ?? localStorage.getItem('dormId')) || 0
              ),
              roomNumber:
                (data.roomNumber ?? localStorage.getItem('roomNumber')) || ''
            }
          : {})
      }

      saveUserToLocalStorage(user.value)
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

  // 🔴 Logout
  const logoutAccount = async (router) => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      localStorage.clear()
      router?.replace({ name: 'login' })
      window.location.reload()
    }
  }

  // 🟡 โหลดจาก localStorage
  const loadUserFromLocalStorage = () => {
    const token = localStorage.getItem('accessToken')
    const role = localStorage.getItem('userRole')
    const name = localStorage.getItem('userName')
    const email = localStorage.getItem('userEmail')
    const position = localStorage.getItem('position')
    const dormId = localStorage.getItem('dormId')
    const roomNumber = localStorage.getItem('roomNumber')

    if (!token || !role) return false

    user.value = {
      email,
      fullName: name,
      role,
      accessToken: token,
      ...(role === 'STAFF' ? { position } : {}),
      ...(role === 'RESIDENT' ? { dormId, roomNumber } : {})
    }

    return true
  }

  // 🧠 Refresh token
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

  // 🌐 สำหรับเรียก API พร้อม token ตรวจสอบอัตโนมัติ
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

  // 🔒 Navigation Guard (กันหน้า)
  const useAuthGuard = (router) => {
    router.beforeEach(async (to, from, next) => {
      const publicPages = ['login', 'register', 'resetpassword']

      if (publicPages.includes(to.name)) return next()

      if (!user.value && !loadUserFromLocalStorage()) {
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

  // 🧰 helper: save user -> localStorage
  const saveUserToLocalStorage = (u) => {
    if (!u) return
    localStorage.setItem('accessToken', u.accessToken)
    localStorage.setItem('userRole', u.role)
    localStorage.setItem('userEmail', u.email)
    localStorage.setItem('userName', u.fullName)
    if (u.position) localStorage.setItem('position', u.position)
    if (u.dormId) localStorage.setItem('dormId', u.dormId)
    if (u.roomNumber) localStorage.setItem('roomNumber', u.roomNumber)
  }

  // 📦 export ทุกอย่าง
  return {
    user,
    isLoading,
    errorMessage,
    successMessage,
    registerAccount,
    loginAccount,
    logoutAccount,
    loadUserFromLocalStorage,
    refreshToken,
    apiRequest,
    useAuthGuard
  }
})
