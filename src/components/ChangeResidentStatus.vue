<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserManager } from '@/stores/MemberAndStaffManager'
import ButtonWeb from './ButtonWeb.vue'
import { getItemById, editItem, resendVerification } from '@/utils/fetchUtils'
import SelectWeb from './SelectWeb.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserManager()

const emit = defineEmits([
  'cancelStatusDetail',
  'confirmStatusDetail',
  'redStatusAlert',
  'showAlert'
])

const props = defineProps({
  residentDataStatus: {
    type: Object,
    required: false
  }
})

const newStatus = ref('')
const currentStatus = ref('')
const statusChangedSuccessfuly = ref(false)
const isSaving = ref(false)
const loadingEmail = ref(false)



const handleSendEmailNotification = async () => {
  const userId = form.value.id
  if (!userId) {
    console.error('No resident ID available for sending email')
    return
  }

  // ✅ ตรวจสอบสถานะก่อนส่ง (ถ้าไม่ใช่ PENDING ห้ามส่ง)
  const currentStatusUpper = String(currentStatus.value || form.value.status || '').toUpperCase()
  if (currentStatusUpper !== 'PENDING') {
    emit('showAlert', {
      style: 'red',
      message: 'Error!!',
      title: 'Only users with PENDING status can receive verification emails.'
    })
    return
  }

  loadingEmail.value = true
  try {
    const success = await resendVerification(userId, router)
    
    if (success) {
      const now = Date.now()
      localStorage.setItem(`lastEmailSent_${currentUserId.value}`, now.toString())
      lastEmailSentTime.value = now

      emit('showAlert', {
        style: 'blue',
        message: 'Success!!',
        title: 'The verification email has been sent to the resident.'
      })
    } else {
      emit('showAlert', {
        style: 'red',
        message: 'Error!!',
        title: 'Unable to send verification email. Please try again.'
      })
    }
  } finally {
    loadingEmail.value = false
  }
}

const form = ref({
  id: '',
  fullName: '',
  email: '',
  dormName: '',
  roomNumber: '',
  status: '',
  photo: ''
})

const lastEmailSentTime = ref(null)

const currentUserId = computed(() => form.value.id)

const isEmailDisabled = computed(() => {
  if (!lastEmailSentTime.value) return false
  const oneDay = 24 * 60 * 60 * 1000
  return (Date.now() - lastEmailSentTime.value) < oneDay
})

const checkLastEmailSent = () => {
  if (currentUserId.value) {
    const stored = localStorage.getItem(`lastEmailSent_${currentUserId.value}`)
    if (stored) {
      lastEmailSentTime.value = parseInt(stored)
    } else {
      lastEmailSentTime.value = null
    }
  }
}

watch(currentUserId, () => {
  checkLastEmailSent()
}, { immediate: true })

const originalForm = ref({ ...form.value })

const statusOptions = computed(() => {
  const current = currentStatus.value ? String(currentStatus.value).trim().toUpperCase() : ''
  // If pending, allow changing to ACTIVE or keep PENDING
  if (current === 'PENDING') {
    return [
      { value: 'PENDING', label: 'Pending' },
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' }
    ]
  }
  // Otherwise, allow ACTIVE / INACTIVE
  return [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' }
  ]
})

const isLocked = computed(() => {
  const status = currentStatus.value ? String(currentStatus.value).trim().toUpperCase() : ''
  // Default to locked (true) if status is not yet loaded, to prevent UI flicker
  if (!status) return true 
  // Only PENDING is editable (isLocked = false), everything else is locked
  return status !== 'PENDING'
})

