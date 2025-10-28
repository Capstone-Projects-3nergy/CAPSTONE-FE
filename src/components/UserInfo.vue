<script setup>
import { computed } from 'vue'
import { useLoginManager } from '@/stores/LoginManager'

// 🧠 ดึงข้อมูลผู้ใช้จาก Pinia store
const loginStore = useLoginManager()

// ✅ สร้าง computed เพื่ออ่านค่าจาก store
const userName = computed(() => loginStore.user?.name || 'Guest')
const userRole = computed(() =>
  loginStore.user?.role === 'staff'
    ? 'Dormitory Admin'
    : loginStore.user?.role === 'resident'
    ? 'Resident'
    : 'Unknown'
)
</script>

<template>
  <!-- user info -->
  <div class="flex items-center gap-3">
    <!-- วงกลมแทนรูปโปรไฟล์ -->
    <div class="w-[48px] h-[38px] bg-[#185DC0] rounded-[10px]"></div>

    <!-- ข้อมูลชื่อกับบทบาท -->
    <div class="flex flex-col leading-tight">
      <span class="font-medium text-blue-500">{{ userName }}</span>
      <span class="text-blue-500 text-sm">{{ userRole }}</span>
    </div>
  </div>
</template>
