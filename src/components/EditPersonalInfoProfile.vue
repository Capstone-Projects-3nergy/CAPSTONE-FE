<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'
import { useNotificationManager } from '@/stores/NotificationManager'
import ButtonWeb from './ButtonWeb.vue'
import { useProfileManager } from '@/stores/ProfileManager'
import {
  updateProfileWithFile,
  getProfile,
  addMemberWithFile,
  updateDetailWithFile,
  getItems
} from '@/utils/fetchUtils'
import { useUserManager } from '@/stores/MemberAndStaffManager'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const profileManager = useProfileManager()
const userManager = useUserManager()
const loginManager = useAuthManager()
const notificationManager = useNotificationManager()
const selectedResidentId = ref(null)

const router = useRouter()
const auth = useAuthManager()
const props = defineProps({
  userId: {
    type: Number,
    required: true
  },
  mode: {
    type: String,
    default: 'edit' // 'edit' | 'add'
  },
  title: { type: String, default: 'Edit Personal Information' },
  showEdit: { type: Boolean, default: true },
  showDomain: { type: Boolean, default: true },
  profileImage: { type: String, default: '' },
  fullName: { type: String, required: true },
  firstName: { type: String, default: '-' },
  lastName: { type: String, default: '-' },
  dormName: { type: String, default: '-' },
  email: { type: String, default: '-' },
  position: { type: String, default: '-' },
  roomNumber: { type: String, default: null },
  lineId: { type: String, default: null },
  phoneNumber: { type: String, default: null },
  editProfile: { type: Boolean, default: true },
  editResidentDetail: { type: Boolean, required: false }
})
const newAvatar = ref(null)
const emit = defineEmits([
  'edit',
  'save',
  'cancel',
  'error',
  'success',
  'first-name-error',
  'last-name-error',
  'phone-error',
  'position-error',
  'successAddProfile',
  'errorAddProfile',
  'first-name-required',
  'last-name-required',
  'email-required',
  'dorm-ID-required',
  'room-number-required',
  'email-duplicate',
  'email-form-error',
  'room-number-error'
])

const isEdit = ref(false)
const dormList = ref([])
// const forms = reactive({
//   dormId: null
// })

// form data
const form = ref({
  userId: null,
  firstName: '',
  lastName: '',
  email: '',
  roomNumber: '',
  dormId: null,
  lineId: '',
  position: '',
  phoneNumber: '',
  profileImage: null
})

const originalForm = ref({ ...form.value })
const resetFormForAdd = () => {
  newAvatar.value = null
  Object.assign(form.value, {
    userId: null,
    firstName: '',
    lastName: '',
    email: '',
    roomNumber: '',
    dormName: '',
    dormId: null,
    lineId: '',
    position: '',
    phoneNumber: '',
    profileImage: null
  })
  originalForm.value = { ...form.value }
}
watch(
  () => props.userId,
  (newId) => {
    if (!newId) return

    Object.assign(form.value, {
      userId: newId,
      firstName: props.firstName || '',
      lastName: props.lastName || '',
      email: props.email || '',
      roomNumber: props.roomNumber || '',
      dormName: props.dormName || '',
      lineId: props.lineId || '',
      phoneNumber: props.phoneNumber || ''
    })

    originalForm.value = { ...form.value }
  },
  { immediate: true }
)

