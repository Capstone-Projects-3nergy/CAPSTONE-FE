import { reactive, ref } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useProfileManager = defineStore('profileManager', () => {
  // ------------------------
  // state
  // ------------------------
  const profile = reactive([]) // ✅ เหมือน parcel
  const loading = ref(false)
  const error = ref(false)

  // ------------------------
  // getters
  // ------------------------
  const getProfile = () => profile[0] || null

  // ------------------------
  // mutations
  // ------------------------
  const setProfile = (data) => {
    if (!data) return
    profile.length = 0
    profile.push(data)
  }

  const updateProfile = (updatedData) => {
    if (!updatedData || profile.length === 0) return
    profile.splice(0, 1, { ...profile[0], ...updatedData })
  }

  const clearProfile = () => {
    profile.length = 0
  }

  return {
    profile,
    loading,
    error,

    getProfile,
    setProfile,
    updateProfile,
    clearProfile
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileManager, import.meta.hot))
}
// import { reactive, ref } from 'vue'
// import { defineStore, acceptHMRUpdate } from 'pinia'
// import axios from 'axios'

// export const useProfileManager = defineStore('profileManager', () => {
//   // ------------------------
//   // state
//   // ------------------------
//   const profile = reactive({
//     id: null,
//     firstName: '',
//     lastName: '',
//     email: '',
//     role: '',
//     avatar: '',
//     position: '',
//     roomNumber: '',
//     lineId: '',
//     phoneNumber: ''
//   })

//   const loading = ref(false)
//   const editSuccess = ref(false)
//   const error = ref(false)

//   // ------------------------
//   // getters
//   // ------------------------
//   const getProfile = () => profile

//   // ------------------------
//   // mutations
//   // ------------------------
//   const setProfile = (user) => {
//     if (!user) return
//     Object.assign(profile, user)
//   }

//   const updateProfileState = (updatedData) => {
//     if (!updatedData) return
//     Object.assign(profile, updatedData)
//   }

//   const clearProfile = () => {
//     Object.assign(profile, {
//       id: null,
//       firstName: '',
//       lastName: '',
//       email: '',
//       role: '',
//       avatar: '',
//       position: '',
//       roomNumber: '',
//       lineId: '',
//       phoneNumber: ''
//     })
//   }

//   // ------------------------
//   // alerts
//   // ------------------------
//   const showEditSuccess = () => {
//     editSuccess.value = true
//   }

//   const showError = () => {
//     error.value = true
//   }

//   const clearAlert = () => {
//     editSuccess.value = false
//     error.value = false
//   }

//   // ------------------------
//   // API actions ✅ (อันที่ขาด)
//   // ------------------------
//   const updateProfile = async (url, payload, router) => {
//     loading.value = true
//     clearAlert()

//     try {
//       let body

//       // ✅ รองรับ avatar → FormData
//       if (payload.avatar) {
//         body = new FormData()
//         Object.keys(payload).forEach((key) => {
//           if (payload[key] !== null && payload[key] !== undefined) {
//             body.append(key, payload[key])
//           }
//         })
//       } else {
//         body = payload
//       }

//       const res = await axios.put(url, body, {
//         headers:
//           body instanceof FormData
//             ? { 'Content-Type': 'multipart/form-data' }
//             : {}
//       })

//       updateProfileState(res.data)
//       showEditSuccess()
//       return res.data
//     } catch (err) {
//       console.error(err)
//       showError()

//       if (err.response?.status === 401 && router) {
//         router.push('/login')
//       }

//       return null
//     } finally {
//       loading.value = false
//     }
//   }

//   // ------------------------
//   return {
//     // state
//     profile,
//     loading,
//     editSuccess,
//     error,

//     // getters
//     getProfile,

//     // actions
//     setProfile,
//     updateProfile,
//     updateProfileState,
//     clearProfile,

//     // alerts
//     showEditSuccess,
//     showError,
//     clearAlert
//   }
// })

// if (import.meta.hot) {
//   import.meta.hot.accept(acceptHMRUpdate(useProfileManager, import.meta.hot))
// }
