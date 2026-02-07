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
  <Transition name="modal-fade" appear>
    <div
      class="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
    >
      <div
        class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all"
        @click.stop
      >
        <div class="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900">
            Confirm Logout
          </h1>
        </div>

        <div class="px-6 py-8 text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          
          <p class="text-gray-600 text-lg leading-relaxed">
            Are you sure you want to logout?
          </p>
          <p class="text-xs text-gray-400 mt-2">You will need to login again to access the system.</p>
        </div>

        <div class="px-6 py-6 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <ButtonWeb
            label="Cancel"
            color="gray"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition shadow-sm"
            @click="cancelLogoutFn"
          />
          <ButtonWeb
            label="Logout"
            color="red"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:bg-red-600 font-medium transition"
            @click="confirmLogoutFn"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .bg-white,
.modal-fade-leave-active .bg-white {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from .bg-white,
.modal-fade-leave-to .bg-white {
  transform: scale(0.95);
}
</style>
