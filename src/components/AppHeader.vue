<script setup>
import { computed } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'

const authStore = useAuthManager()

const userName = computed(() => authStore.user?.fullName || 'Courier')
const userInitial = computed(() =>
  userName.value ? userName.value[0].toUpperCase() : 'C'
)

const userRole = computed(() => {
  const role = authStore.user?.role
  if (!role) return ''
  switch (role.toUpperCase()) {
    case 'STAFF':
      return 'Dormitory Staff'
    case 'RESIDENT':
      return 'Resident'
    default:
      return 'User'
  }
})

const emit = defineEmits(['toggle-sidebar'])

const toggleSidebar = () => {
  emit('toggle-sidebar')
}
</script>

<template>
  <header class="flex items-center w-full h-16 bg-white">
    <div
      class="flex-1 bg-white flex justify-end items-center px-4 shadow h-full"
    >
      <!-- Hamburger -->
      <svg
        @click="toggleSidebar"
        class="md:hidden mr-4 cursor-pointer"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M3 7H21M3 12H21M3 17H21"
          stroke="black"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>

      <div class="flex-1 flex justify-end items-center gap-5">
        <svg width="14" height="14" viewBox="0 0 14 14">
          <circle cx="10.75" cy="2.5" r="2.5" fill="#FFCC00" />
        </svg>

        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-[#185DC0] rounded-full flex items-center justify-center text-white font-semibold text-lg"
          >
            {{ userInitial }}
          </div>

          <div class="flex flex-col leading-tight">
            <span class="font-medium text-[#185DC0]">{{ userName }}</span>
            <span class="text-[#185DC0] text-sm">{{ userRole }}</span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