onMounted(async () => {
  try {
    const baseURL = import.meta.env.VITE_BASE_URL
    const res = await axios.get(`${baseURL}/api/dorms/list`, {
      headers: { Accept: 'application/json' }
    })

    const rawData = res.data

    let parsedDorms = []

    if (typeof rawData === 'string') {
      const dormMatches =
        rawData.match(/"dormId":(\d+).*?"dormName":"(.*?)"/g) || []

      parsedDorms = dormMatches.map((str) => {
        const idMatch = str.match(/"dormId":(\d+)/)
        const nameMatch = str.match(/"dormName":"(.*?)"/)
        return {
          dormId: idMatch ? Number(idMatch[1]) : null,
          dormName: nameMatch ? nameMatch[1] : ''
        }
      })
    } else if (Array.isArray(rawData)) {
      parsedDorms = rawData
    }

    dormList.value = parsedDorms

    if (props.mode === 'add') {
      return
    }
    // -------------------------
    // 2. โหลด profile
    // -------------------------
    const profile = await getProfile(`${baseURL}/api/profile`, router)

    if (!profile) return

    profileManager.setCurrentProfile(profile)

    // -------------------------
    // 3. หา dormName จาก dormId
    // -------------------------
    // const dorm = dormList.value.find((d) => d.dormId === profile.dormId)
    const dormName = computed(() => {
      if (!loginManager.user?.dormId) return ''

      const dorm = dormList.value.find(
        (d) => d.dormId === loginManager.user.dormId
      )

      return dorm ? dorm.dormName : ''
    })
    if (props.mode === 'add') {
      return // ⛔ ห้ามโหลด profile ต่อ
    }
    // -------------------------
    // 4. set ค่าเริ่มต้นให้ form
    // -------------------------
    if (props.editResidentDetail) {
      Object.assign(form.value, {
        userId: props.userId,
        firstName: props.firstName,
        lastName: props.lastName,
        email: props.email,
        roomNumber: props.roomNumber,
        dormName: props.dormName,
        lineId: props.lineId,
        phoneNumber: props.phoneNumber
      })
      originalForm.value = { ...form.value }
      return
    }

    // ✅ แก้ profile login เท่านั้น
    if (props.editProfile) {
      const profile = await getProfile(
        `${import.meta.env.VITE_BASE_URL}/api/profile`,
        router
      )

      if (!profile) return

      profileManager.setCurrentProfile(profile)

      Object.assign(form.value, {
        userId: profile.userId,
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        roomNumber: profile.roomNumber || '',
        dormName: '',
        lineId: profile.lineId || '',
        position: profile.position || '',
        phoneNumber: profile.phoneNumber || ''
      })

      originalForm.value = { ...form.value }
    }

    // if (props.mode === 'edit') {
    //   form.value = {
    //     userId: profile.userId,
    //     firstName: profile.firstName || '',
    //     lastName: profile.lastName || '',
    //     email: profile.email || '',
    //     roomNumber: profile.roomNumber || '',
    //     dormName: dormName || '',
    //     lineId: profile.lineId || '',
    //     position: profile.position || '',
    //     phoneNumber: profile.phoneNumber || ''
    //   }
    // }
    // // ใช้สำหรับ compare ตอน edit
    // originalForm.value = { ...form.value }
  } catch (err) {
    console.error(err)
  }
})
watch(
  () => [props.mode, props.dormName, dormList.value],
  ([mode, dormName]) => {
    if (mode !== 'edit') return
    if (form.value.dormId) return // ⭐ สำคัญ
    if (!dormName || !dormList.value.length) return

    const dorm = dormList.value.find((d) => d.dormName === dormName)
    if (dorm) form.value.dormId = dorm.dormId
  },
  { immediate: true }
)

// load props → form
watch(
  () => props.mode,
  (mode) => {
    if (mode === 'add') {
      resetFormForAdd()
      // form.value.firstName = ''
      // form.value.lastName = ''
      // form.value.email = ''
      // form.value.roomNumber = ''
      // form.value.lineId = ''
      // form.value.position = ''
      // form.value.phoneNumber = ''
      // form.value.dormId = ''
      // form.value.dormName = props.dormName || ''
    }

    if (mode === 'edit') {
      form.value.firstName = props.firstName
      form.value.lastName = props.lastName
      form.value.fullName = props.fullName
      form.value.email = props.email
      form.value.position = props.position
      form.value.roomNumber = props.roomNumber
      form.value.lineId = props.lineId
      form.value.phoneNumber = props.phoneNumber
      // form.value.dormName = props.dormName
    }
  },
  { immediate: true }
)

// watch(
//   () => props.mode,
//   (mode) => {
//     if (mode === 'add') {
//       form.value = {
//         firstName: '',
//         lastName: '',
//         email: '',
//         roomNumber: '',
//         lineId: '',
//         position: '',
//         phoneNumber: '',
//         dormId: ''
//       }
//       // newAvatar.value = null
//     }
//   },
//   { immediate: true }
// )
// watch(
//   () => props.dormName,
//   (val) => {
//     form.value.dormName = val
//   },
//   { immediate: true }
// )

