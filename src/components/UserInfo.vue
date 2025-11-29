<script setup>
import { computed } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'

const authStore = useAuthManager()

const userName = computed(() => authStore.user?.fullName || 'Parcel Sender')

const userRole = computed(() => {
  const role = authStore.user?.role
  if (!role) return ''
  switch (role.toUpperCase()) {
    case 'STAFF':
      return 'Dormitory Staff'
    case 'RESIDENT':
      return 'Resident'
    case 'SHIPPING':
      return 'Parcel Sender'
    default:
      return 'User'
  }
})
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="w-[48px] h-[38px] bg-[#185DC0] rounded-[10px]"></div>

    <div class="flex flex-col leading-tight">
      <span class="font-medium text-[#185DC0]">{{ userName }}</span>
      <span class="text-[#185DC0] text-sm">{{ userRole }}</span>
    </div>
  </div>
</template>
