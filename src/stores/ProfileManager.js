import { reactive } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useProfileManager = defineStore('profileManager', () => {
  // เก็บข้อมูลโปรไฟล์ผู้ใช้ (object เดียว)
  const profile = reactive({
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  })

  const getProfile = () => profile

  const setProfile = (user) => {
    if (!user) return
    profile.id = user.id
    profile.firstName = user.firstName
    profile.lastName = user.lastName
    profile.email = user.email
    profile.role = user.role
  }

  const updateProfile = (updatedData) => {
    if (!updatedData) return
    Object.assign(profile, {
      ...profile,
      ...updatedData,
      updatedAt: new Date().toISOString()
    })
  }

  const clearProfile = () => {
    Object.keys(profile).forEach((key) => (profile[key] = null))
  }
  const editSuccess = ref(false)
  const error = ref(false)

  const showEditSuccess = () => {
    editSuccess.value = true
  }

  const showError = () => {
    error.value = true
  }

  const clearAlert = () => {
    editSuccess.value = false
    error.value = false
  }
  return {
    profile,
    editSuccess,
    error,
    updateProfile,
    showEditSuccess,
    showError,
    clearAlert,
    getProfile,
    setProfile,
    updateProfile,
    clearProfile
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileManager, import.meta.hot))
}
