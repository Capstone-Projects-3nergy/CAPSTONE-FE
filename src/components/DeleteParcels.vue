<script setup>
import { ref, reactive } from 'vue'
import { deleteItemById } from '@/utils/fetchUtils'
import { useParcelManager } from '@/stores/ParcelManager'
import { useRoute, useRouter } from 'vue-router'

const emit = defineEmits(['confirmDetail', 'cancelDetail', 'redAlert'])
const props = defineProps(['parcel']) // 👉 ของเดิม taskId

const router = useRouter()
const route = useRoute()
const parcelManager = useParcelManager()

const deletedParcel = ref(null)

const deleteParcel = async (parcelId) => {
  deletedParcel.value = await deleteItemById(
    `${import.meta.env.VITE_BASE_URL}/v3/parcels`, // แก้ URL ให้ตรง backend
    parcelId
  )

  if (deletedParcel.value == '404') {
    emit('redAlert')
    emit('cancelDetail', true)
    return
  }

  // ลบใน Pinia
  parcelManager.deleteParcel(parcelId)

  emit('confirmDetail', true)
}
</script>

<template>
  <div
    class="itbkk-message bg-grey-500 backdrop-blur-sm w-screen h-screen fixed top-0 left-0 pt-[10px]"
  >
    <div class="w-[59%] m-[auto] border border-green-700 mt-[20%]">
      <div class="flex flex-col justify-between bg-white p-4 h-[10%]">
        <div class="itbkk-title w-full h-[40px] mt-1 border-b">
          <h1 class="text-xl font-bold text-justify">Delete Parcel</h1>
        </div>

        <div class="w-[70%] h-[100%]">
          <div class="flex pl-4 mt-5">
            Do you want to delete the parcel
            <b>{{ props.parcel.trackingNumber }}</b
            >?
          </div>
        </div>
      </div>

      <div class="flex flex-row w-full justify-end border-t h-[60%]">
        <button
          class="itbkk-button-confirm bg-green-400 rounded-[2px] w-[60px] h-[25px] mr-3 mt-4 mb-2"
          @click="deleteParcelFn(props.parcel.parcelId)"
        >
          Confirm
        </button>

        <button
          class="itbkk-button-cancel bg-red-400 rounded-[2px] w-[50px] h-[25px] mr-3 mt-4 mb-2"
          @click="
            ;[emit('cancelDetail', true), router.replace({ name: 'Parcel' })]
          "
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
