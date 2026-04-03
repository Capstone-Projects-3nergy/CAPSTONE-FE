<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'
import { useNotificationManager } from '@/stores/NotificationManager'
import ButtonWeb from './ButtonWeb.vue'
import SelectWeb from './SelectWeb.vue'
import LoadingPopUp from './LoadingPopUp.vue'
import ImageCropperModal from './ImageCropperModal.vue'
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

const MAX_NAME_LENGTH = 100
const MAX_STAFFPOSITION_LENGTH = 50
const MAX_ROOMNUMBER_LENGTH = 20
const MAX_EMAIL_LENGTH = 100
const MAX_PHONE_LENGTH = 15
const MAX_LINE_ID_LENGTH = 20

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
  editResidentDetail: { type: Boolean, required: false },
  useCurrentProfile: { type: Boolean, default: true },
  status: { type: String, default: '' },
  showLineId: { type: Boolean, default: true }
})
const newAvatar = ref(null)
const loading = ref(false)
const showCropper = ref(false)
const tempImageSrc = ref('')

const showEmailLengthError = ref(false)
const showRoomLengthError = ref(false)
const showPhoneLengthError = ref(false)
const showLineIdLengthError = ref(false)
const showPositionLengthError = ref(false)
const showPositionMinLengthError = ref(false)
const showNameLengthError = ref(false)
const showNameMinLengthError = ref(false)

const showFirstNameWhitespaceError = ref(false)
const showLastNameWhitespaceError = ref(false)
const showEmailWhitespaceError = ref(false)
const showRoomWhitespaceError = ref(false)
const showLineIdWhitespaceError = ref(false)
const showPositionWhitespaceError = ref(false)
const showPhoneWhitespaceError = ref(false)

const showFirstNameError = ref(false)
const showLastNameError = ref(false)
const showEmailError = ref(false)
const showRoomNumberError = ref(false)
const showDormIdError = ref(false)
const showPositionError = ref(false)
const showPhoneError = ref(false)
const showLineIdError = ref(false)

const hasWhitespace = (s) => s && (s !== s.trim());

const handleEmailInput = (event) => {
  const val = event.target.value
  if (val.length > MAX_EMAIL_LENGTH) {
    const sliced = val.slice(0, MAX_EMAIL_LENGTH)
    form.value.email = sliced
    event.target.value = sliced
    showEmailLengthError.value = true
    setTimeout(() => {
      showEmailLengthError.value = false
    }, 10000)
  } else {
    form.value.email = val
    showEmailError.value = false
    showEmailLengthError.value = false
    showEmailWhitespaceError.value = false
  }
}

const handleRoomInput = (event) => {
  const val = event.target.value
  if (val.length > MAX_ROOMNUMBER_LENGTH) {
    const sliced = val.slice(0, MAX_ROOMNUMBER_LENGTH)
    form.value.roomNumber = sliced
    event.target.value = sliced
    showRoomLengthError.value = true
    setTimeout(() => {
      showRoomLengthError.value = false
    }, 10000)
  } else {
    form.value.roomNumber = val
    showRoomNumberError.value = false
    showRoomLengthError.value = false
    showRoomWhitespaceError.value = false
  }
}

const handlePhoneInput = (event) => {
  let val = event.target.value
  const digits = val.replace(/-/g, '')
  if (digits.length > MAX_PHONE_LENGTH) {
    while (val.replace(/-/g, '').length > MAX_PHONE_LENGTH && val.length > 0) {
      val = val.slice(0, -1)
    }
    form.value.phoneNumber = val
    event.target.value = val
    showPhoneLengthError.value = true
    setTimeout(() => {
      showPhoneLengthError.value = false
    }, 10000)
  } else {
    form.value.phoneNumber = val
    showPhoneError.value = false
    showPhoneLengthError.value = false
    showPhoneWhitespaceError.value = false
  }
}

const handleLineIdInput = (event) => {
  const val = event.target.value
  if (val.length > MAX_LINE_ID_LENGTH) {
    const sliced = val.slice(0, MAX_LINE_ID_LENGTH)
    form.value.lineId = sliced
    event.target.value = sliced
    showLineIdLengthError.value = true
    setTimeout(() => {
      showLineIdLengthError.value = false
    }, 10000)
  } else {
    form.value.lineId = val
    showLineIdError.value = false
    showLineIdLengthError.value = false
    showLineIdWhitespaceError.value = false
  }
}

const handlePositionInput = (event) => {
  const val = event.target.value
  if (val.length > MAX_STAFFPOSITION_LENGTH) {
    const sliced = val.slice(0, MAX_STAFFPOSITION_LENGTH)
    form.value.position = sliced
    event.target.value = sliced
    showPositionLengthError.value = true
    setTimeout(() => {
      showPositionLengthError.value = false
    }, 10000)
  } else {
    form.value.position = val
    showPositionError.value = false
    showPositionLengthError.value = false
    showPositionMinLengthError.value = false
    showPositionWhitespaceError.value = false
  }
}

const handleFirstNameInput = (event) => {
  const val = event.target.value
  const lastNameLen = form.value.lastName ? form.value.lastName.length : 0
  if (val.length + lastNameLen > MAX_NAME_LENGTH) {
    const allowed = MAX_NAME_LENGTH - lastNameLen
    const sliced = val.slice(0, Math.max(0, allowed))
    form.value.firstName = sliced
    event.target.value = sliced
    showNameLengthError.value = true
    setTimeout(() => {
      showNameLengthError.value = false
    }, 10000)
  } else {
    form.value.firstName = val
    showFirstNameError.value = false
    showNameLengthError.value = false
    showNameMinLengthError.value = false
    showFirstNameWhitespaceError.value = false
  }
}

