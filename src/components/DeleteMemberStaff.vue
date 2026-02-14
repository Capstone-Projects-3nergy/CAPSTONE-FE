<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import { deleteItemById } from '@/utils/fetchUtils'
import { useUserManager } from '@/stores/MemberAndStaffManager'

const emit = defineEmits(['confirmDetail', 'cancelDetail', 'redAlert'])

const props = defineProps({
  residentData: Object,
  isPermanent: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const userManager = useUserManager()
const deletedProfile = ref(null)

const resident = computed(() => props.residentData || {})

/* ---------- move to trash ---------- */
const moveToTrash = async () => {
  if (!resident.value.id) {
    console.error('No resident ID found')
    return
  }

  try {
    const response = await deleteItemById(
      `${import.meta.env.VITE_BASE_URL}/api/staff/users`,
      resident.value.id,
      router
    )


    if (!response || response === '404') {
      console.error('❌ Delete failed')
      emit('redAlert')
      emit('cancelDetail', true)
      return
    }

    // ✅ สำเร็จ
    userManager.moveMemberToTrash(resident.value.id)
    emit('confirmDetail', true)
  } catch (error) {
    emit('redAlert')
    emit('cancelDetail', true)
  }
}


const deletePermanent = async () => {
  if (!resident.value.id) {
    console.error('No resident ID found')
    return
  }

  try {
    deletedProfile.value = await deleteItemById(
      `${import.meta.env.VITE_BASE_URL}/api/trash/residents`,
      resident.value.id
    )

    if (deletedProfile.value === '404') {
      emit('redAlert')
      emit('cancelDetail', true)
      return
    }

    userManager.deletePermanent(resident.value.id)
    emit('confirmDetail', true)
  } catch (error) {
    console.error('Error deleting permanently:', error)
    emit('redAlert')
    emit('cancelDetail', true)
  }
}

const confirmAction = () => {
  props.isPermanent ? deletePermanent() : moveToTrash()
}

const cancelAction = () => {
  emit('cancelDetail', true)
  router.replace({
    name: props.isPermanent ? 'trashparcels' : 'manageresident'
  })
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
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h1 class="text-xl font-bold text-gray-800">
            <template v-if="isPermanent"> Delete Resident </template>
            <template v-else> Move To Trash </template>
          </h1>
        </div>

        <!-- Body -->
        <div class="px-6 py-8">
          <div class="flex flex-col items-center text-center">
            
            <div 
              class="h-16 w-16 rounded-full flex items-center justify-center mb-6"
              :class="isPermanent ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'"
            >
              <svg v-if="isPermanent" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <p class="text-gray-600 text-lg mb-2">
              <template v-if="isPermanent">
                Permanently delete resident <br>
                <span class="font-bold text-gray-900 block mt-1 text-xl">"{{ resident.firstName }} {{ resident.lastName }}"</span>
              </template>
              <template v-else>
                Move resident to trash <br>
                <span class="font-bold text-gray-900 block mt-1 text-xl">"{{ resident.fullName }}"</span>
              </template>
            </p>

            <div v-if="isPermanent" class="mt-4 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
              This action cannot be undone.
            </div>
            <div v-else class="mt-4 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Items in trash are deleted after 30 days.
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-6 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100">
          <ButtonWeb
            label="Cancel"
            color="gray"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium transition shadow-sm"
            @click="cancelAction"
          />
          <ButtonWeb
            label="Confirm"
            :color="isPermanent ? 'red' : 'orange'"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg font-medium transition flex items-center justify-center"
            @click="confirmAction"
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
