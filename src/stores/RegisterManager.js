// src/stores/RegisterManager.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth } from '@/firebase/firebaseConfig'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'

export const useRegisterManager = defineStore('RegisterManager', () => {
  // STATE
  const loading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  // ACTION: สมัครสมาชิกใหม่
  const registerAccount = async (formData) => {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      // 1️⃣ สร้างบัญชีใน Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      const user = userCredential.user

      // 2️⃣ อัปเดตชื่อผู้ใช้ใน Firebase Profile
      await updateProfile(user, {
        displayName: formData.fullName
      })

      // 3️⃣ ส่งข้อมูลไปเก็บใน backend (Node.js/MySQL)
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          userType: formData.userType,
          fullName: formData.fullName,
          email: formData.email,
          dormitoryName: formData.dormitoryName || null,
          gender: formData.gender || null,
          staffId: formData.staffId || null,
          position: formData.position || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save user data in backend')
      }

      successMessage.value = 'Account created successfully!'
    } catch (error) {
      console.error(error)
      if (error.code === 'auth/email-already-in-use') {
        errorMessage.value = 'This email is already registered.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage.value = 'Invalid email format.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage.value = 'Password must be at least 6 characters.'
      } else {
        errorMessage.value = error.message || 'Registration failed.'
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    errorMessage,
    successMessage,
    registerAccount
  }
})
