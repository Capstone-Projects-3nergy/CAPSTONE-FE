<script setup>
import { ref, computed, onMounted } from 'vue'
import { useParcelManager } from '@/stores/ParcelsManager'
import { useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import { confirmParcelReceived } from '@/utils/fetchUtils'

const emit = defineEmits([
  'confirmDetail',
  'cancelDetail',
  'redAlert',
  'confirmParcel'
])
const props = defineProps(['parcelConfirmData'])
const router = useRouter()
const parcelManager = useParcelManager()
const parcelEditDetail = ref(null)
const parcelIdDetail = ref(null)
const deletedParcel = ref(null)
onMounted(() => {})

const parcel = computed(() => props.parcelConfirmData || {})
const confirmParcelFn = async () => {
  if (!parcel.value.id) return

  const res = await confirmParcelReceived(
    `${import.meta.env.VITE_BASE_URL}/api/OwnerParcels`,
    parcel.value.id,
    router
  )

  if (!res || res?.status === 404 || res?.error) {
    emit('redAlert')
    emit('cancelParcel', true)
    return
  }

  if (res?.status === 401) {
    emit('redAlert')
    emit('cancelParcel', true)
    return
  }

  if (res?.parcelId || res?.status === 'RECEIVED') {
    parcelManager.updateParcelStatus(parcel.value.id, 'PICKED_UP')
    emit('confirmParcel', true)
    return
  }
}

const cancelFn = () => {
  emit('cancelParcel', true)
  router.replace({ name: 'residentparcelsDetail' })
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
            Confirm Pickup
          </h1>
        </div>

        <div class="px-6 py-8 text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <svg class="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p class="text-gray-600 text-lg leading-relaxed">
            Are you sure you want to confirm that you have received this parcel?
          </p>
          <p class="text-xs text-gray-400 mt-2">This action cannot be undone.</p>
        </div>

        <div class="px-6 py-6 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
           <ButtonWeb
            label="Cancel"
            color="gray"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium transition shadow-sm"
            @click="cancelFn"
          />
          <ButtonWeb
            label="Confirm"
            color="blue"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:bg-blue-600 font-medium transition"
            @click="confirmParcelFn"
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
