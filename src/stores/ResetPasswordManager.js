import { defineStore } from 'pinia'
import { ref } from 'vue'

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
        const response = await fetch(
          'http://localhost:3000/api/reset-password',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          }
        )

        const data = await response.json()

        if (response.ok) {
          successMessage.value =
            data.message || '📧 Reset password email sent successfully!'
        } else {
          errorMessage.value = data.message || 'Failed to send reset email.'
        }
      } catch (err) {
        console.error('❌ Reset password error:', err)
        errorMessage.value = 'Network error. Please try again.'
      } finally {
        loading.value = false
      }
    }

    return {
      loading,
      successMessage,
      errorMessage,
      sendResetEmail
    }
  }
)
