<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useParcelManager } from '@/stores/ParcelsManager.js'
import ButtonWeb from './ButtonWeb.vue'
import { getItemById, editItem } from '@/utils/fetchUtils'

// ใช้ route แทน props
const route = useRoute()
const router = useRouter()

const parcelStore = useParcelManager()

const parcelId = route.params.tid // parcelId
const residentId = route.params.id // residentId
const emit = defineEmits([
  'cancelStatusDetail',
  'confirmStatusDetail',
  'redStatusAlert'
])
const newStatus = ref('')
const currentStatus = ref('')

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
  if (currentStatus.value === 'PICKED_UP') return ['PICKED_UP']
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
  } catch (err) {
    console.error(err)
  }
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
    emit('confirmStatusDetail')
    router.replace({ name: 'staffparcels' })
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
  <div class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div class="bg-white p-6 rounded shadow-md w-80">
      <h3 class="font-semibold text-lg mb-4">Change Status</h3>

      <p v-if="!isPickUp" class="text-sm text-red-600 mb-2">
        * You can only update the status in order: PENDING → RECEIVED →
        PICKED_UP
      </p>

      <!-- ถ้าเป็น PICKED_UP บอกว่าเปลี่ยนไม่ได้ -->
      <p v-if="isPickUp" class="text-sm text-red-600 mb-4">
        This parcel has already been PICKED_UP. Status cannot be changed.
      </p>

      <select
        v-model="newStatus"
        class="border p-2 rounded w-full mb-4"
        :disabled="isPickUp"
      >
        <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
      </select>

      <div class="flex justify-end gap-2">
        <ButtonWeb
          label="Cancel"
          color="gray"
          class="w-full sm:w-auto"
          @click="cancel"
        />
        <!-- ซ่อนปุ่ม Save ถ้า PICKED_UP -->
        <ButtonWeb
          v-if="!isPickUp"
          label=" Save"
          color="blue"
          class="w-full sm:w-auto"
          @click="saveStatusChange"
          :disabled="isSaveDisabled"
        />
      </div>
    </div>
  </div>
</template>
