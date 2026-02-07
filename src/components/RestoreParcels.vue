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
  <Transition name="modal-fade" appear>
    <div
      class="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
    >
      <div
        class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h1 class="text-xl font-bold text-gray-800">
            <template v-if="restoreType === 'parcel'">Restore Parcel</template>
            <template v-else-if="restoreType === 'resident'">Restore Resident</template>
            <template v-else-if="restoreType === 'staff'">Restore Staff</template>
          </h1>
        </div>

        <!-- Body -->
        <div class="px-6 py-8">
          <div class="flex flex-col items-center text-center">
            
            <div class="h-16 w-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>

            <p class="text-gray-600 text-lg mb-2">
              <template v-if="restoreType === 'resident'">
                Restore resident account <br>
                <span class="font-bold text-gray-900 block mt-1 text-xl">"{{ resident.firstName }} {{ resident.lastName }}"</span>
              </template>

              <template v-else-if="restoreType === 'staff'">
                Restore staff account <br>
                <span class="font-bold text-gray-900 block mt-1 text-xl">"{{ staff.fullName || 'Unknown' }}"</span>
              </template>

              <template v-else-if="restoreType === 'parcel'">
                Restore parcel tracking <br>
                <span class="font-bold text-gray-900 block mt-1 text-xl">"{{ parcel.parcelNumber || 'Unknown' }}"</span>
              </template>
            </p>

            <div class="mt-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              This item will be moved back to the active list.
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-6 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100">
          <ButtonWeb
            label="Cancel"
            color="gray"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition shadow-sm"
            @click="cancelAction"
          />
          <ButtonWeb
            label="Confirm Restore"
            color="green"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg font-medium transition flex items-center justify-center"
            @click="confirmRestore"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .bg-white,
.modal-fade-leave-active .bg-white {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from .bg-white,
.modal-fade-leave-to .bg-white {
  transform: scale(0.95);
}
</style>
