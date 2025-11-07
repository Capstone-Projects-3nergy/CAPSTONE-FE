// 📁 src/stores/ResetPasswordManager.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/firebaseConfig'
import { sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth'

export const useResetPasswordManager = defineStore(
  'ResetPasswordManager',
  () => {
    // 🟦 State
    const loading = ref(false)
    const successMessage = ref('')
    const errorMessage = ref('')

    // 🟨 Action 1: ส่งอีเมลรีเซ็ตรหัสผ่านผ่าน Firebase + (แจ้ง Backend ถ้ามี)
    const sendResetEmail = async (email) => {
      loading.value = true
      successMessage.value = ''
      errorMessage.value = ''

      try {
        // 🔹 Step 1: Firebase ส่งอีเมลรีเซ็ต
        await sendPasswordResetEmail(auth, email)
        console.log('✅ Firebase reset email sent.')

        // 🔹 Step 2: แจ้ง backend (optional สำหรับบันทึก log หรือ event)
        const baseURL = import.meta.env.VITE_BASE_URL
        if (baseURL) {
          await axios.post(`${baseURL}/public/auth/reset-password-request`, {
            email
          })
        }

        // 🔹 Step 3: สำเร็จ
        successMessage.value =
          '📧 Reset password email sent! Please check your inbox.'
      } catch (error) {
        console.error('❌ Reset password error:', error)
        if (error.code === 'auth/user-not-found') {
          errorMessage.value = '❌ Email not found in system.'
        } else {
          errorMessage.value =
            error.response?.data?.message ||
            error.message ||
            'Failed to send reset email. Please try again.'
        }
      } finally {
        loading.value = false
      }
    }

    // 🟨 Action 2: ตั้งรหัสผ่านใหม่หลังคลิกลิงก์รีเซ็ต (Firebase + Backend)
    const confirmResetPassword = async (oobCode, newPassword) => {
      loading.value = true
      successMessage.value = ''
      errorMessage.value = ''

      try {
        // 🔹 Step 1: Firebase ยืนยันโค้ดรีเซ็ตและตั้งรหัสใหม่
        await confirmPasswordReset(auth, oobCode, newPassword)
        console.log('✅ Firebase password updated.')

        // 🔹 Step 2: แจ้ง backend เพื่อ sync password (optional)
        const baseURL = import.meta.env.VITE_BASE_URL
        if (baseURL) {
          await axios.post(`${baseURL}/public/auth/confirm-reset`, {
            oobCode,
            newPassword
          })
        }

        successMessage.value = '✅ Password has been reset successfully!'
      } catch (error) {
        console.error('❌ Confirm reset error:', error)
        if (error.code === 'auth/invalid-action-code') {
          errorMessage.value = '❌ Reset link is invalid or expired.'
        } else {
          errorMessage.value =
            error.response?.data?.message ||
            error.message ||
            'Failed to reset password. Please try again.'
        }
      } finally {
        loading.value = false
      }
    }

    // 🟢 Return values
    return {
      loading,
      successMessage,
      errorMessage,
      sendResetEmail,
      confirmResetPassword
    }
  }
)

// import { defineStore } from 'pinia'
// import { ref } from 'vue'
// import axios from 'axios'
// import { auth } from '@/firebase/firebaseConfig'

// export const useResetPasswordManager = defineStore(
//   'ResetPasswordManager',
//   () => {
//     // 🟦 State
//     const loading = ref(false)
//     const successMessage = ref('')
//     const errorMessage = ref('')

//     // 🟨 Action: ส่งอีเมลรีเซ็ตรหัสผ่าน (Backend-Driven)
//     const sendResetEmail = async (email) => {
//       loading.value = true
//       successMessage.value = ''
//       errorMessage.value = ''

//       try {
//         // 1️⃣ ดึง Firebase ID Token ของผู้ใช้ปัจจุบัน (ถ้ามี login)
//         let idToken = null
//         const currentUser = auth.currentUser
//         if (currentUser) {
//           idToken = await currentUser.getIdToken(true)
//         }

//         // 2️⃣ ส่ง POST ไป backend พร้อม Authorization header
//         const response = await axios.post(
//           'http://localhost:3000/api/reset-password',
//           { email },
//           {
//             headers: idToken
//               ? { Authorization: `Bearer ${idToken}` }
//               : undefined
//           }
//         )

//         const data = response.data

//         // 3️⃣ ตรวจสอบ response
//         if (!data.success) {
//           throw new Error(data.message || 'Failed to send reset email.')
//         }

//         // ✅ ถ้าสำเร็จ
//         successMessage.value =
//           data.message || '📧 Reset password email sent successfully!'
//       } catch (error) {
//         console.error('❌ Reset password error:', error)
//         // 🔹 แปลง error จาก backend
//         errorMessage.value =
//           error.response?.data?.message ||
//           error.message ||
//           'Failed to send reset email. Please try again.'
//       } finally {
//         loading.value = false
//       }
//     }

//     return {
//       loading,
//       successMessage,
//       errorMessage,
//       sendResetEmail
//     }
//   }
// )

// import { defineStore } from 'pinia'
// import { ref } from 'vue'
// import { auth } from '@/firebase/firebaseConfig'
// import { sendPasswordResetEmail } from 'firebase/auth'

// export const useResetPasswordManager = defineStore(
//   'ResetPasswordManager',
//   () => {
//     // 🟦 State
//     const loading = ref(false)
//     const successMessage = ref('')
//     const errorMessage = ref('')

//     // 🟨 Action: ส่งอีเมลรีเซ็ตรหัสผ่าน (Firebase + Backend)
//     const sendResetEmail = async (email) => {
//       loading.value = true
//       successMessage.value = ''
//       errorMessage.value = ''

//       try {
//         // 1️⃣ ส่งคำขอไปที่ Firebase เพื่อส่งอีเมลรีเซ็ตรหัสผ่าน
//         await sendPasswordResetEmail(auth, email)
//         console.log('📧 Firebase reset email sent.')

//         // 2️⃣ ส่งข้อมูลไป backend (เหมือน login / register)
//         const response = await fetch(
//           'http://localhost:3000/api/reset-password',
//           {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ email })
//           }
//         )

//         const data = await response.json()

//         if (!response.ok) {
//           throw new Error(data.message || 'Failed to contact backend.')
//         }

//         // ✅ ถ้าทุกอย่างสำเร็จ
//         successMessage.value =
//           data.message || '📧 Reset password email sent successfully!'
//       } catch (error) {
//         console.error('❌ Reset password error:', error)

//         // 🔹 แปลง error จาก Firebase หรือ Backend
//         if (error.code) {
//           switch (error.code) {
//             case 'auth/invalid-email':
//               errorMessage.value = 'Invalid email format.'
//               break
//             case 'auth/user-not-found':
//               errorMessage.value = 'No user found with this email.'
//               break
//             default:
//               errorMessage.value =
//                 'Failed to send reset email. Please try again.'
//           }
//         } else {
//           errorMessage.value =
//             error.message || 'Failed to send reset email. Please try again.'
//         }
//       } finally {
//         loading.value = false
//       }
//     }

//     return {
//       loading,
//       successMessage,
//       errorMessage,
//       sendResetEmail
//     }
//   }
// )
