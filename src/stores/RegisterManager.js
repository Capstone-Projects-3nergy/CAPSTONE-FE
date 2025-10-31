import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/firebaseConfig'
import { createUserWithEmailAndPassword, getIdToken } from 'firebase/auth'

export const useRegisterManager = defineStore('RegisterManager', () => {
  // 🔹 STATE
  const loading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  // 🔹 ACTION: สมัครสมาชิกใหม่ (ทั้ง staff และ resident)
  const registerAccount = async (formData) => {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      // 1️⃣ สมัครผู้ใช้ใน Firebase ก่อน
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // 2️⃣ ดึง Firebase ID Token
      const idToken = await getIdToken(userCredential.user)

      // 3️⃣ เตรียม payload (ข้อมูลที่ backend ต้องใช้)
      const payload = {
        userType: formData.userType,
        fullName: formData.fullName,
        email: formData.email,
        dormitoryName: formData.dormitoryName || null,
        gender: formData.gender || null,
        staffId: formData.staffId || null,
        position: formData.position || null
      }

      // 4️⃣ แยก endpoint ตามประเภทผู้ใช้
      const endpoint =
        formData.userType === 'staff'
          ? 'http://localhost:3000/api/staff/register'
          : 'http://localhost:3000/api/resident/register'

      // 5️⃣ ส่งข้อมูลไป backend พร้อม header Authorization
      const response = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      })

      // 6️⃣ ตรวจสอบ response จาก backend
      if (response.data && response.data.success) {
        successMessage.value = `Account created successfully as ${formData.userType}!`
      } else {
        throw new Error(response.data.message || 'Registration failed.')
      }
    } catch (error) {
      console.error(error)
      if (error.response?.data?.message) {
        errorMessage.value = error.response.data.message
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

// import { defineStore } from 'pinia'
// import { ref } from 'vue'
// import { auth } from '@/firebase/firebaseConfig'
// import {
//   createUserWithEmailAndPassword,
//   updateProfile,
//   onAuthStateChanged
// } from 'firebase/auth'

// export const useRegisterManager = defineStore('RegisterManager', () => {
//   // 🔹 STATE
//   const loading = ref(false)
//   const errorMessage = ref('')
//   const successMessage = ref('')
//   const currentUser = ref(null)

//   // 🔹 ACTION: สมัครสมาชิกใหม่ (ทั้ง staff และ resident)
//   const registerAccount = async (formData) => {
//     loading.value = true
//     errorMessage.value = ''
//     successMessage.value = ''

//     try {
//       // 1️⃣ สร้างบัญชีใน Firebase
//       const userCredential = await createUserWithEmailAndPassword(
//         auth,
//         formData.email,
//         formData.password
//       )
//       const user = userCredential.user

//       // 2️⃣ อัปเดตชื่อใน Firebase Profile
//       await updateProfile(user, {
//         displayName: formData.fullName
//       })

//       // 3️⃣ เตรียมข้อมูลส่งไป backend
//       const payload = {
//         uid: user.uid,
//         userType: formData.userType, // "staff" หรือ "resident"
//         fullName: formData.fullName,
//         email: formData.email,
//         dormitoryName: formData.dormitoryName || null,
//         gender: formData.gender || null,
//         staffId: formData.staffId || null,
//         position: formData.position || null
//       }

//       // 4️⃣ แยก API ตามประเภทผู้ใช้
//       const endpoint =
//         formData.userType === 'staff'
//           ? 'http://localhost:3000/api/staff/register'
//           : 'http://localhost:3000/api/resident/register'

//       const response = await fetch(endpoint, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       })

//       if (!response.ok) {
//         throw new Error('Failed to save user data in backend')
//       }

//       successMessage.value = `Account created successfully as ${formData.userType}!`
//     } catch (error) {
//       console.error(error)
//       if (error.code === 'auth/email-already-in-use') {
//         errorMessage.value = 'This email is already registered.'
//       } else if (error.code === 'auth/invalid-email') {
//         errorMessage.value = 'Invalid email format.'
//       } else if (error.code === 'auth/weak-password') {
//         errorMessage.value = 'Password must be at least 6 characters.'
//       } else {
//         errorMessage.value = error.message || 'Registration failed.'
//       }
//     } finally {
//       loading.value = false
//     }
//   }

//   // 🔹 ACTION: ตรวจสอบสถานะผู้ใช้
//   const initAuthWatcher = () => {
//     onAuthStateChanged(auth, (user) => {
//       if (user) {
//         currentUser.value = {
//           uid: user.uid,
//           email: user.email,
//           displayName: user.displayName
//         }
//         console.log('🔄 Auth State: User is logged in:', currentUser.value)
//       } else {
//         currentUser.value = null
//         console.log('🔄 Auth State: No user signed in')
//       }
//     })
//   }

//   return {
//     // state
//     loading,
//     errorMessage,
//     successMessage,
//     currentUser,
//     // actions
//     registerAccount,
//     initAuthWatcher
//   }
// })
