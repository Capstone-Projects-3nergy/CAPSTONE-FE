import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/firebaseConfig'
import { verifyBeforeUpdateEmail } from 'firebase/auth'

export const useChangeEmailManager = defineStore('ChangeEmailManager', () => {
  const loading = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')

  const sendChangeEmailVerification = async (newEmail) => {
    loading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const user = auth.currentUser
      if (!user) throw new Error('User not authenticated')

      // 🔑 actionCodeSettings (จำเป็น)
      const actionCodeSettings = {
        url: `${window.location.origin}/profile`,
        handleCodeInApp: false
      }

      // ✅ CHANGE EMAIL (Firebase official way)
      await verifyBeforeUpdateEmail(user, newEmail, actionCodeSettings)

      successMessage.value =
        '📧 Verification email has been sent to your new email address.'

      // optional: backend log
      const baseURL = import.meta.env.VITE_BASE_URL
      if (baseURL) {
        await axios.post(`${baseURL}/public/auth/change-email-request`, {
          uid: user.uid,
          oldEmail: user.email,
          newEmail
        })
      }
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage.value = '❌ This email is already in use.'
          break
        case 'auth/invalid-email':
          errorMessage.value = '❌ Invalid email address.'
          break
        case 'auth/requires-recent-login':
          errorMessage.value = '⚠️ Please re-login before changing your email.'
          break
        default:
          errorMessage.value =
            error.message || 'Failed to send verification email.'
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
