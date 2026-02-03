<script setup>
import { ref, computed } from 'vue'
import { useParcelManager } from '@/stores/ParcelsManager'
import { useRouter } from 'vue-router'
import ButtonWeb from './ButtonWeb.vue'
import { restoreParcel } from '@/utils/fetchUtils'
import { useProfileManager } from '@/stores/ProfileManager'
import { useUserManager } from '@/stores/MemberAndStaffManager'
const emit = defineEmits([
  'confirmDetail',
  'cancelDetail',
  'redAlert',
  'confirmMemberDetail',
  'confirmStaffDetail'
])

const props = defineProps({
  restoreType: {
    type: String,
    required: true // 'parcel' | 'resident' | 'staff'
  },
  parcelData: Object,
  isPermanent: {
    type: Boolean,
    default: false
  },
  residentData: Object,
  staffData: Object,
  // showMember: { type: Boolean, default: false },
  // showStaff: { type: Boolean, default: false },
  // showParcel: { type: Boolean, default: true }
})

const router = useRouter()
const parcelManager = useParcelManager()

const parcel = computed(() => props.parcelData || {})
const profileManager = useProfileManager()
const userManager = useUserManager()
const resident = computed(() => props.residentData || {})
const staff = computed(() => props.staffData || {})
// const restoreParcelFn = async () => {
//   if (!parcel.value?.id) return

//   restoreParcels.value = await restoreParcel(
//     `${import.meta.env.VITE_BASE_URL}/api/trash`,
//     parcel.value.id
//   )
//   if (restoreParcels.value === '404') {
//     emit('redAlert')
//     emit('cancelDetail', true)
//     return
//   }

//   parcelManager.restoreFromTrash(parcel.value.id)
//   emit('confirmDetail', true)
// }
const restoreResult = ref(null) // null | true | false

// const restoreParcelFn = async () => {
//   if (!parcel.value?.id) return

//   restoreResult.value = null

//   restoreResult.value = await restoreParcel(
//     `${import.meta.env.VITE_BASE_URL}/api/trash`,
//     parcel.value.id,
//     router
//   )

//   if (restoreResult.value !== true) {
//     emit('redAlert')
//     emit('cancelDetail', true)
//     return
//   }

//   parcelManager.restoreFromTrash(parcel.value.id)
//   emit('confirmDetail', true)
// }

const restoreParcelFn = async () => {
  if (!parcel.value?.id) return

  const res = await restoreParcel(
    `${import.meta.env.VITE_BASE_URL}/api/trash`,
    parcel.value.id,
    router
  )

  // ❌ backend ไม่ success (status ไม่ใช่ 2xx)
  if (!res || !res.ok) {
    emit('redAlert')
    emit('cancelDetail', true)
    return
  }

  // ✅ backend restore สำเร็จจริง
  parcelManager.restoreFromTrash(parcel.value.id)
  emit('confirmDetail', true)
}
const restoreMemberFn = async () => {
  if (!resident.value?.id) return

  const res = await restoreParcel(
    `${import.meta.env.VITE_BASE_URL}/api/trash/residents`,
    resident.value.id,
    router
  )

  // ❌ backend ไม่ success (status ไม่ใช่ 2xx)
  if (!res || !res.ok) {
    emit('redAlert')
    emit('cancelDetail', true)
    return
  }

  userManager.restoreFromTrash(resident.value.id)
  emit('confirmMemberDetail', true)
}

// ==============================
// restore staff
// ==============================
const restoreStaffFn = async () => {
  if (!resident.value?.id) return

  const res = await restoreParcel(
    `${import.meta.env.VITE_BASE_URL}/api/trash/staffs`,
    staff.value.id,
    router
  )

  // ❌ backend ไม่ success (status ไม่ใช่ 2xx)
  if (!res || !res.ok) {
    emit('redAlert')
    emit('cancelDetail', true)
    return
  }

  userManager.restoreFromTrash(staff.value.id)
  emit('confirmStaffDetail', true)
}

