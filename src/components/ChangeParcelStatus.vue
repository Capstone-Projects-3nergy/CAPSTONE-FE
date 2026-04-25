<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useParcelManager } from '@/stores/ParcelsManager.js'
import ButtonWeb from './ButtonWeb.vue'
import { getItemById, editItem } from '@/utils/fetchUtils'
import ManageParcels from './ManageParcels.vue'
import SelectWeb from './SelectWeb.vue'

const route = useRoute()
const router = useRouter()
const parcelStore = useParcelManager()

import { useNotificationManager } from '@/stores/NotificationManager'
const notificationManager = useNotificationManager()

const emit = defineEmits([
  'cancelStatusDetail',
  'confirmStatusDetail',
  'redStatusAlert'
])

defineProps({
  parcelDataStatus: {
    type: Object,
    required: false
  }
})

const newStatus = ref('')
const currentStatus = ref('')
const statusChangedSuccessfuly = ref(false)
const isSaving = ref(false)

const form = ref({
  parcelId: '',
  trackingNumber: '',
  recipientName: '',
  senderName: '',
  parcelType: '',
  companyId: '',
  imageUrl: '',
  status: '',
  receivedAt: '',
  pickedUpAt: '',
  updatedAt: '',
  residentName: '',
  roomNumber: '',
  email: ''
})

const originalForm = ref({ ...form.value })

const statusOptions = computed(() => {
  const s = currentStatus.value?.toUpperCase() || ''
  
  if (s === 'WAITING_FOR_STAFF') {
    return [
      { value: 'WAITING_FOR_STAFF', label: 'Waiting for Staff' },
      { value: 'RECEIVED', label: 'Received' }
    ]
  }
  
  if (s === 'WAITING') {
    return [
      { value: 'WAITING', label: 'Waiting' },
      { value: 'PICKED_UP', label: 'Picked Up' }
    ]
  }

  if (s === 'RECEIVED') {
    return [
      { value: 'RECEIVED', label: 'Received' },
      { value: 'PICKED_UP', label: 'Picked Up' }
    ]
  }

  if (s === 'OVERDUE') {
    return [
      { value: 'OVERDUE', label: 'Overdue' },
      { value: 'PICKED_UP', label: 'Picked Up' }
    ]
  }

  return [
    { value: s, label: s.replace(/_/g, ' ') }
  ]
})

const isPickUp = computed(() => currentStatus.value === 'PICKED_UP')

const getParcelDetail = async (id) => {
  try {
    const data = await getItemById(
      `${import.meta.env.VITE_BASE_URL}/api/parcels`,
      Number(id),
      router
    )
    form.value = { ...data }
    parcelStore.addParcel(form.value)
    originalForm.value = { ...form.value }
  } catch (err) {}
}

watch(
  () => route.params.tid,
  async (tid) => {
    if (!tid) return
    await getParcelDetail(tid)

    const status = form.value.status?.toUpperCase().replace(' ', '_') || ''
    newStatus.value = status
    currentStatus.value = status
  },
  { immediate: true }
)

const saveStatusChange = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const body = {
      trackingNumber: form.value.trackingNumber,
      recipientName: form.value.recipientName,
      parcelType: form.value.parcelType,
      senderName: form.value.senderName,
      status: newStatus.value,
      companyId: form.value.companyId ? Number(form.value.companyId) : null,
      imageUrl: form.value.imageUrl
    }

    const updatedParcel = await editItem(
      `${import.meta.env.VITE_BASE_URL}/api/parcels`,
      form.value.parcelId,
      body,
      router
    )

    parcelStore.updateParcel(updatedParcel)
    notificationManager.notifyParcelUpdate(updatedParcel, router)
    
    form.value = { ...form.value, ...updatedParcel }
    currentStatus.value = newStatus.value
    statusChangedSuccessfuly.value = true
    emit('confirmStatusDetail')
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
  router.replace({ name: 'staffparcels' })
}

const steps = ['WAITING_FOR_STAFF', 'WAITING', 'OVERDUE', 'PICKED_UP']
const getStepLabel = (step) => {
  if (step === 'WAITING_FOR_STAFF') return 'WAITING FOR STAFF' 
  if (step === 'WAITING') {
    return currentStatus.value === 'RECEIVED' ? 'RECEIVED' : 'WAITING'
  }
  if (step === 'OVERDUE') return 'OVERDUE'
  if (step === 'PICKED_UP') return 'PICKED UP'
  return step.replace(/_/g, ' ')
}

