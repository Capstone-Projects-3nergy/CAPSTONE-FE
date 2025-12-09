<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'

const props = defineProps({
  title: { type: String, default: 'Personal Information' },
  showEdit: { type: Boolean, default: true },

  avatar: { type: String, default: '' },
  fullName: { type: String, required: true },
  firstName: { type: String, default: '-' },
  lastName: { type: String, default: '-' },
  email: { type: String, default: '-' },
  roomNumber: { type: String, default: null },
  lineId: { type: String, default: null },
  contact: { type: String, default: null }
})

const emit = defineEmits(['edit', 'save', 'cancel'])

const isEdit = ref(false)

// form data
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  roomNumber: '',
  lineId: '',
  contact: ''
})

// load props → form
watch(
  () => props,
  () => {
    form.value.firstName = props.firstName
    form.value.lastName = props.lastName
    form.value.email = props.email
    form.value.roomNumber = props.roomNumber
    form.value.lineId = props.lineId
    form.value.contact = props.contact
  },
  { immediate: true, deep: true }
)

function startEdit() {
  isEdit.value = true
  emit('edit')
}

function save() {
  emit('save', { ...form.value })
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

function display(value) {
  if (!value || value.trim() === '') return '-'
  return value
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow p-6 md:p-8 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl max-sm:text-xl font-bold text-[#185dc0]">
        {{ title }}
      </h2>

      <button
        v-if="showEdit && !isEdit"
        @click="startEdit"
        class="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl shadow transition max-sm:px-3 max-sm:py-1.5 max-sm:text-sm"
      >
        Edit Profile
      </button>
    </div>

    <div
      class="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-50"
    >
      <div class="flex flex-col items-center w-full md:w-1/3">
        <div
          class="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-blue-600 shadow"
        >
          <img
            v-if="hasAvatar"
            :src="avatar"
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

        <p class="mt-3 text-gray-700 font-medium text-center md:text-left">
          {{ props.fullName }}
        </p>
      </div>

      <!-- VIEW MODE -->
      <div
        v-if="!isEdit"
        class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 w-full md:w-2/3 text-gray-700"
      >
        <div>
          <label class="block font-semibold text-[#185dc0] mb-1"
            >Firstname</label
          >
          <p>{{ firstName }}</p>
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1"
            >Lastname</label
          >
          <p>{{ lastName }}</p>
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1">Email</label>
          <p>{{ email }}</p>
        </div>

        <div v-if="roomNumber !== null">
          <label class="block font-semibold text-[#185dc0] mb-1"
            >Room Number</label
          >
          <p>{{ roomNumber }}</p>
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1">Line ID</label>
          <p>{{ display(lineId) }}</p>
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1">Contact</label>
          <p>{{ display(contact) }}</p>
        </div>
      </div>

      <!-- EDIT MODE -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 w-full md:w-2/3 text-gray-700"
      >
        <div>
          <label class="block font-semibold text-[#185dc0] mb-1"
            >Firstname</label
          >
          <input v-model="form.firstName" class="input" />
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1"
            >Lastname</label
          >
          <input v-model="form.lastName" class="input" />
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1">Email</label>
          <input v-model="form.email" class="input" />
        </div>

        <div v-if="roomNumber !== null">
          <label class="block font-semibold text-[#185dc0] mb-1"
            >Room Number</label
          >
          <input v-model="form.roomNumber" class="input" />
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1">Line ID</label>
          <input v-model="form.lineId" class="input" />
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1">Contact</label>
          <input v-model="form.contact" class="input" />
        </div>

        <div class="col-span-2 flex gap-4 mt-4">
          <button
            @click="save"
            class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl shadow"
          >
            Save
          </button>
          <button
            @click="cancel"
            class="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-xl shadow"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input {
  @apply w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500;
}
</style>