const handleLastNameInput = (event) => {
  const val = event.target.value
  const firstNameLen = form.value.firstName ? form.value.firstName.length : 0
  if (val.length + firstNameLen > MAX_NAME_LENGTH) {
    const allowed = MAX_NAME_LENGTH - firstNameLen
    const sliced = val.slice(0, Math.max(0, allowed))
    form.value.lastName = sliced
    event.target.value = sliced
    showNameLengthError.value = true
    setTimeout(() => {
      showNameLengthError.value = false
    }, 10000)
  } else {
    form.value.lastName = val
    showLastNameError.value = false
    showNameLengthError.value = false
    showNameMinLengthError.value = false
    showLastNameWhitespaceError.value = false
  }
}

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
  'position-required',
  'successAddProfile',
  'errorAddProfile',
  'first-name-required',
  'last-name-required',
  'email-required',
  'dorm-id-required',
  'room-number-required',
  'email-duplicate',
  'email-form-error',
  'room-number-error',
  'line-id-error',
  'email-invalid-chars',
  'file-size-error',
  'file-type-error',
  'whitespace-error',
  'email-firebase'
])

const isEdit = ref(false)
const dormList = ref([])
const dormOptions = computed(() => {
  return dormList.value.map((dorm) => ({
    label: dorm.dormName,
    value: dorm.dormId
  }))
})
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
  } catch (err) {
    console.error(err)
  }
})

// ✅ Sync form with store when profile is updated (e.g. after LINE linking)
watch(
  () => profileManager.currentProfile,
  (newProfile) => {
    if (newProfile && props.editProfile) {
      if (newProfile.lineId) form.value.lineId = newProfile.lineId
    }
  },
  { deep: true, immediate: true }
)

// ✅ เพิ่ม watch ที่ loginManager ด้วยเพื่อความชัวร์
watch(
  () => loginManager.user?.lineId,
  (newLineId) => {
    if (newLineId && props.editProfile) {
      form.value.lineId = newLineId
    }
  },
  { immediate: true }
)
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


const isFormEmpty = computed(() => {
  const hasText =
    form.value.firstName ||
    form.value.lastName ||
    form.value.email ||
    form.value.roomNumber ||
    form.value.lineId ||
    form.value.position ||
    form.value.phoneNumber ||
    form.value.dormId

  const hasImage = !!newAvatar.value

  return !hasText && !hasImage
})

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


function onImageChange(e) {
  const file = e.target.files[0]
  if (file) {
    if (file.size > 1 * 1024 * 1024) {
      emit('file-size-error', true)
      e.target.value = null
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      emit('file-type-error', true)
      e.target.value = null
      return
    }

    // Open Cropper
    tempImageSrc.value = URL.createObjectURL(file)
    showCropper.value = true
    e.target.value = null // Reset input to allow re-selecting same file
  }
}

function onCrop(blob) {
  // Convert blob to File
  const file = new File([blob], "avatar.jpg", { type: "image/jpeg" })
  newAvatar.value = file
  showCropper.value = false
  // URL.revokeObjectURL(tempImageSrc.value) // Clean up
  tempImageSrc.value = ''
}

function closeCropper() {
  showCropper.value = false
  tempImageSrc.value = ''
}

function removeImage() {
  newAvatar.value = null
  // Reset input if exists
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = null
}



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

  if (!currentFirst) {
    return ''
  }

  if (currentFirst !== originalFirst) {
    return currentFirst[0].toUpperCase()
  }

  return userName.value ? userName.value.trim()[0].toUpperCase() : ''
})

