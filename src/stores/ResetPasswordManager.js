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

    return {
      loading,
      successMessage,
      errorMessage,
      sendResetEmail,
      confirmResetPassword
    }
  }
)
