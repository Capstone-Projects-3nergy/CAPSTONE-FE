<script setup>
import { ref, reactive } from 'vue'
// import { deleteItemById } from '@/utils/fetchUtils'
import { useParcelManager } from '@/stores/ParcelsManager'
import { useRoute, useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import {
  getItems,
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
  deleteFile
} from '@/utils/fetchUtils'

const emit = defineEmits(['confirmDetail', 'cancelDetail', 'redAlert'])
const props = defineProps(['parcelData'])
import { useParcelManager } from '@/stores/ParcelsManager'
const router = useRouter()
const route = useRoute()
const parcelManager = useParcelManager()

const deletedParcel = ref(null)

const deleteParcel = async (parcelId) => {
  deletedParcel.value = await deleteItemById(
    `${import.meta.env.VITE_BASE_URL}/api/parcels`, // แก้ URL ให้ตรง backend
    parcelId
  )

  if (deletedParcel.value == '404') {
    emit('redAlert')
    emit('cancelDetail', true)
    return
  }

  // ลบใน Pinia
  parcelManager.deleteParcels(parcelId)

  emit('confirmDetail', true)
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
            <b>{{ props.parcelData }}</b>
          </div>
        </div>
      </div>

      <div class="flex flex-row w-full justify-end border-t h-[60%]">
        <ButtonWeb
          label="Confirm"
          color="green"
          class="mr-3 mt-4 mb-2"
          @click="deleteParcel(props.parcelData.id)"
        />

        <!-- <button
          class="itbkk-button-confirm bg-green-400 rounded-[2px] w-[60px] h-[25px] mr-3 mt-4 mb-2 cursor-pointer"
          @click="deleteParcelFn(props.parcel.parcelId)"
        >
          Confirm
        </button> -->
        <ButtonWeb
          label="Cancel "
          color="red"
          class="mr-3 mt-4 mb-2"
          @click="
            ;[
              emit('cancelDetail', true),
              router.replace({ name: 'staffparcels' })
            ]
          "
        />
        <!-- <button
          class="itbkk-button-cancel bg-red-400 rounded-[2px] w-[50px] h-[25px] mr-3 mt-4 mb-2 cursor-pointer"
          @click="
            ;[
              emit('cancelDetail', true),
              router.replace({ name: 'staffparcels' })
            ]
          "
        >
          Cancel
        </button> -->
      </div>
    </div>
  </div>
</template>

<style scoped></style>
