import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/firebaseConfig'
import { verifyBeforeUpdateEmail } from 'firebase/auth'

export const useChangeEmailManager = defineStore('ChangeEmailManager', () => {
  const loading = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')

  // ===============================
  // SEND VERIFY EMAIL (CHANGE EMAIL)
  // ===============================
  const sendChangeEmailVerification = async (newEmail) => {
    loading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('User is not authenticated')
      }

      // Firebase sends verification email to NEW email
      await verifyBeforeUpdateEmail(user, newEmail)

      // Optional: notify backend (log / audit only)
      const baseURL = import.meta.env.VITE_BASE_URL
      if (baseURL) {
        await axios.post(`${baseURL}/public/auth/change-email-request`, {
          uid: user.uid,
          oldEmail: user.email,
          newEmail
        })
      }

      successMessage.value =
        '📧 Verification email has been sent. Please check your inbox to confirm the change.'
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        errorMessage.value = '❌ This email address is already in use.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage.value = '❌ Invalid email address.'
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage.value =
          '⚠️ Please sign in again before updating your account.'
      } else {
        errorMessage.value =
          error.response?.data?.message ||
          error.message ||
          'Failed to send verification email. Please try again.'
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    successMessage,
    errorMessage,
    sendChangeEmailVerification
  }
})
