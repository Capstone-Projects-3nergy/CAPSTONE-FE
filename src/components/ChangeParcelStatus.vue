<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useParcelManager } from '@/stores/ParcelsManager.js'
import ButtonWeb from './ButtonWeb.vue'
import { getItemById, editItem } from '@/utils/fetchUtils'
import ManageParcels from './ManageParcels.vue'
const route = useRoute()
const router = useRouter()
const parcelStore = useParcelManager()

const emit = defineEmits([
  'cancelStatusDetail',
  'confirmStatusDetail',
  'redStatusAlert'
])
defineProps({
  parcelDataStatus: {
    type: Object,
    required: false
  }
})
const newStatus = ref('')
const currentStatus = ref('')
const statusChangedSuccessfuly = ref(false)

const form = ref({
  parcelId: '',
  trackingNumber: '',
  recipientName: '',
  senderName: '',
  parcelType: '',
  companyId: '',
  imageUrl: '',
  status: '',
  receivedAt: '',
  pickedUpAt: '',
  updatedAt: '',
  residentName: '',
  roomNumber: '',
  email: ''
})

const originalForm = ref({ ...form.value })

const statusOptions = computed(() => {
  if (currentStatus.value === 'WAITING_FOR_STAFF')
    return ['WAITING_FOR_STAFF', 'RECEIVED']
  if (currentStatus.value === 'RECEIVED') return ['RECEIVED', 'PICKED_UP']
  return ['RECEIVED', 'PICKED_UP']
})

const isPickUp = computed(() => currentStatus.value === 'PICKED_UP')

const getParcelDetail = async (id) => {
  try {
    const data = await getItemById(
      `${import.meta.env.VITE_BASE_URL}/api/parcels`,
      Number(id),
      router
    )
    form.value = { ...data }
    parcelStore.addParcel(form.value)
    originalForm.value = { ...form.value }
  } catch (err) {}
}

watch(
  () => route.params.tid,
  async (tid) => {
    if (!tid) return
    await getParcelDetail(tid)

    const status = form.value.status.toUpperCase().replace(' ', '_')
    newStatus.value = status
    currentStatus.value = status
  },
  { immediate: true }
)

const saveStatusChange = async () => {
  try {
    const body = {
      trackingNumber: form.value.trackingNumber,
      recipientName: form.value.recipientName,
      parcelType: form.value.parcelType,
      senderName: form.value.senderName,
      status: newStatus.value,
      companyId: form.value.companyId ? Number(form.value.companyId) : null,
      imageUrl: form.value.imageUrl
    }

    const updatedParcel = await editItem(
      `${import.meta.env.VITE_BASE_URL}/api/parcels`,
      form.value.parcelId,
      body,
      router
    )

    parcelStore.updateParcel(updatedParcel)
    form.value = { ...form.value, ...updatedParcel }
    currentStatus.value = newStatus.value
    statusChangedSuccessfuly.value = true
    emit('confirmStatusDetail')
  } catch (err) {
    emit('redStatusAlert', err)
  }
}

const isSaveDisabled = computed(() => {
  return !newStatus.value || newStatus.value === currentStatus.value
})

const cancel = () => {
  router.replace({ name: 'staffparcels' })
}
</script>

<template>
  <Transition name="modal-fade" appear>
    <div
      class="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 transform transition-all"
        @click.stop
      >
        <div
          v-if="statusChangedSuccessfuly"
          class="flex flex-col items-center justify-center space-y-4 py-6"
        >
          <div class="rounded-full bg-green-100 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 text-center">
            Update Successful
          </h3>
          <p class="text-gray-500 text-center">
            The parcel status has been updated.
          </p>
          <ButtonWeb
            label="Close"
            color="green"
            class="mt-4 w-full sm:w-auto px-6 py-2.5 rounded-xl hover:bg-green-700 transition font-medium"
            @click="cancel"
          />
        </div>

        <div v-else>
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-2xl text-gray-800">Change Status</h3>
          </div>

          <div v-if="!isPickUp" class="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
             <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-blue-700">
                  Update order: <strong>Waiting for Staff</strong> →
                  <strong>Received</strong> → <strong>Picked Up</strong>
                </p>
              </div>
            </div>
          </div>

          <div v-if="isPickUp" class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-700">
                  This parcel has been <strong>PICKED_UP</strong>. Status changes are locked.
                </p>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">New Status</label>
            <div class="relative">
              <select
                v-model="newStatus"
                class="appearance-none block w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
                :disabled="isPickUp"
              >
                <option v-for="s in statusOptions" :key="s" :value="s">
                  {{ s.replace('_', ' ') }}
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <ButtonWeb
              label="Cancel"
              color="gray"
              class="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium transition"
              @click="cancel"
            />
             <ButtonWeb
              v-if="!isPickUp"
              label="Save Changes"
              color="blue"
              class="w-full sm:w-auto px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:bg-blue-600 font-medium transition"
              @click="saveStatusChange"
              :disabled="isSaveDisabled"
            />
          </div>
        </div>
      </div>
    </div>
  </Transition>
  <Teleport to="body">
    <ManageParcels />
  </Teleport>
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
  transition: transform 0.3s ease-out;
}

.modal-fade-enter-from .bg-white,
.modal-fade-leave-to .bg-white {
  transform: scale(0.95);
}
</style>