const cancelAction = () => {
  emit('cancelDetail', true)
}
const restoreActionMap = {
  parcel: async () => {
    const res = await restoreParcel(
      `${import.meta.env.VITE_BASE_URL}/api/trash`,
      parcel.value.id,
      router
    )
    if (!res?.ok) throw new Error()
    parcelManager.restoreFromTrash(parcel.value.id)
    emit('confirmDetail', true)
  },

  resident: async () => {
    const res = await restoreParcel(
      `${import.meta.env.VITE_BASE_URL}/api/trash/residents`,
      resident.value.id,
      router
    )
    if (!res?.ok) throw new Error()
    userManager.restoreFromTrash(resident.value.id)
    emit('confirmMemberDetail', true)
  },

  staff: async () => {
    const res = await restoreParcel(
      `${import.meta.env.VITE_BASE_URL}/api/trash/staffs`,
      staff.value.id,
      router
    )
    if (!res?.ok) throw new Error()
    userManager.restoreFromTrash(staff.value.id)
    emit('confirmStaffDetail', true)
  }
}
const confirmRestore = async () => {
  try {
    await restoreActionMap[props.restoreType]()
  } catch (err) {
    emit('redAlert')
    emit('cancelDetail', true)
  }
}

// const confirmRestore = async () => {
//   try {
//     if (props.showMember) {
//       await restoreMemberFn()
//     } else if (props.showStaff) {
//       await restoreStaffFn()
//     } else {
//       await restoreParcelFn()
//     }

//     emit('confirmDetail', true)
//   } catch (err) {
//     emit('redAlert')
//     emit('cancelDetail', true)
//   }
// }
</script>

<template>
  <div
    class="message bg-gray-500/50 backdrop-blur-sm w-screen h-screen fixed top-0 left-0 flex items-center justify-center p-2"
  >
    <div
      class="bg-white w-full max-w-xs sm:max-w-md rounded-lg shadow-lg overflow-hidden h-auto max-h-96 sm:max-h-[32rem] flex flex-col sm:translate-x-0 sm:translate-y-0 sm:right-auto sm:top-auto right-8 top-16"
    >
      <div v-if="restoreType === 'parcel'" class="flex flex-col justify-between p-4 border-b">
        <h1 class="text-xl font-bold text-center sm:text-left">
          Restore Parcel
        </h1>
      </div>
      <div v-if="restoreType === 'resident'" class="flex flex-col justify-between p-4 border-b">
        <h1 class="text-xl font-bold text-center sm:text-left">
          Restore Resident Member
        </h1>
      </div>
      <div v-if="restoreType === 'staff'" class="flex flex-col justify-between p-4 border-b">
        <h1 class="text-xl font-bold text-center sm:text-left">
          Restore Staff Member
        </h1>
      </div>
      <div class="p-4 text-center sm:text-left">
        <template v-if="restoreType === 'resident'">
          Do you want to restore this Resident name
          <b>"{{ resident.firstName }} {{ resident.lastName }}"</b>
        </template>

        <template v-if="restoreType === 'staff'">
          Do you want to restore this Staff name
          <b>"{{ staff.fullName || '' }}"</b>
        </template>

        <template v-if="restoreType === 'parcel'">
          Do you want to restore this Parcel
          <b>"{{ parcel.parcelNumber || '' }}"</b>?
        </template>
      </div>

      <!-- <div class="p-4 text-center sm:text-left">
        Do you want to restore the parcel with tracking number
        <b>"{{ parcel.parcelNumber || '' }}"</b>?
      </div> -->

      <div class="flex flex-col sm:flex-row justify-end gap-2 p-4 border-t">
        <ButtonWeb
          label="Confirm"
          color="green"
          class="w-full sm:w-auto"
          @click="confirmRestore"
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
