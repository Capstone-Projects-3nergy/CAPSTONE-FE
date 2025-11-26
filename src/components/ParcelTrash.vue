<script setup>
import { ref, onMounted } from 'vue'
import { useParcelStore } from '@/stores/parcelStore'
import ButtonWeb from './ButtonWeb.vue'
import AlertPopUp from './AlertPopUp.vue'
const parcelStore = useParcelStore()
const trashList = ref([])
const deleteSuccess = ref(false)
const error = ref(false)
const fetchTrash = async () => {
  const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/parcels/trash`)
  trashList.value = await res.json()
}

// const restoreParcel = async (id) => {
//   const res = await fetch(
//     `${import.meta.env.VITE_BASE_URL}/api/parcels/${id}/restore`,
//     { method: 'PUT' }
//   )

//   if (res.ok) {
//     await fetchTrash()
//   }
// }

const deleteForever = async (id) => {
  if (!confirm('Delete permanently? This action cannot be undone.')) {
    error.value = true
    setTimeout(() => (error.value = false), 3000)
    return
  }
  const res = await fetch(
    `${import.meta.env.VITE_BASE_URL}/api/parcels/${id}/force`,
    { method: 'DELETE' }
  )

  if (res.ok) {
    await fetchTrash()
    setTimeout(() => (deleteSuccess.value = false), 3000)
    deleteSuccess.value = true
  }
}

onMounted(fetchTrash)
const cancelPage = () => {
  router.replace({ name: 'detailparcels' })
}
const closePopUp = (operate) => {
  if (operate === 'problem') error.value = false
  if (operate === 'errorSuccessMessage ') addSuccess.value = false
}
</script>

<template>
  <div class="p-5">
    <h1 class="text-2xl font-bold mb-4">🗑 Trash (Deleted Parcels)</h1>

    <!-- ไม่มีข้อมูล -->
    <div v-if="trashList.length === 0" class="text-gray-500 text-center py-10">
      No Parcels In Trash
      <div class="fixed top-5 left-5 z-50">
        <AlertPopUp
          v-if="deleteSuccess"
          :titles="'Add New Parcel is Successfull.'"
          message="Success!!"
          styleType="green"
          operate="errorSuccessMessage"
          @closePopUp="closePopUp"
        />
        <AlertPopUp
          v-if="error"
          :titles="'There is a problem. Please try again later.'"
          message="Error!!"
          styleType="red"
          operate="problem"
          @closePopUp="closePopUp"
        />
      </div>
    </div>

    <!-- ตาราง -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full bg-white shadow-md rounded-xl">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-2 text-left">Tracking Number</th>
            <th class="px-4 py-2 text-left">Recipient</th>
            <th class="px-4 py-2 text-left">Type</th>
            <th class="px-4 py-2 text-left">Deleted At</th>
            <th class="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in trashList"
            :key="p.id"
            class="border-t hover:bg-gray-50"
          >
            <td class="px-4 py-2">{{ p.trackingNumber }}</td>
            <td class="px-4 py-2">{{ p.recipientName }}</td>
            <td class="px-4 py-2">{{ p.parcelType }}</td>
            <td class="px-4 py-2">
              {{ new Date(p.deletedAt).toLocaleString() }}
            </td>

            <td class="px-4 py-2 flex gap-2">
              <!-- Restore -->
              <!-- <button
                @click="restoreParcel(p.id)"
                class="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Restore
              </button> -->
              <!-- <ButtonWeb
                label=" Restore"
                color="green"
                @click="restoreParcel(p.id)"
                class="w-full md:w-auto"
              /> -->

              <!-- Delete forever -->
              <!-- <button
                @click="deleteForever(p.id)"
                class="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete Permanently
              </button> -->
              <ButtonWeb
                label="Delete Permanently"
                color="red"
                @click="deleteForever(p.id)"
                class="w-full md:w-auto"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <ButtonWeb
      label="Cancel"
      color="gray"
      @click="cancelPage"
      class="w-full md:w-auto"
    />
  </div>
</template>
