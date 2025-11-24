<script setup>
import { useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import { useAuthManager } from '@/stores/AuthManager.js'

const emit = defineEmits(['confirmLogout', 'cancelLogout'])
const router = useRouter()
const authManager = useAuthManager()

// ฟังก์ชันยืนยัน logout
const confirmLogoutFn = async () => {
  try {
    await authManager.logoutAccount(router)
    emit('confirmLogout', true)
  } catch (err) {
    console.error('❌ Logout failed:', err)
  }
}

// ฟังก์ชันยกเลิก logout
const cancelLogoutFn = () => {
  emit('cancelLogout', true)
  // กลับหน้าเดิม (ถ้าต้องการ)
  router.back()
}
</script>

<template>
  <div
    class="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
  >
    <div class="bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b">
        <h1 class="text-lg font-bold text-gray-900 text-center">
          Confirm Logout
        </h1>
      </div>

      <!-- Body -->
      <div class="px-6 py-4 text-center text-gray-600">
        <p>
          Are you sure you want to logout? You will need to login again to
          access the system.
        </p>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
        <ButtonWeb
          label="Cancel"
          color="gray"
          class="w-full sm:w-auto"
          @click="cancelLogoutFn"
        />
        <ButtonWeb
          label="Logout"
          color="red"
          class="w-full sm:w-auto"
          @click="confirmLogoutFn"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
