<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useParcelManager } from '@/stores/ParcelsManager.js'
import ButtonWeb from './ButtonWeb.vue'
import { useAuthManager } from '@/stores/AuthManager.js'
import { useRouter, useRoute } from 'vue-router'
import {
  getItemById,
  deleteItemById,
  addItem,
  editItem,
  deleteAndTransferItem,
  toggleVisibility,
  editReadWrite,
  acceptInvite,
  cancelInvite,
  editInviteReadWrite,
  declineInvite,
  editItemWithFile,
  deleteFile,
  updateParcelStatus
} from '@/utils/fetchUtils'
const props = defineProps({
  parcelDataStatus: { type: Object, required: true }
})
const router = useRouter()
const emit = defineEmits([
  'cancelStatusDetail',
  'confirmStatusDetail',
  'redStatusAlert'
])
// const parcelManager = useParcelManager()
const parcelStore = useParcelManager()
const newStatus = ref('')
const currentStatus = ref('')

// watch prop อัปเดตค่า select
// watch prop parcelDataStatus เพื่อโหลดข้อมูลจาก backend

// เลือก status ตามลำดับ
const statusOptions = computed(() => {
  if (currentStatus.value === 'RECEIVED') return ['RECEIVED', 'PICKED_UP']
  if (currentStatus.value === 'PICKED_UP') return ['PICKED_UP']
  return ['RECEIVED', 'PICKED_UP']
})

const isPickUp = computed(() => currentStatus.value === 'PICKED_UP')

// ⚡️ Form ข้อมูลพัสดุ (ให้ตรง ParcelDetailDto)
const form = ref({
  parcelId: '', // read-only
  trackingNumber: '', // editable
  recipientName: '', // editable
  senderName: '', // editable
  parcelType: '', // editable
  companyId: '', // editable (id ขนส่ง)
  imageUrl: '', // editable / upload
  status: '', // editable via dropdown (enum จาก backend)

  receivedAt: '', // read-only
  pickedUpAt: '', // read-only
  updatedAt: '', // read-only

  residentName: '', // read-only
  roomNumber: '', // read-only
  email: '' // read-only
})
const originalForm = ref({ ...form.value })

// const saveStatusChange = async () => {
//   try {
//     const tid = props.parcelDataStatus.parcelId

//     const updatedStatus = await updateParcelStatus(
//       `${import.meta.env.VITE_BASE_URL}/api/parcels`,
//       tid,
//       newStatus.value,
//       useAuthManager().user.accessToken
//     )

//     if (updatedStatus) {
//       parcelManager.updateParcelStatus(tid, updatedStatus.status)
//       emit('confirmStatusDetail', updatedStatus)
//     }
//   } catch (err) {
//     console.error(err)
//     emit('redStatusAlert', err)
//   }
// }
// ⚡ ฟังก์ชันโหลด parcel detail
// ⚡ ฟังก์ชันโหลด parcel detail จาก backend เสมอ
const getParcelDetail = async (id) => {
  if (!id) return
  const parcelIdNum = Number(id)

  try {
    const data = await getItemById(
      `${import.meta.env.VITE_BASE_URL}/api/parcels`,
      parcelIdNum,
      router
    )

    if (!data) return

    form.value = {
      parcelId: data.parcelId,
      trackingNumber: data.trackingNumber,
      recipientName: data.recipientName,
      senderName: data.senderName || '',
      parcelType: data.parcelType || '',
      companyId: Number(data.companyId) ?? '',
      imageUrl: data.imageUrl ?? '',
      status: data.status,
      receivedAt: data.receivedAt,
      pickedUpAt: data.pickedUpAt,
      updatedAt: data.updatedAt,
      residentName: data.residentName,
      roomNumber: data.roomNumber,
      email: data.email
    }

    parcelStore.addParcel(form.value)
    originalForm.value = { ...form.value }
  } catch (err) {
    console.error('Failed to load parcel detail', err)
  }
}
// onMounted(() => {
//   const parcelIdNum = Number(id)
//   getParcelDetail(parcelIdNum) // 🔥 เรียกครั้งเดียวพอ
// })
watch(
  () => props.parcelDataStatus,
  async (val) => {
    if (!val || !val.id) return

    // ดึงข้อมูลจาก backend ตาม id
    await getParcelDetail(val.id)

    // ตั้งค่า currentStatus / newStatus จาก form.value.status
    const status = form.value.status.toUpperCase().replace(' ', '_')
    newStatus.value = status
    currentStatus.value = status
  },
  { immediate: true }
)
const saveStatusChange = async () => {
  try {
    // สร้าง body สำหรับอัปเดตข้อมูลพัสดุ
    const body = {
      trackingNumber: form.value.trackingNumber,
      recipientName: form.value.recipientName,
      parcelType: form.value.parcelType,
      senderName: form.value.senderName,
      status: newStatus.value, // ใช้ status ใหม่จาก dropdown
      companyId: form.value.companyId ? Number(form.value.companyId) : null,
      imageUrl: form.value.imageUrl
    }

    const updatedParcel = await editItem(
      `${import.meta.env.VITE_BASE_URL}/api/parcels`,
      form.value.parcelId, // ใช้ parcelId ของ form เป็น id
      body,
      router
    )

    if (!updatedParcel) {
      error.value = true
      setTimeout(() => (error.value = false), 3000)
      return
    }

    // อัปเดตข้อมูลใน store
    parcelStore.updateParcelStatus(form.value.parcelId, updatedParcel.status)

    // ซิงค์ข้อมูล form กับข้อมูลที่ backend ส่งกลับ
    form.value = { ...form.value, ...updatedParcel }
    originalForm.value = { ...form.value }

    console.log('✅ Updated parcel:', updatedParcel)

    emit('confirmStatusDetail', updatedParcel)
  } catch (err) {
    console.error('❌ Failed to save parcel status:', err)
    emit('redStatusAlert', err)
  }
}
const isSaveDisabled = computed(() => {
  return !newStatus.value || newStatus.value === currentStatus.value
})

const cancel = () => {
  router.replace({ name: 'staffparcels' })
  emit('cancelStatusDetail')
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
