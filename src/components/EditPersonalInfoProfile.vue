<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'
import ButtonWeb from './ButtonWeb.vue'
import { useProfileManager } from '@/stores/ProfileManager'

const profileManager = useProfileManager()
const loginManager = useAuthManager()
const props = defineProps({
  mode: {
    type: String,
    default: 'edit' // 'edit' | 'add'
  },
  title: { type: String, default: 'Personal Information' },
  showEdit: { type: Boolean, default: true },

  avatar: { type: String, default: '' },
  fullName: { type: String, required: true },
  firstName: { type: String, default: '-' },
  lastName: { type: String, default: '-' },
  email: { type: String, default: '-' },
  position: { type: String, default: '-' },
  roomNumber: { type: String, default: null },
  lineId: { type: String, default: null },
  phoneNumber: { type: String, default: null }
})

const emit = defineEmits([
  'edit',
  'save',
  'cancel',
  'error',
  'success',
  'first-name-error',
  'last-name-error',
  'phone-error'
])

const isEdit = ref(false)

// form data
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  roomNumber: '',
  lineId: '',
  position: '',
  phoneNumber: ''
})

// load props → form
watch(
  () => props.mode,
  (mode) => {
    if (mode === 'add') {
      form.value = {
        firstName: '',
        lastName: '',
        email: '',
        roomNumber: '',
        lineId: '',
        position: '',
        phoneNumber: ''
      }
      // newAvatar.value = null
    }
  },
  { immediate: true }
)

watch(
  () => props.mode,
  (mode) => {
    if (mode === 'edit') {
      form.value.firstName = props.firstName
      form.value.lastName = props.lastName
      form.value.fullName = props.fullName
      form.value.email = props.email
      form.value.position = props.position
      form.value.roomNumber = props.roomNumber
      form.value.lineId = props.lineId
      form.value.phoneNumber = props.phoneNumber
    }
  },
  { immediate: true, deep: true }
)

function startEdit() {
  isEdit.value = true
  emit('edit')
}
const newAvatar = ref(null)
const avatarPreview = computed(() => {
  if (newAvatar.value) return URL.createObjectURL(newAvatar.value)
  return props.avatar
})

function onImageChange(e) {
  const file = e.target.files[0]
  if (file) newAvatar.value = file
}

function save() {
  const payload = {
    firstName: form.value.firstName,
    lastName: form.value.lastName,
    email: form.value.email,
    position: form.value.position,
    roomNumber: form.value.roomNumber,
    lineId: form.value.lineId,
    phoneNumber: form.value.phoneNumber,
    avatar: newAvatar.value || null
  }

  emit('save', payload)
  isEdit.value = false
}

function cancel() {
  isEdit.value = false
  emit('cancel')
}

const authStore = useAuthManager()
const userName = computed(() => authStore.user?.fullName || 'Courier')
const userInitial = computed(() =>
  userName.value ? userName.value[0].toUpperCase() : 'C'
)
const hasAvatar = computed(() => props.avatar && props.avatar.trim() !== '')

function updateUser(data) {
  console.log('ข้อมูลใหม่:', data)
  // API update...
}
const submit = () => {
  if (props.mode === 'add') {
    emit('save', {
      ...form.value,
      avatar: newAvatar.value || null
    })
  } else {
    saveEditProfile()
  }
}