// watch(
//   () => props.mode,
//   (mode) => {
//     if (mode === 'edit') {
//       form.value.firstName = props.firstName
//       form.value.lastName = props.lastName
//       form.value.fullName = props.fullName
//       form.value.email = props.email
//       form.value.position = props.position
//       form.value.roomNumber = props.roomNumber
//       form.value.lineId = props.lineId
//       form.value.phoneNumber = props.phoneNumber
//       form.value.dormName = props.dormName
//     }
//   },
//   { immediate: true, deep: true }
// )

// function startEdit() {
//   isEdit.value = true
//   emit('edit')
// }

const profileImageUrlPreview = computed(() => {
  // ⭐ ADD MODE : ไม่ดึงรูปเก่าเด็ดขาด
  if (props.mode === 'add') {
    if (newAvatar.value) {
      return URL.createObjectURL(newAvatar.value)
    }
    return ''
  }
  // 1️⃣ รูปใหม่
  if (newAvatar.value) {
    return URL.createObjectURL(newAvatar.value)
  }

  // 2️⃣ แก้ resident → ใช้รูปจาก props
  if (props.editResidentDetail && props.profileImage) {
    return props.profileImage
  }

  // 3️⃣ แก้ profile login
  if (props.editProfile) {
    const url = profileManager.currentProfile?.profileImageUrl
    if (url && url.startsWith('http')) return url
  }

  return ''
})

// function onImageChange(e) {
//   const file = e.target.files[0]
//   if (file) newAvatar.value = file
// }
function onImageChange(e) {
  const file = e.target.files[0]
  if (file) {
    newAvatar.value = file
    e.target.value = null // ⭐ reset input
  }
}

// function save() {
//   const payload = {
//     firstName: form.value.firstName,
//     lastName: form.value.lastName,
//     email: form.value.email,
//     position: form.value.position,
//     roomNumber: form.value.roomNumber,
//     lineId: form.value.lineId,
//     phoneNumber: form.value.phoneNumber,
//     profileImage: newAvatar.value || null
//   }

//   emit('save', payload)
//   isEdit.value = false
// }

function cancel() {
  isEdit.value = false
  emit('cancel')
}

const authStore = useAuthManager()
const userName = computed(() => authStore.user?.fullName || 'Courier')
const getInitial = (name) => {
  if (!name) return ''
  return name.trim()[0].toUpperCase()
}
const userInitial = computed(() => {
  // 🟢 edit resident detail → ใช้ firstName ของ resident เสมอ
  if (props.editResidentDetail) {
    return form.value.firstName
      ? form.value.firstName.trim()[0].toUpperCase()
      : ''
  }

  // 🔵 profile login
  const currentFirst = form.value.firstName?.trim()
  const originalFirst = originalForm.value.firstName?.trim()

  // ⛔ ถ้า form ว่าง → ให้ initial ว่างตาม
  if (!currentFirst) {
    return ''
  }

  // ✏️ กำลังพิมพ์แก้ชื่อ → ใช้จาก form
  if (currentFirst !== originalFirst) {
    return currentFirst[0].toUpperCase()
  }

  // 📌 ยังไม่แก้ / revert / ยังไม่ save → ใช้ userName
  return userName.value ? userName.value.trim()[0].toUpperCase() : ''
})

// const userInitial = computed(() =>
//   userName.value ? userName.value[0].toUpperCase() : ''
// )

// function updateUser(data) {
//   console.log('ข้อมูลใหม่:', data)
//   // API update...
// }
const submit = async () => {
  if (props.mode === 'add') {
    await addResidents()
    return
  }

  if (props.editResidentDetail) {
    await saveEditDetail()
    return
  }

  if (props.editProfile) {
    await saveEditProfile()
    return
  }
}

