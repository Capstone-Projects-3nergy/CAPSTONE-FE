<script setup>
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import Quagga from 'quagga'
import axios from 'axios'
import Tesseract from 'tesseract.js'
import ButtonWeb from './ButtonWeb.vue'
import AlertPopUp from './AlertPopUp.vue'
import SidebarItem from './SidebarItem.vue'
import DashBoard from './DashBoard.vue'
import ResidentParcelsPage from '@/components/ResidentParcels.vue'
import StaffParcelsPage from '@/components/ManageParcels.vue'
import LoginPage from './LoginPage.vue'
import UserInfo from '@/components/UserInfo.vue'
import ConfirmLogout from './ConfirmLogout.vue'
import { useAuthManager } from '@/stores/AuthManager.js'
import { useParcelManager } from '@/stores/ParcelsManager'
import { getItems, addItem } from '@/utils/fetchUtils'

const addSuccess = ref(false)
const showLogoutConfirm = ref(false)
const parcelManager = useParcelManager()
const trackingNumberError = ref(false)
const recipientNameError = ref(false)
const senderNameError = ref(false)
const companyIdError = ref(false)
const parcelTypeErrorRequired = ref(false)
const auth = useAuthManager()
const companyList = ref([])
const router = useRouter()
const error = ref(false)
const roomNumberError = ref(false)
const SenderNameError = ref(false)
const parcelTypeError = ref(false)
const scanResult = ref('')
const previewUrl = ref(null)
const showStaffParcels = ref(false)
const showParcelScanner = ref(false)
const showResidentParcels = ref(false)
const showManageAnnouncement = ref(false)
const showManageResident = ref(false)
const showDashBoard = ref(false)
const showProfileStaff = ref(false)
const showAddParcels = ref(false)

const parcelStore = useParcelManager()
const isAllFilled = computed(() => {
  return (
    form.value.trackingNumber &&
    form.value.recipientName &&
    form.value.parcelType &&
    form.value.companyId &&
    form.value.receiveAt &&
    form.value.pickupAt &&
    form.value.updateAt
  )
})

const form = ref({
  trackingNumber: '',
  recipientName: '',
  roomNumber: '',
  parcelType: '',
  status: 'waiting for staff',
  pickupAt: null,
  updateAt: null,
  senderName: null,
  companyId: '',
  receiveAt: null
})
const residents = ref([])

const recipientSearch = ref('')
const selectedResidentId = ref(null)
function cancelParcel() {
  Object.keys(form.value).forEach(
    (key) => (form.value[key] = key === 'status' ? 'Waiting for staff' : '')
  )
}

const selectedResident = computed(
  () =>
    residents.value.find((r) => r.userId === selectedResidentId.value) || null
)
const showSuggestions = computed(
  () => recipientSearch.value.trim().length > 0 && !selectedResidentId.value
)

const filteredResidents = computed(() => {
  const q = recipientSearch.value.trim().toLowerCase()
  if (!q) return []
  return residents.value.filter((r) => {
    const fullName = (
      r.fullName || `${r.firstName} ${r.lastName}`
    ).toLowerCase()
    return (
      fullName.includes(q) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.roomNumber && r.roomNumber.toLowerCase().includes(q))
    )
  })
})

const selectResident = (resident) => {
  selectedResidentId.value = resident.userId
  const name = resident.fullName || `${resident.firstName} ${resident.lastName}`
  form.value.recipientName = name
  recipientSearch.value = name
}

watch(recipientSearch, (val) => {
  if (!val) {
    selectedResidentId.value = null
    form.value.recipientName = ''
  }
})

const savedParcels = ref([])
const scanningMode = ref('')
let html5QrCode = null
const videoStream = ref(null)
const videoRef = ref(null)
const isCameraReady = ref(false)

