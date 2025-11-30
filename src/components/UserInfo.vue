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
</script>

<template>
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
</template>