// const submit = async () => {
//   if (props.mode === 'add') {
//     await addResidents()
//   } else {
//     await saveEditProfile()
//   }
// }
const addResidents = async () => {
  // -----------------------
  // REQUIRED FIELD CHECK
  // -----------------------
  if (!form.value.firstName?.trim()) {
    emit('first-name-required', true)
    return
  }

  if (!form.value.lastName?.trim()) {
    emit('last-name-required', true)
    return
  }

  if (!form.value.email?.trim()) {
    emit('email-required', true)
    return
  }

  if (!form.value.roomNumber?.trim()) {
    emit('room-number-required', true)
    return
  }
  if (form.value.dormId === null || form.value.dormId === '') {
    emit('dorm-ID-required', true)
    return
  }
  if (!/^[0-9]+$/.test(form.value.roomNumber)) {
    emit('room-number-error', true)
    return
  }
  // -----------------------
  // validate name (ไทย + อังกฤษ)
  // -----------------------
  const nameRegex = /^[A-Za-zก-๙\s]+$/

  if (!form.value.firstName || !nameRegex.test(form.value.firstName)) {
    emit('first-name-error', true)
    return
  }

  if (!form.value.lastName || !nameRegex.test(form.value.lastName)) {
    emit('last-name-error', true)
    return
  }

  // -----------------------
  // validate email
  // -----------------------
  if (!form.value.email || !form.value.email.endsWith('@gmail.com')) {
    emit('email-form-error')
    return
  }

  // if (!form.value.email || !/^\S+@\S+\.\S+$/.test(form.value.email)) {
  //   emit('errorAddProfile')
  //   return
  // }

  // -----------------------
  // validate phone (optional)
  // -----------------------
  if (form.value.phoneNumber) {
    // รูปแบบตัวเลข + -
    if (!/^[0-9-]+$/.test(form.value.phoneNumber)) {
      emit('phone-error', true)
      return
    }

    // เช็คจำนวนตัวเลข 9–10
    const digits = form.value.phoneNumber.replace(/-/g, '')
    if (digits.length < 9 || digits.length > 10) {
      emit('phone-error', true)
      return
    }
  }
  // -----------------------
  // CHECK DUPLICATE EMAIL
  // -----------------------
  const dataUser = await getItems(
    `${import.meta.env.VITE_BASE_URL}/api/staff/users`,
    router
  )

  if (dataUser) {
    const isDuplicate = dataUser.some(
      (u) => u.email?.toLowerCase() === form.value.email.toLowerCase()
    )

    if (isDuplicate) {
      emit('email-duplicate', true)
      return
    }
  }

  try {
    // -----------------------
    // payload
    // -----------------------
    const body = {
      userId: selectedResidentId.value,
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      email: form.value.email,
      roomNumber: form.value.roomNumber,
      lineId: form.value.lineId,
      phoneNumber: form.value.phoneNumber,
      dormId: form.value.dormId
    }

    if (newAvatar.value) {
      body.profileImage = newAvatar.value
    }

    // -----------------------
    // API call
    // -----------------------
    const savedMember = await addMemberWithFile(
      `${import.meta.env.VITE_BASE_URL}/api/staff/users`,
      body,
      router
    )

    if (!savedMember) {
      emit('errorAddProfile')
      return
    }
    if (savedMember.status === 400) {
      emit('email-duplicate', true)
      return
    }
    // ✅ เพิ่มเข้า Pinia store (เหมือน parcel)
    userManager.addMember(savedMember)

    // Trigger Welcome Notification
    notificationManager.notifyWelcome(form.value.firstName, 'RESIDENT')

    // -----------------------
    // success
    // -----------------------
    emit('successAddProfile')

    // reset form
    Object.assign(form.value, {
      firstName: '',
      lastName: '',
      email: '',
      roomNumber: '',
      dormId: null,
      lineId: '',
      phoneNumber: ''
    })

    newAvatar.value = null
    isEdit.value = false
  } catch (err) {
    console.error(err)
    emit('errorAddProfile')
  }
}

// const addResidents = async () => {
//   // -----------------------
//   // validate name (ไทย + อังกฤษ)
//   // -----------------------
//   const nameRegex = /^[A-Za-zก-๙\s]+$/

//   if (!form.value.firstName || !nameRegex.test(form.value.firstName)) {
//     emit('first-name-error', true)
//     return
//   }

//   if (!form.value.lastName || !nameRegex.test(form.value.lastName)) {
//     emit('last-name-error', true)
//     return
//   }

