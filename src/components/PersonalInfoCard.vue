<script setup>
import { computed, ref, onMounted, watch, onUnmounted } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'
import ButtonWeb from './ButtonWeb.vue'
import { useRouter, useRoute } from 'vue-router'
import { useProfileManager } from '@/stores/ProfileManager'
import { useUserManager } from '@/stores/MemberAndStaffManager'
import { getItems, unlinkLineAccount, connectLineAccount, getLineConnectUrl, sendVerificationEmail } from '@/utils/fetchUtils'
import { LINE_CONFIG } from '@/lineApi/line.config.js'
import AlertPopUp from './AlertPopUp.vue'
const emit = defineEmits([
  'confirmAccount',
  'redAlertError',
  'incorrectemailform',
  'edit',
  'emailRequire',
  'cancel',
  'changeStatus'
])
const userManager = useUserManager()
const profileManager = useProfileManager()
const route = useRoute()
const router = useRouter()
const loginManager = useAuthManager()
const activeTab = ref('profile')
const newEmail = ref('')
const trimmedEmail = newEmail.value?.trim()
const showLineSuccessPopup = ref(false)

// LINE Connection alert state
const lineAlertVisible = ref(false)
const lineAlertMessage = ref('')
const lineAlertTitle = ref('')
const lineAlertStyle = ref('blue')
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
  isLineLinked: { type: Boolean, default: null },
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
  // return 'PENDING'
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
    } else if (tab === 'status') {
      activeTab.value = 'status'
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
    'w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center gap-3',
    activeTab.value === tab
      ? 'bg-blue-50 text-[#185DC0] shadow-sm shadow-blue-100/50 scale-[1.02]'
      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:translate-x-1'
  ]
}