const currentStepIndex = computed(() => {
  const s = currentStatus.value?.toUpperCase() || ''
  if (s === 'RECEIVED' || s === 'WAITING') return 1
  if (s === 'OVERDUE') return 2
  if (s === 'PICKED_UP') return 3
  return 0
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
    
        <div v-if="statusChangedSuccessfuly" class="p-8 sm:p-10 flex flex-col items-center text-center">
          <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce-short">
             <svg class="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-2xl font-black text-slate-900 mb-2">Success!</h3>
          <p class="text-slate-500 mb-8 leading-relaxed">
            The status for parcel <span class="font-bold text-slate-900">#{{ form.trackingNumber }}</span> has been updated to <span class="font-bold text-emerald-600">{{ newStatus.replace('_', ' ') }}</span>.
          </p>
          <ButtonWeb
            label="Dismiss"
            color="green"
            class="w-full py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            @click="cancel"
          />
        </div>

        <div v-else class="p-0">
     
          <div class="bg-slate-50 p-6 sm:p-8 border-b border-slate-100">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">Change Status</h3>
                <p class="text-xs font-bold text-blue-600 tracking-widest mt-1">Management Console</p>
              </div>
              <button @click="cancel" class="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div class="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black text-slate-400 tracking-wider">Tracking Number</p>
                <h4 class="text-sm font-bold text-slate-900 truncate">{{ form.trackingNumber }}</h4>
                <p class="text-xs text-slate-500 truncate mt-0.5">{{ form.recipientName }} • Room {{ form.roomNumber }}</p>
              </div>
            </div>
          </div>

          <div class="p-6 sm:p-8">
            <div v-if="!isPickUp" class="mb-8 px-2 relative">
              <div class="flex items-center justify-between relative">
                <div class="absolute top-[11px] left-0 w-full h-[3px] bg-slate-100 z-0"></div>
                <div 
                  class="absolute top-[11px] left-0 h-[3px] bg-blue-500 transition-all duration-700 z-0"
                  :style="{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }"
                ></div>
                
                <div v-for="(step, i) in steps" :key="step" class="relative z-10 flex flex-col items-center gap-2">
                  <div 
                    class="w-[25px] h-[25px] rounded-full border-[3px] flex items-center justify-center transition-all duration-500"
                    :class="[
                      (currentStepIndex === i) ? 'bg-white border-blue-500 scale-125' : 
                      (i < currentStepIndex ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200')
                    ]"
                  >
                    <svg v-if="i < currentStepIndex" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <div v-if="currentStepIndex === i" class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  </div>
                  <span class="text-[8px] font-extrabold tracking-tighter uppercase text-center leading-none" 
                        :class="currentStepIndex === i ? 'text-blue-600' : 'text-slate-400'">
                    {{ getStepLabel(step) }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="isPickUp" class="mb-8 p-4 bg-rose-50 rounded-2xl border border-rose-100 flex gap-3">
              <div class="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M12 15v2m0-8V7m0 11a1 1 0 100-2 1 1 0 000 2zm0-16a9 9 0 110 18 9 9 0 010-18z" /></svg>
              </div>
              <div>
                <h5 class="text-sm font-bold text-rose-900">Chain Locked</h5>
                <p class="text-xs text-rose-700 leading-relaxed mt-1">This parcel has been completed (Picked Up). Modifications are restricted for security.</p>
              </div>
            </div>

            <div class="mb-8">
              <label class="block text-xs font-black text-slate-500 tracking-widest mb-3 ml-1">New Assignment</label>
              <SelectWeb
                v-model="newStatus"
                :options="statusOptions"
                :disabled="isPickUp"
                placeholder="Choose Status..."
              />
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <ButtonWeb
                label="Cancel"
                color="gray"
                class="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold transition-all hover:bg-slate-50"
                @click="cancel"
              />
              <ButtonWeb
                v-if="!isPickUp"
                label="Confirm Change"
                color="blue"
                class="flex-[1.5] py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                @click="saveStatusChange"
                :disabled="isSaveDisabled"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <Teleport to="body">
    <ManageParcels />
  </Teleport>
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

