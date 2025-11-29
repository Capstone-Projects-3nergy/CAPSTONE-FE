<script setup>
import { ref, computed, onMounted } from 'vue'
import { useParcelManager } from '@/stores/ParcelsManager'
import { useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import { confirmParcelReceived } from '@/utils/fetchUtils'

const emit = defineEmits([
  'confirmDetail',
  'cancelDetail',
  'redAlert',
  'confirmParcel'
])
const props = defineProps(['parcelConfirmData'])
const router = useRouter()
const parcelManager = useParcelManager()
const parcelEditDetail = ref(null)
const parcelIdDetail = ref(null)
const deletedParcel = ref(null)
onMounted(() => {})

const parcel = computed(() => props.parcelConfirmData || {})
const confirmParcelFn = async () => {
  if (!parcel.value.id) return

  const res = await confirmParcelReceived(
    `${import.meta.env.VITE_BASE_URL}/api/OwnerParcels`,
    parcel.value.id,
    router
  )

  if (!res || res?.status === 404 || res?.error) {
    emit('redAlert')
    emit('cancelParcel', true)
    return
  }

  if (res?.status === 401) {
    emit('redAlert')
    emit('cancelParcel', true)
    return
  }

  if (res?.parcelId || res?.status === 'RECEIVED') {
    parcelManager.updateParcelStatus(parcel.value.id, 'PICKED_UP')
    emit('confirmParcel', true)
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
    <div
      class="bg-white w-full max-w-xs sm:max-w-md rounded-lg shadow-lg overflow-hidden h-auto max-h-96 sm:max-h-[32rem] flex flex-col sm:translate-x-0 sm:translate-y-0 sm:right-auto sm:top-auto right-8 top-16"
    >
      <div class="px-6 py-4 border-b">
        <h1 class="text-lg font-bold text-gray-900 text-center">
          Confirm Parcel Pickup
        </h1>
      </div>

      <div class="px-6 py-4 text-center text-gray-600">
        <p>
          Are you sure you want to confirm that you have received this parcel?
          This action cannot be undone.
        </p>
      </div>

      <div class="px-6 py-4 flex flex-row sm:flex-row justify-end gap-3 pt-4">
        <ButtonWeb
          label="Confirm"
          color="blue"
          class="w-full sm:w-auto"
          @click="confirmParcelFn"
        />
        <ButtonWeb
          label="Cancel"
          color="gray"
          class="w-full sm:w-auto"
          @click="cancelFn"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