// แสดงค่า (default = ACTIVE)
const displayStatus = (value) => {
  if (!value || value.trim() === '') return 'Error'
  const s = value.toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// กำหนดสีตามสถานะ
const statusClass = (value) => {
  const status = displayStatus(value)

  return {
    'bg-gradient-to-r from-emerald-400 to-green-500 shadow-sm shadow-green-200': status === 'Active',
    'bg-gradient-to-r from-gray-400 to-gray-500 shadow-sm shadow-gray-200': status === 'Inactive',
    'bg-gradient-to-r from-red-400 to-rose-500 shadow-sm shadow-red-200': status === 'Error'
  }
}
onMounted(async () => {
  // ✅ ดึงโปรไฟล์ล่าสุดของผู้ใช้เพื่อเช็คสถานะการเชื่อมต่อ (LINE, etc.)
  if (props.useCurrentProfile) {
    await profileManager.fetchProfile()
  }
  console.log(profileManager.profile) // ✅ ตอนนี้ใช้งานได้แล้วเพราะเพิ่ม alias ใน store
  // กันกรณี refresh แล้ว store ว่าง
  if (userManager.members.length || userManager.staffs.length) return

  // Only STAFF can fetch all users
  if (loginManager.user?.role !== 'STAFF') return

  const dataUser = await getItems(
    `${import.meta.env.VITE_BASE_URL}/api/staff/users`,
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

// ✅ Detect LINE Connection results from URL redirect
watch(
  () => route.query.line,
  (status) => {
    if (!status) return

    console.log('Detected LINE status in URL:', status)
    const errorMsg = route.query.msg

    if (status === 'success') {
      showLineSuccessPopup.value = true
      // ✅ Refresh profile ข้อมูลการเชื่อมต่อ LINE ทันทีที่กลับมาจาก Redirect
      profileManager.fetchProfile()
    } else if (status === 'error') {
      lineAlertVisible.value = true
      lineAlertStyle.value = 'red'
      lineAlertMessage.value = 'LINE Connection Failed'
      lineAlertTitle.value = errorMsg || 'Please try again or contact support'
      
      // Auto-hide alert after 8 seconds
      setTimeout(() => {
        lineAlertVisible.value = false
      }, 8000)
    }

    // Clean up query string after processing
    setTimeout(() => {
      const newQuery = { ...route.query }
      delete newQuery.line
      delete newQuery.msg
      router.replace({ query: newQuery })
    }, 1500)
  },
  { immediate: true }
)

const addLineOA = () => {
  // 👈 ไอดีบอทจริง @788eafre
  window.open('https://lin.ee/kCqc35o/@446subfw', '_blank')
  showLineSuccessPopup.value = false
}

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

const userRoleLabel = computed(() => {
  if (props.residentDetail) return 'Resident Name'
  return loginManager.user?.role === 'STAFF' ? 'Staff Name' : 'Resident Name'
})

const effectiveLineId = computed(() => {
  let isLinked = false
  let id = null

  if (props.useCurrentProfile) {
    // ✅ ตรวจสอบสถานะจริงจากการเชื่อมต่อ LINE (Boolean)
    isLinked = profileManager.currentProfile?.isLineLinked || loginManager.user?.isLineLinked || props.isLineLinked
    id = loginManager.user?.lineId || profileManager.currentProfile?.lineId || props.lineId
  } else {
    // ✅ สำหรับการดูโปรไฟล์คนอื่น
    isLinked = props.isLineLinked !== null ? props.isLineLinked : routeUser.value?.isLineLinked
    id = props.lineId || routeUser.value?.lineId
  }

  // ✅ ใช้ Boolean 'isLinked' เป็นตัวตัดสิน UI ว่าเชื่อมต่อหรือยัง
  if (!isLinked) {
    return null
  }

  // คืนค่า ID เพื่อใช้เปิดลิงก์ ถ้าไม่มีให้คืน true เพื่อบอกว่าเชื่อมแล้ว
  return id || true
})

const handleLineAction = async (directLineId = null) => {
  // 1. เช็คสถานะการเชื่อมต่อเดิม (ถ้าผูกไว้แล้ว ให้เปิดโปรไฟล์ LINE OA)
  if (effectiveLineId.value) {
    if (typeof effectiveLineId.value === 'string') {
      window.open(`https://line.me/ti/p/~${effectiveLineId.value}`, '_blank')
    }
    return
  }

  // 2. 🚀 [ระบบใหม่] การผูกบัญชีแบบ Direct (ถ้าได้รับไอดีส่งมาโดยตรงจาก LIFF หรือพารามิเตอร์)
  if (directLineId && typeof directLineId === 'string') {
    const success = await connectLineAccount(directLineId, router)
    if (success) {
      // ✅ อัปเดต UI ทันทีใน Store
      if (profileManager.currentProfile) {
        profileManager.currentProfile.isLineLinked = true
        profileManager.currentProfile.lineId = directLineId
      }
      if (loginManager.user) {
        loginManager.user.isLineLinked = true
        loginManager.user.lineId = directLineId
      }
      
      // ✅ ดึง Profile ใหม่จาก Backend เพื่อความแม่นยำ
      await profileManager.fetchProfile()
      
      // ✅ แสดง Popup ความสำเร็จ
      showLineSuccessPopup.value = true
      return
    }
  }

  // 3. 🛡️ [ระบบเดิม] ถ้าไม่มีไอดีส่งมา ให้ทำงานแบบ Redirect ไปหน้า LINE Login (OAuth)
  reconnectLine()
}

const reconnectLine = async () => {
  const token = loginManager.user?.accessToken
  if (!token) {
    console.error('No firebase token available')
    return
  }

  const url = await getLineConnectUrl(token, router)
  if (url) {
    // 🛡️ พาลูกบ้านไปหน้า Auth ของ LINE (ระบบเดิมที่คุณใช้งานอยู่ 100%)
    window.location.href = url
  } else {
    console.error('Failed to get LINE login URL from backend')
  }
}

const handleSendEmailNotification = async () => {
  // ✅ ระบุ userId จาก props หรือจาก routeUser (Staff ดู Resident)
  const userId = props.userId || routeUser.value?.id || (props.useCurrentProfile ? profileManager.currentProfile?.userId : null)
  
  if (!userId) {
    console.error('No valid user ID available for sending email')
    return
  }

  const success = await sendVerificationEmail(userId, router)
  
  if (success) {
    lineAlertVisible.value = true
    lineAlertStyle.value = 'blue'
    lineAlertMessage.value = 'Email Sent'
    lineAlertTitle.value = 'The verification email has been sent to the resident.'
    
    setTimeout(() => {
      lineAlertVisible.value = false
    }, 10000)
  } else {
    lineAlertVisible.value = true
    lineAlertStyle.value = 'red'
    lineAlertMessage.value = 'Failed'
    lineAlertTitle.value = 'Unable to send verification email. Please try again.'
    
    setTimeout(() => {
      lineAlertVisible.value = false
    }, 10000)
  }
}

const handleUnlink = async () => {
  if (confirm('Are you sure you want to disconnect your LINE account?')) {
    const success = await unlinkLineAccount(router)
    if (success) {
      // ✅ อัปเดตสถานะใน Store ทันทีเพื่อให้ UI เปลี่ยนแปลง
      if (profileManager.currentProfile) {
        profileManager.currentProfile.isLineLinked = false
        profileManager.currentProfile.lineId = null
      }
      if (loginManager.user) {
        loginManager.user.isLineLinked = false
        loginManager.user.lineId = null
      }

      // ✅ ดึง Profile ใหม่จาก Backend เพื่อความแม่นยำ
      await profileManager.fetchProfile()
      
      // ✅ แสดง Popup แจ้งเตือนความสำเร็จ
      lineAlertVisible.value = true
      lineAlertStyle.value = 'blue'
      lineAlertMessage.value = 'Disconnected'
      lineAlertTitle.value = 'Your LINE account has been unlinked successfully.'
      
      setTimeout(() => {
        lineAlertVisible.value = false
      }, 5000)
    } else {
      lineAlertVisible.value = true
      lineAlertStyle.value = 'red'
      lineAlertMessage.value = 'Error'
      lineAlertTitle.value = 'Failed to disconnect. Please try again later.'
    }
  }
}
</script>
<template>
  <div class="w-full mx-auto px-4 relative">
    <!-- Beautiful LINE Feedback Alert -->
    <div v-if="lineAlertVisible" class="fixed top-24 right-6 z-[110] w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-500">
      <AlertPopUp
        :message="lineAlertMessage"
        :titles="lineAlertTitle"
        :styleType="lineAlertStyle"
        @closePopUp="lineAlertVisible = false"
      />
    </div>

    <div v-if="profile" class="flex flex-col md:flex-row gap-2">
      <!-- LEFT : Profile Card -->
      <div
        class="w-full md:w-1/3 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-blue-50/50 p-6 sm:p-8"
      >
        <!-- Avatar -->
        <div class="flex flex-col items-center text-center">
          <div
            class="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-[#1D355E] to-[#0E4B90] p-1 shadow-lg ring-4 ring-white relative group/avatar"
          >
            <div class="w-full h-full rounded-full overflow-hidden relative from-[#1D355E] to-[#0E4B90]">
              <img
                v-if="profileImageUrlPreview"
                :src="profileImageUrlPreview"
                class="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-white text-4xl font-bold"
              >
                {{ userInitial }}
              </div>
            </div>
          </div>
          <p class="text-sm font-extrabold text-[#0E4B90] pt-6">
            {{ userRoleLabel }}
          </p>
          <p class="mt-4 text-black font-semibold text-lg text-gray-500 truncate max-w-[200px] mx-auto">
            {{ fullName }}
          </p>
        </div>

        <!-- Menu -->
        <div v-if="showMenu" class="mt-8 space-y-2">
          <button
            @click="activeTab = 'profile'"
            :class="menuClass('profile')"
            class="relative w-full cursor-pointer"
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
            @click="activeTab = 'line'"
            :class="menuClass('line')"
            class="relative w-full cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path d="M200.533 256H55.467C24.834 256 0 231.166 0 200.533V55.467C0 24.834 24.834 0 55.467 0h145.067C231.166 0 256 24.834 256 55.467v145.067C256 231.166 231.166 256 200.533 256" fill="currentColor"/><path d="M220.792 116.744c0-41.707-41.81-75.64-93.207-75.64-51.4 0-93.205 33.933-93.205 75.64 0 37.39 33.158 68.704 77.95 74.624 3.036.655 7.166 2.003 8.21 4.597.94 2.355.614 6.048.3 8.43l-1.33 7.98c-.407 2.355-1.875 9.216 8.073 5.024s53.68-31.607 73.233-54.116h-.004c13.508-14.812 19.98-29.845 19.98-46.537" fill="#fff"/><g fill="currentColor"><path d="M108.647 96.6h-6.54c-1.003 0-1.815.813-1.815 1.813v40.612c0 .998.813 1.8 1.815 1.8h6.54c1.003 0 1.815-.8 1.815-1.8V98.403c0-1-.813-1.813-1.815-1.813m45 .01H147.1c-1.005 0-1.815.813-1.815 1.813v24.128l-18.613-25.135c-.043-.064-.092-.126-.14-.183l-.01-.013-.143-.143-.098-.08c-.015-.013-.03-.026-.047-.036l-.094-.064c-.017-.013-.036-.02-.055-.032l-.096-.055-.058-.028-.105-.045-.058-.02a.83.83 0 0 0-.11-.036l-.064-.017-.102-.02c-.026-.006-.053-.01-.077-.01-.032-.006-.064-.01-.096-.013l-.094-.006c-.023 0-.043-.002-.064-.002h-6.537c-1.003 0-1.815.813-1.815 1.813v40.612c0 .998.813 1.8 1.815 1.8h6.537c1.005 0 1.818-.8 1.818-1.8v-24.122l18.633 25.167a1.81 1.81 0 0 0 .463.448c.004.004.01.01.017.015l.113.066.05.03a1.1 1.1 0 0 0 .087.041l.087.038.053.02.126.038c.006.002.017.004.026.006a1.75 1.75 0 0 0 .465.06h6.537c1.003 0 1.815-.8 1.815-1.8V98.402c0-1-.813-1.813-1.815-1.813"/><path d="M92.887 130.657H75.122V98.403c0-1.003-.813-1.815-1.813-1.815h-6.54c-1.003 0-1.815.813-1.815 1.815v40.6a1.8 1.8 0 0 0 .508 1.254.09.09 0 0 0 .024.028c.01.008.02.017.028.026a1.81 1.81 0 0 0 1.252.506h26.12c1.003 0 1.813-.815 1.813-1.815v-6.54c0-1.003-.8-1.815-1.813-1.815m96.864-23.897c1.003 0 1.813-.813 1.813-1.815v-6.54c0-1.003-.8-1.815-1.813-1.815h-26.12a1.8 1.8 0 0 0-1.259.512c-.006.006-.015.013-.02.02s-.02.02-.028.032c-.3.324-.503.764-.503 1.25v40.613c0 .486.194.928.508 1.254l.023.026.026.024c.326.314.768.508 1.254.508h26.12c1.003 0 1.813-.813 1.813-1.813v-6.54c0-1.003-.8-1.815-1.813-1.815H172v-6.865h17.762a1.81 1.81 0 0 0 1.813-1.815v-6.537c0-1.003-.8-1.818-1.813-1.818H172v-6.863h17.762z"/></g></svg>
            <span>Line Account</span>
          </button>
        </div>
      </div>
      <!-- RIGHT : Information Card -->
      <div
        v-if="activeTab === 'profile'"
        class="w-full md:w-2/3 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-blue-50/50 p-6 sm:p-8"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-4">
            <div class="w-2 h-8 bg-gradient-to-b from-[#0E4B90] to-blue-400 rounded-full"></div>
            <h3 class="font-extrabold text-xl text-black tracking-tight">
              {{ title }}
            </h3>
            <div class="relative group">
              <div 
                class="p-2 cursor-pointer text-[#8C8F91] hover:text-[#0E4B90] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center rounded-full hover:bg-blue-50"
                @click="$emit('edit')"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentcolor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.71 7.04055C21.1 6.65055 21.1 6.00055 20.71 5.63055L18.37 3.29055C18 2.90055 17.35 2.90055 16.96 3.29055L15.12 5.12055L18.87 8.87055M3 17.2505V21.0005H6.75L17.81 9.93055L14.06 6.18055L3 17.2505Z"
                  />
                </svg>
              </div>
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
      </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7">
          <div>
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              First Name
            </label>
            <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-medium text-gray-700 flex items-center h-[58px] overflow-hidden">
              <p class="truncate">{{ firstName }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Last Name
            </label>
            <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-medium text-gray-700 flex items-center h-[58px] overflow-hidden">
              <p class="truncate">{{ lastName }}</p>
            </div>
          </div>

          <div>
            <label
              class="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2 ml-1"
            >
              <span>Email</span>

              <span class="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full text-[10px] tracking-wider">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  class="shrink-0"
                >
                  <g fill="none" stroke="currentColor" stroke-width="2">
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

                <span> Verified </span>
              </span>
            </label>

            <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-medium text-gray-700 flex items-center h-[58px] overflow-hidden">
              <p class="truncate">
                {{ email }}
              </p>
            </div>
          </div>

          <div v-if="loginManager.user.role === 'STAFF'">
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Position
            </label>
            <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-medium text-gray-700 flex items-center h-[58px] overflow-hidden">
              <p class="truncate">{{ position }}</p>
            </div>
          </div>
          <div v-if="roomNumber !== null">
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Room Number
            </label>
            <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-medium text-gray-700 flex items-center h-[58px] overflow-hidden">
              <p class="truncate">{{ roomNumber }}</p>
            </div>
          </div>
          <div
            v-if="dormName !== null && loginManager.user.role === 'RESIDENT'"
          >
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Dormitory
            </label>
            <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-medium text-gray-700 flex items-center h-[58px] overflow-hidden">
              <p class="truncate">{{ dormName }}</p>
            </div>
          </div>

          <!-- line removed from here and moved to a new tab -->

          <div>
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Phone Number
            </label>
            <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-medium text-gray-700 flex items-center h-[58px] overflow-hidden">
              <p class="truncate">{{ display(phoneNumber) }}</p>
            </div>
          </div>
          <!-- <div class="flex items-center gap-2 mt-2">
            <label class="text-sm font-bold text-gray-500"> Status: </label>

            <span
              class="px-3 py-1 rounded-full text-xs font-semibold text-white inline-block"
              :class="statusClass(safeStatus)"
            >
              {{ displayStatus(safeStatus) }}
            </span>
          </div> -->
        </div>
      </div>
      <div
        v-if="activeTab === 'line'"
        class="w-full md:w-2/3 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-blue-50/50 p-6 sm:p-8 overflow-hidden"
      >
        <div class="flex items-center gap-4 mb-8">
          <div class="w-2 h-8 bg-gradient-to-b from-[#00b900] to-green-400 rounded-full"></div>
          <h3 class="font-extrabold text-xl text-black tracking-tight">
            Line Account
          </h3>
          <div class="relative group ml-auto">
            <!-- <div 
              class="p-2 cursor-pointer text-[#8C8F91] hover:text-[#00b900] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center rounded-full hover:bg-green-50"
              @click="$emit('edit')"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentcolor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.71 7.04055C21.1 6.65055 21.1 6.00055 20.71 5.63055L18.37 3.29055C18 2.90055 17.35 2.90055 16.96 3.29055L15.12 5.12055L18.87 8.87055M3 17.2505V21.0005H6.75L17.81 9.93055L14.06 6.18055L3 17.2505Z"
                />
              </svg>
            </div> -->
          </div>
        </div>

        <div class="space-y-6">
          <div class="relative overflow-hidden bg-white rounded-3xl border border-gray-100 p-4 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] group">
            <!-- Header section -->
            <div class="flex items-center gap-5 mb-8 relative z-10">
              <div class="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#06C755] via-[#05B34B] to-[#05A344] flex items-center justify-center shadow-[0_12px_30px_rgba(6,199,85,0.3)] relative overflow-hidden">
                <!-- Glossy overlay -->
                <div class="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 opacity-0 pointer-events-none"></div>
                <!-- Inner Glow -->
                <div class="absolute inset-px rounded-[21px] border border-white/20 pointer-events-none"></div>
                
                <div class="w-11 h-11 flex items-center justify-center relative z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 256 256" class="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                    <!-- Chat Bubble (White) -->
                    <path d="M220.792 116.744c0-41.707-41.81-75.64-93.207-75.64-51.4 0-93.205 33.933-93.205 75.64 0 37.39 33.158 68.704 77.95 74.624 3.036.655 7.166 2.003 8.21 4.597.94 2.355.614 6.048.3 8.43l-1.33 7.98c-.407 2.355-1.875 9.216 8.073 5.024s53.68-31.607 73.233-54.116h-.004c13.508-14.812 19.98-29.845 19.98-46.537" fill="#fff"/>
                    <!-- "LINE" Text (Branded Green) -->
                    <g fill="#06C755">
                      <path d="M108.647 96.6h-6.54c-1.003 0-1.815.813-1.815 1.813v40.612c0 .998.813 1.8 1.815 1.8h6.54c1.003 0 1.815-.8 1.815-1.8V98.403c0-1-.813-1.813-1.815-1.813m45 .01H147.1c-1.005 0-1.815.813-1.815 1.813v24.128l-18.613-25.135c-.043-.064-.092-.126-.14-.183l-.01-.013-.143-.143-.098-.08c-.015-.013-.03-.026-.047-.036l-.094-.064c-.017-.013-.036-.02-.055-.032l-.096-.055-.058-.028-.105-.045-.058-.02a.83.83 0 0 0-.11-.036l-.064-.017-.102-.02c-.026-.006-.053-.01-.077-.01-.032-.006-.064-.01-.096-.013l-.094-.006c-.023 0-.043-.002-.064-.002h-6.537c-1.003 0-1.815.813-1.815 1.813v40.612c0 .998.813 1.8 1.815 1.8h6.537c1.005 0 1.818-.8 1.818-1.8v-24.122l18.633 25.167a1.81 1.81 0 0 0 .463.448c.004.004.01.01.017.015l.113.066.05.03a1.1 1.1 0 0 0 .087.041l.087.038.053.02.126.038c.006.002.017.004.026.006a1.75 1.75 0 0 0 .465.06h6.537c1.003 0 1.815-.8 1.815-1.8V98.402c0-1-.813-1.813-1.815-1.813"/>
                      <path d="M92.887 130.657H75.122V98.403c0-1.003-.813-1.815-1.813-1.815h-6.54c-1.003 0-1.815.813-1.815 1.815v40.6a1.8 1.8 0 0 0 .508 1.254.09.09 0 0 0 .024.028c.01.008.02.017.028.026a1.81 1.81 0 0 0 1.252.506h26.12c1.003 0 1.813-.815 1.813-1.815v-6.54c0-1.003-.8-1.815-1.813-1.815m96.864-23.897c1.003 0 1.813-.813 1.813-1.815v-6.54c0-1.003-.8-1.815-1.813-1.815h-26.12a1.8 1.8 0 0 0-1.259.512c-.006.006-.015.013-.02.02s-.02.02-.028.032c-.3.324-.503.764-.503 1.25v40.613c0 .486.194.928.508 1.254l.023.026.026.024c.326.314.768.508 1.254.508h26.12c1.003 0 1.813-.813 1.813-1.813v-6.54c0-1.003-.8-1.815-1.813-1.815H172v-6.865h17.762a1.81 1.81 0 0 0 1.813-1.815v-6.537c0-1.003-.8-1.818-1.813-1.818H172v-6.863h17.762z"/>
                    </g>
                  </svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-extrabold text-lg sm:text-xl text-gray-800 tracking-tight leading-none mb-2">LINE Notification</h3>
                <p class="text-xs sm:text-sm text-gray-500 font-medium break-words">Smart alerts for parcels & announcements</p>
              </div>
            </div>

            <!-- Main Connection Status -->
            <div class="relative z-10 bg-gray-50/50 rounded-2xl border border-gray-100/50 p-4 sm:p-6 backdrop-blur-sm">
              <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
                <!-- Status -->
                <div class="flex items-center gap-4">
                  <div class="relative">
                    <div :class="[
                      'w-4 h-4 rounded-full',
                      effectiveLineId ? 'bg-green-500' : 'bg-gray-300'
                    ]"></div>
                    <div v-if="effectiveLineId" class="absolute inset-0 w-4 h-4 rounded-full bg-green-500 animate-ping opacity-75"></div>
                  </div>
                  <div>
                    <span class="text-[9px] sm:text-[10px] tracking-widest font-black text-gray-400 block mb-0.5">Status</span>
                    <span :class="[
                      'text-lg sm:text-xl font-black transition-colors duration-300',
                      effectiveLineId ? 'text-green-600' : 'text-gray-500'
                    ]">
                      {{ effectiveLineId ? 'Linked' : 'Not Linked' }}
                    </span>
                  </div>
                </div>

                <!-- Action Buttons Area -->
                <div class="flex flex-col items-center gap-3">
                  <!-- Action Button: Connect or Status -->
                  <button
                    v-if="!effectiveLineId"
                    @click="handleLineAction"
                    class="w-full sm:w-auto flex flex-nowrap items-center justify-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 rounded-2xl bg-[#00b900] text-white font-black shadow-[0_10px_25px_rgba(0,185,0,0.25)] hover:bg-[#009900] hover:shadow-[0_15px_35px_rgba(0,185,0,0.35)] hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 group/btn cursor-pointer"
                  >
                    <span class="text-sm sm:text-base cursor-pointer whitespace-nowrap">Connect Now</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="sm:w-5 sm:h-5 text-white group-hover/btn:translate-x-1.5 transition-transform duration-300">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>

                  <!-- Status Display when connected -->
                  <div
                    v-else
                    class="w-full sm:w-auto flex flex-nowrap items-center justify-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 rounded-2xl bg-gray-100 text-gray-400 border border-gray-200 font-black cursor-default transition-all duration-300"
                  >
                    <span class="text-sm sm:text-base whitespace-nowrap">LINE Account Connected</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  
                  <div v-if="effectiveLineId" class="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-1">
                    <button 
                      @click="handleUnlink"
                      class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-gray-400 hover:text-red-500 hover:bg-red-50/50 transition-all duration-300 group/unlink cursor-pointer border border-transparent hover:border-red-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 group-hover/unlink:scale-110 transition-transform duration-300">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                        <line x1="12" y1="2" x2="12" y2="12"></line>
                      </svg>
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Background Decoration -->
            <div class="absolute -top-12 -right-12 w-40 h-40 bg-green-50/80 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-50/50 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          <!-- Helper Banner -->
          <div class="flex items-start gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-2xl border border-blue-100/50 relative overflow-hidden group/tip">
            <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm shadow-blue-200/50 shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div class="relative z-10">
              <h4 class="text-sm font-bold text-blue-900 mb-1">Instant Notifications</h4>
              <p class="text-[11px] text-blue-700/70 leading-relaxed font-medium">
                Receive automated updates for parcel arrivals and new announcements, right on your LINE app.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="activeTab === 'notify'"
        class="w-full md:w-2/3 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-blue-50/50 p-8"
      >
        <div class="flex items-center gap-4 mb-8">
          <div class="w-2 h-8 bg-gradient-to-b from-[#0E4B90] to-blue-400 rounded-full"></div>
          <h3 class="font-extrabold text-xl text-black tracking-tight">
            Notifications
          </h3>
        </div>
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
            class="flex items-start gap-4 bg-white border border-gray-50 rounded-2xl px-5 py-4 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all duration-300 group shadow-sm"
          >
            <!-- LEFT ICON -->
            <div class="mt-1">
              <span
                class="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white shadow-lg transition-transform group-hover:scale-110"
                :class="badgeClass(item.type)"
                v-html="badgeIcon(item.type)"
              />
            </div>

            <!-- CONTENT -->
            <div class="flex-1">
              <div class="flex items-center justify-between mb-0.5">
                <p class="text-sm font-bold text-gray-800">
                  {{ item.label }}
                </p>
                <span class="text-[10px] text-gray-400 font-medium">
                  {{ item.time }}
                </span>
              </div>

              <p class="text-sm text-gray-500 line-clamp-2">
                {{ item.title }}
              </p>

              <div class="flex items-center gap-2 mt-2">
                <div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                <p class="text-[11px] font-bold text-gray-400 tracking-tight">
                  {{ item.user }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="residentDetail" class="w-full mx-auto px-4 relative">
      <div class="flex flex-col md:flex-row gap-6">
        <!-- LEFT : Profile Card -->
        <div
          class="w-full md:w-1/3 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-blue-50/50 p-6 sm:p-8"
        >
          <!-- Avatar Section -->
          <div class="flex flex-col items-center text-center">
            <div
              class="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-[#1D355E] to-[#0E4B90] p-1 shadow-lg ring-4 ring-white relative group/avatar mx-auto"
            >
              <div class="w-full h-full rounded-full overflow-hidden relative from-[#1D355E] to-[#0E4B90]">
                <img
                  v-if="profileImageUrlPreview"
                  :src="profileImageUrlPreview"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                />
                <div
                  v-else-if="fullName"
                  class="w-full h-full flex items-center justify-center text-white text-4xl font-bold"
                >
                  {{ userInitial }}
                </div>
              </div>
            </div>
            <p class="text-sm font-extrabold text-[#0E4B90] pt-6 tracking-wider">
              {{ userRoleLabel }}
            </p>
            <p class="mt-4 text-black font-bold text-xl truncate max-w-[200px] mx-auto">
              {{ fullName }}
            </p>
          </div>

          <!-- Menu Navigation -->
          <div class="mt-8 space-y-2 border-t border-gray-100 pt-6">
            <button
              @click="activeTab = 'profile'"
              :class="menuClass('profile')"
              class="relative w-full cursor-pointer"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 22C4 20.9391 4.42143 19.9217 5.17157 19.1716C5.92172 18.4214 6.93913 18 8 18H16C17.0609 18 18.0783 18.4214 18.8284 19.1716C19.5786 19.9217 20 20.9391 20 22C20 22.5304 19.7893 23.0391 19.4142 23.4142C19.0391 23.7893 18.5304 24 18 24H6C5.46957 24 4.96086 23.7893 4.58579 23.4142C4.21071 23.0391 4 22.5304 4 22Z"
                  stroke-width="2.5"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8C10.3431 8 9 9.34315 9 11C9 12.6569 10.3431 14 12 14Z"
                  stroke-width="2.5"
                />
              </svg>
              <span>Personal Information</span>
            </button>

            <button
              @click="activeTab = 'status'"
              :class="menuClass('status')"
              class="relative w-full cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Resident Status</span>
            </button>
          </div>
        </div>

        <!-- RIGHT : Content Area -->
        <div class="w-full md:w-2/3">
          <!-- Tab 1: Personal Information -->
          <div v-if="activeTab === 'profile'" class="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-blue-50/50 p-6 sm:p-10 h-full">
            <div class="flex items-center gap-4 mb-8">
              <div class="w-2 h-8 bg-gradient-to-b from-[#0E4B90] to-blue-400 rounded-full"></div>
              <h3 class="font-extrabold text-xl text-black tracking-tight">
                Resident Details
              </h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7">
              <div>
                <label class="block text-sm font-bold text-gray-400 mb-2 ml-1 tracking-wider">First Name</label>
                <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-semibold text-gray-700 flex items-center h-[58px] overflow-hidden">
                  <p class="truncate">{{ firstName }}</p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-400 mb-2 ml-1 tracking-wider">Last Name</label>
                <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-semibold text-gray-700 flex items-center h-[58px] overflow-hidden">
                  <p class="truncate">{{ lastName }}</p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-400 mb-2 ml-1 tracking-wider">Email</label>
                <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-semibold text-gray-700 flex items-center h-[58px] overflow-hidden">
                  <p class="truncate">{{ email }}</p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-400 mb-2 ml-1 tracking-wider">Room Number</label>
                <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-semibold text-gray-700 flex items-center h-[58px] overflow-hidden">
                  <p class="truncate">{{ display(roomNumber) }}</p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-400 mb-2 ml-1 tracking-wider">Dormitory</label>
                <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-semibold text-gray-700 flex items-center h-[58px] overflow-hidden">
                  <p class="truncate">{{ dormName }}</p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-400 mb-2 ml-1 tracking-wider">Phone Number</label>
                <div class="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 font-semibold text-gray-700 flex items-center h-[58px] overflow-hidden">
                  <p class="truncate">{{ display(phoneNumber) }}</p>
                </div>
              </div>
            </div>

            <!-- Bottom Actions -->
            <div class="flex justify-between sm:justify-end gap-x-2 sm:gap-x-3 mt-6 sm:mt-12 pt-4 sm:pt-6 border-t border-gray-50">
              <ButtonWeb
                class="flex-1 sm:flex-none justify-center px-4 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl sm:rounded-2xl transition-all active:scale-95 flex items-center cursor-pointer"
                label="Back"
                color="gray"
                @click="$emit('cancel')"
              />
              <ButtonWeb
                class="flex-1 sm:flex-none justify-center px-4 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl sm:rounded-2xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1.5 sm:gap-2 cursor-pointer"
                label="Edit"
                color="blue"
                @click="$emit('edit')"
              />
            </div>
          </div>

          <!-- Tab 2: Resident Status -->
          <div v-if="activeTab === 'status'" class="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-blue-50/50 p-6 sm:p-10 h-full">
            <div class="flex items-center gap-4 mb-10">
              <div class="w-2 h-8 bg-gradient-to-b from-[#0E4B90] to-blue-400 rounded-full"></div>
              <h3 class="font-extrabold text-xl text-black tracking-tight font-black">
                Account Status
              </h3>
            </div>

            <div class="space-y-8">
              <div class="bg-gray-50 rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div class="flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10">
                  <div class="flex items-center gap-5">
                    <div :style="{ 
                      background: safeStatus?.toUpperCase() === 'ACTIVE' ? '#10B981' : 
                                 safeStatus?.toUpperCase() === 'PENDING' ? '#3B82F6' : '#9CA3AF' 
                    }" class="w-4 h-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] animate-pulse"></div>
                    <div>
                      <p class="text-xs sm:text-sm font-black text-gray-400 tracking-[0.2em] mb-1.5">Current Status</p>
                      <h4 class="text-3xl font-black text-slate-800 tracking-tight">{{ displayStatus(safeStatus) }}</h4>
                    </div>
                  </div>
                  
                  <!-- Verified Status Badge (For Active/Inactive) -->
                  <div v-if="safeStatus?.toUpperCase() === 'ACTIVE' || safeStatus?.toUpperCase() === 'INACTIVE'" class="flex items-center gap-3 px-8 py-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div>
                      <p class="text-[10px] font-black text-emerald-600/60 tracking-widest leading-none mb-1.5 uppercase">Account</p>
                      <p class="text-lg font-black text-emerald-900 leading-none">Verified</p>
                    </div>
                  </div>

                  <!-- Email Notification Reminder (For Pending) -->
                  <div v-else-if="safeStatus?.toUpperCase() === 'PENDING'" class="bg-white rounded-3xl p-5 sm:p-6 border border-blue-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-500 flex flex-col sm:flex-row items-center gap-5">
                    <div class="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                    </div>
                    <div class="flex-1 text-left">
                       <h5 class="text-base font-black text-gray-800 mb-0.5">Account Verification</h5>
                       <p class="text-xs text-gray-500 font-medium leading-relaxed">Resident hasn't verified account yet. Send verification email to resident to complete account setup.</p>
                    </div>
                    <button 
                      @click="handleSendEmailNotification"
                      class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                       <span>Send Email</span>
                    </button>
                  </div>
                </div>
                
                <!-- Background decoration -->
                <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
              </div>

              <div class="flex flex-col sm:flex-row items-start gap-4 p-5 sm:p-6 bg-blue-50/40 rounded-2xl border border-blue-100/30 text-left">
                <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <div class="space-y-1.5 pt-0.5">
                  <h5 class="text-base font-black text-blue-900">About Status Management</h5>
                  <p class="text-sm text-blue-700/70 leading-relaxed font-medium">Account status determines access privileges for the resident. <span class="font-bold text-blue-800">Pending</span> accounts require approval before they can access the full system features.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ✅ Popup แจ้งเตือนเชื่อมต่อสำเร็จและให้ Add OA -->
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="showLineSuccessPopup" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-md" @click="showLineSuccessPopup = false"></div>
      
      <!-- Modal Content -->
      <div class="relative bg-white rounded-[40px] p-8 sm:p-10 max-w-sm w-full text-center shadow-[0_30px_100px_rgba(0,0,0,0.25)] border border-white/20">
        <!-- Success Icon -->
        <div class="w-24 h-24 bg-gradient-to-br from-[#00d500] to-[#00b900] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-100 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h3 class="text-3xl font-[900] text-gray-900 mb-3 tracking-tight">LINE Connected!</h3>
        <p class="text-gray-500 font-bold leading-relaxed mb-10 px-4">Please click the button below to add <span class="text-[#00b900]">Tractify OA</span> as a friend to receive notifications.</p>
        
        <div class="space-y-4">
          <ButtonWeb 
            @click="addLineOA"
            label="Add Tractify OA"
            color="green"
            class="w-full py-5 font-black text-lg rounded-2xl shadow-[0_12px_24px_rgba(0,185,0,0.3)] hover:shadow-[0_15px_30px_rgba(0,185,0,0.4)]"
          >
            <template #icon>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path d="M200.533 256H55.467C24.834 256 0 231.166 0 200.533V55.467C0 24.834 24.834 0 55.467 0h145.067C231.166 0 256 24.834 256 55.467v145.067C256 231.166 231.166 256 200.533 256" fill="currentColor"/><path d="M220.792 116.744c0-41.707-41.81-75.64-93.207-75.64-51.4 0-93.205 33.933-93.205 75.64 0 37.39 33.158 68.704 77.95 74.624 3.036.655 7.166 2.003 8.21 4.597.94 2.355.614 6.048.3 8.43l-1.33 7.98c-.407 2.355-1.875 9.216 8.073 5.024s53.68-31.607 73.233-54.116h-.004c13.508-14.812 19.98-29.845 19.98-46.537" fill="#fff"/></svg>
            </template>
          </ButtonWeb>
          
          <ButtonWeb 
            @click="showLineSuccessPopup = false"
            label="Remind me later"
            color="gray"
            class="w-full py-4 text-gray-400 font-bold border-none shadow-none bg-transparent hover:bg-transparent hover:text-gray-600 transition-colors"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>