const getUserDetail = async (id) => {
  if (!id) return
  try {
    const data = await getItemById(
      `${import.meta.env.VITE_BASE_URL}/api/staff/users/status`,
      Number(id),
      router
    )
    
    // Smart merge: Only update if the API returns a value for that field
    // and provide fallbacks for common name field patterns
    const updatedForm = { ...form.value }
    
    if (data.userId) updatedForm.id = data.userId
    
    // Handle name mapping (fullName vs firstName/lastName)
    if (data.fullName) {
      updatedForm.fullName = data.fullName
    } else if (data.firstName || data.lastName) {
      updatedForm.fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim()
    }

    if (data.email) updatedForm.email = data.email
    if (data.dormName) updatedForm.dormName = data.dormName
    if (data.roomNumber) updatedForm.roomNumber = data.roomNumber
    if (data.status) updatedForm.status = data.status
    if (data.profileImageUrl) updatedForm.photo = data.profileImageUrl

    // Update form and reactive status values
    form.value = updatedForm
    
    if (updatedForm.status) {
      const caps = updatedForm.status.toUpperCase()
      newStatus.value = caps
      currentStatus.value = caps
      originalForm.value = { ...updatedForm }
    }
  } catch (err) {
    console.error('Error fetching user detail:', err)
  }
}

watch(
  () => props.residentDataStatus?.id,
  async (userId) => {
    if (!userId) return
    
    // Pre-populate from props so UI is ready immediately and isLocked is correct
    if (props.residentDataStatus) {
      const p = props.residentDataStatus
      if (p.status) {
        const caps = p.status.toUpperCase()
        currentStatus.value = caps
        // Default to ACTIVE if current is PENDING for faster approval
        newStatus.value = (caps === 'PENDING') ? 'ACTIVE' : caps
      }
      form.value = {
        ...form.value,
        id: p.id || '',
        fullName: p.fullName || '',
        roomNumber: p.roomNumber || '',
        dormName: p.dormName || '',
        photo: p.photo || '',
        status: p.status || ''
      }
    }

    await getUserDetail(userId)
  },
  { immediate: true }
)

const saveStatusChange = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const body = {
      ...form.value,
      status: newStatus.value,
    }
    // Remove unnecessary fields if API expects specific DTO
    delete body.photo
    delete body.id

    const updatedUser = await editItem(
      `${import.meta.env.VITE_BASE_URL}/api/staff/users/status`,
      form.value.id,
      body,
      router
    )

    if (updatedUser) {
        // Refresh local store
        userStore.updateMember({
            ...form.value,
            status: newStatus.value
        })
        
        currentStatus.value = newStatus.value
        statusChangedSuccessfuly.value = true
        emit('confirmStatusDetail')
    }
  } catch (err) {
    emit('redStatusAlert', err)
  } finally {
    isSaving.value = false
  }
}

const isSaveDisabled = computed(() => {
  return !newStatus.value || newStatus.value === currentStatus.value || isSaving.value
})

const cancel = () => {
  emit('cancelStatusDetail')
}

