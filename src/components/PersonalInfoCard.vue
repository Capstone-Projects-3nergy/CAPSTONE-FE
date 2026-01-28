<script setup>
import { computed, ref, onMounted, watch, onUnmounted } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'
import ButtonWeb from './ButtonWeb.vue'
import { useRouter, useRoute } from 'vue-router'
import { useProfileManager } from '@/stores/ProfileManager'
import { useUserManager } from '@/stores/MemberAndStaffManager'
import { getItems } from '@/utils/fetchUtils'
const emit = defineEmits([
  'confirmAccount',
  'redAlertError',
  'incorrectemailform',
  'edit',
  'emailRequire',
  'cancel'
])
const userManager = useUserManager()
const profileManager = useProfileManager()
const route = useRoute()
const router = useRouter()
const loginManager = useAuthManager()
const activeTab = ref('profile')
const newEmail = ref('')
const trimmedEmail = newEmail.value?.trim()
const props = defineProps({
  title: { type: String, default: 'Personal Information' },
  showEdit: { type: Boolean, default: true },
  profileImage: { type: String, default: '' },
  fullName: {
    type: String,
    default: ''
  },
  firstName: { type: String, default: '-' },
  lastName: { type: String, default: '-' },
  dormName: { type: String, default: '-' },
  position: { type: String, default: '-' },
  email: { type: String, default: '-' },
  roomNumber: { type: String, default: null },
  status: { type: String, default: null },
  lineId: { type: String, default: null },
  phoneNumber: { type: String, default: null },
  showNotify: { type: Boolean, default: true },
  showMenu: { type: Boolean, default: true },
  profile: { type: Boolean, default: true },
  residentDetail: { type: Boolean, default: false },
  profileImage: String,
  useCurrentProfile: {
    type: Boolean,
    default: false
  }
})
const resetForm = () => {
  newEmail.value = ''
}
const routeUser = computed(() => {
  const userId = route.params.id
  if (!userId) return null

  return (
    userManager.members.find((u) => u.id == userId) ||
    userManager.staffs.find((u) => u.id == userId) ||
    null
  )
})
const safeFullName = computed(() => {
  return props.fullName || routeUser.value?.fullName || ''
})

const safeStatus = computed(() => {
  return props.status || routeUser.value?.status || null
})

function display(value) {
  if (!value || value.trim() === '') return '-'
  return value
}
watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'notify') {
      activeTab.value = 'notify'
    }
  },
  { immediate: true }
)

const authStore = useAuthManager()

const userName = computed(() => authStore.user?.fullName || 'Courier')
const userInitial = computed(() => {
  const name = safeFullName.value?.trim()
  if (!name) return '?'
  return name.charAt(0)
})

// const userInitial = computed(() => {
//   const name = props.fullName?.trim()
//   if (!name) return '?'
//   return name.split('')[0] // ไทยไม่ต้อง toUpperCase
// })

const hasProfileImageUrl = computed(
  () => props.profileImage && props.profileImage.trim() !== ''
)
const menuClass = (tab) => {
  return [
    'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition',
    activeTab.value === tab
      ? 'bg-[#D9D9D9] text-[#60a5fa]'
      : 'text-gray-500 hover:bg-gray-100'
  ]
}

// แสดงค่า (default = ACTIVE)
const displayStatus = (value) => {
  if (!value || value.trim() === '') return 'ERROR'
  return value.toUpperCase()
}

// กำหนดสีตามสถานะ
const statusClass = (value) => {
  const status = displayStatus(value)

  return {
    'bg-green-400': status === 'ACTIVE',
    'bg-gray-400': status === 'INACTIVE',
    'bg-yellow-400': status === 'ERROR'
  }
}
onMounted(async () => {
  // กันกรณี refresh แล้ว store ว่าง
  if (userManager.members.length || userManager.staffs.length) return

  const dataUser = await getItems(
    `${import.meta.env.VITE_BASE_URL}/api/staff/users`,
    id,
    router
  )

  if (dataUser) {
    const mapped = dataUser.map((p) => ({
      id: p.userId,
      fullName: p.fullName,
      email: p.email,
      dormName: p.dormName,
      phoneNumber: p.phoneNumber || '',
      lineId: p.lineId || '',
      roomNumber: p.roomNumber,
      role: p.role,
      status: p.status,
      updateAt: p.updatedAt,
      photo: p.profileImageUrl
    }))

    // เรียงล่าสุด
    mapped.sort((a, b) => new Date(b.updateAt) - new Date(a.updateAt))

    userManager.setMembers(mapped.filter((u) => u.role === 'RESIDENT'))
    userManager.setStaffs(mapped.filter((u) => u.role === 'STAFF'))
  }
})