//   // -----------------------
//   // validate email
//   // -----------------------
//   if (!form.value.email || !/^\S+@\S+\.\S+$/.test(form.value.email)) {
//     emit('errorAddProfile')
//     return
//   }

//   // -----------------------
//   // validate phone (optional)
//   // -----------------------
//   if (form.value.phoneNumber && !/^[0-9]{9,10}$/.test(form.value.phoneNumber)) {
//     emit('phone-error', true)
//     return
//   }

//   try {
//     // -----------------------
//     // payload
//     // -----------------------
//     const body = {
//       firstName: form.value.firstName.trim(),
//       lastName: form.value.lastName.trim(),
//       email: form.value.email.trim(),
//       roomNumber: form.value.roomNumber || null,
//       lineId: form.value.lineId || null,
//       phoneNumber: form.value.phoneNumber || null
//     }

//     if (newAvatar.value) {
//       body.profileImage = newAvatar.value
//     }

//     // -----------------------
//     // API call
//     // -----------------------
//     const result = await addMemberWithFile(
//       `${import.meta.env.VITE_BASE_URL}/api/members`,
//       body,
//       router
//     )

//     if (!result) {
//       emit('errorAddProfile')
//       return
//     }

//     // -----------------------
//     // success
//     // -----------------------
//     emit('successAddProfile')

//     // reset form (เหมือน saveParcel)
//     form.value = {
//       firstName: '',
//       lastName: '',
//       email: '',
//       roomNumber: '',
//       lineId: '',
//       position: '',
//       phoneNumber: ''
//     }

//     newAvatar.value = null
//     isEdit.value = false
//   } catch (err) {
//     console.error(err)
//     emit('errorAddProfile')
//   }
// }

const saveEditProfile = async () => {
  const isStaff = loginManager.user?.role === 'STAFF'
  // const isResident = loginManager.user?.role === 'RESIDENT'
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
  // if (isResident &&!/^[0-9]+$/.test(form.value.roomNumber)) {
  //   emit('room-number-error', true)
  //   return
  // }
  if (form.value.phoneNumber) {
    // รูปแบบตัวเลข + -
    if (!/^[0-9-]+$/.test(form.value.phoneNumber)) {
      emit('phone-error', true)
      return
    }

    // เช็คจำนวนตัวเลข 9–10
    const digits = form.value.phoneNumber.replace(/-/g, '')
    if (digits.length < 9 || digits.length > 10) {
      emit('phone-error', true)
      return
    }
  }

  // -----------------------
  // validate position (staff only)
  // -----------------------
  if (isStaff && form.value.position) {
    if (!/^[A-Za-zก-๙\s]+$/.test(form.value.position)) {
      emit('position-error', true)
      return
    }
  }
  try {
    // -----------------------
    // payload
    // -----------------------
    const body = {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      roomNumber: form.value.roomNumber || null,
      lineId: form.value.lineId || null,
      phoneNumber: form.value.phoneNumber || null
    }

    if (isStaff) {
      body.position = form.value.position || null
    }

    if (newAvatar.value) {
      body.profileImage = newAvatar.value
    }

    // -----------------------
    // API call
    // -----------------------
    const updated = await updateProfileWithFile(
      `${import.meta.env.VITE_BASE_URL}/api/profile`,
      body,
      router
    )

    if (!updated) {
      emit('error', true)
      return
    }
    await getProfile()
    // profileManager.setCurrentProfile(profile)
    // 🔥 sync ทุก store
    profileManager.setCurrentProfile(updated)
    loginManager.updateUser(updated)
    // reset local state
    newAvatar.value = null
    originalForm.value = { ...form.value }

    emit('success', true)
    isEdit.value = false
  } catch (err) {
    console.error(err)
    emit('error', true)
  }
}
const saveEditDetail = async () => {
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
  // -----------------------
  // validate phone (optional)
  // -----------------------
  if (!/^[0-9]+$/.test(form.value.roomNumber)) {
    emit('room-number-error', true)
    return
  }

  if (form.value.phoneNumber) {
    if (!/^[0-9-]+$/.test(form.value.phoneNumber)) {
      emit('phone-error', true)
      return
    }
    const digits = form.value.phoneNumber.replace(/-/g, '')
    if (digits.length < 9 || digits.length > 10) {
      emit('phone-error', true)
      return
    }
  }

  // -----------------------
  // validate position (staff only)
  // -----------------------
  // if (isStaff && form.value.position) {
  //   if (!/^[A-Za-zก-๙\s]+$/.test(form.value.position)) {
  //     emit('position-error', true)
  //     return
  //   }
  // }

  try {
    // -----------------------
    // payload
    // -----------------------
    const body = {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      roomNumber: form.value.roomNumber || null,
      lineId: form.value.lineId || null,
      phoneNumber: form.value.phoneNumber || null,
      dormId: form.value.dormId || null
    }

    if (isStaff) {
      body.position = form.value.position || null
    }

    if (newAvatar.value) {
      body.profileImage = newAvatar.value
    }

    // -----------------------
    // API call
    // -----------------------
    const updated = await updateDetailWithFile(
      `${import.meta.env.VITE_BASE_URL}/api/staff/users`,
      form.value.userId,
      body,
      router
    )

    if (!updated) {
      emit('error', true)
      return
    }

    // ⭐ sync userManager
    if (isStaff) {
      userManager.updateStaff({
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phoneNumber: updated.phoneNumber,
        lineId: updated.lineId,
        position: updated.position,
        profileImageUrl: updated.profileImageUrl
      })
    } else {
      userManager.updateMember({
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        roomNumber: updated.roomNumber,
        dormId: updated.dormId,
        dormName: updated.dormName,
        phoneNumber: updated.phoneNumber,
        lineId: updated.lineId,
        profileImageUrl: updated.profileImageUrl
      })
    }

    originalForm.value = { ...form.value }

    emit('success', true)
    isEdit.value = false
  } catch (err) {
    console.error(err)
    emit('error', true)
  }
}