const saveEditProfile = async () => {
  const isStaff = loginManager.user?.role === 'STAFF'
  // -----------------------
  // validate name (ไทย + อังกฤษ)
  // -----------------------
  const nameRegex = /^[A-Za-zก-๙\s]+$/

  if (!nameRegex.test(form.value.firstName)) {
    emit('first-name-error', true)
    return
  }

  if (!nameRegex.test(form.value.lastName)) {
    emit('last-name-error', true)
    return
  }

  // -----------------------
  // validate phone (optional)
  // -----------------------
  if (form.value.phoneNumber && !/^[0-9]{9,10}$/.test(form.value.phoneNumber)) {
    emit('phone-error', true)
    return
  }
  try {
    // -----------------------
    // payload
    // -----------------------
    const body = {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      email: form.value.email,
      roomNumber: form.value.roomNumber || null,
      lineId: form.value.lineId || null,
      phoneNumber: form.value.phoneNumber || null
    }

    if (isStaff) {
      body.position = form.value.position || null
    }

    if (newAvatar.value) {
      body.avatar = newAvatar.value
    }

    // -----------------------
    // API call
    // -----------------------
    const updatedProfile = await profileManager.updateProfile(
      `${import.meta.env.VITE_BASE_URL}/api/profile`,
      body,
      router
    )

    if (!updatedProfile) {
      emit('error', true)
      return
    }

    // -----------------------
    // update store
    // -----------------------
    profileManager.setProfile(updatedProfile)
    loginManager.updateUser(updatedProfile)

    // -----------------------
    // sync form
    // -----------------------
    form.value = {
      ...form.value,
      ...updatedProfile
    }

    emit('success', true)
    isEdit.value = false
  } catch (err) {
    console.error(err)
    emit('error', true)
  }
}
const displayFullName = computed(() => {
  if ((props.mode = 'edit')) {
    const first = form.value.firstName?.trim()
    const last = form.value.lastName?.trim()

    if (!first && !last) return '-'
    return `${first || ''} ${last || ''}`.trim()
  }
})
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-col md:flex-row gap-10">
      <!-- LEFT : Profile Image Card -->
      <div
        class="w-full md:w-1/3 bg-white rounded-[5px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center text-center"
      >
        <div class="relative inline-block">
          <!-- Avatar -->
          <div class="w-32 h-32 rounded-full overflow-hidden border shadow-sm">
            <img
              v-if="avatarPreview"
              :src="avatarPreview"
              alt="Profile"
              class="w-full h-full object-cover"
            />

            <div
              v-else
              class="w-full h-full bg-[#185DC0] flex items-center justify-center text-white font-semibold text-4xl"
            >
              {{ userInitial }}
            </div>
          </div>

          <!-- ✏️ Edit icon (อยู่นอกวง แต่ทับขอบ) -->
          <div
            class="absolute -bottom-2 -right-2 p-1.5 cursor-pointer group"
            @click="$refs.imageInput.click()"
          >
            <svg
              class="transition hover:text-[#8C8F91]"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.71 7.04055C21.1 6.65055 21.1 6.00055 20.71 5.63055L18.37 3.29055C18 2.90055 17.35 2.90055 16.96 3.29055L15.12 5.12055L18.87 8.87055M3 17.2505V21.0005H6.75L17.81 9.93055L14.06 6.18055L3 17.2505Z"
                fill="#8C8F91"
              />
            </svg>

            <!-- Tooltip -->
            <div
              class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0"
            >
              <div
                class="rounded-lg bg-gray-400 px-3 py-1.5 text-xs text-white shadow"
              >
                Change Image
              </div>
            </div>
          </div>
        </div>

        <!-- hidden input -->
        <input
          type="file"
          accept="image/*"
          class="hidden"
          ref="imageInput"
          @change="onImageChange"
        />

        <p class="mt-4 text-gray-800 font-semibold text-lg">
          {{ displayFullName }}
        </p>
      </div>

      <!-- RIGHT : Edit Information Card -->
      <div
        class="w-full md:w-2/3 bg-white rounded-[5px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8"
      >
        <!-- Header -->
        <div class="mb-8">
          <h2 class="text-xl sm:text-2xl font-semibold text-gray-800">
            {{ title }}
          </h2>
        </div>

        <!-- Form Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7">
          <div>
            <label class="block text-sm text-black font-semibold mb-1">
              Firstname
            </label>
            <input
              v-model="form.firstName"
              class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            />
          </div>

          <div>
            <label class="block text-sm text-black font-semibold mb-1">
              Lastname
            </label>
            <input
              v-model="form.lastName"
              class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            />
          </div>

          <div>
            <label class="block text-sm text-black font-semibold mb-1">
              Email
            </label>
            <input
              :disabled="mode === 'edit'"
              v-model="form.email"
              class="w-full bg-gray-100 border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            />
          </div>

          <div v-if="roomNumber !== null">
            <label class="block text-sm text-black font-semibold mb-1">
              Room Number
            </label>
            <input
              v-model="form.roomNumber"
              class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            />
          </div>
          <div v-if="loginManager.user.role === 'STAFF' && mode !== 'add'">
            <label class="block text-sm text-black font-semibold mb-1">
              position
            </label>
            <input
              v-model="form.position"
              class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            />
          </div>

          <div>
            <label class="block text-sm text-black font-semibold mb-1">
              Line ID
            </label>
            <input
              v-model="form.lineId"
              class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            />
          </div>

          <div>
            <label class="block text-sm text-black font-semibold mb-1">
              Phone Number
            </label>
            <input
              v-model="form.phoneNumber"
              class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            />
          </div>

          <!-- Actions -->
          <div class="col-span-2 flex justify-end gap-4 mt-6">
            <ButtonWeb
              :label="mode === 'add' ? 'Add Member' : 'Save Changes'"
              color="blue"
              @click="submit"
            />
            <ButtonWeb
              label="Cancel Changes"
              color="gray"
              @click="cancel"
              class="text-[#898989]"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- <div class="bg-white rounded-2xl shadow p-6 md:p-8 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl max-sm:text-xl font-bold text-[#185dc0]">
        {{ title }}
      </h2>
    </div>

    <div
      class="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-50"
    >
      <div class="flex flex-col items-center w-full md:w-1/3">
        <div
          class="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-blue-600 shadow"
        >
          <img
            v-if="avatarPreview"
            :src="avatarPreview"
            alt="Profile"
            class="w-full h-full object-cover"
          />

          <div
            v-else
            class="w-full h-full bg-[#185DC0] flex items-center justify-center text-white font-semibold text-4xl"
          >
            {{ userInitial }}
          </div>
        </div>
        <ButtonWeb
          label=" Change Image"
          color="blue"
          class="mt-3 bg-[#185DC0] hover:bg-[#144a99] text-white text-xs px-3 py-1.5 rounded cursor-pointer"
          @click="$refs.imageInput.click()"
        />
       
        <input
          type="file"
          accept="image/*"
          class="hidden"
          ref="imageInput"
          @change="onImageChange"
        />

        <p class="mt-3 text-gray-700 font-medium text-center md:text-left">
          {{ props.fullName }}
        </p>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 w-full md:w-2/3 text-gray-700"
      >
        <div>
          <label class="block font-semibold text-[#185dc0] mb-1"
            >Firstname</label
          >
          <input
            v-model="form.firstName"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1"
            >Lastname</label
          >
          <input
            v-model="form.lastName"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1">Email</label>
          <input
            v-model="form.email"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div v-if="roomNumber !== null">
          <label class="block font-semibold text-[#185dc0] mb-1"
            >Room Number</label
          >
          <input
            v-model="form.roomNumber"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1">Line ID</label>
          <input
            v-model="form.lineId"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1">phoneNumber</label>
          <input
            v-model="form.phoneNumber"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="col-span-2 flex gap-4 mt-4 justify-end">
          <ButtonWeb
            label="Save"
            color="green"
            class="w-full sm:w-auto px-5 py-2 rounded-xl shadow"
            @click="save"
          />
          <ButtonWeb
            label=" Cancel"
            color="gray"
            class="w-full sm:w-auto px-5 py-2 rounded-xl shadow"
            @click="cancel"
          />
        
        </div>
      </div>
    </div>
  </div> -->
</template>

<style scoped></style>