async function extractParcelInfo(imageDataUrl) {
  try {
    const result = await Tesseract.recognize(imageDataUrl, 'tha+eng')
    const text = result.data.text

    const info = { name: '', tracking: '', courier: '', type: '' }

    const nameMatch = text.match(
      /(ชื่อเจ้าของพัสดุ|ชื่อผู้รับ)[:\s]*([\u0E00-\u0E7Fa-zA-Z ]+)/
    )
    if (nameMatch) info.name = nameMatch[2].trim()

    const trackingMatch = text.match(/(TH\d{10,}[A-Z]?)/)
    if (trackingMatch) info.tracking = trackingMatch[1]

    if (/Shopee Express/i.test(text)) info.courier = 'Shopee Express'
    else if (/Kerry/i.test(text)) info.courier = 'Kerry Express'
    else if (/J&T/i.test(text)) info.courier = 'J&T Express'

    if (/กล่องเล็ก/.test(text)) info.type = 'กล่องเล็ก'
    else if (/กล่องใหญ่/.test(text)) info.type = 'กล่องใหญ่'
    else if (/ซอง/.test(text)) info.type = 'ซอง'

    return info
  } catch (err) {
    return null
  }
}

const deleteScanResult = () => (scanResult.value = null)
function deleteSaveInformation(index) {
  savedParcels.value.splice(index, 1)
}
const deletePreview = () => (previewUrl.value = null)

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert('กล้องไม่รองรับ')
    return
  }
  try {
    videoStream.value = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })
    videoRef.value.srcObject = videoStream.value
    videoRef.value.onloadedmetadata = () => {
      videoRef.value.play()
      isCameraReady.value = true
    }
  } catch (err) {
    alert('ไม่สามารถเปิดกล้องได้')
  }
}

function stopCameraOnly() {
  if (videoStream.value) {
    videoStream.value.getTracks().forEach((track) => track.stop())
    videoStream.value = null
    isCameraReady.value = false
  }
}

async function capturePhoto() {
  if (!videoRef.value || !isCameraReady.value) {
    alert('กรุณาเปิดกล้องก่อนถ่ายรูป')
    return
  }
  const video = videoRef.value
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  previewUrl.value = canvas.toDataURL('image/png')

  const parcelInfo = await extractParcelInfo(previewUrl.value)
  if (parcelInfo) {
    form.value.recipientName = parcelInfo.name || ''
    form.value.trackingNumber = parcelInfo.tracking || ''
    form.value.companyId = parcelInfo.courier || ''
    form.value.parcelType = parcelInfo.type || ''
  }
}

function startQuagga() {
  Quagga.init(
    {
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: document.querySelector('#reader'),
        constraints: {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }
      },
      locator: { patchSize: 'medium', halfSample: false },
      numOfWorkers: navigator.hardwareConcurrency || 4,
      decoder: {
        readers: [
          'code_128_reader',
          'ean_reader',
          'ean_8_reader',
          'code_39_reader',
          'code_39_vin_reader',
          'codabar_reader',
          'upc_reader',
          'upc_e_reader',
          'i2of5_reader'
        ]
      },
      locate: true
    },
    (err) => {
      Quagga.start()
    }
  )

  Quagga.onDetected((result) => {
    if (result?.codeResult?.code) {
      const detectedCode = result.codeResult.code.trim()

      scanResult.value = detectedCode
      form.value.trackingNumber = detectedCode

      // แปลงประเภทพัสดุจาก barcode หรือ pattern ให้ตรง enum backend
      if (detectedCode.startsWith('B')) {
        // ตัวอย่าง logic
        form.value.parcelType = 'BOX'
      } else if (detectedCode.startsWith('D')) {
        form.value.parcelType = 'DOCUMENT'
      } else {
        form.value.parcelType = 'ELECTRONIC'
      }

      stopQuagga()
    }
  })
}

function stopQuagga() {
  try {
    Quagga.stop()
    Quagga.offDetected()
  } catch (e) {}
}
const getResponsiveSize = () => {
  const width = window.innerWidth

  if (width < 480) {
    return { width: 130, height: 130 }
  } else if (width < 640) {
    return { width: 140, height: 140 }
  } else if (width < 768) {
    return { width: 160, height: 160 }
  } else if (width < 1024) {
    return { width: 180, height: 180 }
  } else {
    return { width: 200, height: 200 }
  }
}

