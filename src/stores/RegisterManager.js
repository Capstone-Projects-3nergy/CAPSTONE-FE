import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/firebaseConfig'
import { createUserWithEmailAndPassword } from 'firebase/auth'

export const useRegisterManager = defineStore('RegisterManager', () => {
  // ----------------------------
  // 🔹 STATE
  // ----------------------------
  const loading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const userData = ref(null) // เก็บข้อมูลผู้ใช้หลังสมัครเสร็จ

  // ----------------------------
  // 🔹 REGISTER FUNCTION
  // ----------------------------
  const registerAccount = async (formData) => {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    userData.value = null // reset ก่อนเริ่ม

    try {
      // ----------------------------
      // 🔸 ตรวจ role เบื้องต้น
      // ----------------------------
      const role = String(formData.role || '').toUpperCase()
      if (!['RESIDENT', 'STAFF'].includes(role)) {
        throw new Error('Invalid role.')
      }

      // ----------------------------
      // 🔸 เตรียม payload สำหรับ backend
      // ----------------------------
      let payload = { ...formData, role }

      if (role === 'RESIDENT') {
        const dormIdNum = Number(formData.dormId)
        if (!Number.isFinite(dormIdNum) || dormIdNum <= 0) {
          throw new Error('Please select a valid dormitory.')
        }
        if (!formData.roomNumber || !formData.roomNumber.trim()) {
          throw new Error('Room number is required.')
        }
        payload = {
          ...payload,
          dormId: dormIdNum,
          roomNumber: formData.roomNumber.trim()
        }
      } else if (role === 'STAFF') {
        if (!formData.position || !formData.position.trim()) {
          throw new Error('Position is required for staff.')
        }
        payload = {
          ...payload,
          position: formData.position.trim()
        }
      }

      // ----------------------------
      // 🔸 ส่งข้อมูลไป Backend
      // ----------------------------
      const baseURL = import.meta.env.VITE_BASE_URL
      if (!baseURL) throw new Error('VITE_BASE_URL is not set')
      const endpoint = `${baseURL}/public/auth/register`
      const response = await axios.post(endpoint, payload)

      if (!response.data?.userId) {
        throw new Error('Registration failed on backend.')
      }

      // ----------------------------
      // 🔸 สร้างบัญชีใน Firebase
      // ----------------------------
      const cred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )
      const idToken = await cred.user.getIdToken()

      // ----------------------------
      // 🔸 เก็บข้อมูลลงใน Pinia
      // ----------------------------
      userData.value = {
        userId: response.data.userId,
        email: formData.email,
        fullName: formData.fullName,
        role,
        accessToken: idToken,
        ...(role === 'STAFF' ? { position: formData.position } : {}),
        ...(role === 'RESIDENT'
          ? { dormId: formData.dormId, roomNumber: formData.roomNumber }
          : {})
      }

      // ----------------------------
      // 🔸 เก็บลง LocalStorage
      // ----------------------------
      localStorage.setItem('accessToken', idToken)
      localStorage.setItem('userRole', role)
      localStorage.setItem('userEmail', formData.email)
      localStorage.setItem('userName', formData.fullName)

      if (role === 'STAFF') {
        localStorage.setItem('position', formData.position)
      } else if (role === 'RESIDENT') {
        localStorage.setItem('dormId', formData.dormId)
        localStorage.setItem('roomNumber', formData.roomNumber)
      }

      successMessage.value = 'Account created successfully!'
    } catch (error) {
      // ----------------------------
      // 🔸 แสดง Error message
      // ----------------------------
      const backendErrors = error?.response?.data?.errors
      if (backendErrors && typeof backendErrors === 'object') {
        errorMessage.value = Object.entries(backendErrors)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
      } else {
        errorMessage.value =
          error?.response?.data?.message ||
          error?.message ||
          'Registration failed.'
      }
    } finally {
      loading.value = false
    }
  }

  // ----------------------------
  // 🔹 LOAD USER จาก LocalStorage (หลัง refresh)
  // ----------------------------
  const loadUserFromLocalStorage = () => {
    const savedEmail = localStorage.getItem('userEmail')
    const savedName = localStorage.getItem('userName')
    const savedRole = localStorage.getItem('userRole')
    const savedToken = localStorage.getItem('accessToken')
    const savedPosition = localStorage.getItem('position')
    const savedDormId = localStorage.getItem('dormId')
    const savedRoomNumber = localStorage.getItem('roomNumber')

    if (savedEmail && savedToken) {
      userData.value = {
        email: savedEmail,
        fullName: savedName,
        role: savedRole,
        accessToken: savedToken,
        ...(savedRole === 'STAFF' ? { position: savedPosition } : {}),
        ...(savedRole === 'RESIDENT'
          ? { dormId: savedDormId, roomNumber: savedRoomNumber }
          : {})
      }
    }
  }

  // ----------------------------
  // 🔹 LOGOUT: ล้างข้อมูลทั้ง store และ localStorage
  // ----------------------------
  const logout = () => {
    userData.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    localStorage.removeItem('position')
    localStorage.removeItem('dormId')
    localStorage.removeItem('roomNumber')
  }

  // ----------------------------
  // ✅ RETURN
  // ----------------------------
  return {
    loading,
    errorMessage,
    successMessage,
    userData,
    registerAccount,
    loadUserFromLocalStorage,
    logout
  }
})

