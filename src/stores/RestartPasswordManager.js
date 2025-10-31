import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth } from '@/firebase/firebaseConfig'
import { sendPasswordResetEmail } from 'firebase/auth'

export const useResetPasswordManager = defineStore(
  'ResetPasswordManager',
  () => {
    // 🟦 State
    const loading = ref(false)
    const successMessage = ref('')
    const errorMessage = ref('')

    // 🟨 Action: ส่งอีเมลรีเซ็ตรหัสผ่าน
    const sendResetEmail = async (email) => {
      loading.value = true
      successMessage.value = ''
      errorMessage.value = ''

      try {
        await sendPasswordResetEmail(auth, email)
        successMessage.value = '📧 Reset password email sent successfully!'
      } catch (error) {
        console.error('❌ Reset password error:', error)

        // 🔹 แปลง error code ของ Firebase เป็นข้อความอ่านง่าย
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage.value = 'Invalid email format.'
            break
          case 'auth/user-not-found':
            errorMessage.value = 'No user found with this email.'
            break
          default:
            errorMessage.value = 'Failed to send reset email. Please try again.'
        }
      } finally {
        loading.value = false
      }
    }

    return {
      // State
      loading,
      successMessage,
      errorMessage,
      // Actions
      sendResetEmail
    }
  }
)
