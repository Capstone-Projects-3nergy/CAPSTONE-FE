<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'
import { useProfileManager } from '@/stores/ProfileManager'
import axios from 'axios'
import { getProfile } from '@/utils/fetchUtils'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthManager()
const profileManager = useProfileManager()
const newAvatar = ref(null)
// --------------------
// name + initial
// --------------------
const userName = computed(() => authStore.user?.fullName || 'Courier')

const userInitial = computed(() =>
  userName.value ? userName.value[0].toUpperCase() : 'C'
)

// --------------------
// profile image
// --------------------
// const profileImage = computed(() => {
//   return profileManager.currentProfile?.profileImage || null
// })
const profileImageUrlPreview = computed(() => {
  if (newAvatar.value) {
    return URL.createObjectURL(newAvatar.value)
  }

  const url = profileManager.currentProfile?.profileImageUrl
  if (url && url.startsWith('http')) {
    return url
  }

  return ''
})
// const profileImage = computed(() => {
//   const img = profileManager.currentProfile?.profileImage
//   if (!img) return null
//   return img.startsWith('http')
//     ? img
//     : `${import.meta.env.VITE_BASE_URL}${img}`
// })

const userRole = computed(() => {
  const role = authStore.user?.role
  if (!role) return ''
  switch (role.toUpperCase()) {
    case 'STAFF':
      return authStore.user.position
    case 'RESIDENT':
      return 'Resident'
    default:
      return 'User'
  }
})
onMounted(async () => {
  try {
    const baseURL = import.meta.env.VITE_BASE_URL
    const profile = await getProfile(`${baseURL}/api/profile`, router)
    if (!profile) return
    profileManager.setCurrentProfile(profile)
  } catch (err) {
    console.error(err)
  }
})
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- profile image -->
    <div
      class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-[#185DC0]"
    >
      <img
        v-if="profileImageUrlPreview"
        :src="profileImageUrlPreview"
        alt="profile"
        class="w-full h-full object-cover"
      />

      <span v-else class="text-white font-semibold text-lg">
        {{ userInitial }}
      </span>
    </div>

    <div class="flex flex-col leading-tight">
      <span class="font-medium text-[#185DC0]">{{ userName }}</span>
      <span class="text-[#185DC0] text-sm">{{ userRole }}</span>
    </div>
  </div>
</template>
