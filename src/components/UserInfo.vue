<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'
import { useProfileManager } from '@/stores/ProfileManager'
import axios from 'axios'
import { getProfile } from '@/utils/fetchUtils'
import { useRouter } from 'vue-router'
const loginManager = useAuthManager()
const router = useRouter()
const authStore = useAuthManager()
const profileManager = useProfileManager()
const newAvatar = ref(null)
const userName = computed(() => authStore.user?.fullName || 'Courier')
const role = computed(() => authStore.user?.role)
const userInitial = computed(() =>
  userName.value ? userName.value[0].toUpperCase() : 'C'
)
const userEmail = computed(() => authStore.user?.email || '')
const showDropdown = ref(false)
const showHoverInfo = ref(false)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  showHoverInfo.value = false
}

const closeDropdown = () => {
  showDropdown.value = false
}


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
  if (!authStore.user?.accessToken) return

  try {
    const baseURL = import.meta.env.VITE_BASE_URL
    const profile = await getProfile(`${baseURL}/api/profile`, router)
    if (profile) {
      profileManager.setCurrentProfile(profile)
    }
  } catch (err) {
    console.error('getProfile error:', err)
  }
})


const returnLoginPage = async () => {
  try {
    await loginManager.logoutAccount(router)
  } catch (err) {}
}
const openProfile = () => {
  if (!role.value) return

  if (role.value === 'STAFF') {
    router.replace({ name: 'profilestaff' })
  } else if (role.value === 'RESIDENT') {
    router.replace({
      name: 'profileresident'
    })
  }
}

const handleLogout = async () => {
  closeDropdown()
  await returnLoginPage()
}
const handleProfile = async () => {
  closeDropdown()
  await openProfile()
}
</script>
<template>
  <div class="relative">
    <!-- Main Avatar Circle -->
    <div
      class="flex items-center cursor-pointer group"
      @click="toggleDropdown"
      @mouseenter="showHoverInfo = true"
      @mouseleave="showHoverInfo = false"
    >
      <div
        class="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#1D355E] to-[#0E4B90] ring-2 ring-[#0E4B90]/10 group-hover:ring-[#0E4B90]/40 transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-110 active:scale-95 relative"
      >
        <img
          v-if="profileImageUrlPreview"
          :src="profileImageUrlPreview"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-white font-bold text-sm"
        >
          {{ userInitial }}
        </div>
      </div>
    </div>

    <!-- Quick Info Hover Tooltip -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div
        v-if="showHoverInfo && !showDropdown"
        class="absolute right-0 top-14 w-max bg-[#1D355E]/95 backdrop-blur-md px-5 py-2.5 rounded-xl shadow-xl border border-white/10 z-40 pointer-events-none flex flex-col items-end text-right"
      >
        <p class="font-bold text-sm text-white leading-none mb-1">{{ userName }}</p>
        <p class="text-[10px] text-blue-200 font-medium tracking-wide uppercase opacity-80">{{ userEmail }}</p>
      </div>
    </transition>

    <!-- Detailed Dropdown Menu -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="showDropdown"
        class="absolute right-0 mt-4 w-72 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-50 overflow-hidden"
      >
        <!-- Dropdown Header -->
        <div class="relative px-6 py-8 flex flex-col items-center text-center bg-gradient-to-b from-gray-50/50 to-white">
          <button
            class="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-400 hover:text-gray-600 cursor-pointer group"
            @click="closeDropdown"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="group-hover:rotate-90 transition-transform duration-300"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>

          <!-- Avatar in Dropdown -->
          <div class="relative mb-4 group/avatar">
            <div class="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#1D355E] to-[#0E4B90] p-1 shadow-lg ring-4 ring-white">
              <div class="w-full h-full rounded-full overflow-hidden bg-[#1D355E] relative">
                <img
                  v-if="profileImageUrlPreview"
                  :src="profileImageUrlPreview"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                >
                  {{ userInitial }}
                </div>
              </div>
            </div>
          </div>

          <h3 class="font-bold text-gray-900 text-lg leading-tight">{{ userName }}</h3>
          <p class="text-sm text-[#0E4B90] font-semibold mt-1 px-3 py-1 bg-blue-50 rounded-full">
            {{ userRole }}
          </p>
          <p class="text-xs text-gray-400 mt-2 font-medium">{{ userEmail }}</p>
        </div>

        <!-- Menu Actions -->
        <div class="p-2 bg-white">
          <button
            class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
            @click="handleProfile"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  class="text-[#0E4B90]"
                >
                  <path
                    d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 4C13.657 4 15 5.343 15 7C15 8.657 13.657 10 12 10C10.343 10 9 8.657 9 7C9 5.343 10.343 4 12 4ZM12 20C9.394 20 6.99 18.913 5.39 17.158C6.315 15.26 8.528 14 11 14H13C15.472 14 17.685 15.26 18.61 17.158C17.01 18.913 14.606 20 12 20Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span class="text-gray-700 font-bold text-sm">Personal Information</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-gray-300 group-hover:text-[#0E4B90] transition-all transform group-hover:translate-x-1"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <div class="h-px bg-gray-100 my-1 mx-4" />

          <button
            class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-red-50 transition-all duration-200 cursor-pointer group"
            @click="handleLogout"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-red-500"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <span class="text-red-600 font-bold text-sm">Logout</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-red-200 group-hover:text-red-500 transition-all transform group-hover:translate-x-1"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- Overlay Close Background -->
    <div
      v-if="showDropdown"
      class="fixed inset-0 z-40 bg-black/5"
      @click="closeDropdown"
    />
  </div>
</template>