// import { defineStore } from 'pinia'
// import { ref } from 'vue'
// import axios from 'axios'
// import { auth } from '@/firebase/firebaseConfig'
// import { createUserWithEmailAndPassword } from 'firebase/auth'

// export const useRegisterManager = defineStore('RegisterManager', () => {
//   const loading = ref(false)
//   const errorMessage = ref('')
//   const successMessage = ref('')
//   const userData = ref(null) // ✅ เก็บข้อมูลผู้ใช้หลังสมัครเสร็จ

//   /**
//    * formData ที่คาดหวัง:
//    * {
//    *   fullName: string,
//    *   email: string,
//    *   password: string,
//    *   role: 'RESIDENT' | 'STAFF',
//    *   dormType: 'RESIDENT' | 'STAFF',
//    *   dormId?: number,
//    *   roomNumber?: string,
//    *   position?: string
//    * }
//    */
//   const registerAccount = async (formData) => {
//     loading.value = true
//     errorMessage.value = ''
//     successMessage.value = ''
//     userData.value = null // reset ก่อนเริ่ม

//     try {
//       // ----------------------------
//       // 🔹 ตรวจ role เบื้องต้น
//       // ----------------------------
//       const role = String(formData.role || '').toUpperCase()
//       if (!['RESIDENT', 'STAFF'].includes(role)) {
//         throw new Error('Invalid role.')
//       }

//       // ----------------------------
//       // 🔹 เตรียม payload สำหรับ backend
//       // ----------------------------
//       let payload = { ...formData, role }

//       if (role === 'RESIDENT') {
//         const dormIdNum = Number(formData.dormId)
//         if (!Number.isFinite(dormIdNum) || dormIdNum <= 0) {
//           throw new Error('Please select a valid dormitory.')
//         }
//         if (!formData.roomNumber || !formData.roomNumber.trim()) {
//           throw new Error('Room number is required.')
//         }
//         payload = {
//           ...payload,
//           dormId: dormIdNum,
//           roomNumber: formData.roomNumber.trim()
//         }
//       } else if (role === 'STAFF') {
//         if (!formData.position || !formData.position.trim()) {
//           throw new Error('Position is required for staff.')
//         }
//         payload = {
//           ...payload,
//           position: formData.position.trim()
//         }
//       }

//       // ----------------------------
//       // 🔹 ส่งข้อมูลไป Backend
//       // ----------------------------
//       const baseURL = import.meta.env.VITE_BASE_URL
//       if (!baseURL) throw new Error('VITE_BASE_URL is not set')
//       const endpoint = `${baseURL}/public/auth/register`
//       const response = await axios.post(endpoint, payload)

//       if (!response.data?.userId) {
//         throw new Error('Registration failed on backend.')
//       }

//       // ----------------------------
//       // 🔹 สร้างบัญชีใน Firebase
//       // ----------------------------
//       const cred = await createUserWithEmailAndPassword(
//         auth,
//         formData.email,
//         formData.password
//       )

//       // รับ token จาก Firebase
//       const idToken = await cred.user.getIdToken()

//       // ----------------------------
//       // 🔹 เก็บข้อมูลลงใน Pinia + LocalStorage
//       // ----------------------------
//       userData.value = {
//         userId: response.data.userId,
//         email: formData.email,
//         fullName: formData.fullName,
//         role,
//         accessToken: idToken
//       }

//       localStorage.setItem('accessToken', idToken)
//       localStorage.setItem('userRole', role)
//       localStorage.setItem('userEmail', formData.email)
//       localStorage.setItem('userName', formData.fullName)

//       successMessage.value = 'Account created successfully!'
//     } catch (error) {
//       // ----------------------------
//       // 🔹 แสดง Error message
//       // ----------------------------
//       const backendErrors = error?.response?.data?.errors
//       if (backendErrors && typeof backendErrors === 'object') {
//         errorMessage.value = Object.entries(backendErrors)
//           .map(([k, v]) => `${k}: ${v}`)
//           .join('\n')
//       } else {
//         errorMessage.value =
//           error?.response?.data?.message ||
//           error?.message ||
//           'Registration failed.'
//       }
//     } finally {
//       loading.value = false
//     }
//   }

//   return {
//     loading,
//     errorMessage,
//     successMessage,
//     userData, // ✅ เพิ่มใน return
//     registerAccount
//   }
// })
