<script setup>
import { computed } from 'vue'
import { useAuthManager } from '@/stores/AuthManager' // ✅ ใช้ตัวใหม่แทน

// 🧠 ดึงข้อมูลผู้ใช้จาก Pinia store
const authStore = useAuthManager()

// ✅ Computed สำหรับชื่อผู้ใช้
const userName = computed(() => authStore.user?.fullName || 'Guest')

// ✅ Computed สำหรับบทบาทผู้ใช้
const userRole = computed(() => {
  const role = authStore.user?.role
  if (!role) return 'Unknown'
  switch (role.toUpperCase()) {
    case 'STAFF':
      return 'Dormitory Admin'
    case 'RESIDENT':
      return 'Resident'
    default:
      return 'Unknown'
  }
})
</script>

<template>
  <!-- user info -->
  <div class="flex items-center gap-3">
    <!-- วงกลมแทนรูปโปรไฟล์ -->
    <div class="w-[48px] h-[38px] bg-[#185DC0] rounded-[10px]"></div>

    <!-- ข้อมูลชื่อกับบทบาท -->
    <div class="flex flex-col leading-tight">
      <span class="font-medium text-[#185DC0]">{{ userName }}</span>
      <span class="text-[#185DC0] text-sm">{{ userRole }}</span>
    </div>
  </div>
</template>
<!-- <script setup>
import { computed } from 'vue'
import { useLoginManager } from '@/stores/LoginManager'

// 🧠 ดึงข้อมูลผู้ใช้จาก Pinia store
const loginStore = useLoginManager()

// ✅ Computed สำหรับชื่อผู้ใช้
const userName = computed(() => loginStore.user?.name || 'Guest')

// ✅ Computed สำหรับบทบาทผู้ใช้
const userRole = computed(() => {
  if (!loginStore.user?.role) return 'Unknown'
  switch (loginStore.user.role) {
    case 'STAFF':
      return 'Dormitory Admin'
    case 'RESIDENT':
      return 'Resident'
    default:
      return 'Unknown'
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
</template> -->
