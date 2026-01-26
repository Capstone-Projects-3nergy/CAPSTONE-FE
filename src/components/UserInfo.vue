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
// --------------------
// name + initial
// --------------------
const userName = computed(() => authStore.user?.fullName || 'Courier')
const role = computed(() => authStore.user?.role)
const userInitial = computed(() =>
  userName.value ? userName.value[0].toUpperCase() : 'C'
)
const showDropdown = ref(false)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
}

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
      // query: { tab: 'notify' }
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
    <!-- avatar trigger -->
    <div class="flex items-center cursor-pointer" @click="toggleDropdown">
      <div
        class="w-10 h-10 rounded-full overflow-hidden bg-[#0E4B90] ring-2 ring-transparent hover:ring-[#0E4B90]/40 transition"
      >
        <img
          v-if="profileImageUrlPreview"
          :src="profileImageUrlPreview"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-white font-semibold"
        >
          {{ userInitial }}
        </div>
      </div>
    </div>

    <!-- dropdown -->
    <transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="showDropdown"
        class="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
      >
        <!-- header -->
        <div class="relative px-6 py-5 flex flex-col items-center gap-2">
          <button
            class="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 cursor-pointer"
            @click="closeDropdown"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
          <div class="w-16 h-16 rounded-full overflow-hidden bg-[#0E4B90]">
            <img
              v-if="profileImageUrlPreview"
              :src="profileImageUrlPreview"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-white text-xl font-semibold"
            >
              {{ userInitial }}
            </div>
          </div>

          <p class="font-semibold text-gray-900">
            {{ userName }}
          </p>
          <p class="text-sm text-gray-500">
            {{ userRole }}
          </p>
        </div>

        <div class="border-t" />

        <!-- profile -->
        <button
          class="w-full flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-sm cursor-pointer"
          @click="handleProfile"
        >
          <!-- profile svg -->
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M8 7C8 5.9 8.42 4.92 9.17 4.17C9.92 3.42 10.94 3 12 3C13.06 3 14.08 3.42 14.83 4.17C15.58 4.92 16 5.94 16 7C16 8.06 15.58 9.08 14.83 9.83C14.08 10.58 13.06 11 12 11C10.94 11 9.92 10.58 9.17 9.83C8.42 9.08 8 8.06 8 7ZM8 13C6.67 13 5.4 13.53 4.46 14.46C3.53 15.4 3 16.67 3 18C3 18.8 3.32 19.56 3.88 20.12C4.44 20.68 5.2 21 6 21H18C18.8 21 19.56 20.68 20.12 20.12C20.68 19.56 21 18.8 21 18C21 16.67 20.47 15.4 19.54 14.46C18.6 13.53 17.33 13 16 13H8Z"
              fill="#0E4B90"
            />
          </svg>

          <span class="text-[#0E4B90]">Personal Information</span>
        </button>

        <!-- logout -->
        <button
          class="w-full flex items-center gap-3 px-6 py-3 hover:bg-red-50 transition text-sm text-red-600 cursor-pointer"
          @click="handleLogout"
        >
          <!-- logout svg -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" />
            <path
              d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"
            />
            <path d="M9 12h12l-3 -3" />
            <path d="M18 15l3 -3" />
          </svg>

          <span>Logout</span>
        </button>
      </div>
    </transition>

    <!-- overlay -->
    <div
      v-if="showDropdown"
      class="fixed inset-0 z-40"
      @click="closeDropdown"
    />
  </div>
</template>

<!-- <template>
  <div class="relative">
   
    <div
      class="flex items-center gap-3 cursor-pointer group"
      @click="toggleDropdown"
    >
      <div
        class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-[#0E4B90] ring-2 ring-transparent group-hover:ring-[#0E4B90]/40 transition-all duration-200"
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
    </div>

   
    <transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showDropdown"
        class="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
      >
        
        <div class="px-4 py-3 bg-[#0E4B90]">
          <p class="text-white font-medium text-sm truncate">
            {{ userName }}
          </p>
          <p class="text-white/80 text-xs">
            {{ userRole }}
          </p>
        </div>

       
        <button
          class="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-100 transition"
          @click="handleProfile"
        >
          <span>👤</span>
          Profile
        </button>

        <button
          class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
          @click="handleLogout"
        >
          <span>🚪</span>
          Logout
        </button>
      </div>
    </transition>

  
    <div
      v-if="showDropdown"
      class="fixed inset-0 z-40"
      @click="closeDropdown"
    />
  </div>
</template> -->

<!-- <template>
  <div class="flex items-center gap-3">
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
</template> -->
