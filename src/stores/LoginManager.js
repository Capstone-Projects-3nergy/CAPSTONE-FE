// 🔥 LoginManager.js — ใช้ Firebase Auth + เชื่อม Backend + เก็บใน Pinia
import { defineStore } from 'pinia'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/firebase/firebaseConfig' // ต้องมีไฟล์ firebaseConfig.js ตั้งค่า firebase app
import { ref } from 'vue'

// ✅ ตัวช่วย decode JWT (สำหรับ backend ที่ส่ง token กลับ)
import jwtDecode from 'jwt-decode'

export const useLoginManager = defineStore('loginManager', () => {
  // 🧠 state
  const user = ref(null) // เก็บข้อมูลผู้ใช้ที่ล็อกอินอยู่
  const isLoading = ref(false)
  const errorMessage = ref(null)
  const successMessage = ref(null)

  // 🧩 ฟังก์ชันเข้าสู่ระบบ
  const loginAccount = async (email, password, router) => {
    isLoading.value = true
    errorMessage.value = null
    successMessage.value = null

    try {
      // 🔐 เข้าสู่ระบบด้วย Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const firebaseUser = userCredential.user

      // 🧾 ดึง token ของผู้ใช้จาก Firebase
      const idToken = await firebaseUser.getIdToken()

      // ✅ ส่ง token ไป backend เพื่อยืนยันสิทธิ์และเช็ค role (resident / staff)
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }) // ส่ง JWT จาก Firebase ให้ backend ตรวจสอบ
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Login failed')

      // 📌 สมมุติ backend ส่งกลับ: { success: true, role: 'resident', name: 'John' }
      user.value = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: data.name,
        role: data.role
      }

      // ✅ decode JWT จาก backend (ถ้ามี)
      if (data.accessToken) {
        const decoded = jwtDecode(data.accessToken)
        console.log('Decoded JWT payload:', decoded)
      }

      successMessage.value = 'Login successful!'

      // 🚀 นำทางไปหน้า dashboard/home ตาม role
      if (data.role === 'resident') router.replace({ name: 'home' })
      else if (data.role === 'staff') router.replace({ name: 'staffDashboard' })
      else router.replace({ name: 'home' })

      return user.value
    } catch (err) {
      console.error('Login error:', err)
      errorMessage.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 🧹 ฟังก์ชันออกจากระบบ
  const logoutAccount = async (router) => {
    try {
      await signOut(auth)
      user.value = null
      router.replace({ name: 'login' })
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return {
    user,
    isLoading,
    errorMessage,
    successMessage,
    loginAccount,
    logoutAccount
  }
})
