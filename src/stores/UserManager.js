import { ref } from 'vue'

// เก็บค่า userName ใน ref
export const userName = ref('')
export const userEmail = ref('')
export const userRole = ref('')
import { msalService } from '@/utils/msalService'
import { useRouter } from 'vue-router'
import { msalInstance } from '@/stores/msalConfig'
const { msalLogout } = msalService()
const router = useRouter()

const initialize = async () => {
  try {
    await msalInstance.initialize()
  } catch (error) {
    console.log('Initialization error', error)
  }
}
function deleteCookie(name) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
}

initialize()

// ฟังก์ชันถอดรหัส JWT
export function decodeJWT(token) {
  try {
    const [header, payload, signature] = token.split('.')
    const decodedHeader = JSON.parse(atob(header))
    const decodedPayload = JSON.parse(atob(payload))

    if (decodedHeader.typ !== 'JWT' || decodedHeader.alg !== 'HS256') {
      throw new Error('Invalid JWT header')
    }

    // const requiredFields = [
    //   'role',
    //   'name',
    //   'oid',
    //   'email',
    //   'sub',
    //   'iat',
    //   'exp',
    //   'iss'
    // ]
    // for (const field of requiredFields) {
    //   if (!decodedPayload.hasOwnProperty(field)) {
    //     throw new Error(`Missing required field in JWT payload: ${field}`)
    //   }
    // }

    userEmail.value = decodedPayload.email
    localStorage.setItem('role', decodedPayload.role)
    localStorage.setItem('userEmail', decodedPayload.email)
    userName.value = decodedPayload.name
    localStorage.setItem('userName', decodedPayload.name)
    return {
      header: decodedHeader,
      payload: decodedPayload,
      signature: signature
    }
  } catch (error) {
    throw new Error('Invalid JWT Token: ' + error.message)
  }
}

// ฟังก์ชันสำหรับเข้าสู่ระบบ (login)
export async function login(userCredentials, router) {
  const response = await apiRequest(
    `${import.meta.env.VITE_BASE_URL}/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...userCredentials }),
      credentials: 'include'
    },
    router
  )

  if (!response.ok) {
    return response.status
  }

  const data = await response.json()
  const decodedToken = decodeJWT(data.access_token)
  localStorage.setItem('jwt', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token) // Save refresh token
  return data
}

// ฟังก์ชันสำหรับออกจากระบบ (logout)
export function logout() {
  if (localStorage.getItem('loginFormMicrosoft') == 'true') {
    localStorage.removeItem('jwt')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('loginFormMicrosoft')
    msalLogout()
  }
  deleteCookie('access_token')
  deleteCookie('refresh_token')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('jwt')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('userName')
  localStorage.removeItem('role')
  sessionStorage.removeItem('userRole')

  // ลบข้อมูลที่เกี่ยวข้องจาก sessionStorage (ถ้ามี)
  sessionStorage.removeItem('jwt')
  sessionStorage.removeItem('userName')

  userName.value = ''
}

// ฟังก์ชัน refreshToken
export async function refreshToken(router) {
  const refresh_token = localStorage.getItem('refresh_token')

  // If no refresh token exists, logout and redirect to login
  if (!refresh_token) {
    logout()
    router.replace({ name: 'Login' })
    return null // Return null if refresh token is missing
  }

  try {
    let response
    if (localStorage.getItem('loginFormMicrosoft') == 'true') {
      response = await fetch(`${import.meta.env.VITE_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refresh_token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          msal: true
        })
      })
    } else {
      response = await fetch(`${import.meta.env.VITE_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refresh_token}` // Use refresh token
        },
        credentials: 'include'
      })
    }

    // If refresh token request is successful
    if (response.ok) {
      const data = await response.json()
      localStorage.setItem('jwt', data.access_token) // Store new access token

      return data.access_token // Return the new access token
    }
    // If refresh token is invalid (401 Unauthorized)
    else if (response.status === 401) {
      logout()
      router.replace({ name: 'Login' })
      return null // Return null to indicate failure
    } else {
      alert('There was a problem refreshing the token. Please try again later.')
      return null
    }
  } catch (error) {
    alert('Error occurred while refreshing token.')
    return null
  }
}

// Navigation Guard สำหรับตรวจสอบการยืนยันตัวตน
export function useAuthGuard(router) {
  router.beforeEach(async (to, from, next) => {
    console.log('Auth Guard Triggered')

    const token = localStorage.getItem('jwt')

    if (!token) {
      console.log('No token found, redirecting to login.')
      return next()
    }

    console.log('Token found, checking validity...')
    try {
      const decodedToken = decodeJWT(token)
      const currentTime = Math.floor(Date.now() / 1000)

      if (decodedToken.payload.exp < currentTime) {
        console.log('Token expired, attempting to refresh...')
        const newToken = await refreshToken(router)

        if (newToken) {
          console.log('New token obtained:', newToken)
          localStorage.setItem('jwt', newToken) // Ensure the new token is stored
          return next() // Allow navigation
        } else {
          console.log('Failed to refresh token, redirecting to login.')
          logout() // Ensure logout is called if refresh fails
          return next({ name: 'Login' })
        }
      } else {
        console.log('Token is valid, allowing navigation.')
        return next() // Proceed as normal
      }
    } catch (error) {
      console.error('Error decoding token:', error)
      logout()
      return next({ name: 'Login' })
    }
  })
}

// ฟังก์ชันสำหรับทำ API request พร้อมแนบ token
export async function apiRequest(url, options = {}, router) {
  let token = localStorage.getItem('jwt') // Get access token from localStorage

  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}` // Attach access token to the request
    }
  }

  const response = await fetch(url, options)

  // If access token expired (status 401), attempt to refresh the token
  if (response.status === 401) {
    const newToken = await refreshToken(router) // Try to refresh token

    if (newToken) {
      // Replace the old token with the new one
      token = newToken
      options.headers.Authorization = `Bearer ${newToken}` // Update the request with the new token
      return await fetch(url, options) // Retry request with new token
    } else {
      logout()
      router.replace({ name: 'Login' })
    }
  }

  return response
}