function startScan(mode) {
  scanningMode.value = mode

  if (mode === 'qr') {
    html5QrCode = new Html5Qrcode('reader')
    html5QrCode = new Html5Qrcode('reader')
    const config = {
      fps: 10,
      qrbox: function () {
        return getResponsiveSize()
      },
      formatsToSupport: Object.values(Html5QrcodeSupportedFormats)
    }

    html5QrCode
      .start({ facingMode: 'environment' }, config, (decodedText) => {
        const cleanText = decodedText.trim()
        scanResult.value = cleanText
        form.value.trackingNumber = cleanText
      })
      .catch((err) => {
        alert('Failed to start QR scanning.')
      })
  } else if (mode === 'barcode') {
    startQuagga()
  }
}

function stopScan() {
  scanningMode.value = ''
  if (html5QrCode) {
    html5QrCode.stop().catch(() => {})
    html5QrCode.clear()
    html5QrCode = null
  }
  stopQuagga()
  stopCameraOnly()
}

const saveParcel = async () => {
  if (!form.value.trackingNumber) {
    trackingNumberError.value = true
    setTimeout(() => (trackingNumberError.value = false), 10000)
    return
  }
  if (!form.value.recipientName) {
    recipientNameError.value = true
    setTimeout(() => (recipientNameError.value = false), 10000)
    return
  }
  if (!form.value.parcelType) {
    parcelTypeErrorRequired.value = true
    setTimeout(() => (parcelTypeErrorRequired.value = false), 10000)
    return
  }
  if (!form.value.companyId) {
    companyIdError.value = true
    setTimeout(() => (companyIdError.value = false), 10000)
    return
  }

  if (!/^[A-Za-zก-๙\s]*$/.test(form.value.senderName || '')) {
    SenderNameError.value = true
    setTimeout(() => (SenderNameError.value = false), 10000)
    return
  }
  if (!/^[A-Za-z0-9]+$/.test(form.value.trackingNumber)) {
    trackingNumberError.value = true
    setTimeout(() => (trackingNumberError.value = false), 10000)
    return
  }

  try {
    const requestBody = {
      userId: selectedResidentId.value,
      trackingNumber: form.value.trackingNumber,
      recipientName: form.value.recipientName,
      parcelType: form.value.parcelType,
      senderName: form.value.senderName || '',
      companyId: Number(form.value.companyId)
    }

    const savedParcel = await addItem(
      `${import.meta.env.VITE_BASE_URL}/api/public/parcels`,
      requestBody,
      router
    )

    if (!savedParcel || savedParcel === 400 || savedParcel === 500) {
      error.value = true
      setTimeout(() => (error.value = false), 10000)
      return
    }

    parcelManager.addParcel(savedParcel)
    addSuccess.value = true
    setTimeout(() => (addSuccess.value = false), 10000)

    selectedResidentId.value = null
    recipientSearch.value = ''
    form.value = {
      trackingNumber: '',
      recipientName: '',
      roomNumber: '',
      parcelType: '',
      status: 'waiting for staff',
      pickupAt: null,
      updateAt: null,
      senderName: null,
      companyId: '',
      receiveAt: null
    }
  } catch (err) {
    error.value = true
    setTimeout(() => (error.value = false), 10000)
  }
}

