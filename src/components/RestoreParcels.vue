<script setup>
import { ref, computed } from 'vue'
import { useParcelManager } from '@/stores/ParcelsManager'
import { useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import { deleteItemById } from '@/utils/fetchUtils'

const emit = defineEmits(['confirmDetail', 'cancelDetail', 'redAlert'])

const props = defineProps({
  parcelData: Object,
  isPermanent: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const parcelManager = useParcelManager()

const deletedParcel = ref(null)

const parcel = computed(() => props.parcelData || {})

const removeParcelToTrashFn = async () => {
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

  parcelManager.moveToTrash(parcel.value.id)

  emit('confirmDetail', true)
}

const restoreParcelFn = async () => {
  if (!parcel.value.id) return

  deletedParcel.value = await deleteItemById(
    `${import.meta.env.VITE_BASE_URL}/api/parcels/permanent`,
    parcel.value.id
  )

  if (deletedParcel.value === '404') {
    emit('redAlert')
    emit('cancelDetail', true)
    return
  }

  parcelManager.deletePermanent(parcel.value.id)

  emit('confirmDetail', true)
}

const cancelAction = () => {
  emit('cancelDetail', true)
}
</script>

<template>
  <div
    class="message bg-gray-500/50 backdrop-blur-sm w-screen h-screen fixed top-0 left-0 flex items-center justify-center p-2"
  >
    <div
      class="bg-white w-full max-w-xs sm:max-w-md rounded-lg shadow-lg overflow-hidden h-auto max-h-96 sm:max-h-[32rem] flex flex-col sm:translate-x-0 sm:translate-y-0 sm:right-auto sm:top-auto right-8 top-16"
    >
      <div class="flex flex-col justify-between p-4 border-b">
        <h1 class="text-xl font-bold text-center sm:text-left">
          Restore Parcel
        </h1>
      </div>

      <div class="p-4 text-center sm:text-left">
        Do you want to restore the parcel with tracking number
        <b>"{{ parcel.parcelNumber || '' }}"</b>?
      </div>

      <div class="flex flex-col sm:flex-row justify-end gap-2 p-4 border-t">
        <ButtonWeb
          label="Confirm"
          color="green"
          class="w-full sm:w-auto"
          @click="restoreParcelFn"
        />

        <ButtonWeb
          label="Cancel"
          color="gray"
          class="w-full sm:w-auto"
          @click="cancelAction"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
