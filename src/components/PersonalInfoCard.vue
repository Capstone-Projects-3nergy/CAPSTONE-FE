<script setup>
import { computed, ref } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'
import ButtonWeb from './ButtonWeb.vue'
import { useChangeEmailManager } from '@/stores/ChangeEmailManager'
import { useRouter, useRoute } from 'vue-router'
const changeEmailStore = useChangeEmailManager()
const emit = defineEmits([
  'confirmAccount',
  'redAlertError',
  'incorrectemailform',
  'edit',
  'emailRequire'
])
const router = useRouter()
const loginManager = useAuthManager()
const activeTab = ref('profile')
const newEmail = ref('')
const trimmedEmail = newEmail.value?.trim()
const props = defineProps({
  title: { type: String, default: 'Personal Information' },
  showEdit: { type: Boolean, default: true },

  avatar: { type: String, default: '' },
  fullName: { type: String, required: true },
  firstName: { type: String, default: '-' },
  lastName: { type: String, default: '-' },
  position: { type: String, default: '-' },
  email: { type: String, default: '-' },
  roomNumber: { type: String, default: null },
  lineId: { type: String, default: null },
  phoneNumber: { type: String, default: null }
})
const resetForm = () => {
  newEmail.value = ''
}

function display(value) {
  if (!value || value.trim() === '') return '-'
  return value
}
const authStore = useAuthManager()

const userName = computed(() => authStore.user?.fullName || 'Courier')

const userInitial = computed(() =>
  userName.value ? userName.value[0].toUpperCase() : 'C'
)
const hasAvatar = computed(() => props.avatar && props.avatar.trim() !== '')
const menuClass = (tab) => {
  return [
    'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition',
    activeTab.value === tab
      ? 'bg-[#D9D9D9] text-[#60a5fa]'
      : 'text-gray-500 hover:bg-gray-100'
  ]
}
const sendUpdateEmail = async () => {
  const trimmedEmail = newEmail.value?.trim()

  // 1️⃣ required
  if (!trimmedEmail) {
    emit('emailRequire', true)
    return
  }

  // 2️⃣ format
  if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
    emit('incorrectemailform', true)
    return
  }

  try {
    await changeEmailStore.sendChangeEmailVerification(trimmedEmail)
    newEmail.value = ''
    emit('confirmAccount', true)
  } catch (e) {
    emit('redAlertError', true)
  }
}

// แสดงค่า (default = ACTIVE)
const displayStatus = (value) => {
  if (!value || value.trim() === '') return 'ACTIVE'
  return value.toUpperCase()
}