const submit = async () => {
  // Reset previous errors
  showFirstNameError.value = false
  showLastNameError.value = false
  showEmailError.value = false
  showRoomNumberError.value = false
  showDormIdError.value = false
  showPositionError.value = false
  showPhoneError.value = false
  showLineIdError.value = false

  // Check for leading/trailing whitespace
  showFirstNameWhitespaceError.value = hasWhitespace(form.value.firstName)
  showLastNameWhitespaceError.value = hasWhitespace(form.value.lastName)
  showEmailWhitespaceError.value = hasWhitespace(form.value.email)
  showRoomWhitespaceError.value = hasWhitespace(form.value.roomNumber)
  showLineIdWhitespaceError.value = hasWhitespace(form.value.lineId)
  showPositionWhitespaceError.value = hasWhitespace(form.value.position)
  showPhoneWhitespaceError.value = hasWhitespace(form.value.phoneNumber)

  if (
    showFirstNameWhitespaceError.value ||
    showLastNameWhitespaceError.value ||
    showEmailWhitespaceError.value ||
    showRoomWhitespaceError.value ||
    showLineIdWhitespaceError.value ||
    showPositionWhitespaceError.value ||
    showPhoneWhitespaceError.value
  ) {
    setTimeout(() => {
      showFirstNameWhitespaceError.value = false
      showLastNameWhitespaceError.value = false
      showEmailWhitespaceError.value = false
      showRoomWhitespaceError.value = false
      showLineIdWhitespaceError.value = false
      showPositionWhitespaceError.value = false
      showPhoneWhitespaceError.value = false
    }, 10000)
    return
  }

  if (form.value.email && form.value.email.length > MAX_EMAIL_LENGTH) {
    showEmailLengthError.value = true
    setTimeout(() => {
      showEmailLengthError.value = false
    }, 10000)
    return
  }
  if (form.value.roomNumber && form.value.roomNumber.length > MAX_ROOMNUMBER_LENGTH) {
    showRoomLengthError.value = true
    setTimeout(() => {
      showRoomLengthError.value = false
    }, 10000)
    return
  }
  if (form.value.phoneNumber) {
    const digits = form.value.phoneNumber.replace(/-/g, '')
    if (digits.length > MAX_PHONE_LENGTH) {
      showPhoneLengthError.value = true
      setTimeout(() => {
        showPhoneLengthError.value = false
      }, 10000)
      return
    }
  }
  if (form.value.lineId && form.value.lineId.length > MAX_LINE_ID_LENGTH) {
    showLineIdLengthError.value = true
    setTimeout(() => {
      showLineIdLengthError.value = false
    }, 10000)
    return
  }
  const fName = form.value.firstName || ''
  const lName = form.value.lastName || ''
  if (fName.length + lName.length > MAX_NAME_LENGTH) {
    showNameLengthError.value = true
    setTimeout(() => {
      showNameLengthError.value = false
    }, 10000)
    return
  }
  if ((fName.length + lName.length) > 0 && (fName.length + lName.length) < 6) {
    showNameMinLengthError.value = true
    setTimeout(() => {
      showNameMinLengthError.value = false
    }, 10000)
    return
  }

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

const addResidents = async () => {
  // -----------------------
  // REQUIRED FIELD CHECK
  // -----------------------
  if (!form.value.firstName?.trim()) {
    showFirstNameError.value = true
    emit('first-name-required', true)
    return
  }

  if (!form.value.lastName?.trim()) {
    showLastNameError.value = true
    emit('last-name-required', true)
    return
  }

  if (!form.value.email?.trim()) {
    showEmailError.value = true
    emit('email-required', true)
    return
  }

  if (!form.value.roomNumber?.trim()) {
    showRoomNumberError.value = true
    emit('room-number-required', true)
    return
  }
  if (form.value.dormId === null || form.value.dormId === '') {
    showDormIdError.value = true
    emit('dorm-id-required', true)
    return
  }
  if (!/^[0-9]+$/.test(form.value.roomNumber)) {
    showRoomNumberError.value = true
    emit('room-number-error', true)
    return
  }
  if (form.value.lineId && !/^[a-zA-Z0-9._]+$/.test(form.value.lineId)) {
    showLineIdError.value = true
    emit('line-id-error', true)
    return
  }
  // -----------------------
  // validate name (ไทย + อังกฤษ)
  // -----------------------
  const nameRegex = /^[A-Za-zก-๙\s]+$/

  if (!form.value.firstName || !nameRegex.test(form.value.firstName)) {
    showFirstNameError.value = true
    emit('first-name-error', true)
    return
  }

  if (!form.value.lastName || !nameRegex.test(form.value.lastName)) {
    showLastNameError.value = true
    emit('last-name-error', true)
    return
  }
  const fName = form.value.firstName || ''
  const lName = form.value.lastName || ''
  if ((fName.length + lName.length) > 0 && (fName.length + lName.length) < 6) {
    showNameMinLengthError.value = true
    setTimeout(() => {
      showNameMinLengthError.value = false
    }, 10000)
    return
  }

  // -----------------------
  // validate email
  // -----------------------
  if (/[^a-zA-Z0-9.@]/.test(form.email)) {
    showEmailError.value = true
    emit('email-invalid-chars', true)
    return
  }
  if (!form.value.email || !form.value.email.endsWith('@gmail.com')) {
    showEmailError.value = true
    emit('email-form-error')
    return
  }


  if (form.value.phoneNumber) {
    // รูปแบบตัวเลข + -
    if (!/^[0-9-]+$/.test(form.value.phoneNumber)) {
      showPhoneError.value = true
      emit('phone-error', true)
      return
    }
    
    // เช็คจำนวนตัวเลข 9–10
    const digits = form.value.phoneNumber.replace(/-/g, '')
    if (digits.length < 9 || digits.length > 10) {
      showPhoneError.value = true
      emit('phone-error', true)
      return
    }
  }
  // -----------------------
  // CHECK DUPLICATE EMAIL
  // -----------------------
  loading.value = true
  const dataUser = await getItems(
    `${import.meta.env.VITE_BASE_URL}/api/staff/users`,
    router
  )

  // 🔹 เช็คจาก Firebase ไว้ก่อน
  const isFirebaseDuplicate = await loginManager.checkEmailInFirebase(form.value.email)

  if (dataUser) {
    const isDuplicate = dataUser.some(
      (u) => u.email?.toLowerCase() === form.value.email.toLowerCase()
    )

    if (isDuplicate) {
      loading.value = false
      showEmailError.value = true
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
      loading.value = false
      if (isFirebaseDuplicate) {
        emit('email-firebase')
      } else {
        emit('errorAddProfile')
      }
      return
    }
    if (savedMember.status === 400) {
      loading.value = false
      emit('email-duplicate', true)
      return
    }
    // ✅ เพิ่มเข้า Pinia store (เหมือน parcel)
    userManager.addMember(savedMember)



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

    loading.value = false
    newAvatar.value = null
    isEdit.value = false
  } catch (err) {
    console.error(err)
    loading.value = false
    emit('errorAddProfile')
  }
}

const saveEditProfile = async () => {
  const isStaff = loginManager.user?.role === 'STAFF'

  const nameRegex = /^[A-Za-zก-๙\s]+$/

  if (!form.value.firstName?.trim()) {
    showFirstNameError.value = true
    emit('first-name-required', true)
    return
  }
  if (!nameRegex.test(form.value.firstName)) {
    showFirstNameError.value = true
    emit('first-name-error', true)
    return
  }
  if (!form.value.lastName?.trim()) {
    showLastNameError.value = true
    emit('last-name-required', true)
    return
  }
  if (!nameRegex.test(form.value.lastName)) {
    showLastNameError.value = true
    emit('last-name-error', true)
    return
  }
  const fName = form.value.firstName || ''
  const lName = form.value.lastName || ''
  if ((fName.length + lName.length) > 0 && (fName.length + lName.length) < 6) {
    showNameMinLengthError.value = true
    setTimeout(() => {
      showNameMinLengthError.value = false
    }, 10000)
    return
  }

  if (form.value.lineId && !/^[a-zA-Z0-9._]+$/.test(form.value.lineId)) {
    emit('line-id-error', true)
    return
  }

  if (!isStaff && !form.value.roomNumber?.trim()) {
    showRoomNumberError.value = true
    emit('room-number-required', true)
    return
  }

  if (form.value.phoneNumber) {
    // รูปแบบตัวเลข + -
    if (!/^[0-9-]+$/.test(form.value.phoneNumber)) {
      showPhoneError.value = true
      emit('phone-error', true)
      return
    }
    // เช็คจำนวนตัวเลข 9–10
    const digits = form.value.phoneNumber.replace(/-/g, '')
    if (digits.length < 9 || digits.length > 10) {
      showPhoneError.value = true
      emit('phone-error', true)
      return
    }
  }

  // -----------------------
  // validate position (staff only)
  // -----------------------
  if (isStaff) {
    if (!form.value.position?.trim()) {
      showPositionError.value = true
      emit('position-required', true)
      return
    }
    if (form.value.position && form.value.position.length > MAX_STAFFPOSITION_LENGTH) {
      showPositionError.value = true
      emit('position-error', true)
      return
    }
    if (form.value.position && !/^[A-Za-zก-๙\s]+$/.test(form.value.position)) {
      showPositionError.value = true
      emit('position-error', true)
      return
    }
    if (form.value.position && form.value.position.length < 2) {
      showPositionMinLengthError.value = true
      setTimeout(() => {
        showPositionMinLengthError.value = false
      }, 10000)
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
      phoneNumber: form.value.phoneNumber || null,
      lineId: form.value.lineId || null
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
    loading.value = true
    const updated = await updateProfileWithFile(
      `${import.meta.env.VITE_BASE_URL}/api/profile`,
      body,
      router
    )

    if (!updated) {
      loading.value = false
      emit('error', true)
      return
    }
    loading.value = false
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
    loading.value = false
    emit('error', true)
  }
}
const saveEditDetail = async () => {
  const isStaff = loginManager.user?.role === 'STAFF'

  // -----------------------
  // validate name (ไทย + อังกฤษ)
  // -----------------------
  const nameRegex = /^[A-Za-zก-๙\s]+$/

  if (!form.value.firstName?.trim()) {
    showFirstNameError.value = true
    emit('first-name-required', true)
    return
  }
  if (!nameRegex.test(form.value.firstName)) {
    showFirstNameError.value = true
    emit('first-name-error', true)
    return
  }

  if (!form.value.lastName?.trim()) {
    showLastNameError.value = true
    emit('last-name-required', true)
    return
  }
  if (!nameRegex.test(form.value.lastName)) {
    showLastNameError.value = true
    emit('last-name-error', true)
    return
  }
  const fName = form.value.firstName || ''
  const lName = form.value.lastName || ''
  if ((fName.length + lName.length) > 0 && (fName.length + lName.length) < 6) {
    showNameMinLengthError.value = true
    setTimeout(() => {
      showNameMinLengthError.value = false
    }, 10000)
    return
  }

  if (!form.value.roomNumber?.trim()) {
    showRoomNumberError.value = true
    emit('room-number-required', true)
    return
  }

  if (form.value.roomNumber && !/^[0-9]+$/.test(form.value.roomNumber)) {
    showRoomNumberError.value = true
    emit('room-number-error', true)
    return
  }
  if (form.value.lineId && !/^[a-zA-Z0-9._]+$/.test(form.value.lineId)) {
    showLineIdError.value = true
    emit('line-id-error', true)
    return
  }
  if (form.value.phoneNumber) {
    if (!/^[0-9-]+$/.test(form.value.phoneNumber)) {
      showPhoneError.value = true
      emit('phone-error', true)
      return
    }
    const digits = form.value.phoneNumber.replace(/-/g, '')
    if (digits.length < 9 || digits.length > 10) {
      showPhoneError.value = true
      emit('phone-error', true)
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
    loading.value = true
    const updated = await updateDetailWithFile(
      `${import.meta.env.VITE_BASE_URL}/api/staff/users`,
      form.value.userId,
      body,
      router
    )

    if (!updated) {
      loading.value = false
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

    loading.value = false
    emit('success', true)
    isEdit.value = false
  } catch (err) {
    console.error(err)
    loading.value = false
    emit('error', true)
  }
}

const displayFullName = computed(() => {
  const first = form.value.firstName?.trim()
  const last = form.value.lastName?.trim()

  if (!first && !last) return ''
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

const userRoleLabel = computed(() => {
  if (props.editResidentDetail) {
    return 'Resident Name'
  }
  if (loginManager.user?.role === 'STAFF' && props.mode !== 'add') {
    return 'Staff Name'
  }
  return 'Resident Name'
})
const isLineLinked = computed(() => {
  
  const id = form.value.lineId || profileManager.currentProfile?.lineId || loginManager.user?.lineId
  if (!id || id === 'null' || id === 'unlinked' || id === '') {
    return false
  }
  return true
})

// Add reset function to be called by parents when popup closes
const resetErrorStates = () => {
  showFirstNameError.value = false
  showLastNameError.value = false
  showEmailError.value = false
  showRoomNumberError.value = false
  showDormIdError.value = false
  showPositionError.value = false
  showPhoneError.value = false
  showLineIdError.value = false
  
  // Also clear whitespace errors
  showFirstNameWhitespaceError.value = false
  showLastNameWhitespaceError.value = false
  showEmailWhitespaceError.value = false
  showRoomWhitespaceError.value = false
  showLineIdWhitespaceError.value = false
  showPositionWhitespaceError.value = false
  showPhoneWhitespaceError.value = false
}

defineExpose({
  resetErrorStates
})
</script>

<template>
  <div class="w-full mx-auto px-4">
    <div v-if="editProfile" class="flex flex-col md:flex-row gap-2">
      <!-- LEFT : Profile Image Card -->
      <div
        class="w-full md:w-1/3 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-blue-50/50 p-5 md:p-8 flex flex-col items-center text-center"
      >
        <div class="relative inline-block group mb-6">
          <!-- Avatar -->
          <div
            class="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-[#1D355E] to-[#0E4B90] p-1 shadow-lg ring-4 ring-white relative mx-auto group/avatar"
          >
            <div class="w-full h-full rounded-full overflow-hidden relative from-[#1D355E] to-[#0E4B90] flex items-center justify-center">
              <img
                v-if="profileImageUrlPreview"
                :src="profileImageUrlPreview"
                alt="Profile"
                class="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
              />

              <!-- ADD MODE + ยังไม่เลือกรูป -->
              <div
                v-else-if="props.mode === 'add'"
                class="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24"><g fill="none"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M12 13c2.396 0 4.575.694 6.178 1.672c.8.488 1.484 1.064 1.978 1.69c.486.615.844 1.351.844 2.138c0 .845-.411 1.511-1.003 1.986c-.56.45-1.299.748-2.084.956c-1.578.417-3.684.558-5.913.558s-4.335-.14-5.913-.558c-.785-.208-1.524-.506-2.084-.956C3.41 20.01 3 19.345 3 18.5c0-.787.358-1.523.844-2.139c.494-.625 1.177-1.2 1.978-1.69C7.425 13.695 9.605 13 12 13m0-11a5 5 0 1 1 0 10a5 5 0 0 1 0-10"/></g></svg>
              </div>

              <!-- EDIT MODE + ไม่มีรูป -->
              <div
                v-else
                class="w-full h-full flex items-center justify-center font-bold bg-gradient-to-br from-[#1D355E] to-[#0E4B90] text-white text-5xl"
              >
                {{ userInitial }}
              </div>
            </div>
          </div>

          <div
            class="absolute -bottom-2 -right-2 p-1 cursor-pointer group"
            @click="$refs.imageInput.click()"
          >
            <div
              class="bg-[#185DC0] rounded-full p-2 shadow-xl border-4 border-white hover:bg-[#0E4B90] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center w-10 h-10 text-white"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.2322 5.23223L18.7678 8.76777M16.7322 3.73223C17.7085 2.75592 19.2915 2.75592 20.2678 3.73223C21.2441 4.70854 21.2441 6.29146 20.2678 7.26777L6.5 21H3V17.5L16.7322 3.73223Z"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
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
        <div class="mt-4">
          <p class="text-sm font-extrabold text-[#0E4B90]">
            {{ userRoleLabel }}
          </p>
          <p class="text-xl sm:text-2xl font-bold text-gray-700 pt-2 truncate max-w-[200px] mx-auto">
            {{ displayFullName }}
          </p>
        </div>
      </div>

      <!-- RIGHT : Edit Information Card -->
      <div
        class="w-full md:w-2/3 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-blue-50/50 p-5 md:p-8"
      >
        <!-- Header -->
        <div class="flex items-center gap-4 mb-8">
          <div class="w-2 h-8 bg-gradient-to-b from-[#0E4B90] to-blue-400 rounded-full"></div>
          <h3 class="font-extrabold text-xl text-black tracking-tight">
            {{ title }}
          </h3>
        </div>

        <!-- Form Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          <div class="flex flex-col">
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              First Name
              <span v-if="mode === 'add'" class="text-red-500">*</span>
            </label>
            <input
              :value="form.firstName"
              @input="handleFirstNameInput"
              placeholder="Enter First Name"
              class="w-full h-[58px] bg-gray-50/50 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] transition-all duration-300 truncate"
              :class="[
                showNameLengthError || showNameMinLengthError || showFirstNameWhitespaceError || showFirstNameError
                  ? 'border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600'
                  : 'border-gray-100 text-gray-900'
              ]"
            />
            <div v-if="showFirstNameWhitespaceError" class="flex items-center text-sm text-red-600 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Leading and trailing whitespace are not allowed.
            </div>
            <div
              v-if="showNameLengthError"
              class="flex items-center text-sm text-red-600 mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="red"
                class="w-[15px] mr-1"
              >
                <path
                  fill-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="text-sm text-red-600">
                Combined First Name and Last Name must be at most {{ MAX_NAME_LENGTH }} characters
              </div>
            </div>
            <div
              v-if="showNameMinLengthError"
              class="flex items-center text-sm text-red-600 mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="red"
                class="w-[15px] mr-1"
              >
                <path
                  fill-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="text-sm text-red-600">
                Combined First Name and Last Name must be at least 6 characters
              </div>
            </div>
          </div>

          <div class="flex flex-col">
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Last Name <span v-if="mode === 'add'" class="text-red-500">*</span>
            </label>
            <input
              :value="form.lastName"
              @input="handleLastNameInput"
              placeholder="Enter Last Name"
              class="w-full h-[58px] bg-gray-50/50 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] transition-all duration-300 truncate"
              :class="[
                showNameLengthError || showNameMinLengthError || showLastNameWhitespaceError || showLastNameError
                  ? 'border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600'
                  : 'border-gray-100 text-gray-900'
              ]"
            />
            <div v-if="showLastNameWhitespaceError" class="flex items-center text-sm text-red-600 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Leading and trailing whitespace are not allowed.
            </div>
            <div
              v-if="showNameLengthError"
              class="flex items-center text-sm text-red-600 mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="red"
                class="w-[15px] mr-1"
              >
                <path
                  fill-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="text-sm text-red-600">
                Combined First Name and Last Name must be at most {{ MAX_NAME_LENGTH }} characters
              </div>
            </div>
            <div
              v-if="showNameMinLengthError"
              class="flex items-center text-sm text-red-600 mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="red"
                class="w-[15px] mr-1"
              >
                <path
                  fill-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="text-sm text-red-600">
                Combined First Name and Last Name must be at least 6 characters
              </div>
            </div>
          </div>

          <div class="flex flex-col">
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Email <span v-if="mode === 'add'" class="text-red-500">*</span>
            </label>
            <input
              :disabled="mode === 'edit'"
              :value="form.email"
              @input="handleEmailInput"
              placeholder="Enter Email"
              :class="[
                'w-full h-[58px] border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 transition-all duration-300 truncate',
                mode === 'edit' ? 'bg-gray-100 cursor-not-allowed border-transparent text-gray-400 font-medium' : (showEmailError || showEmailLengthError || showEmailWhitespaceError ? 'bg-gray-50/50 border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600' : 'bg-gray-50/50 border-gray-100 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] text-gray-900')
              ]"
            />
            <div v-if="showEmailWhitespaceError" class="flex items-center text-sm text-red-600 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Leading and trailing whitespace are not allowed.
            </div>
            <div
              v-if="showEmailLengthError"
              class="flex items-center text-sm text-red-600 mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="red"
                class="w-[15px] mr-1"
              >
                <path
                  fill-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="text-sm text-red-600">
                Email must be at most {{ MAX_EMAIL_LENGTH }} characters
              </div>
            </div>
          </div>

          <div
            class="flex flex-col"
            v-if="roomNumber !== null || mode == 'add'"
          >
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Room Number
              <span v-if="mode === 'add'" class="text-red-500">*</span>
            </label>
            <input
              :disabled="mode === 'edit' && loginManager.user?.role === 'RESIDENT'"
              :value="form.roomNumber"
              @input="handleRoomInput"
              placeholder="Enter Room Number"
              :class="[
                'w-full h-[58px] border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 transition-all duration-300 truncate',
                (mode === 'edit' && loginManager.user?.role === 'RESIDENT') ? 'bg-gray-100 cursor-not-allowed border-transparent text-gray-400 font-medium' : ((showRoomNumberError || showRoomLengthError || showRoomWhitespaceError) ? 'bg-gray-50/50 border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600' : 'bg-gray-50/50 border-gray-100 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] text-gray-900')
              ]"
            />
            <div v-if="showRoomWhitespaceError" class="flex items-center text-sm text-red-600 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Leading and trailing whitespace are not allowed.
            </div>
            <div
              v-if="showRoomLengthError"
              class="flex items-center text-sm text-red-600 mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="red"
                class="w-[15px] mr-1"
              >
                <path
                  fill-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="text-sm text-red-600">
                Room Number must be at most {{ MAX_ROOMNUMBER_LENGTH }} characters
              </div>
            </div>
          </div>
          <div
            class="flex flex-col"
            v-if="
              form.dormId !== null &&
              mode !== 'add' &&
              loginManager.user.role === 'RESIDENT'
            "
          >
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Dormitory
            </label>
            <input
              :disabled="mode === 'edit' && loginManager.user?.role === 'RESIDENT'"
              :value="dormName"
              :class="[
                'w-full h-[58px] border rounded-2xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-4 transition-all duration-300 truncate',
                (mode === 'edit' && loginManager.user?.role === 'RESIDENT') ? 'bg-gray-100 cursor-not-allowed border-transparent text-gray-400 font-medium' : 'bg-gray-50/50 border-gray-100 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90]'
              ]"
            />
          </div>
          <div
            class="flex flex-col"
            v-if="mode == 'add' && loginManager.user.role === 'STAFF'"
          >
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Dormitory
              <span class="text-red-500">*</span>
            </label>
            <SelectWeb
              v-model="form.dormId"
              :options="dormOptions"
              placeholder="Select dormitory"
              :class="[showDormIdError ? 'border-red-400 rounded-2xl' : '']"
            />
          </div>
          <div
            class="flex flex-col"
            v-if="loginManager.user.role === 'STAFF' && mode !== 'add'"
          >
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Position
            </label>
            <input
              :value="form.position"
              @input="handlePositionInput"
              placeholder="Enter Position"
              class="w-full h-[58px] bg-gray-50/50 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] transition-all duration-300 truncate"
              :class="[
                showPositionError || showPositionLengthError || showPositionMinLengthError || showPositionWhitespaceError
                  ? 'border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600'
                  : 'border-gray-100 text-gray-900'
              ]"
            />
            <div v-if="showPositionWhitespaceError" class="flex items-center text-sm text-red-600 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Leading and trailing whitespace are not allowed.
            </div>
            <div
              v-if="showPositionLengthError"
              class="flex items-center text-sm text-red-600 mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="red"
                class="w-[15px] mr-1"
              >
                <path
                  fill-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="text-sm text-red-600">
                Position must be at most {{ MAX_STAFFPOSITION_LENGTH }} characters
              </div>
            </div>
            <div
              v-if="showPositionMinLengthError"
              class="flex items-center text-sm text-red-600 mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="red"
                class="w-[15px] mr-1"
              >
                <path
                  fill-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="text-sm text-red-600">
                Position must be at least 2 characters
              </div>
            </div>
          </div>

          <div class="flex flex-col">
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Phone Number
            </label>
            <input
              :value="form.phoneNumber"
              @input="handlePhoneInput"
              placeholder="Enter Phone Number"
              class="w-full h-[58px] bg-gray-50/50 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] transition-all duration-300 truncate"
              :class="[
                showPhoneError || showPhoneLengthError || showPhoneWhitespaceError
                  ? 'border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600'
                  : 'border-gray-100 text-gray-900'
              ]"
            />
            <div v-if="showPhoneWhitespaceError" class="flex items-center text-sm text-red-600 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Leading and trailing whitespace are not allowed.
            </div>
            <div
              v-if="showPhoneLengthError"
              class="flex items-center text-sm text-red-600 mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="red"
                class="w-[15px] mr-1"
              >
                <path
                  fill-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="text-sm text-red-600">
                Phone Number must be at most {{ MAX_PHONE_LENGTH }} digits
              </div>
            </div>
          </div>

          <div v-if="showLineId" class="flex flex-col">
            <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
              Line ID
            </label>
            <input
              :value="form.lineId"
              @input="handleLineIdInput"
              placeholder="Enter Line ID"
              class="w-full h-[58px] bg-gray-50/50 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] transition-all duration-300 truncate"
              :class="[
                showLineIdError || showLineIdLengthError || showLineIdWhitespaceError
                  ? 'border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600'
                  : 'border-gray-100 text-gray-900'
              ]"
            />
            <div v-if="showLineIdWhitespaceError" class="flex items-center text-sm text-red-600 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Leading and trailing whitespace are not allowed.
            </div>
            <div
              v-if="showLineIdLengthError"
              class="flex items-center text-sm text-red-600 mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="red"
                class="w-[15px] mr-1"
              >
                <path
                  fill-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="text-sm text-red-600">
                Line ID must be at most {{ MAX_LINE_ID_LENGTH }} characters
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="md:col-span-2 flex gap-3 mt-6 flex-row md:justify-end border-t border-gray-50 pt-6">
            <ButtonWeb
              class="flex-1 md:flex-none md:min-w-[160px] text-xs py-2 md:text-base md:py-3.5 cursor-pointer hover:bg-gray-100 rounded-2xl transition-all font-bold px-4 md:px-8 whitespace-nowrap"
              label="Cancel"
              color="gray"
              @click="cancel"
            />
            <ButtonWeb
              class="flex-1 md:flex-none md:min-w-[160px] text-xs py-2 md:text-base md:py-3.5 cursor-pointer hover:opacity-90 rounded-2xl shadow-lg transition-all font-black px-4 md:px-8 whitespace-nowrap"
              :label="mode === 'add' ? 'Add Resident' : 'Save'"
              color="blue"
              @click="submit"
              :disabled="isSaveDisabled"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="editResidentDetail" class="max-w-5xl mx-auto">
      <!-- 🔹 CARD เดียว -->
      <div
        class="bg-white rounded-3xl shadow-[0_20px_50px_rgba(14,75,144,0.05)] border border-blue-50/50 p-5 md:p-8"
      >
        <div class="mb-6 text-center md:hidden">
          <p class="hidden md:block text-sm font-extrabold text-[#0E4B90] pt-6">
          {{ userRoleLabel }}
        </p>
          <h2 class="hidden md:block text-xl sm:text-2xl font-semibold text-gray-500 pt-5 truncate max-w-[200px]">
            {{ displayFullName }}
          </h2>
        </div>
        <!-- 🔹 WRAPPER -->
        <div class="flex flex-col md:flex-row gap-10">
          <!-- ================= LEFT : Profile Image ================= -->
          <div
            class="md:w-1/3 flex flex-col items-center text-center pt-2 sm:pt-6 md:pt-8 lg:pt-10"
          >
            <div class="relative inline-block group mb-6">
              <!-- Avatar -->
              <div
                class="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-[#1D355E] to-[#0E4B90] p-1 shadow-lg ring-4 ring-white relative mx-auto group/preview"
              >
                <div class="w-full h-full rounded-full overflow-hidden relative from-[#1D355E] to-[#0E4B90]">
                  <img
                    v-if="profileImageUrlPreview"
                    :src="profileImageUrlPreview"
                    alt="Profile"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-110"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center font-bold text-white text-5xl"
                  >
                    {{ userInitial }}
                  </div>
                </div>
              </div>
              <div
                class="absolute -bottom-2 -right-2 p-1 cursor-pointer group"
                @click="$refs.imageInput.click()"
              >
                <div
                  class="bg-[#185DC0] rounded-full p-2 shadow-xl border-4 border-white hover:bg-[#0E4B90] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center w-10 h-10 text-white"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15.2322 5.23223L18.7678 8.76777M16.7322 3.73223C17.7085 2.75592 19.2915 2.75592 20.2678 3.73223C21.2441 4.70854 21.2441 6.29146 20.2678 7.26777L6.5 21H3V17.5L16.7322 3.73223Z"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>

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
      
            <p class="text-sm font-extrabold text-[#0E4B90]">
              {{ userRoleLabel }}
            </p>
            <h2
              class="text-xl sm:text-2xl font-bold text-gray-700 pt-2 truncate max-w-[200px] mx-auto"
            >
              {{ displayFullName }}
            </h2>
          </div>

          <div class="md:w-2/3">
            <!-- Header -->
            <div class="flex items-center gap-4 mb-8">
              <div class="w-2 h-8 bg-gradient-to-b from-[#0E4B90] to-blue-400 rounded-full"></div>
              <h3 class="font-extrabold text-xl text-black tracking-tight">
                User Information
              </h3>
            </div>

            <!-- Form Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 items-start">
              <div class="flex flex-col">
                <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
                  First Name
                  <span v-if="mode === 'add'" class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.firstName"
                  @input="handleFirstNameInput"
                  placeholder="Enter First Name"
                  class="w-full h-[58px] max-w-md bg-gray-50/50 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] transition-all duration-300 truncate"
                  :class="[
                    showFirstNameError || showNameLengthError || showNameMinLengthError || showFirstNameWhitespaceError
                      ? 'border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600'
                      : 'border-gray-100 text-gray-900'
                  ]"
                />
              </div>

              <div class="flex flex-col">
                <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
                  Last Name
                  <span v-if="mode === 'add'" class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.lastName"
                  @input="handleLastNameInput"
                  placeholder="Enter Last Name"
                  class="w-full h-[58px] max-w-md bg-gray-50/50 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] transition-all duration-300 truncate"
                  :class="[
                    showLastNameError || showNameLengthError || showNameMinLengthError || showLastNameWhitespaceError
                      ? 'border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600'
                      : 'border-gray-100 text-gray-900'
                  ]"
                />
              </div>

              <div class="flex flex-col">
                <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
                  Email
                  <span v-if="mode === 'add'" class="text-red-500">*</span>
                </label>
                <input
                  :disabled="mode === 'edit'"
                  v-model="form.email"
                  @input="handleEmailInput"
                  placeholder="Enter Email"
                  :class="[
                    'w-full h-[58px] max-w-md border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 transition-all duration-300 truncate',
                    mode === 'edit' ? 'bg-gray-100 cursor-not-allowed border-transparent text-gray-400 font-medium' : (showEmailError || showEmailLengthError || showEmailWhitespaceError ? 'bg-gray-50/50 border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600' : 'bg-gray-50/50 border-gray-100 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] text-gray-900')
                  ]"
                />
              </div>

              <div class="flex flex-col">
                <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
                  Room Number
                </label>
                <input
                  v-model="form.roomNumber"
                  @input="handleRoomInput"
                  :disabled="loginManager.user?.role === 'RESIDENT'"
                  placeholder="Enter Room Number"
                  :class="[
                    'w-full h-[58px] max-w-md border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 transition-all duration-300 truncate',
                    loginManager.user?.role === 'RESIDENT' ? 'bg-gray-100 cursor-not-allowed border-transparent text-gray-400 font-medium' : (showRoomNumberError || showRoomLengthError || showRoomWhitespaceError ? 'bg-gray-50/50 border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600' : 'bg-gray-50/50 border-gray-100 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] text-gray-900')
                  ]"
                />
              </div>
              <div class="flex flex-col">
                <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
                  Dormitory
                </label>
                <SelectWeb
                  v-model="form.dormId"
                  :options="dormOptions"
                  :disabled="loginManager.user?.role === 'RESIDENT'"
                  placeholder="Select Dormitory"
                  class="max-w-md"
                  :class="[showDormIdError ? 'border-red-400 rounded-2xl' : '']"
                />
              </div>
              <div class="flex flex-col">
                <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
                  Phone Number
                </label>
                <input
                  v-model="form.phoneNumber"
                  @input="handlePhoneInput"
                  placeholder="Enter Phone Number"
                  class="w-full h-[58px] max-w-md bg-gray-50/50 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] transition-all duration-300 truncate"
                  :class="[
                    showPhoneError || showPhoneLengthError || showPhoneWhitespaceError
                      ? 'border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600'
                      : 'border-gray-100 text-gray-900'
                  ]"
                />
              </div>
              <div v-if="showLineId" class="flex flex-col">
                <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
                  Line ID
                </label>
                <input
                  v-model="form.lineId"
                  @input="handleLineIdInput"
                  placeholder="Enter Line ID"
                  class="w-full h-[58px] max-w-md bg-gray-50/50 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-[#0E4B90] transition-all duration-300 truncate"
                  :class="[
                    showLineIdError || showLineIdLengthError || showLineIdWhitespaceError
                      ? 'border-red-600 text-red-600 focus:ring-red-100 focus:border-red-600'
                      : 'border-gray-100 text-gray-900'
                  ]"
                />
              </div>

              <!-- Actions -->
              <div class="md:col-span-2 flex gap-3 mt-6 justify-end pt-6 border-t border-gray-50">
                <ButtonWeb
                  class="flex-1 md:flex-none text-[#898989] text-xs py-2 md:text-base md:py-3 cursor-pointer hover:bg-gray-100 hover:text-gray-600 rounded-2xl transition-all font-bold px-3 md:px-8 whitespace-nowrap"
                  label="Cancel"
                  color="gray"
                  @click="cancel"
                />
                <ButtonWeb
                  class="flex-1 md:flex-none text-xs py-2 md:text-base md:py-3 cursor-pointer hover:opacity-90 hover:shadow-blue-500/20 rounded-2xl shadow-lg shadow-blue-500/10 transition-all font-bold px-3 md:px-10 whitespace-nowrap"
                  :label="mode === 'add' ? 'Add' : 'Save'"
                  color="blue"
                  :disabled="isSaveDisabled"
                  @click="submit"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ImageCropperModal
    :isOpen="showCropper"
    :imageSrc="tempImageSrc"
    @close="closeCropper"
    @crop="onCrop"
  />
  <Teleport to="body" v-if="loading"><LoadingPopUp /></Teleport>
</template>

<style scoped></style>
