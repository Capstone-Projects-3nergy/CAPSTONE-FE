<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useParcelManager } from '@/stores/ParcelsManager.js'
import { updateParcelStatus } from '@/utils/fetchUtils'

const router = useRouter()
const route = useRoute()
const parcelManager = useParcelManager()

const tid = route.params.tid // id ของพัสดุที่ต้องการแก้ status
const currentStatus = ref('')
const newStatus = ref('')

onMounted(() => {
  const parcel = parcelManager
    .getParcels()
    .find((p) => p.parcelId === Number(tid))
  if (parcel) {
    currentStatus.value = parcel.status
    newStatus.value = parcel.status
  }
})

// เลือก status ตามลำดับ
const statusOptions = computed(() => {
  if (currentStatus.value === 'PENDING') return ['PENDING', 'RECEIVED']
  if (currentStatus.value === 'RECEIVED') return ['RECEIVED', 'PICKED_UP']
  if (currentStatus.value === 'PICKED_UP') return ['PICKED_UP']
  return ['PENDING', 'RECEIVED', 'PICKED_UP']
})

const saveStatusChange = async () => {
  try {
    const updatedStatus = await updateParcelStatus(
      `${import.meta.env.VITE_BASE_URL}/api/parcels/${tid}`,
      Number(tid),
      newStatus.value,
      router
    )

    if (updatedStatus) {
      parcelManager.updateParcelStatus(Number(tid), updatedStatus.status)
      console.log('✅ Status updated:', updatedStatus)
    }
    router.push({ name: 'staffparcels' }) // กลับหน้ารายการ
  } catch (err) {
    console.error('❌ Failed to update status:', err)
  }
}

const cancel = () => {
  router.push({ name: 'staffparcels' })
}
</script>
<template>
  <div class="p-6 max-w-md mx-auto">
    <h2 class="text-xl font-semibold mb-4">Change Parcel Status</h2>
    <p class="text-sm text-red-600 mb-2">
      * You can only update the status in order: PENDING → RECEIVED → PICKED_UP
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
</template>