// กำหนดสีตามสถานะ
const statusClass = (value) => {
  const status = displayStatus(value)

  return {
    'bg-green-500': status === 'ACTIVE',
    'bg-red-500': status === 'INACTIVE'
  }
}
</script>
<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-col md:flex-row gap-2">
      <!-- LEFT : Profile Card -->
      <div
        class="w-full md:w-1/3 bg-white rounded-[5px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8"
      >
        <!-- Avatar -->
        <div class="flex flex-col items-center text-center">
          <div
            class="w-28 h-28 rounded-full overflow-hidden border border-gray-200 shadow-sm relative"
          >
            <img
              v-if="hasAvatar"
              :src="avatar"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full bg-[#185DC0] flex items-center justify-center text-white text-4xl font-semibold"
            >
              {{ userInitial }}
            </div>
          </div>

          <p class="mt-4 text-black font-semibold text-lg">
            {{ fullName }}
          </p>
        </div>

        <!-- Menu -->
        <div class="mt-8 space-y-2">
          <button
            @click="activeTab = 'profile'"
            :class="menuClass('profile')"
            class="relative flex items-center gap-3 w-full cursor-pointer"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_995_32)">
                <path
                  d="M4 22C4 20.9391 4.42143 19.9217 5.17157 19.1716C5.92172 18.4214 6.93913 18 8 18H16C17.0609 18 18.0783 18.4214 18.8284 19.1716C19.5786 19.9217 20 20.9391 20 22C20 22.5304 19.7893 23.0391 19.4142 23.4142C19.0391 23.7893 18.5304 24 18 24H6C5.46957 24 4.96086 23.7893 4.58579 23.4142C4.21071 23.0391 4 22.5304 4 22Z"
                  stroke-width="2.5"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8C10.3431 8 9 9.34315 9 11C9 12.6569 10.3431 14 12 14Z"
                  stroke-width="2.5"
                />
              </g>
              <defs>
                <clipPath id="clip0_995_32">
                  <rect width="24" height="24" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span>Personal Information</span>
          </button>

          <button
            @click="activeTab = 'account'"
            :class="menuClass('account')"
            class="relative flex items-center gap-3 w-full cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 12c-3.87 0-7 3.13-7 7c0 .34.03.67.08 1H3v-1l2-2v-6c0-3.1 2.03-5.83 5-6.71V4c0-1.1.9-2 2-2s2 .9 2 2v.29c2.97.88 5 3.61 5 6.71zm-9 9a2 2 0 0 0 2 2c.39 0 .75-.12 1.06-.31c-.32-.52-.56-1.09-.76-1.69zm13.77-.68c.1.07.12.21.06.32l-1 1.73c-.06.13-.19.13-.3.13l-1.25-.53c-.28.2-.53.37-.84.5l-.19 1.32c-.02.12-.12.21-.25.21h-2c-.12 0-.23-.09-.25-.21l-.18-1.32c-.32-.13-.57-.3-.85-.5l-1.22.53c-.13 0-.27 0-.33-.13l-1-1.73a.26.26 0 0 1 .06-.32l1.06-.82c-.02-.17-.04-.33-.04-.5s.02-.33.04-.5l-1.06-.82c-.09-.07-.12-.18-.06-.32l1-1.72c.06-.11.2-.14.33-.11l1.22.47c.28-.17.53-.34.85-.46l.18-1.33c.02-.12.13-.21.25-.21h2c.13 0 .23.09.25.21l.19 1.33c.31.12.56.29.84.46l1.25-.47c.11-.03.24 0 .3.11l1 1.72c.06.14.04.25-.06.32l-1.05.82a4.3 4.3 0 0 1 0 1zM20.75 19c0-.97-.78-1.75-1.75-1.75s-1.75.78-1.75 1.75s.79 1.75 1.75 1.75s1.75-.78 1.75-1.75"
              />
            </svg>
            <!-- <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M14.208 4.83q.68.21 1.3.54l1.833-1.1a1 1 0 0 1 1.221.15l1.018 1.018a1 1 0 0 1 .15 1.221l-1.1 1.833q.33.62.54 1.3l2.073.519a1 1 0 0 1 .757.97v1.438a1 1 0 0 1-.757.97l-2.073.519q-.21.68-.54 1.3l1.1 1.833a1 1 0 0 1-.15 1.221l-1.018 1.018a1 1 0 0 1-1.221.15l-1.833-1.1q-.62.33-1.3.54l-.519 2.073a1 1 0 0 1-.97.757h-1.438a1 1 0 0 1-.97-.757l-.519-2.073a7.5 7.5 0 0 1-1.3-.54l-1.833 1.1a1 1 0 0 1-1.221-.15L4.42 18.562a1 1 0 0 1-.15-1.221l1.1-1.833a7.5 7.5 0 0 1-.54-1.3l-2.073-.519A1 1 0 0 1 2 12.72v-1.438a1 1 0 0 1 .757-.97l2.073-.519q.21-.68.54-1.3L4.27 6.66a1 1 0 0 1 .15-1.221L5.438 4.42a1 1 0 0 1 1.221-.15l1.833 1.1q.62-.33 1.3-.54l.519-2.073A1 1 0 0 1 11.28 2h1.438a1 1 0 0 1 .97.757zM12 16a4 4 0 1 0 0-8a4 4 0 0 0 0 8"
              />
            </svg> -->
            <!-- <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
            >
              <path
                d="M12 2C9.243 2 7 4.243 7 7V10H6C5.46957 10 4.96086 10.2107 4.58579 10.5858C4.21071 10.9609 4 11.4696 4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12C20 11.4696 19.7893 10.9609 19.4142 10.5858C19.0391 10.2107 18.5304 10 18 10H17V7C17 4.243 14.757 2 12 2ZM9 7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V10H9V7ZM13 17.723V20H11V17.723C10.6504 17.5228 10.3697 17.2213 10.1948 16.8584C10.02 16.4954 9.95928 16.0879 10.0207 15.6898C10.0821 15.2916 10.2627 14.9214 10.5388 14.6279C10.8148 14.3345 11.1733 14.1316 11.567 14.046C11.8594 13.9811 12.1627 13.9828 12.4544 14.0509C12.7461 14.1189 13.0188 14.2516 13.2524 14.4392C13.4859 14.6268 13.6743 14.8644 13.8037 15.1345C13.9331 15.4047 14.0002 15.7005 14 16C13.9994 16.3497 13.9067 16.6932 13.7311 16.9956C13.5556 17.2981 13.3034 17.549 13 17.723Z"
                fill="currentColor"
              />
            </svg> -->
            <span>Notifications</span>
          </button>
        </div>
      </div>

      <!-- <div
        class="w-full md:w-1/3 bg-white rounded-[5px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center text-center"
      >
        <div
          class="w-28 h-28 rounded-full overflow-hidden border border-gray-200 shadow-sm"
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

        <p class="mt-4 text-black font-semibold text-lg">
          {{ fullName }}
        </p>
      </div> -->
      <!-- RIGHT : Information Card -->
      <div
        v-if="activeTab === 'profile'"
        class="w-full md:w-2/3 bg-white rounded-[5px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8"
      >
        <!-- Header -->
        <div class="flex items-center gap-3 mb-8">
          <h2 class="text-xl sm:text-2xl font-semibold text-gray-800">
            {{ title }}
          </h2>
          <div class="relative group">
            <svg
              class="cursor-pointer font-semibold hover:text-[#8C8F91] transition"
              @click="$emit('edit')"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentcolor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.71 7.04055C21.1 6.65055 21.1 6.00055 20.71 5.63055L18.37 3.29055C18 2.90055 17.35 2.90055 16.96 3.29055L15.12 5.12055L18.87 8.87055M3 17.2505V21.0005H6.75L17.81 9.93055L14.06 6.18055L3 17.2505Z"
                fill="#8C8F91"
              />
            </svg>
            <!-- 
            <svg
              class="cursor-pointer text-black font-semibold hover:text-[#8C8F91] transition"
              @click="$emit('edit')"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="m18.988 2.012l3 3L19.701 7.3l-3-3zM8 16h3l7.287-7.287l-3-3L8 13z"
              />
              <path
                fill="currentColor"
                d="M19 19H8.158c-.026 0-.053.01-.079.01c-.033 0-.066-.009-.1-.01H5V5h6.847l2-2H5c-1.103 0-2 .896-2 2v14c0 1.104.897 2 2 2h14a2 2 0 0 0 2-2v-8.668l-2 2z"
              />
            </svg> -->
            <div
              class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
            >
              <div
                class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
              >
                Edit Profile

                <div class="absolute left-1/2 top-full -translate-x-1/2">
                  <div
                    class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7 truncate">
          <div>
            <label class="block text-sm text-black font-semibold mb-1">
              Firstname
            </label>
            <p class="text-[#8C8F91] font-medium">
              {{ firstName }}
            </p>
          </div>

          <div>
            <label class="block text-sm text-black font-semibold mb-1">
              Lastname
            </label>
            <p class="text-[#8C8F91] font-medium">
              {{ lastName }}
            </p>
          </div>

          <div>
            <label class="block text-sm text-black font-semibold mb-1">
              Email
            </label>

            <div class="flex items-center gap-2">
              <p class="font-medium break-all text-[#8C8F91]">
                {{ email }}
              </p>

              <div class="flex items-center gap-1 text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  class="shrink-0"
                >
                  <g fill="none" stroke="currentColor" stroke-width="1.5">
                    <path
                      d="M14.049 5.54a1 1 0 0 1 1.071.443l.994 1.587a1 1 0 0 0 .316.316l1.587.994a1 1 0 0 1 .444 1.072l-.42 1.824a1 1 0 0 0 0 .448l.42 1.825a1 1 0 0 1-.444 1.07l-1.587.995a1 1 0 0 0-.316.316l-.994 1.587a1 1 0 0 1-1.071.444l-1.825-.42a1 1 0 0 0-.447 0l-1.825.42a1 1 0 0 1-1.071-.444l-.994-1.587a1 1 0 0 0-.317-.316l-1.586-.994a1 1 0 0 1-.444-1.071l.419-1.825a1 1 0 0 0 0-.448l-.42-1.824a1 1 0 0 1 .445-1.072l1.586-.994a1 1 0 0 0 .317-.316l.994-1.587a1 1 0 0 1 1.07-.443l1.826.419a1 1 0 0 0 .447 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m9.515 12.536l2.035 1.949l2.935-4.97"
                    />
                  </g>
                </svg>

                <span class="text-sm font-medium leading-none"> verified </span>
              </div>
            </div>
          </div>

          <div v-if="loginManager.user.role === 'STAFF'">
            <label class="block text-sm text-black font-semibold mb-1">
              Position
            </label>
            <p class="text-[#8C8F91] font-medium break-all">
              {{ position }}
            </p>
          </div>
          <div v-if="roomNumber !== null">
            <label class="block text-sm text-black font-semibold mb-1">
              Room Number
            </label>
            <p class="text-[#8C8F91] font-medium">
              {{ roomNumber }}
            </p>
          </div>

          <div>
            <label class="block text-sm text-black font-semibold mb-1">
              Line ID
            </label>
            <p class="text-[#8C8F91] font-medium">
              {{ display(lineId) }}
            </p>
          </div>

          <div>
            <label class="block text-sm text-black font-semibold mb-1">
              Phone Number
            </label>
            <p class="text-[#8C8F91] font-medium">
              {{ display(phoneNumber) }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm text-black font-semibold"> Status: </label>

            <span
              class="px-3 py-1 rounded-full text-xs font-semibold text-white inline-block"
              :class="statusClass(status)"
            >
              {{ displayStatus(status) }}
            </span>
          </div>
        </div>
      </div>
      <div
        v-if="activeTab === 'account'"
        class="w-full md:w-2/3 bg-white rounded-[5px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8"
      >
        <h2 class="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
          Account Settings
        </h2>
        <p class="text-sm text-gray-500 mb-6">
          Update your account information and manage how we contact you.
        </p>

        <div class="space-y-6 max-w-md">
          <!-- Account Email -->
          <div>
            <label class="block text-sm font-semibold mb-1">
              Account Email
            </label>
            <div class="relative">
              <input
                type="email"
                disabled
                class="w-full px-4 py-2 pr-28 bg-gray-100 text-gray-600 rounded-md outline-none"
                :value="email"
              />

              <!-- Verified badge -->
              <div
                class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 pointer-events-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  class="shrink-0"
                >
                  <g fill="none" stroke="currentColor" stroke-width="1.5">
                    <path
                      d="M14.049 5.54a1 1 0 0 1 1.071.443l.994 1.587a1 1 0 0 0 .316.316l1.587.994a1 1 0 0 1 .444 1.072l-.42 1.824a1 1 0 0 0 0 .448l.42 1.825a1 1 0 0 1-.444 1.07l-1.587.995a1 1 0 0 0-.316.316l-.994 1.587a1 1 0 0 1-1.071.444l-1.825-.42a1 1 0 0 0-.447 0l-1.825.42a1 1 0 0 1-1.071-.444l-.994-1.587a1 1 0 0 0-.317-.316l-1.586-.994a1 1 0 0 1-.444-1.071l.419-1.825a1 1 0 0 0 0-.448l-.42-1.824a1 1 0 0 1 .445-1.072l1.586-.994a1 1 0 0 0 .317-.316l.994-1.587a1 1 0 0 1 1.07-.443l1.826.419a1 1 0 0 0 .447 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m9.515 12.536l2.035 1.949l2.935-4.97"
                    />
                  </g>
                </svg>

                <span class="text-xs font-medium leading-none"> verified </span>
              </div>
            </div>
          </div>

          <!-- Contact Email -->
          <div>
            <label class="block text-sm font-semibold mb-1">
              Update Email Address
            </label>
            <input
              type="email"
              v-model="newEmail"
              placeholder="Enter a new email address"
              class="w-full px-4 py-2 bg-gray-100 rounded-md focus:ring-2 focus:ring-blue-300 outline-none"
            />
            <p class="text-xs text-[#8C8F91] mt-1">
              We’ll send a confirmation link to verify this email before
              updating your account.
            </p>
          </div>
        </div>

        <div class="flex justify-end mt-8 gap-3">
          <ButtonWeb
            label="Reset"
            color="red"
            class="min-w-[180px]"
            @click="resetForm"
          />
          <ButtonWeb
            label="Save Account Changes"
            color="green"
            class="min-w-[180px]"
            @click="sendUpdateEmail"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- <div class="bg-white rounded-2xl shadow p-6 md:p-8 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl max-sm:text-xl font-bold text-[#185dc0]">
        {{ title }}
      </h2>
      <svg
        class="cursor-pointer"
        @click="$emit('edit')"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path
          fill="gray"
          d="m18.988 2.012l3 3L19.701 7.3l-3-3zM8 16h3l7.287-7.287l-3-3L8 13z"
        />
        <path
          fill="gray"
          d="M19 19H8.158c-.026 0-.053.01-.079.01c-.033 0-.066-.009-.1-.01H5V5h6.847l2-2H5c-1.103 0-2 .896-2 2v14c0 1.104.897 2 2 2h14a2 2 0 0 0 2-2v-8.668l-2 2z"
        />
      </svg>
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
          {{ fullName }}
        </p>
      </div>

      <div
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
          <label class="block font-semibold text-[#185dc0] mb-1">phoneNumber</label>
          <p>{{ display(phoneNumber) }}</p>
        </div>
      </div>
    </div>
  </div> -->
</template>
