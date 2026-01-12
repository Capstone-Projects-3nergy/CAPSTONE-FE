<script setup>
import { computed } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'
import ButtonWeb from './ButtonWeb.vue'
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
defineEmits(['edit'])
</script>
<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-col md:flex-row gap-10">
      <!-- LEFT : Profile Card -->
      <div
        class="w-full md:w-1/3 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center text-center"
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

        <p class="mt-4 text-gray-800 font-semibold text-lg">
          {{ fullName }}
        </p>
      </div>

      <!-- RIGHT : Information Card -->
      <div
        class="w-full md:w-2/3 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8"
      >
        <!-- Header -->
        <div class="flex items-center gap-3 mb-8">
          <h2 class="text-xl sm:text-2xl font-semibold text-gray-800">
            {{ title }}
          </h2>
          <div class="relative group">
            <svg
              class="cursor-pointer text-gray-400 hover:text-gray-600 transition"
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
            </svg>
            <div
              class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
            >
              <div
                class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
              >
                Edit Profile

                <div class="absolute left-1/2 top-full -translate-x-1/2">
                  <div
                    class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-600"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7">
          <div>
            <label class="block text-sm text-gray-400 mb-1"> Firstname </label>
            <p class="text-gray-800 font-medium">
              {{ firstName }}
            </p>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1"> Lastname </label>
            <p class="text-gray-800 font-medium">
              {{ lastName }}
            </p>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1"> Email </label>
            <p class="text-gray-800 font-medium break-all">
              {{ email }}
            </p>
          </div>

          <div v-if="roomNumber !== null">
            <label class="block text-sm text-gray-400 mb-1">
              Room Number
            </label>
            <p class="text-gray-800 font-medium">
              {{ roomNumber }}
            </p>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1"> Line ID </label>
            <p class="text-gray-800 font-medium">
              {{ display(lineId) }}
            </p>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1"> Contact </label>
            <p class="text-gray-800 font-medium">
              {{ display(contact) }}
            </p>
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
          <label class="block font-semibold text-[#185dc0] mb-1">Contact</label>
          <p>{{ display(contact) }}</p>
        </div>
      </div>
    </div>
  </div> -->
</template>
