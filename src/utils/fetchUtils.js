import axios from 'axios'
import router from '@/router'
import { refreshToken } from '@/stores/LoginManager'
import { useLoginManager } from '@/stores/LoginManager'

// 🧩 สร้าง instance ของ axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', // ปรับตาม backend ของคุณ
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // ถ้า backend ใช้ cookie
})

// 🟢 ดึง token จาก localStorage แล้วใส่ในทุก request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 🔄 Interceptor สำหรับ refresh token อัตโนมัติเมื่อเจอ 401
let isRefreshing = false
let refreshSubscribers = []

function onRereshDone(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken))
  refreshSubscribers = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // ⚠️ ถ้าเจอ 401 ให้ลอง refresh token
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await refreshToken(router)
        if (newToken) {
          localStorage.setItem('jwt', newToken)
          api.defaults.headers.Authorization = `Bearer ${newToken}`
          onRereshDone(newToken)
          return api(originalRequest)
        } else {
          throw new Error('Refresh token failed')
        }
      } catch (err) {
        console.error('❌ Token refresh failed:', err)
        const loginManager = useLoginManager()
        await loginManager.logoutAccount(router)
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

//
// 🔹 ฟังก์ชัน CRUD (แทน fetch แบบเดิม)
//
export const apiService = {
  async getItems(url) {
    const res = await api.get(url)
    return res.data
  },

  async getItemById(url, id) {
    const res = await api.get(`${url}/${id}`)
    return res.data
  },

  async deleteItemById(url, id) {
    const res = await api.delete(`${url}/${id}`)
    return res.status
  },

  async deleteAndTransferItem(url, id, newId) {
    const res = await api.delete(`${url}/${id}/${newId}`)
    return res.status
  },

  async addItem(url, newItem) {
    const res = await api.post(url, newItem)
    return res.data
  },

  async editItem(url, id, editedItem) {
    const res = await api.put(`${url}/${id}`, editedItem)
    return res.data
  },

  async toggleVisibility(url, id, visibility) {
    const res = await api.patch(`${url}/${id}`, { visibility })
    return res.data
  },

  async editReadWrite(url, id, readWrite) {
    const res = await api.patch(`${url}/${id}`, { accessRight: readWrite })
    return res.data
  },

  async editInviteReadWrite(url, id, readWrite) {
    const res = await api.put(`${url}/${id}`, { accessRight: readWrite })
    return res.data
  },

  async acceptInvite(url) {
    const res = await api.post(url)
    return res.data
  },

  async cancelInvite(url, id) {
    const res = await api.delete(`${url}/${id}`)
    return res.data
  },

  async declineInvite(url) {
    const res = await api.delete(url)
    return res.data
  },

  async editItemWithFile(url, id, files = null, editedItem = {}) {
    const formData = new FormData()

    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        formData.append('file', file)
      })
    }

    if (editedItem && Object.keys(editedItem).length > 0) {
      const jsonString = JSON.stringify(editedItem)
      const blob = new Blob([jsonString], { type: 'application/json' })
      formData.append('taskDetails', blob)
    }

    const res = await api.put(`${url}/${id}`, formData)
    return res.data
  },

  async deleteFile(url, id, file) {
    const res = await api.delete(`${url}/${id}/file/${file}`)
    return res.data
  }
}

export default api
