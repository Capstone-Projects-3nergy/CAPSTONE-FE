import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/firebaseConfig'
import { createUserWithEmailAndPassword } from 'firebase/auth'

export const useRegisterManager = defineStore('RegisterManager', () => {
  const loading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  /**
   * formData ที่คาดหวังจากหน้า Register:
   * {
   *   fullName: string,
   *   email: string,
   *   password: string,       // ใช้กับ Firebase เท่านั้น
   *   role: 'RESIDENT' | 'STAFF',
   *   dormId: number | string,
   *   roomNumber?: string,    // ถ้า role = RESIDENT
   *   position?: string       // ถ้า role = STAFF
   * }
   */
  const registerAccount = async (formData) => {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      // 1) สมัครผู้ใช้กับ Firebase
      const cred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // 2) เตรียมข้อมูลโปรไฟล์ให้ตรงกับ RegisterDto ของ backend
      const fullNameArr = (formData.fullName || '').trim().split(/\s+/)
      const firstName = fullNameArr[0] || ''
      const lastName = fullNameArr.slice(1).join(' ')
      const role = String(formData.role || '').toUpperCase()

      const payload = {
        email: formData.email,
        firstName: firstName,
        lastName: lastName,
        role, // "RESIDENT" | "STAFF"
        dormId: Number(formData.dormId),
        roomNumber: role === 'RESIDENT' ? formData.roomNumber || '' : null,
        position: role === 'STAFF' ? formData.position || '' : null
      }

      // 3) เรียก backend เพื่อบันทึก "โปรไฟล์"
      const baseURL = import.meta.env.VITE_BASE_URL
      if (!baseURL) throw new Error('VITE_BASE_URL is not set')

      const endpoint = `${baseURL}/public/auth/register`
      const response = await axios.post(endpoint, payload)

      // 4) ตรวจผลลัพธ์ และเก็บ idToken
      if (response.data && response.data.userId) {
        const idToken = await cred.user.getIdToken()
        localStorage.setItem('idToken', idToken)
        successMessage.value = 'Account created successfully!'
      } else {
        throw new Error('Registration failed.')
      }
    } catch (error) {
      console.error(error)
      errorMessage.value =
        error?.response?.data?.message ||
        error?.message ||
        'Registration failed.'
    } finally {
      loading.value = false
    }
    console.log('BASE URL:', import.meta.env.VITE_BASE_URL)
  }

  return {
    loading,
    errorMessage,
    successMessage,
    registerAccount
  }
})

// version 1
// import { defineStore } from 'pinia'
// import { ref } from 'vue'
// import axios from 'axios'
// import { auth } from '@/firebase/firebaseConfig'
// import { createUserWithEmailAndPassword } from 'firebase/auth'
// export const useRegisterManager = defineStore('RegisterManager', () => {
//   const loading = ref(false)
//   const errorMessage = ref('')
//   const successMessage = ref('')

//   const registerAccount = async (formData) => {
//     loading.value = true
//     errorMessage.value = ''
//     successMessage.value = ''

//     try {
//       // แยกชื่อเต็มเป็น firstName, lastName
//       const [firstName, lastName] = formData.fullName.split(' ')

//       const payload = {
//         email: formData.email,
//         password: formData.password,
//         roomNumber: formData.roomNumber, // หรือ generatedPassword ถ้าใช้ Firebase สร้าง password
//         firstName: firstName || '',
//         lastName: lastName || '',
//         dormitoryName: formData.dormId || null, // เปลี่ยนจาก formData.dormitoryName เป็น formData.dormId
//         position: formData.position || null
//       }

//       // ใช้ VITE_BASE_URL
//       const endpoint = `${import.meta.env.VITE_BASE_URL}/public/auth/register`

//       // เรียก backend ด้วย axios
//       const response = await axios.post(endpoint, payload)

//       // ตรวจสอบ response
//       if (response.data && response.data.userId) {
//         successMessage.value = 'Account created successfully!'
//       } else {
//         throw new Error('Registration failed.')
//       }
//     } catch (error) {
//       console.error(error)
//       if (error.response?.data?.message) {
//         errorMessage.value = error.response.data.message
//       } else {
//         errorMessage.value = error.message || 'Registration failed.'
//       }
//     } finally {
//       loading.value = false
//     }
//   }

//   return {
//     loading,
//     errorMessage,
//     successMessage,
//     registerAccount
//   }
// })