const displayFullName = computed(() => {
  const first = form.value.firstName?.trim()
  const last = form.value.lastName?.trim()

  if (!first && !last) return '-'
  return `${first || ''} ${last || ''}`.trim()
})

const isUnchanged = computed(
  () => JSON.stringify(form.value) === JSON.stringify(originalForm.value)
)
const isFormUnchanged = computed(() => {
  return JSON.stringify(form.value) === JSON.stringify(originalForm.value)
})

const isAvatarChanged = computed(() => {
  return !!newAvatar.value
})

// const isSaveDisabled = computed(() => {
//   return isFormUnchanged.value && !isAvatarChanged.value
// })
const isAddFormValid = computed(() => {
  if (!form.value.firstName?.trim()) return false
  if (!form.value.lastName?.trim()) return false
  if (!form.value.email?.trim()) return false
  if (!form.value.roomNumber?.trim()) return false

  // dormId บังคับเฉพาะ STAFF ตอน add
  if (
    props.mode === 'add' &&
    loginManager.user.role === 'STAFF' &&
    (form.value.dormId === null || form.value.dormId === '')
  ) {
    return false
  }

  return true
})

const isSaveDisabled = computed(() => {
  // -------------------------
  // ADD MODE
  // -------------------------
  if (props.mode === 'add') {
    return !isAddFormValid.value
  }

  // -------------------------
  // EDIT MODE
  // -------------------------
  return isFormUnchanged.value && !isAvatarChanged.value
})
</script>