const formatStatusDisplay = (status) => {
  if (!status) return ''
  const s = String(status).toUpperCase()
  if (s === 'PENDING') return 'Pending'
  if (s === 'ACTIVE') return 'Active'
  if (s === 'INACTIVE') return 'Inactive'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

const steps = ['PENDING', 'ACTIVE', 'INACTIVE']
const currentStepIndex = computed(() => {
  const current = currentStatus.value ? String(currentStatus.value).toUpperCase() : ''
  const idx = steps.indexOf(current)
  return idx === -1 ? 0 : idx
})
</script>

<template>
  <Transition name="modal-fade" appear>
    <div
      class="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-md z-50 p-4"
      @click="cancel"
    >

      <div
        class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all"
        @click.stop
      >
        <!-- Modal Content -->
        <div v-if="statusChangedSuccessfuly" class="p-8 sm:p-10 flex flex-col items-center text-center">
          <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce-short">
             <svg class="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-2xl font-black text-slate-900 mb-2">Success!</h3>
          <p class="text-slate-500 mb-8 leading-relaxed">
            Resident <span class="font-bold text-slate-900">{{ form.fullName }}</span> status has been updated to <span class="font-bold text-emerald-600">{{ newStatus }}</span>.
          </p>
          <ButtonWeb
            label="Dismiss"
            color="green"
            class="w-full py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            @click="cancel"
          />
        </div>

        <div v-else class="p-0">
          <!-- Header Area -->
          <div class="bg-slate-50 p-6 sm:p-8 border-b border-slate-100">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">Resident Status</h3>
                <p class="text-xs font-bold text-blue-600 tracking-widest mt-1">Approval Console</p>
              </div>
              <button @click="cancel" class="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 cursor-pointer">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <!-- Profile Summary Card -->
            <div class="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0 overflow-hidden">
                <img v-if="form.photo" :src="form.photo" class="w-full h-full object-cover" />
                <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black text-slate-400 tracking-wider">Resident Name</p>
                <h4 class="text-sm font-bold text-slate-900 truncate">{{ form.fullName }}</h4>
                <p class="text-xs text-slate-500 truncate mt-0.5">Room {{ form.roomNumber }} • {{ form.dormName }}</p>
              </div>
            </div>
          </div>

          <div class="p-6 sm:p-8">

            <!-- Email Notification Reminder (For Pending) -->
            <div v-if="!isLocked" class="mb-8 bg-blue-50/50 rounded-3xl p-5 border border-blue-100 flex flex-col sm:flex-row items-center gap-5">
              <div class="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
              </div>
              <div class="flex-1 text-left min-w-0">
                 <h5 class="text-sm font-black text-gray-800 mb-0.5">Account Verification</h5>
                 <p class="text-[10px] text-gray-500 font-medium leading-relaxed">Resident hasn't verified account yet. Send verification email to complete setup.</p>
              </div>
              <div class="flex flex-col items-center gap-2">
                <ButtonWeb
                  label="Send Email"
                  :color="isEmailDisabled ? 'gray' : 'blue'"
                  :loading="loadingEmail"
                  :disabled="isEmailDisabled"
                  @click="!isEmailDisabled && handleSendEmailNotification()"
                  :class="[
                    'text-[11px] font-black rounded-xl shadow-lg transition-all active:scale-95 whitespace-nowrap px-4 py-2',
                    isEmailDisabled ? 'bg-gray-200 text-gray-600 cursor-not-allowed shadow-none' : 'shadow-blue-100 cursor-pointer'
                  ]"
                />
                <span v-if="isEmailDisabled" class="text-[10px] font-bold text-red-600 text-center leading-tight">
                  Email sent recently. <br> Resend tomorrow.
                </span>
              </div>
            </div>

            <!-- Locking Alert -->
            <div v-if="isLocked" class="mb-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
              <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h5 class="text-sm font-bold text-emerald-900">Already Approved</h5>
                <p class="text-xs text-emerald-700 leading-relaxed mt-1">This resident is already approved. Modifications are restricted to pending registrations for data integrity.</p>
              </div>
            </div>
<!-- 
            <div class="mb-8" v-if="!isLocked">
              <label class="block text-xs font-black text-slate-500 tracking-widest mb-3 ml-1">Update Status</label>
              <SelectWeb
                v-model="newStatus"
                :options="statusOptions"
                :disabled="isLocked"
                placeholder="Choose Status..."
              />
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <ButtonWeb
                :label="isLocked ? 'Close' : 'Cancel'"
                color="gray"
                class="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold transition-all hover:bg-slate-50 cursor-pointer"
                @click="cancel"
              />
              <ButtonWeb
                v-if="!isLocked"
                label="Update Status"
                color="blue"
                class="flex-[1.5] py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                @click="saveStatusChange"
                :disabled="isSaveDisabled"
              />
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-fade-enter-active {
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .bg-white {
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-fade-leave-active .bg-white {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from .bg-white {
  transform: scale(0.8) translateY(20px);
}
.modal-fade-leave-to .bg-white {
  transform: scale(0.95);
}

@keyframes bounce-short {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.animate-bounce-short {
  animation: bounce-short 2s ease-in-out infinite;
}
</style>
