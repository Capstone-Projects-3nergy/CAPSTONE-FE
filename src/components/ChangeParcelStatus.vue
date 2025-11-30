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
  <div
    class="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
  >
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 sm:p-8">
      <div
        v-if="statusChangedSuccessfuly"
        class="flex flex-col items-center justify-center space-y-4 py-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-14 w-14 text-green-500"
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
        <p class="text-green-700 font-semibold text-center text-lg sm:text-xl">
          Status updated Successfuly!
        </p>
        <ButtonWeb
          label="Close"
          color="green"
          class="mt-2 w-full sm:w-auto px-6 py-2 rounded-lg hover:bg-green-600 transition"
          @click="cancel"
        />
      </div>

      <div v-else>
        <h3 class="font-bold text-xl mb-4 text-gray-800">Change Status</h3>

        <p v-if="!isPickUp" class="text-sm text-red-600 mb-2">
          * You can only update the status in order: Waiting for Staff →
          Received → Picked Up
        </p>

        <p v-if="isPickUp" class="text-sm text-red-600 mb-4">
          This parcel has already been PICKED_UP. Status cannot be changed.
        </p>

        <select
          v-model="newStatus"
          class="border border-gray-300 rounded-lg p-3 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          :disabled="isPickUp"
        >
          <option v-for="s in statusOptions" :key="s" :value="s">
            {{ s }}
          </option>
        </select>

        <div class="px-6 py-4 flex flex-row sm:flex-row justify-end gap-3 pt-4">
          <ButtonWeb
            v-if="!isPickUp"
            label="Save"
            color="blue"
            class="w-full sm:w-auto px-3 sm:px-6 py-2 rounded-lg hover:bg-blue-600 transition text-sm sm:text-base"
            @click="saveStatusChange"
            :disabled="isSaveDisabled"
          />
          <ButtonWeb
            label="Cancel"
            color="gray"
            class="w-full sm:w-auto px-3 sm:px-6 py-2 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
            @click="cancel"
          />
        </div>
      </div>
    </div>
  </div>
  <Teleport to="body">
    <ManageParcels />
  </Teleport>
</template>
