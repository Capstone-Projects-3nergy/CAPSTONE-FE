<script setup>
import { ref, computed, onMounted } from 'vue'
import { useParcelManager } from '@/stores/ParcelsManager'
import { useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import { deleteItemById } from '@/utils/fetchUtils'

const emit = defineEmits(['confirmDetail', 'cancelDetail', 'redAlert'])
const props = defineProps(['parcelData']) // ไม่ใช่ ref

const router = useRouter()
const parcelManager = useParcelManager()
const parcelEditDetail = ref(null)
const parcelIdDetail = ref(null)
const deletedParcel = ref(null)
onMounted(async () => {
  console.log(parcel.value.id)
})
// ใช้ computed เผื่อ props เป็น undefined
const parcel = computed(() => props.parcelData || {})

const deleteParcelFn = async () => {
  if (!parcel.value.id) return

  deletedParcel.value = await deleteItemById(
    `${import.meta.env.VITE_BASE_URL}/api/parcels`,
    parcel.value.id
  )

  if (deletedParcel.value === '404') {
    emit('redAlert')
    emit('cancelDetail', true)
    return
  }

  // ลบใน Pinia
  parcelManager.deleteParcels(parcel.value.id)

  emit('confirmDetail', true)
}

const cancelFn = () => {
  emit('cancelDetail', true)
  router.replace({ name: 'staffparcels' })
}
</script>

<template>
  <div
    class="message bg-gray-500/50 backdrop-blur-sm w-screen h-screen fixed top-0 left-0 flex items-center justify-center p-2"
  >
    <div
      class="bg-white w-full max-w-xs sm:max-w-md rounded-lg shadow-lg overflow-hidden h-auto max-h-96 sm:max-h-[32rem] flex flex-col sm:translate-x-0 sm:translate-y-0 sm:right-auto sm:top-auto right-8 top-16"
    >
      <!-- Header -->
      <div class="flex flex-col justify-between p-4 border-b">
        <h1 class="text-xl font-bold text-center sm:text-left">
          Delete Parcel
        </h1>
      </div>

      <!-- Body -->
      <div class="p-4 text-center sm:text-left">
        <p class="mb-4">
          Do you want to delete this tracking number
          <b>{{ parcel.parcelNumber || '' }}</b
          >?
        </p>
      </div>

      <!-- Footer -->
      <div class="flex flex-col sm:flex-row justify-end gap-2 p-4 border-t">
        <ButtonWeb
          label="Confirm"
          color="green"
          class="w-full sm:w-auto"
          @click="deleteParcelFn"
        />
        <ButtonWeb
          label="Cancel"
          color="red"
          class="w-full sm:w-auto"
          @click="cancelFn"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
