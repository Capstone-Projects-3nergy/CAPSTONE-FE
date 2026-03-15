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
    default: 'right' // 'right' aligns right edge (pops left), 'left' aligns left edge (pops right)
  },
  manualTrigger: {
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
      left: rect.right + (windowWidth.value < 640 ? 12 : 16)
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
// Existing profile image preview logic...
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
    <!-- Main Avatar Circle -->
    <div
      ref="triggerRef"
      class="flex items-center group"
      :class="manualTrigger ? '' : 'cursor-pointer'"
      @click="manualTrigger ? null : toggleDropdown()"
      @mouseenter="manualTrigger ? null : handleMouseEnter"
      @mouseleave="manualTrigger ? null : handleMouseLeave"
    >
      <div
        class="rounded-full overflow-hidden bg-gradient-to-br from-[#1D355E] to-[#0E4B90] ring-2 ring-[#0E4B90]/10 group-hover:ring-[#0E4B90]/40 transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-110 active:scale-95 relative flex-shrink-0 !w-10 !h-10 flex items-center justify-center"
      >
        <img
          v-if="profileImageUrlPreview"
          :src="profileImageUrlPreview"
          class="absolute inset-0 w-full h-full object-cover object-center block"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-white font-bold text-sm"
        >
          {{ userInitial }}
        </div>
      </div>
    </div>

    <!-- Quick Info Hover Tooltip 
    <teleport to="body">
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
          class="fixed bg-[#1D355E]/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-white/10 z-[70] pointer-events-none flex flex-col min-w-[120px]"
          :style="align === 'left' ? { 
            top: `${popoverStyle.rowCenter - (windowWidth < 640 ? 40 : 22)}px`, 
            left: `${popoverStyle.left}px` 
          } : {}"
          :class="align === 'right' ? 'absolute right-0 top-14 items-end text-right' : 'items-start text-left'"
        >
          <p class="font-bold text-xs text-white leading-none mb-1">{{ userName }}</p>
          <p class="text-[9px] text-blue-200 font-medium tracking-wide uppercase opacity-80">{{ userEmail }}</p>
        </div>
      </transition>
    </teleport>
    -->

    <!-- Detailed Dropdown Menu -->
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
          top: `${popoverStyle.rowCenter - (windowWidth < 640 ? 120 : 200)}px`, 
          left: `${popoverStyle.left}px` 
        } : {}"
        :class="align === 'right' ? 'absolute right-0 mt-4 w-72' : 'w-[280px] sm:w-[420px] mx-0'"
      >
        <!-- Dropdown Header & Content Container -->
        <div :class="align === 'left' ? 'flex flex-col sm:flex-row items-stretch' : 'flex flex-col'">
          
          <!-- Profile Section (Avatar + Basic Info) - Hidden on Mobile for Sidebar -->
          <div 
            v-if="!(windowWidth < 640 && align === 'left')"
            class="relative flex flex-col items-center bg-gradient-to-b from-gray-50/50 to-white transition-all"
            :class="align === 'left' ? 'w-full sm:w-48 py-6 sm:py-10 px-6 border-b sm:border-b-0 sm:border-r border-gray-100' : 'px-6 py-8 text-center'"
          >
            <!-- (Close button removed from here) -->

            <!-- Avatar -->
            <div class="relative mb-3 sm:mb-4 group/avatar">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#1D355E] to-[#0E4B90] p-1 shadow-lg ring-4 ring-white">
                <div class="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center">
                  <img v-if="profileImageUrlPreview" :src="profileImageUrlPreview" class="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover/avatar:scale-110 block" />
                  <div v-else class="w-full h-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                    {{ userInitial }}
                  </div>
                </div>
              </div>
            </div>

            <h3 class="font-bold text-gray-900 text-base sm:text-lg leading-tight text-center">{{ userName }}</h3>
            <p class="text-xs sm:text-sm text-[#0E4B90] font-semibold mt-1 px-3 py-1 bg-blue-50 rounded-full text-center">
              {{ userRole }}
            </p>
            <p class="text-[9px] sm:text-[10px] text-gray-400 mt-2 font-medium text-center truncate w-full px-2">{{ userEmail }}</p>
          </div>

          <!-- Menu Actions Section -->
          <div class="flex-1 p-3 bg-white flex flex-col justify-center gap-2">
            <button
              class="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-blue-50/50 transition-all duration-200 cursor-pointer group"
              @click="handleProfile"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-[#0E4B90]">
                    <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 4C13.657 4 15 5.343 15 7C15 8.657 13.657 10 12 10C10.343 10 9 8.657 9 7C9 5.343 10.343 4 12 4ZM12 20C9.394 20 6.99 18.913 5.39 17.158C6.315 15.26 8.528 14 11 14H13C15.472 14 17.685 15.26 18.61 17.158C17.01 18.913 14.606 20 12 20Z" fill="currentColor"/>
                  </svg>
                </div>
                <span class="text-gray-700 font-bold text-sm">Personal Info</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300 group-hover:text-[#0E4B90] transition-all transform group-hover:translate-x-1">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div class="h-px bg-gray-100 mx-4" />

            <button
              class="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 cursor-pointer group"
              @click="handleLogout"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 bg-red-50 rounded-full group-hover:bg-red-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <span class="text-red-600 font-bold text-sm">Logout</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-200 group-hover:red-500 transition-all transform group-hover:translate-x-1">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </transition>
    </teleport>

    <!-- Overlay Close Background -->
    <teleport to="body">
      <div
        v-if="showDropdown"
        class="fixed inset-0 z-[55] bg-black/5"
        @click="closeDropdown"
      />
    </teleport>
  </div>
</template>