onMounted(async () => {
  try {
    const res = await getItems(
      `${import.meta.env.VITE_BASE_URL}/api/residents`,
      router
    )
    residents.value = res || []
  } catch (e) {}
  try {
    const baseURL = import.meta.env.VITE_BASE_URL
    const res = await axios.get(`${baseURL}/api/companies`, {
      headers: {
        Accept: 'application/json'
      }
    })

    const rawData = res.data
    let parsedCompanies = []

    if (typeof rawData === 'string') {
      const companyMatches =
        rawData.match(/"companyId":(\d+).*?"companyName":"(.*?)"/g) || []

      parsedCompanies = companyMatches.map((str) => {
        const idMatch = str.match(/"companyId":(\d+)/)
        const nameMatch = str.match(/"companyName":"(.*?)"/)
        return {
          companyId: idMatch ? Number(idMatch[1]) : null,
          companyName: nameMatch ? nameMatch[1] : ''
        }
      })
    } else if (Array.isArray(rawData)) {
      parsedCompanies = rawData.map((c) => ({
        companyId: c.companyId,
        companyName: c.companyName
      }))
    }

    companyList.value = parsedCompanies
  } catch (err) {}
})
const showManageParcelPage = async () => {
  router.replace({ name: 'login' })
}
const closePopUp = (operate) => {
  if (operate === 'problem') error.value = false
  if (operate === 'addSuccessMessage ') addSuccess.value = false
  if (operate === 'roomNumber ') roomNumberError.value = false
  if (operate === 'senderName') SenderNameError.value = false
  if (operate === 'parcelType') parcelTypeError.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <header class="flex items-center w-full h-16 bg-white">
      <div
        class="flex-1 bg-white flex justify-end items-center px-4 shadow h-full"
      >
        <div class="flex-1 flex justify-end items-center gap-5">
          <div class="flex items-center gap-3">
            <div class="flex flex-col leading-tight">
              <UserInfo />
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="flex flex-1">
      <main class="flex-1 p-9">
        <div class="flex space-x-1 mb-4">
          <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.9674 2.6177C13.0261 2.23608 11.9732 2.23608 11.032 2.6177L8.75072 3.5427L18.7424 7.42812L22.257 6.07083C22.1124 5.95196 21.9509 5.85541 21.7778 5.78437L13.9674 2.6177ZM22.9163 7.49062L13.2809 11.2135V22.5917C13.5143 22.5444 13.7431 22.4753 13.9674 22.3844L21.7778 19.2177C22.1142 19.0814 22.4023 18.8478 22.6051 18.5468C22.808 18.2458 22.9163 17.8911 22.9163 17.5281V7.49062ZM11.7184 22.5917V11.2135L2.08301 7.49062V17.5292C2.08321 17.892 2.19167 18.2464 2.39449 18.5472C2.59732 18.8481 2.88529 19.0815 3.22155 19.2177L11.032 22.3844C11.2563 22.4746 11.4851 22.543 11.7184 22.5917ZM2.74238 6.07083L12.4997 9.84062L16.5799 8.26354L6.63926 4.39895L3.22155 5.78437C3.04377 5.85659 2.88405 5.95208 2.74238 6.07083Z"
              fill="#185DC0"
            />
          </svg>
          <h2 class="text-2xl font-bold text-[#185dc0]">Add Parcel</h2>
        </div>

        <div
          class="max-w-full mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div class="fixed top-5 left-5 z-50">
            <AlertPopUp
              v-if="addSuccess"
              :titles="'Add New Parcel is Successfull.'"
              message="Success!!"
              styleType="green"
              operate="addSuccessMessage"
              @closePopUp="closePopUp"
            />
            <AlertPopUp
              v-if="error"
              :titles="'There is a problem. Please try again later.'"
              message="Error!!"
              styleType="red"
              operate="problem"
              @closePopUp="closePopUp"
            />
            <AlertPopUp
              v-if="SenderNameError"
              :titles="'Sender Name can only be typed as text.'"
              message="Error!!"
              styleType="red"
              operate="SenderName"
              @closePopUp="closePopUp"
            />
            <AlertPopUp
              v-if="parcelTypeError"
              :titles="'Parcel Type can only be typed as text.'"
              message="Error!!"
              styleType="red"
              operate="parcelType "
              @closePopUp="closePopUp"
            />
            <AlertPopUp
              v-if="trackingNumberError"
              :titles="'Thai characters are not allowed in the Tracking Number.'"
              message="Error!!"
              styleType="red"
              operate="trackingNumber"
              @closePopUp="closePopUp('trackingNumber')"
            />
            <AlertPopUp
              v-if="recipientNameError"
              :titles="'Recipient Name is required.'"
              message="Error!!"
              styleType="red"
              operate="recipientName"
              @closePopUp="closePopUp('recipientName')"
            />

            <AlertPopUp
              v-if="parcelTypeErrorRequired"
              :titles="'Parcel Type is required.'"
              message="Error!!"
              styleType="red"
              operate="parcelType"
              @closePopUp="closePopUp('parcelType')"
            />

            <AlertPopUp
              v-if="senderNameError"
              :titles="'Sender Name is required.'"
              message="Error!!"
              styleType="red"
              operate="senderName"
              @closePopUp="closePopUp('senderName')"
            />

            <AlertPopUp
              v-if="companyIdError"
              :titles="'Company ID is required.'"
              message="Error!!"
              styleType="red"
              operate="companyId"
              @closePopUp="closePopUp('companyId')"
            />
          </div>

          <div class="grid md:grid-cols-2 gap-6 p-6">
            <div class="space-y-6">
              <div
                id="scanner"
                class="w-full h-58 sm:h-64 md:w-full md:h-64 border-2 border-dashed border-blue-300 rounded-lg bg-black flex items-center justify-center relative overflow-hidden"
              >
                <span v-if="!scanningMode && !videoStream" class="text-white">
                  Scan QR/Barcode or Take Picture
                </span>

                <div
                  id="scanner-overlay"
                  :class="
                    scanningMode ? 'w-full h-full absolute inset-0' : 'hidden'
                  "
                >
                  <div id="reader" class="w-full h-full"></div>
                  <ButtonWeb
                    label="Cancel"
                    color="red"
                    class="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600"
                    @click="stopScan"
                  />
                </div>

                <video
                  ref="videoRef"
                  :class="
                    videoStream
                      ? 'w-full h-full object-cover rounded-lg'
                      : 'hidden'
                  "
                ></video>
                <ButtonWeb
                  label="Close Camera"
                  color="red"
                  class="absolute bottom-2 right-2 bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600"
                  v-if="videoStream"
                  @click="stopCameraOnly"
                />
              </div>

              <div class="flex flex-wrap gap-3 px-7">
                <ButtonWeb
                  label="Scan QR"
                  color="blue"
                  @click="startScan('qr')"
                  :disabled="scanningMode || videoStream"
                />
              </div>

              <div class="space-y-3 px-7">
                <div>
                  <label class="block font-semibold mb-1">
                    Tracking number <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.trackingNumber"
                    placeholder="Enter tracking number"
                    class="w-full border rounded px-3 py-2 focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label class="block font-semibold mb-1">
                    Recipient <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="recipientSearch"
                    type="text"
                    placeholder="Enter Recipient Name"
                    class="w-full border rounded-md p-2 focus:ring focus:ring-blue-200"
                  />

                  <ul
                    v-if="showSuggestions"
                    class="absolute z-10 mt-1 w-[235px] lg:w-[505px] sm:w-[560px] md:w-[380px] bg-white border rounded-md max-h-40 overflow-auto text-sm shadow"
                  >
                    <li
                      v-for="r in filteredResidents"
                      :key="r.userId"
                      @click="selectResident(r)"
                      class="px-3 py-1 cursor-pointer hover:bg-blue-100"
                    >
                      {{ r.fullName }}
                    </li>
                    <li
                      v-if="filteredResidents.length === 0"
                      class="px-3 py-1 text-gray-400"
                    >
                      No residents found matching your search terms.
                    </li>
                  </ul>
                </div>
                <!-- <div>
                  <label class="block font-semibold mb-1">
                    Recipient <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.recipientName"
                    type="text"
                    placeholder="Enter Recipient Name"
                    class="w-full border rounded-md p-2 focus:ring focus:ring-blue-200"
                  />
                </div> -->
                <div>
                  <label class="block font-semibold mb-1">
                    Parcel Type <span class="text-red-500">*</span>
                  </label>

                  <select
                    v-model="form.parcelType"
                    class="w-full border rounded-md p-2 focus:ring focus:ring-blue-200"
                  >
                    <option disabled value="">Select Parcel Type</option>
                    <option value="DOCUMENT">Document</option>
                    <option value="BOX">Box</option>
                    <option value="ELECTRONIC">Electronic</option>
                  </select>
                </div>

                <div>
                  <label class="block font-semibold mb-1">
                    Status <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.status"
                    class="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500"
                    disabled
                  />
                </div>

                <div>
                  <label class="block font-semibold mb-1">Sender Name</label>
                  <input
                    v-model="form.senderName"
                    placeholder="Enter sender name"
                    class="w-full border rounded px-3 py-2 focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label class="block font-semibold mb-1">
                    Company <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="form.companyId"
                    class="w-full border rounded px-3 py-2 focus:outline-blue-500"
                  >
                    <option disabled value="">Select Company</option>
                    <option
                      v-for="company in companyList"
                      :key="company.companyId"
                      :value="company.companyId"
                    >
                      {{ company.companyName }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="flex justify-end space-x-3 mt-3 px-7">
                <ButtonWeb
                  label="Save"
                  color="green"
                  @click="saveParcel"
                  :class="{
                    'bg-gray-400 text-gray-200 cursor-default': isAllFilled,
                    'bg-black hover:bg-gray-600 text-white': !isAllFilled
                  }"
                  :disabled="isAllFilled"
                  class="block md:hidden"
                />
                <ButtonWeb
                  label="Reset"
                  color="red"
                  @click="cancelParcel"
                  class="block md:hidden"
                />
              </div>
            </div>

            <div
              class="hidden sm:block bg-gray-50 border-l border-gray-200 p-6 rounded-lg px-15"
            >
              <div class="flex items-center justify-end mb-4"></div>

              <h2 class="text-xl font-semibold text-[#185DC0] mb-4">
                Parcel Information
              </h2>

              <div class="space-y-2 text-[#185DC0] font-medium">
                <div class="flex justify-between border-b py-2">
                  <span>Tracking:</span>
                  <span>{{ form.trackingNumber }}</span>
                </div>
                <div class="flex justify-between border-b py-2">
                  <span>Recipient:</span>
                  <span>{{
                    selectedResident
                      ? selectedResident.fullName
                      : form.recipientName
                  }}</span>
                </div>
                <div class="flex justify-between border-b py-2">
                  <span>Type:</span>
                  <span>{{ form.parcelType }}</span>
                </div>
                <div class="flex justify-between border-b py-2">
                  <span>Status:</span>
                  <span>{{ form.status }}</span>
                </div>
                <div class="flex justify-between border-b py-2">
                  <span>Company:</span>
                  <span>
                    {{
                      companyList.find((c) => c.companyId === form.companyId)
                        ?.companyName || ''
                    }}
                  </span>
                </div>
                <div class="flex justify-between border-b py-2">
                  <span>Sender:</span>
                  <span>{{ form.senderName }}</span>
                </div>
              </div>
              <div class="flex justify-end space-x-3 mt-3 flex-nowrap">
                <ButtonWeb
                  label="Save"
                  color="green"
                  @click="saveParcel"
                  :class="{
                    'bg-gray-400 text-gray-200 cursor-default': isAllFilled,
                    'bg-black hover:bg-gray-600 text-white': !isAllFilled
                  }"
                  :disabled="isAllFilled"
                  class="w-auto"
                />
                <ButtonWeb
                  label="Reset"
                  color="red"
                  @click="cancelParcel"
                  class="w-auto"
                />
              </div>

              <div v-if="previewUrl" class="mt-4 relative">
                <h3 class="font-semibold text-[#185DC0] mb-2">
                  Parcel Picture
                </h3>
                <img
                  :src="previewUrl"
                  class="w-full rounded shadow max-h-64 object-cover"
                />
                <button
                  @click="deletePreview"
                  class="absolute top-2 right-2 bg-white text-red-600 rounded-full shadow w-7 h-7 flex items-center justify-center hover:bg-red-100"
                >
                  ×
                </button>
              </div>

              <div class="mt-6">
                <ul class="space-y-2">
                  <li
                    v-for="(p, i) in savedParcels"
                    :key="i"
                    class="border p-3 rounded relative flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0"
                  >
                    <div>
                      <div>Recipient: {{ p.recipientName }}</div>
                      <div>Tracking: {{ p.trackingNumber }}</div>
                      <div>Sender: {{ p.senderName }}</div>
                      <div>Type: {{ p.parcelType }}</div>
                      <div>Status: {{ p.status }}</div>
                    </div>
                    <div v-if="p.imageUrl" class="md:ml-4">
                      <img
                        :src="p.imageUrl"
                        class="w-28 h-28 object-cover rounded"
                      />
                    </div>
                    <button
                      @click="deleteSaveInformation(i)"
                      class="absolute top-2 right-2 bg-white text-red-600 rounded-full shadow w-7 h-7 flex items-center justify-center hover:bg-red-100"
                    >
                      ×
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
body {
  background-color: #f3f4f6;
}
#scanner {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