const notifications = [
  {
    type: 'new',
    label: 'New Parcel Arrived',
    title: 'A new parcel has arrived at the dormitory office',
    user: 'Parcel System',
    time: '15 Jan 2026 · 09:10 AM'
  },
  {
    type: 'message',
    label: 'Pickup Reminder',
    title: 'You have a parcel waiting for pickup',
    user: 'Dormitory Office',
    time: '15 Jan 2026 · 10:30 AM'
  },
  {
    type: 'comment',
    label: 'Parcel Note',
    title: 'Staff added a note to your parcel record',
    user: 'Admin Staff',
    time: '15 Jan 2026 · 11:00 AM'
  },
  {
    type: 'connect',
    label: 'Parcel Assigned',
    title: 'A parcel has been assigned to your room',
    user: 'Parcel Management System',
    time: '15 Jan 2026 · 11:45 AM'
  },
  {
    type: 'message',
    label: 'Pickup Confirmation',
    title: 'Your parcel has been successfully picked up',
    user: 'Dormitory Office',
    time: '15 Jan 2026 · 01:15 PM'
  },
  {
    type: 'new',
    label: 'New Parcel Arrived',
    title: 'A new parcel has arrived for Room 304',
    user: 'Parcel System',
    time: '15 Jan 2026 · 02:40 PM'
  },
  {
    type: 'comment',
    label: 'Delivery Update',
    title: 'Courier updated the delivery status of your parcel',
    user: 'Courier Service',
    time: '15 Jan 2026 · 03:20 PM'
  },
  {
    type: 'connect',
    label: 'Room Verification',
    title: 'Your room number has been verified for parcel delivery',
    user: 'Dormitory Admin',
    time: '15 Jan 2026 · 04:05 PM'
  },
  {
    type: 'message',
    label: 'Parcel Reminder',
    title: 'Please collect your parcel before storage deadline',
    user: 'Dormitory Office',
    time: '15 Jan 2026 · 05:30 PM'
  },
  {
    type: 'new',
    label: 'Parcel Stored',
    title: 'Your parcel is stored safely at the dormitory office',
    user: 'Parcel System',
    time: '15 Jan 2026 · 06:10 PM'
  }
]
const activeNotifyTab = ref('all')
const ACCOUNT_TYPES = ['message']
const PARCEL_TYPES = ['new', 'comment', 'connect']
const filteredNotifications = computed(() => {
  if (activeNotifyTab.value === 'all') {
    return notifications
  }

  if (activeNotifyTab.value === 'parcel') {
    return notifications.filter((n) => PARCEL_TYPES.includes(n.type))
  }

  if (activeNotifyTab.value === 'announcement') {
    return notifications.filter((n) => ACCOUNT_TYPES.includes(n.type))
  }

  return notifications
})

const badgeClass = (type) => {
  if (ACCOUNT_TYPES.includes(type)) return 'bg-green-500'
  if (PARCEL_TYPES.includes(type)) return 'bg-blue-500'
  return 'bg-gray-400'
}

