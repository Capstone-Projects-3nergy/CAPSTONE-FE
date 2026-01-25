import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/firebaseConfig'
import { sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth'

export const useResetPasswordManager = defineStore(
  'ResetPasswordManager',
  () => {
    const loading = ref(false)
    const successMessage = ref('')
    const errorMessage = ref('')

    // ===============================
    // SEND RESET EMAIL
    // ===============================
    const sendResetEmail = async (email) => {
      loading.value = true
      successMessage.value = ''
      errorMessage.value = ''

      try {
        // Firebase handles email sending
        await sendPasswordResetEmail(auth, email)

        // Optional: notify backend (log / audit)
        const baseURL = import.meta.env.VITE_BASE_URL
        if (baseURL) {
          await axios.post(`${baseURL}/public/auth/reset-password-request`, {
            email
          })
        }

        successMessage.value =
          '📧 Password reset email has been sent. Please check your inbox.'
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          errorMessage.value = '❌ Email not found in the system.'
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

    // ===============================
    // CONFIRM RESET PASSWORD
    // ===============================
    const confirmResetPassword = async (oobCode, newPassword) => {
      loading.value = true
      successMessage.value = ''
      errorMessage.value = ''

      try {
        // Firebase resets password
        await confirmPasswordReset(auth, oobCode, newPassword)

        // Optional: notify backend (NO PASSWORD)
        const baseURL = import.meta.env.VITE_BASE_URL
        if (baseURL) {
          await axios.post(`${baseURL}/public/auth/reset-password-success`, {
            oobCode
          })
        }

        successMessage.value = '✅ Password has been reset successfully!'
      } catch (error) {
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
// import { sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth'

// export const useResetPasswordManager = defineStore(
//   'ResetPasswordManager',
//   () => {
//     const loading = ref(false)
//     const successMessage = ref('')
//     const errorMessage = ref('')

//     const sendResetEmail = async (email) => {
//       loading.value = true
//       successMessage.value = ''
//       errorMessage.value = ''

//       try {
//         await sendPasswordResetEmail(auth, email)

//         const baseURL = import.meta.env.VITE_BASE_URL
//         if (baseURL) {
//           await axios.post(`${baseURL}/public/auth/reset-password-request`, {
//             email
//           })
//         }

//         successMessage.value =
//           '📧 Reset password email sent! Please check your inbox.'
//       } catch (error) {
//         if (error.code === 'auth/user-not-found') {
//           errorMessage.value = '❌ Email not found in system.'
//         } else {
//           errorMessage.value =
//             error.response?.data?.message ||
//             error.message ||
//             'Failed to send reset email. Please try again.'
//         }
//       } finally {
//         loading.value = false
//       }
//     }

//     const confirmResetPassword = async (oobCode, newPassword) => {
//       loading.value = true
//       successMessage.value = ''
//       errorMessage.value = ''

//       try {
//         await confirmPasswordReset(auth, oobCode, newPassword)

//         const baseURL = import.meta.env.VITE_BASE_URL
//         if (baseURL) {
//           await axios.post(`${baseURL}/public/auth/confirm-reset`, {
//             oobCode,
//             newPassword
//           })
//         }

//         successMessage.value = '✅ Password has been reset successfully!'
//       } catch (error) {
//         if (error.code === 'auth/invalid-action-code') {
//           errorMessage.value = '❌ Reset link is invalid or expired.'
//         } else {
//           errorMessage.value =
//             error.response?.data?.message ||
//             error.message ||
//             'Failed to reset password. Please try again.'
//         }
//       } finally {
//         loading.value = false
//       }
//     }

//     return {
//       loading,
//       successMessage,
//       errorMessage,
//       sendResetEmail,
//       confirmResetPassword
//     }
//   }
// )
