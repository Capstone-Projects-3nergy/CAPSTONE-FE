<script setup>
import { ref, computed } from 'vue'
import { useParcelManager } from '@/stores/ParcelsManager'
import { useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import { deleteItemById } from '@/utils/fetchUtils'

const emit = defineEmits(['confirmDetail', 'cancelDetail', 'redAlert'])
const props = defineProps(['parcelData']) // ไม่ใช่ ref

const router = useRouter()
const parcelManager = useParcelManager()

const deletedParcel = ref(null)

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
    class="message bg-grey-500 backdrop-blur-sm w-screen h-screen fixed top-0 left-0 pt-[10px]"
  >
    <div class="w-[59%] m-[auto] border border-green-700 mt-[20%]">
      <div class="flex flex-col justify-between bg-white p-4 h-[10%]">
        <div class="itbkk-title w-full h-[40px] mt-1 border-b">
          <h1 class="text-xl font-bold text-justify">Delete Parcel</h1>
        </div>

        <div class="w-[70%] h-[100%]">
          <div class="flex pl-4 mt-5">
            Do you want to delete this tracking number
            <b>{{ parcel.parcelNumber || '' }}</b
            >?
          </div>
        </div>
      </div>

      <div class="flex flex-row w-full justify-end border-t h-[60%]">
        <ButtonWeb
          label="Confirm"
          color="green"
          class="mr-3 mt-4 mb-2"
          @click="deleteParcelFn"
        />

        <ButtonWeb
          label="Cancel"
          color="red"
          class="mr-3 mt-4 mb-2"
          @click="cancelFn"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