const badgeIcon = (type) => {
  // account / message
  if (type === 'message') {
    return `
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 8H4C3.46957 8 2.96086 8.21071 2.58579 8.58579C2.21071 8.96086 2 9.46957 2 10V14C2 14.5304 2.21071 15.0391 2.58579 15.4142C2.96086 15.7893 3.46957 16 4 16H5V20C5 20.2652 5.10536 20.5196 5.29289 20.7071C5.48043 20.8946 5.73478 21 6 21H8C8.26522 21 8.51957 20.8946 8.70711 20.7071C8.89464 20.5196 9 20.2652 9 20V16H12L17 20V4L12 8ZM21.5 12C21.5 13.71 20.54 15.26 19 16V8C20.53 8.75 21.5 10.3 21.5 12Z"
         fill="white"
        />
      </svg>
    `
  }

  // parcel / notification
  return `
    <svg
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.9676 2.61776C13.0264 2.23614 11.9735 2.23614 11.0322 2.61776L8.75096 3.54276L18.7426 7.42818L22.2572 6.07089C22.1127 5.95203 21.9512 5.85547 21.778 5.78443L13.9676 2.61776ZM22.9166 7.49068L13.2812 11.2136V22.5917C13.5145 22.5445 13.7433 22.4754 13.9676 22.3844L21.778 19.2178C22.1145 19.0815 22.4026 18.8479 22.6054 18.5469C22.8082 18.2459 22.9166 17.8912 22.9166 17.5282V7.49068ZM11.7187 22.5917V11.2136L2.08325 7.49068V17.5292C2.08346 17.892 2.19191 18.2465 2.39474 18.5473C2.59756 18.8481 2.88553 19.0816 3.22179 19.2178L11.0322 22.3844C11.2565 22.4747 11.4853 22.5431 11.7187 22.5917ZM2.74263 6.07089L12.4999 9.84068L16.5801 8.2636L6.6395 4.39901L3.22179 5.78443C3.04402 5.85665 2.88429 5.95214 2.74263 6.07089Z"
        fill="white"
      />
    </svg>
  `
}
const notifyTabClass = (tab) => {
  const isActive = activeNotifyTab.value === tab

  if (!isActive) {
    return 'px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition'
  }

  if (tab === 'all') {
    return 'px-4 py-2 rounded-full text-sm font-medium bg-yellow-500 text-white transition'
  }

  if (tab === 'parcel') {
    return 'px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white transition'
  }
  if (tab === 'announcement') {
    return 'px-4 py-2 rounded-full text-sm font-medium bg-green-500 text-white transition'
  }
}
const newAvatar = ref(null)
// const profileImageUrlPreview = computed(() => {
//   if (newAvatar.value) return URL.createObjectURL(newAvatar.value)
//   return props.profileImage
// })
const profileImageUrlPreview = computed(() => {
  // 1️⃣ รูปใหม่ (ตอน edit)
  if (newAvatar.value) {
    return URL.createObjectURL(newAvatar.value)
  }

  // 2️⃣ หน้า profile (user login)
  if (props.useCurrentProfile) {
    const url = profileManager.currentProfile?.profileImageUrl
    return url && url.startsWith('http') ? url : ''
  }

  // 3️⃣ หน้า resident / staff detail
  return props.profileImage && props.profileImage.startsWith('http')
    ? props.profileImage
    : ''
})
</script>
<template>
  <div class="w-full mx-auto px-4">
    <div v-if="profile" class="flex flex-col md:flex-row gap-2">
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
              v-if="profileImageUrlPreview"
              :src="profileImageUrlPreview"
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
        <div v-if="showMenu" class="mt-8 space-y-2">
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

          <!-- <button
            v-if="showNotify"
            @click="activeTab = 'notify'"
            :class="menuClass('notify')"
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
            <span>Notifications</span>
          </button> -->
        </div>
      </div>
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
            <label
              class="flex items-center gap-2 text-sm text-black font-semibold mb-1"
            >
              <span>Email</span>

              <span class="flex items-center gap-1 text-green-600 font-medium">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
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

                <span class="text-xs leading-none"> verified </span>
              </span>
            </label>

            <div class="flex items-center gap-2">
              <p class="font-medium break-all text-[#8C8F91]">
                {{ email }}
              </p>

              <!-- <div class="flex items-center gap-1 text-green-600">
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
              </div> -->
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
          <div
            v-if="dormName !== null && loginManager.user.role === 'RESIDENT'"
          >
            <label class="block text-sm text-black font-semibold mb-1">
              Dormitory
            </label>
            <p class="text-[#8C8F91] font-medium">
              {{ dormName }}
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
              :class="statusClass(safeStatus)"
            >
              {{ displayStatus(safeStatus) }}
            </span>
          </div>
        </div>
      </div>
      <div
        v-if="activeTab === 'notify'"
        class="w-full md:w-2/3 bg-white rounded-[5px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8"
      >
        <!-- Header -->
        <h2 class="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
          Notifications
        </h2>
        <!-- Tabs -->
        <div class="flex gap-2 mb-6">
          <button
            @click="activeNotifyTab = 'all'"
            :class="notifyTabClass('all')"
            class="cursor-pointer"
          >
            All Notify
          </button>

          <button
            @click="activeNotifyTab = 'parcel'"
            :class="notifyTabClass('parcel')"
            class="cursor-pointer"
          >
            Parcel Notify
          </button>

          <button
            @click="activeNotifyTab = 'announcement'"
            :class="notifyTabClass('announcement')"
            class="cursor-pointer"
          >
            Announcement Notify
          </button>
        </div>

        <!-- Notification list -->
        <div class="space-y-4 max-h-[480px] overflow-y-auto pr-2">
          <div
            v-for="(item, index) in filteredNotifications"
            :key="index"
            class="flex items-start gap-4 bg-[#F4F6F8] rounded-md px-5 py-4 cursor-pointer"
          >
            <!-- LEFT ICON -->
            <div class="mt-1">
              <span
                class="inline-flex items-center justify-center w-9 h-9 rounded text-white"
                :class="badgeClass(item.type)"
                v-html="badgeIcon(item.type)"
              />
            </div>

            <!-- CONTENT -->
            <div class="flex-1">
              <p class="text-sm font-semibold text-gray-800">
                {{ item.label }}
              </p>

              <p class="text-sm text-gray-500 mt-0.5">
                {{ item.title }}
              </p>

              <p class="text-xs text-red-500 mt-1">
                {{ item.user }}
              </p>
            </div>

            <!-- TIME -->
            <div class="text-xs text-gray-400 whitespace-nowrap">
              {{ item.time }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="residentDetail" class="max-w-5xl mx-auto">
      <!-- 🔹 CARD เดียว -->
      <div
        class="bg-white rounded-[5px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8"
      >
        <div class="mb-6 text-center md:hidden">
          <h2 class="text-xl font-semibold text-gray-800">
            {{ fullName }}
          </h2>
        </div>
        <!-- 🔹 WRAPPER ซ้าย-ขวา -->
        <div class="flex flex-col md:flex-row gap-10">
          <!-- ================= LEFT : Profile Header ================= -->
          <div
            class="md:w-1/3 flex flex-col items-center text-center pt-2 sm:pt-6 md:pt-8 lg:pt-10"
          >
            <div
              class="w-28 h-28 rounded-full overflow-hidden border border-gray-200 shadow-sm"
            >
              <img
                v-if="profileImageUrlPreview"
                :src="profileImageUrlPreview"
                class="w-full h-full object-cover"
              />
              <div
                v-else-if="fullName"
                class="w-full h-full bg-[#185DC0] flex items-center justify-center text-white text-4xl font-semibold"
              >
                {{ userInitial }}
              </div>
            </div>
            <p
              class="hidden md:block mb-4 text-black font-semibold text-lg pt-5"
            >
              {{ fullName }}
            </p>
          </div>

          <!-- ================= RIGHT : Personal Information ================= -->
          <div class="md:w-2/3">
            <div class="flex items-center gap-3 mb-8">
              <h2
                class="md:block text-xl sm:text-2xl font-semibold text-gray-800"
              >
                User Information
              </h2>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7">
              <div>
                <label class="block text-sm font-semibold mb-1"
                  >Firstname</label
                >
                <p class="text-[#8C8F91] font-medium">{{ firstName }}</p>
              </div>

              <div>
                <label class="block text-sm font-semibold mb-1">Lastname</label>
                <p class="text-[#8C8F91] font-medium">{{ lastName }}</p>
              </div>

              <div>
                <label class="block text-sm font-semibold mb-1">Email</label>
                <p class="text-[#8C8F91] font-medium break-all">{{ email }}</p>
              </div>

              <div>
                <label class="block text-sm font-semibold mb-1"
                  >Room Number</label
                >
                <p class="text-[#8C8F91] font-medium">
                  {{ display(roomNumber) }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-semibold mb-1"
                  >Dormitory</label
                >
                <p class="text-[#8C8F91] font-medium">{{ dormName }}</p>
              </div>

              <div>
                <label class="block text-sm font-semibold mb-1">Line ID</label>
                <p class="text-[#8C8F91] font-medium">{{ display(lineId) }}</p>
              </div>

              <div>
                <label class="block text-sm font-semibold mb-1"
                  >Phone Number</label
                >
                <p class="text-[#8C8F91] font-medium">
                  {{ display(phoneNumber) }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <label class="text-sm font-semibold">Status:</label>
                <span
                  class="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  :class="statusClass(status)"
                >
                  {{ displayStatus(status) }}
                </span>
              </div>

              <!-- Buttons -->
              <div class="sm:col-span-2 flex gap-3 mt-6 justify-end">
                <ButtonWeb
                  class="text-sm py-2 md:text-base md:py-2.5"
                  label="Edit"
                  color="blue"
                  @click="$emit('edit')"
                  :disabled="isSaveDisabled"
                />
                <ButtonWeb
                  class="text-[#898989] text-sm py-2 md:text-base md:py-2.5"
                  label="Cancel"
                  color="gray"
                  @click="$emit('cancel')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
