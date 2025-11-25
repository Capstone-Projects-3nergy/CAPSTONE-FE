<script setup>
import { ref, computed, watch } from 'vue'
import { useParcelManager } from '@/stores/ParcelsManager.js'
import { updateParcelStatus } from '@/utils/fetchUtils'

const props = defineProps({
  parcelDataStatus: { type: Object, required: true }
})

const emit = defineEmits([
  'cancelStatusDetail',
  'confirmStatusDetail',
  'redStatusAlert'
])
const parcelManager = useParcelManager()

const newStatus = ref('')
const currentStatus = ref('')

// watch prop อัปเดตค่า select
watch(
  () => props.parcelDataStatus,
  (val) => {
    const status = val.parcelStatus.toUpperCase().replace(' ', '_')
    newStatus.value = status
    currentStatus.value = status
  },
  { immediate: true }
)

// เลือก status ตามลำดับ
const statusOptions = computed(() => {
  if (currentStatus.value === 'PENDING') return ['PENDING', 'RECEIVED']
  if (currentStatus.value === 'RECEIVED') return ['RECEIVED', 'PICKED_UP']
  if (currentStatus.value === 'PICKED_UP') return ['PICKED_UP']
  return ['PENDING', 'RECEIVED', 'PICKED_UP']
})

const saveStatusChange = async () => {
  try {
    const tid = props.parcelDataStatus.id
    const updatedStatus = await updateParcelStatus(
      `${import.meta.env.VITE_BASE_URL}/api/parcels/${tid}`,
      tid,
      newStatus.value
    )

    if (updatedStatus) {
      parcelManager.updateParcelStatus(tid, updatedStatus.status)
      emit('confirmStatusDetail', updatedStatus)
    }
  } catch (err) {
    console.error(err)
    emit('redStatusAlert', err)
  }
}

const cancel = () => {
  emit('cancelStatusDetail')
}
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div class="bg-white p-6 rounded shadow-md w-80">
      <h3 class="font-semibold text-lg mb-4">Change Status</h3>
      <p class="text-sm text-red-600 mb-2">
        * You can only update the status in order: PENDING → RECEIVED →
        PICKED_UP
      </p>

      <select v-model="newStatus" class="border p-2 rounded w-full mb-4">
        <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
      </select>

      <div class="flex justify-end gap-2">
        <button @click="cancel" class="px-4 py-2 border rounded">Cancel</button>
        <button
          @click="saveStatusChange"
          class="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>
