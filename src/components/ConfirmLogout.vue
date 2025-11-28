<script setup>
import { useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import { useAuthManager } from '@/stores/AuthManager.js'

const emit = defineEmits('cancelLogout')
const router = useRouter()
const authManager = useAuthManager()

const confirmLogoutFn = async () => {
  try {
    await authManager.logoutAccount(router)
  } catch (err) {}
}

const cancelLogoutFn = () => {
  emit('cancelLogout', true)
}
</script>

<template>
  <div
    class="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
  >
    <div
      class="bg-white w-full max-w-xs sm:max-w-md rounded-lg shadow-lg overflow-hidden h-auto max-h-96 sm:max-h-[32rem] flex flex-col sm:translate-x-0 sm:translate-y-0 sm:right-auto sm:top-auto right-8 top-16"
    >
      <div class="px-6 py-4 border-b">
        <h1 class="text-lg font-bold text-gray-900 text-center">
          Confirm Logout
        </h1>
      </div>

      <div class="px-6 py-4 text-center text-gray-600">
        <p>
          Are you sure you want to logout? You will need to login again to
          access the system.
        </p>
      </div>

      <div class="px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
        <ButtonWeb
          label="Logout"
          color="blue"
          class="w-full sm:w-auto"
          @click="confirmLogoutFn"
        />
        <ButtonWeb
          label="Cancel"
          color="gray"
          class="w-full sm:w-auto"
          @click="cancelLogoutFn"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