<template>
  <div class="w-full mx-auto px-4">
    <div v-if="editProfile" class="flex flex-col md:flex-row gap-2">
      <!-- LEFT : Profile Image Card -->
      <div
        class="w-full md:w-1/3 bg-white rounded-[5px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center text-center"
      >
        <div class="relative inline-block">
          <!-- Avatar -->
          <div class="w-32 h-32 rounded-full overflow-hidden border shadow-sm">
            <!-- มีรูป (add หรือ edit ก็แสดง) -->
            <img
              v-if="profileImageUrlPreview"
              :src="profileImageUrlPreview"
              alt="Profile"
              class="w-full h-full object-cover"
            />

            <!-- ADD MODE + ยังไม่เลือกรูป -->
            <div
              v-else-if="props.mode === 'add'"
              class="w-full h-full flex items-center justify-center font-semibold bg-[#185DC0] text-white text-xl"
            ></div>

            <!-- EDIT MODE + ไม่มีรูป -->
            <div
              v-else
              class="w-full h-full flex items-center justify-center font-semibold bg-[#185DC0] text-white text-4xl"
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          <div class="flex flex-col">
            <label class="block text-sm text-black font-semibold mb-1">
              Firstname
              <span v-if="mode === 'add'" class="text-red-500">*</span>
            </label>
            <input
              v-model="form.firstName"
              class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            />
          </div>

          <div class="flex flex-col">
            <label class="block text-sm text-black font-semibold mb-1">
              Lastname <span v-if="mode === 'add'" class="text-red-500">*</span>
            </label>
            <input
              v-model="form.lastName"
              class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            />
          </div>

          <div class="flex flex-col">
            <label class="block text-sm text-black font-semibold mb-1">
              Email <span v-if="mode === 'add'" class="text-red-500">*</span>
            </label>
            <input
              :disabled="mode === 'edit'"
              v-model="form.email"
              :class="[
                'w-full border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]',
                mode === 'edit' ? 'bg-gray-100' : 'bg-white'
              ]"
            />
          </div>

          <div
            class="flex flex-col"
            v-if="roomNumber !== null || mode == 'add'"
          >
            <label class="block text-sm text-black font-semibold mb-1">
              Room Number
              <span v-if="mode === 'add'" class="text-red-500">*</span>
            </label>
            <input
              :disabled="mode === 'edit'"
              v-model="form.roomNumber"
              :class="[
                'w-full border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]',
                mode === 'edit' ? 'bg-gray-100' : 'bg-white'
              ]"
            />
          </div>
          <div
            class="flex flex-col"
            v-if="
              form.dormId !== null &&
              mode !== 'add' &&
              loginManager.user.role === 'RESIDENT'
            "
          >
            <label class="block text-sm text-black font-semibold mb-1">
              Dormitory
            </label>
            <input
              :disabled="mode === 'edit'"
              :value="dormName"
              :class="[
                'w-full border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]',
                mode === 'edit' ? 'bg-gray-100' : 'bg-white'
              ]"
            />
          </div>
          <div
            class="flex flex-col"
            v-if="mode == 'add' && loginManager.user.role === 'STAFF'"
          >
            <label class="block text-sm text-black font-semibold mb-1">
              Dormitory
              <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.dormId"
              class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            >
              <option disabled :value="null">Select Dormitory</option>
              <option
                v-for="dorm in dormList"
                :key="dorm.dormId"
                :value="dorm.dormId"
              >
                {{ dorm.dormName }}
              </option>
            </select>
          </div>
          <div
            class="flex flex-col"
            v-if="loginManager.user.role === 'STAFF' && mode !== 'add'"
          >
            <label class="block text-sm text-black font-semibold mb-1">
              Position
            </label>
            <input
              v-model="form.position"
              class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            />
          </div>

          <div class="flex flex-col">
            <label class="block text-sm text-black font-semibold mb-1">
              Line ID
            </label>
            <input
              v-model="form.lineId"
              class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            />
          </div>

          <div class="flex flex-col">
            <label class="block text-sm text-black font-semibold mb-1">
              Phone Number
            </label>
            <input
              v-model="form.phoneNumber"
              class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
            />
          </div>

          <!-- Actions -->
          <div class="md:col-span-2 flex gap-3 mt-6 flex-row md:justify-end">
            <ButtonWeb
              class="flex-1 md:flex-none text-sm py-2 md:text-base md:py-2.5"
              :label="mode === 'add' ? 'Add Resident' : 'Save Changes'"
              color="blue"
              @click="submit"
              :disabled="isSaveDisabled"
            />
            <ButtonWeb
              class="text-[#898989] flex-1 md:flex-none text-sm py-2 md:text-base md:py-2.5"
              label="Cancel Changes"
              color="gray"
              @click="cancel"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="editResidentDetail" class="max-w-5xl mx-auto">
      <!-- 🔹 CARD เดียว -->
      <div
        class="bg-white rounded-[5px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8"
      >
        <div class="mb-6 text-center md:hidden">
          <h2 class="text-xl font-semibold text-gray-800">
            {{ displayFullName }}
          </h2>
        </div>
        <!-- 🔹 WRAPPER -->
        <div class="flex flex-col md:flex-row gap-10">
          <!-- ================= LEFT : Profile Image ================= -->
          <div
            class="md:w-1/3 flex flex-col items-center text-center pt-2 sm:pt-6 md:pt-8 lg:pt-10"
          >
            <div class="relative inline-block">
              <!-- Avatar -->

              <div
                class="w-32 h-32 rounded-full overflow-hidden border shadow-sm"
              >
                <img
                  v-if="profileImageUrlPreview"
                  :src="profileImageUrlPreview"
                  alt="Profile"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center font-semibold"
                  :class="{
                    'bg-[#185DC0] text-white text-4xl': props.mode !== 'add',
                    'bg-white text-black text-xl': props.mode === 'add'
                  }"
                >
                  {{ userInitial }}
                </div>
              </div>

              <!-- ✏️ Edit icon -->
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
            <h2
              class="hidden md:block text-xl sm:text-2xl font-semibold text-gray-800 pt-5"
            >
              {{ displayFullName }}
            </h2>
          </div>

          <!-- ================= RIGHT : Edit Information ================= -->
          <div class="md:w-2/3">
            <!-- Header -->
            <div class="md:block mb-8">
              <h2 class="text-xl sm:text-2xl font-semibold text-gray-800">
                User Information
              </h2>
            </div>

            <!-- Form Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div class="flex flex-col">
                <label class="block text-sm text-black font-semibold mb-1">
                  Firstname
                  <span v-if="mode === 'add'" class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.firstName"
                  class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
                />
              </div>

              <div class="flex flex-col">
                <label class="block text-sm text-black font-semibold mb-1">
                  Lastname
                  <span v-if="mode === 'add'" class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.lastName"
                  class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
                />
              </div>

              <div class="flex flex-col">
                <label class="block text-sm text-black font-semibold mb-1">
                  Email
                  <span v-if="mode === 'add'" class="text-red-500">*</span>
                </label>
                <input
                  :disabled="mode === 'edit'"
                  v-model="form.email"
                  :class="[
                    'w-full border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]',
                    mode === 'edit' ? 'bg-gray-100' : 'bg-white'
                  ]"
                />
              </div>

              <div class="flex flex-col">
                <label class="block text-sm text-black font-semibold mb-1">
                  Room Number
                </label>
                <input
                  v-model="form.roomNumber"
                  :class="[
                    'w-full border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0] bg-white'
                  ]"
                />
              </div>
              <div class="flex flex-col">
                <!-- <label class="block text-sm text-black font-semibold mb-1">
                  Dormitory
                </label>
                <input
                  :disabled="mode === 'edit'"
                  :value="dormName"
                  :class="[
                    'w-full border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]',
                    mode === 'edit' ? 'bg-gray-100' : 'bg-white'
                  ]"
                /> -->
                <label class="block text-sm text-black font-semibold mb-1">
                  Dormitory
                </label>
                <select
                  v-model="form.dormId"
                  class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
                >
                  <option disabled value="">Select Dormitory</option>
                  <option
                    v-for="dorm in dormList"
                    :key="dorm.dormId"
                    :value="dorm.dormId"
                  >
                    {{ dorm.dormName }}
                  </option>
                </select>
              </div>
              <div class="flex flex-col">
                <label class="block text-sm text-black font-semibold mb-1">
                  Line ID
                </label>
                <input
                  v-model="form.lineId"
                  class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
                />
              </div>

              <div class="flex flex-col">
                <label class="block text-sm text-black font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  v-model="form.phoneNumber"
                  class="w-full bg-white border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#185DC0]"
                />
              </div>

              <!-- Actions -->
              <div class="md:col-span-2 flex gap-3 mt-6 justify-end">
                <ButtonWeb
                  class="text-sm py-2 md:text-base md:py-2.5"
                  :label="mode === 'add' ? 'Add Resident' : 'Save Changes'"
                  color="blue"
                  @click="submit"
                />
                <ButtonWeb
                  class="text-[#898989] text-sm py-2 md:text-base md:py-2.5"
                  label="Cancel Changes"
                  color="gray"
                  @click="cancel"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
