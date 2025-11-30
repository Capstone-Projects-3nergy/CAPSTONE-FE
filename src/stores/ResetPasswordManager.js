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

    const sendResetEmail = async (email) => {
      loading.value = true
      successMessage.value = ''
      errorMessage.value = ''

      try {
        await sendPasswordResetEmail(auth, email)

        const baseURL = import.meta.env.VITE_BASE_URL
        if (baseURL) {
          await axios.post(`${baseURL}/public/auth/reset-password-request`, {
            email
          })
        }

        successMessage.value =
          '📧 Reset password email sent! Please check your inbox.'
      } catch (error) {
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

    const confirmResetPassword = async (oobCode, newPassword) => {
      loading.value = true
      successMessage.value = ''
      errorMessage.value = ''

      try {
        await confirmPasswordReset(auth, oobCode, newPassword)

        const baseURL = import.meta.env.VITE_BASE_URL
        if (baseURL) {
          await axios.post(`${baseURL}/public/auth/confirm-reset`, {
            oobCode,
            newPassword
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
