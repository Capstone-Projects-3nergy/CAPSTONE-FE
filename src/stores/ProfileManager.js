import { reactive, ref } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useProfileManager = defineStore('profileManager', () => {
  // ------------------------
  // state
  // ------------------------
  const profiles = reactive([]) // profile list
  const trash = reactive([]) // deleted profiles

  const loading = ref(false)
  const error = ref(false)

  // ------------------------
  // helpers
  // ------------------------
  const findIndexById = (list, id) => list.findIndex((el) => el.id === id)

  // ------------------------
  // getters
  // ------------------------
  const getProfiles = () => profiles
  const getProfileById = (id) => profiles.find((p) => p.id === id) || null
  const getTrash = () => trash

  // ------------------------
  // setters
  // ------------------------
  const setProfiles = (profileList = []) => {
    profiles.length = 0
    const list = Array.isArray(profileList) ? profileList : [profileList]
    list.forEach((p) => profiles.push(p))
  }

  const setTrash = (trashList = []) => {
    trash.length = 0
    const list = Array.isArray(trashList) ? trashList : [trashList]
    list.forEach((t) => trash.push(t))
  }

  // ------------------------
  // CRUD (เหมือน parcel)
  // ------------------------
  const addProfile = (newProfile) => {
    if (!newProfile) return
    profiles.push(newProfile)
  }

  const updateProfile = (updatedProfile) => {
    if (!updatedProfile) return
    const index = findIndexById(profiles, updatedProfile.id)
    if (index !== -1) {
      profiles.splice(index, 1, {
        ...profiles[index],
        ...updatedProfile,
        updatedAt: new Date().toISOString()
      })
    }
  }

  const moveToTrash = (id) => {
    const index = findIndexById(profiles, id)
    if (index !== -1) {
      const removed = profiles.splice(index, 1)[0]
      trash.push({
        ...removed,
        original: { ...removed },
        deletedAt: new Date().toISOString()
      })
    }
  }

  const restoreFromTrash = (id) => {
    const index = findIndexById(trash, id)
    if (index !== -1) {
      const removed = trash.splice(index, 1)[0]
      const original = removed.original || removed

      profiles.push({
        ...original,
        deletedAt: null,
        updatedAt: new Date().toISOString()
      })
    }
  }

  const deletePermanent = (id) => {
    const index = findIndexById(trash, id)
    if (index !== -1) {
      trash.splice(index, 1)
    }
  }

  const clearProfiles = () => {
    profiles.length = 0
    trash.length = 0
  }
  const currentProfile = ref(null)

  const setCurrentProfile = (profile) => {
    currentProfile.value = profile
  }

  const updateCurrentProfile = (updated) => {
    if (!currentProfile.value) return
    currentProfile.value = {
      ...currentProfile.value,
      ...updated
    }
  }

  return {
    // state
    profiles,
    trash,
    loading,
    error,

    // getters
    getProfiles,
    getProfileById,
    getTrash,

    // actions
    setProfiles,
    setTrash,
    addProfile,
    updateProfile,
    moveToTrash,
    restoreFromTrash,
    deletePermanent,
    clearProfiles,
    currentProfile,
    setCurrentProfile,
    updateCurrentProfile
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
//     profileImageUrl: '',
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
//       profileImageUrl: '',
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

//       // ✅ รองรับ profileImageUrl → FormData
//       if (payload.profileImageUrl) {
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
