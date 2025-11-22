<script setup>
import { ref, computed, onMounted } from 'vue'
import { useParcelManager } from '@/stores/ParcelsManager'
import { useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import { deleteItemById } from '@/utils/fetchUtils'

const emit = defineEmits(['confirmDetail', 'cancelDetail', 'redAlert'])
const props = defineProps(['parcelConfirmData']) // ไม่ใช่ ref

const router = useRouter()
const parcelManager = useParcelManager()
const parcelEditDetail = ref(null)
const parcelIdDetail = ref(null)
const deletedParcel = ref(null)
// onMounted(async () => {
//   isCollapsed.value = true
// })
// ใช้ computed เผื่อ props เป็น undefined
const parcel = computed(() => props.parcelConfirmData || {})

const confirmParcelFn = async () => {
  if (!parcel.value.id) return

  const res = await updateParcelStatus(
    `${import.meta.env.VITE_BASE_URL}/api/parcels`,
    parcel.value.id,
    'Received',
    router
  )

  // ❌ ไม่พบพัสดุ
  if (res?.status === 404 || res?.error) {
    emit('redAlert') // popup error
    emit('cancelParcel', true)
    return
  }

  // ❌ ไม่มีสิทธิ์
  if (res?.status === 401) {
    emit('redAlert')
    emit('cancelParcel', true)
    return
  }

  // ✅ สำเร็จ  (Server ส่ง status = "Received" หรือ message)
  if (res?.status === 'Received' || res?.message === 'Parcel confirmed') {
    parcelManager.updateParcelStatus(parcel.value.id, 'Received')
    emit('confirmParcel', true) // popup success
    return
  }
}

const cancelFn = () => {
  emit('cancelParcel', true)
  router.replace({ name: 'residentparcelsDetail' })
}
</script>

<template>
  <div
    class="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
  >
    <div class="bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b">
        <h1 class="text-lg font-bold text-gray-900 text-center">
          Confirm Parcel Pickup
        </h1>
      </div>

      <!-- Body -->
      <div class="px-6 py-4 text-center text-gray-600">
        <p>
          Are you sure you want to confirm that you have received this parcel?
          This action cannot be undone.
        </p>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
        <ButtonWeb
          label="Cancel"
          color="gray"
          class="w-full sm:w-auto"
          @click="cancelFn"
        />
        <ButtonWeb
          label="Save"
          color="blue"
          class="w-full sm:w-auto"
          @click="confirmParcelFn"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
