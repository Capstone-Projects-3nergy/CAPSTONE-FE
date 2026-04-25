<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
const props = defineProps({
  align: {
    type: String,
    default: 'right' 
  },
  manualTrigger: {
    type: Boolean,
    default: false
  },
  shrunk: {
    type: Boolean,
    default: false
  }
})
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

const userEmail = computed(() => authStore.user?.email || '')
const showDropdown = ref(false)
const showHoverInfo = ref(false)

const triggerRef = ref(null)
const popoverStyle = ref({ rowCenter: 0, left: 0 })

const updatePopoverPosition = (target = null) => {
  const el = target || triggerRef.value
  if (el && props.align === 'left') {
    const rect = el.getBoundingClientRect()
    popoverStyle.value = {
      rowCenter: rect.top + (rect.height / 2),
      left: rect.right + (windowWidth.value < 640 ? -8 : 12)
    }
  }
}

const toggleDropdown = () => {
  updatePopoverPosition()
  showDropdown.value = !showDropdown.value
  showHoverInfo.value = false
}

const handleMouseEnter = (event = null) => {
  const target = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null
  updatePopoverPosition(target)
  showHoverInfo.value = true
}

const handleMouseLeave = () => {
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
  window.addEventListener('resize', handleResize)
  
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

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
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

defineExpose({
  toggleDropdown,
  handleMouseEnter,
  handleMouseLeave
})
</script>
<template>
  <div class="relative">
  
    <div
      ref="triggerRef"
      class="flex items-center justify-center group"
      :class="manualTrigger ? '' : 'cursor-pointer'"
      @click="manualTrigger ? null : toggleDropdown()"
      @mouseenter="manualTrigger ? null : handleMouseEnter"
      @mouseleave="manualTrigger ? null : handleMouseLeave"
    >
      <div
        class="rounded-full overflow-hidden bg-gradient-to-br from-[#1D355E] to-[#0E4B90] ring-2 ring-[#0E4B90]/10 group-hover:ring-[#0E4B90]/40 transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-110 active:scale-95 relative flex-shrink-0 !w-[34px] !h-[34px]"
      >
        <img
          v-if="profileImageUrlPreview"
          :src="profileImageUrlPreview"
          class="absolute inset-0 w-full h-full object-cover object-center block"
        />
        <div
          v-else
          class="absolute inset-0 flex items-center justify-center text-white font-bold text-sm"
        >
          {{ userInitial }}
        </div>
      </div>
    </div>

    <teleport to="body">
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
        class="fixed bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-[60] overflow-hidden transition-all duration-300"
        :style="align === 'left' ? { 
          top: `${Math.max(20, popoverStyle.rowCenter - (shrunk ? 120 : 240))}px`, 
          left: `${popoverStyle.left}px` 
        } : {}"
        :class="align === 'right' ? 'absolute right-0 mt-4 w-72' : 'w-[240px] sm:w-[260px] mx-0'"
      >
       
        <div class="flex flex-col max-h-[90vh] overflow-y-auto">
          
    
          <div 
            class="relative flex flex-col items-center bg-gradient-to-b from-gray-50/50 to-white transition-all px-4 py-4 text-center border-b border-gray-100"
          >
            

            <div class="relative mb-2 group/avatar">
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gradient-to-br from-[#1D355E] to-[#0E4B90] p-1 shadow-lg ring-2 ring-white">
                <div class="w-full h-full rounded-full overflow-hidden relative">
                  <img v-if="profileImageUrlPreview" :src="profileImageUrlPreview" class="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover/avatar:scale-110 block" />
                  <div v-else class="absolute inset-0 flex items-center justify-center text-white text-base font-bold">
                    {{ userInitial }}
                  </div>
                </div>
              </div>
            </div>

            <template v-if="!shrunk">
              <h3 class="font-bold text-gray-900 text-xs sm:text-sm leading-tight text-center">{{ userName }}</h3>
              <p class="text-[9px] sm:text-[10px] text-[#0E4B90] font-semibold mt-1 px-3 py-0.5 bg-blue-50 rounded-full text-center">
                {{ userRole }}
              </p>
              <p class="text-[8px] text-gray-400 mt-1 font-medium text-center w-full px-2 truncate">{{ userEmail }}</p>
            </template>
          </div>

         
          <div class="flex-1 p-2 bg-white flex flex-col justify-center gap-1">
            <button
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-50/50 transition-all duration-200 cursor-pointer group"
              @click="handleProfile"
            >
              <div class="flex items-center gap-2.5">
                <div class="p-1.5 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-[#0E4B90]">
                    <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 4C13.657 4 15 5.343 15 7C15 8.657 13.657 10 12 10C10.343 10 9 8.657 9 7C9 5.343 10.343 4 12 4ZM12 20C9.394 20 6.99 18.913 5.39 17.158C6.315 15.26 8.528 14 11 14H13C15.472 14 17.685 15.26 18.61 17.158C17.01 18.913 14.606 20 12 20Z" fill="currentColor"/>
                  </svg>
                </div>
                <span class="text-gray-700 font-bold text-xs sm:text-sm">Personal Info</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300 group-hover:text-[#0E4B90] transition-all transform group-hover:translate-x-1">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div class="h-px bg-gray-100 mx-3" />

            <button
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all duration-200 cursor-pointer group"
              @click="handleLogout"
            >
              <div class="flex items-center gap-2.5">
                <div class="p-1.5 bg-red-50 rounded-full group-hover:bg-red-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <span class="text-red-600 font-bold text-xs sm:text-sm">Logout</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300 group-hover:text-red-500 transition-all transform group-hover:translate-x-1">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </transition>
    </teleport>

    <teleport to="body">
      <div
        v-if="showDropdown"
        class="fixed inset-0 z-[55] bg-black/5"
        @click="closeDropdown"
      />
    </teleport>
  </div>
</template>

