<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import { restoreParcel } from '@/utils/fetchUtils'

const emit = defineEmits([
  'confirmDetail',
  'cancelDetail',
  'redAlert'
])

const props = defineProps({
  announcementData: Object
})

const router = useRouter()

const announcement = computed(() => props.announcementData || {})

const restoreAnnouncementFn = async () => {
  if (!announcement.value?.id) return

  try {
    const res = await restoreParcel(
      `${import.meta.env.VITE_BASE_URL}/api/trash/announcements`,
      announcement.value.id,
      router
    )

    // ❌ backend not success
    if (!res || !res.ok) {
      emit('redAlert')
      emit('cancelDetail', true)
      return
    }

    // ✅ success
    emit('confirmDetail', true)
  } catch (err) {
    emit('redAlert')
    emit('cancelDetail', true)
  }
}

const cancelAction = () => {
  emit('cancelDetail', true)
}

const confirmRestore = () => {
  restoreAnnouncementFn()
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
            Restore Announcement
          </h1>
        </div>

        <!-- Body -->
        <div class="px-6 py-8">
          <div class="flex flex-col items-center text-center">
            
            <div class="h-16 w-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>

            <p class="text-gray-600 text-lg mb-2">
              Restore announcement <br>
              <span class="font-bold text-gray-900 block mt-1 text-xl">"{{ announcement.title }}"</span>
            </p>

            <div class="mt-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              This item will be moved back to the active list.
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
            label="Confirm Restore"
            color="green"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg font-medium transition flex items-center justify-center"
            @click="confirmRestore"
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
