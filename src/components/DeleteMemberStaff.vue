<script setup>
import { ref, computed } from 'vue'
import { useProfileManager } from '@/stores/ProfileManager'
import { useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import { deleteItemById } from '@/utils/fetchUtils'
import { useUserManager } from '@/stores/MemberAndStaffManager'

const emit = defineEmits(['confirmDetail', 'cancelDetail', 'redAlert'])

const props = defineProps({
  residentData: Object,
  isPermanent: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const profileManager = useProfileManager()
const userManager = useUserManager()
const deletedProfile = ref(null)

const resident = computed(() => props.residentData || {})
const removedResidentToTrashFn = async () => {
  if (!resident.value.id) return

  deletedProfile.value = await deleteItemById(
    `${import.meta.env.VITE_BASE_URL}/api/members`,
    resident.value.id
  )

  if (deletedProfile.value === '404') {
    emit('redAlert')
    emit('cancelDetail', true)
    return
  }

  userManager.moveToTrash(resident.value.id)
  emit('confirmDetail', true)
}
const deleteResidentFn = async () => {
  if (!resident.value.id) return

  deletedProfile.value = await deleteItemById(
    `${import.meta.env.VITE_BASE_URL}/api/members/trash`,
    resident.value.id
  )

  if (deletedProfile.value === '404') {
    emit('redAlert')
    emit('cancelDetail', true)
    return
  }

  userManager.deletePermanent(resident.value.id)
  emit('confirmDetail', true)
}

const confirmAction = () => {
  props.isPermanent ? deleteResidentFn() : removedResidentToTrashFn()
}

const cancelAction = () => {
  emit('cancelDetail', true)
  router.replace({
    name: props.isPermanent ? 'trashparcels' : 'manageresident'
  })
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
          <template v-if="isPermanent"> Delete Resident </template>
          <template v-else> Move To Trash </template>
        </h1>
      </div>

      <div class="p-4 text-center sm:text-left">
        <template v-if="isPermanent">
          Do you want to permanently delete this Resident name
          <b>"{{ resident.firstName }} {{ resident.lastName }}"</b>
          ?
          <br />
          <span class="text-red-500 text-sm">
            **Once deleted, this Resident name cannot be recovered.**
          </span>
        </template>

        <template v-else>
          Do you want to move this Resident name
          <b>"{{ resident.firstName }} {{ resident.lastName }}"</b>

          to the trash?
          <br />
          <span class="text-gray-500 text-sm">
            **Items in the trash will be kept for 30 days before being
            permanently deleted.**
          </span>
        </template>
      </div>

      <div class="flex flex-col sm:flex-row justify-end gap-2 p-4 border-t">
        <ButtonWeb
          label="Confirm"
          color="green"
          class="w-full sm:w-auto"
          @click="confirmAction"
        />

        <ButtonWeb
          label="Cancel"
          color="gray"
          class="w-full sm:w-auto text-[#898989]"
          @click="cancelAction"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
