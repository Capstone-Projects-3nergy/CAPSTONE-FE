<script setup>
import { ref, reactive, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import QrScanner from 'qr-scanner'
import Quagga from '@ericblade/quagga2'
import axios from 'axios'
import Tesseract from 'tesseract.js'
import ButtonWeb from './ButtonWeb.vue'
import SelectWeb from './SelectWeb.vue'
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
import { useNotificationManager } from '@/stores/NotificationManager'
import { getItems, addItem } from '@/utils/fetchUtils'
import WebHeader from './WebHeader.vue'
const addSuccess = ref(false)
const showLogoutConfirm = ref(false)
const parcelManager = useParcelManager()
const trackingNumberError = ref(false)
const recipientNameError = ref(false)
const senderNameError = ref(false)
const companyIdError = ref(false)
const duplicateParcelError = ref(false)
const parcelTypeErrorRequired = ref(false)
const trackingNumberFormatError = ref(false)
const isLoading = ref(false)

const showTrackingLengthError = ref(false)
const showSenderLengthError = ref(false)
const showSenderMinLengthError = ref(false)

const handleTrackingInput = (event) => {
  const val = event.target.value
  if (val.length > 22) {
    const sliced = val.slice(0, 22)
    form.value.trackingNumber = sliced
    event.target.value = sliced
    showTrackingLengthError.value = true
    setTimeout(() => {
      showTrackingLengthError.value = false
    }, 5000)
  } else {
    form.value.trackingNumber = val
  }
}

const handleSenderInput = (event) => {
  const val = event.target.value
  if (val.length > 100) {
    const sliced = val.slice(0, 100)
    form.value.senderName = sliced
    event.target.value = sliced
    showSenderLengthError.value = true
    setTimeout(() => {
      showSenderLengthError.value = false
    }, 5000)
  } else {
    form.value.senderName = val
  }
}
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

const parcelTypeOptions = [
  { label: 'Document', value: 'DOCUMENT' },
  { label: 'Box', value: 'BOX' },
  { label: 'Electronic', value: 'ELECTRONIC' }
]

const companyOptions = computed(() => {
  return companyList.value.map((c) => ({
    label: c.companyName,
    value: c.companyId
  }))
})

const notificationManager = useNotificationManager()
const parcelStore = useParcelManager()
const isAllFilled = computed(() => {
  return (
    !form.value.trackingNumber ||
    !form.value.recipientName ||
    !form.value.parcelType ||
    form.value.companyId === '' ||
    form.value.companyId === null ||
    (form.value.trackingNumber && form.value.trackingNumber.length > 60) ||
    (form.value.senderName && form.value.senderName.length > 100)
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
  form.value.recipientName = val // Sync manual input
  if (!val) {
    selectedResidentId.value = null
  }
})

const savedParcels = ref([])
const scanningMode = ref('')
const isSuccessScan = ref(false)
let qrScanner = null
const videoStream = ref(null)
const videoRef = ref(null)
const barcodeReaderRef = ref(null)
const isCameraReady = ref(false)

async function extractParcelInfo(imageDataUrl) {
  if (
    !imageDataUrl ||
    typeof imageDataUrl !== 'string' ||
    !imageDataUrl.startsWith('data:image')
  )
    return null

  try {
    const result = await Tesseract.recognize(imageDataUrl, 'tha+eng')
    const text = result?.data?.text?.trim()
    if (!text) return null

    const info = {
      recipientName: '',
      trackingNumber: '',
      senderName: '',
      parcelType: ''
    }

    // 👤 Recipient
    const nameMatch = text.match(
      /(ชื่อผู้รับ|ผู้รับ|To|Recipient)[:\s]*([\u0E00-\u0E7Fa-zA-Z\s]{3,})/i
    )
    if (nameMatch) info.recipientName = nameMatch[2].trim()

    // 📦 Tracking (ไม่บังคับ TH)
    const trackingMatch = text.match(/[A-Z0-9\-]{8,20}/)
    if (trackingMatch) info.trackingNumber = trackingMatch[0]

    // 📤 Sender
    const senderMatch = text.match(
      /(ชื่อผู้ส่ง|ผู้ส่ง|From|Sender)[:\s]*([\u0E00-\u0E7Fa-zA-Z\s]{3,})/i
    )
    if (senderMatch) info.senderName = senderMatch[2].trim()

    // 📦 Parcel Type
    if (text.match(/(กล่อง|Box)/i)) info.parcelType = 'BOX'
    else if (text.match(/(ซอง|Document|Letter|Envelope)/i))
      info.parcelType = 'DOCUMENT'
    else if (text.match(/(Electronic|Device)/i))
      info.parcelType = 'ELECTRONIC'

    return info
  } catch {
    return null
  }
}

const processScanResult = (text) => {
  if (!text) return

  scanResult.value = text

  try {
    // Try to parse as JSON first
    const data = JSON.parse(text)
    
    // If it's an object, map fields
    if (typeof data === 'object' && data !== null) {
      if (data.trackingNumber) form.value.trackingNumber = data.trackingNumber
      if (data.recipientName) {
        form.value.recipientName = data.recipientName
        recipientSearch.value = data.recipientName
        // Try to find resident by name if available
        const resident = residents.value.find(r => {
           const fullName = (r.fullName || `${r.firstName} ${r.lastName}`).toLowerCase()
           return fullName === data.recipientName.toLowerCase()
        })
        if (resident) {
          selectedResidentId.value = resident.userId
        }
      }
      if (data.senderName) form.value.senderName = data.senderName
      if (data.parcelType) form.value.parcelType = data.parcelType
      if (data.companyId) form.value.companyId = data.companyId
      if (data.roomNumber) form.value.roomNumber = data.roomNumber
      
      return // Successfully processed as JSON
    }
  } catch (e) {
    // Not JSON, fall back to simple string (tracking number)
  }

  // Fallback: Treat as tracking number
  form.value.trackingNumber = text
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
    alert('Camera not ready')
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = videoRef.value.videoWidth
  canvas.height = videoRef.value.videoHeight

  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoRef.value, 0, 0)

  const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
  previewUrl.value = imageDataUrl

  const info = await extractParcelInfo(imageDataUrl)
  if (!info) return

  // ✅ OCR เติมเฉพาะสิ่งที่ช่วย user
  if (info.recipientName) {
    form.value.recipientName = info.recipientName
    recipientSearch.value = info.recipientName
  }
  if (info.trackingNumber) form.value.trackingNumber = info.trackingNumber
  if (info.senderName) form.value.senderName = info.senderName
  if (info.parcelType) form.value.parcelType = info.parcelType
}

function startQuagga() {
  let lastCode = ''
  let count = 0

  Quagga.init(
    {
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: barcodeReaderRef.value,
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
          'i2of5_reader',
          '2of5_reader',
          'code_93_reader'
        ]
      },
      locate: true
    },
    (err) => {
      if (err) {
        console.error(err)
        alert('Barcode Scanner Error: ' + err)
        return
      }
      Quagga.start()
    }
  )

  Quagga.onDetected((result) => {
    if (result?.codeResult?.code) {
      const detectedCode = result.codeResult.code.trim()
      
      if (detectedCode === lastCode) {
        count++
      } else {
        lastCode = detectedCode
        count = 1
      }

      if (count >= 5) {
        isSuccessScan.value = true
        setTimeout(() => {
          isSuccessScan.value = false
        }, 1000)

        processScanResult(detectedCode)
        
        if (!form.value.parcelType) {
          if (detectedCode.startsWith('B')) {
             form.value.parcelType = 'BOX'
          } else if (detectedCode.startsWith('D')) {
             form.value.parcelType = 'DOCUMENT'
          } else {
             form.value.parcelType = 'ELECTRONIC'
          }
        }

        // Require another 5 matches to process again
        lastCode = ''
        count = 0
      }
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
  nextTick(async () => {
    if (mode === 'qr') {
      const videoElem = document.getElementById('qr-video-sender')
      if (!videoElem) {
        alert('Video element not found')
        scanningMode.value = ''
        return
      }

      qrScanner = new QrScanner(
        videoElem,
        (result) => {
            if (result?.data) processScanResult(result.data)
            else if (typeof result === 'string') processScanResult(result)
        },
        { 
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
            calculateScanRegion: (video) => {
              const width = window.innerWidth
              let size = 400
              if (width < 640) size = 250
              else if (width < 768) size = 300
              
              const smallestDimension = Math.min(video.videoWidth, video.videoHeight)
              const scanRegionSize = Math.min(size, smallestDimension * 0.9)
              
              return {
                x: Math.round((video.videoWidth - scanRegionSize) / 2),
                y: Math.round((video.videoHeight - scanRegionSize) / 2),
                width: scanRegionSize,
                height: scanRegionSize
              }
            }
        }
      )
      
      try {
        await qrScanner.start()
      } catch (e) {
        alert('Failed to start QR scanning: ' + e)
        scanningMode.value = ''
      }
    } else if (mode === 'barcode') {
      startQuagga()
    }
  })
}

function stopScan() {
  scanningMode.value = ''
  if (qrScanner) {
    qrScanner.stop()
    qrScanner.destroy()
    qrScanner = null
  }
  stopQuagga()
  stopCameraOnly()
}

const saveParcel = async () => {
  // if (!form.value.trackingNumber) {
  //   trackingNumberError.value = true
  //   setTimeout(() => (trackingNumberError.value = false), 10000)
  //   return
  // }
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

  const selectedCompany = companyList.value.find(
    (c) => c.companyId === Number(form.value.companyId)
  )
  if (selectedCompany) {
    const name = selectedCompany.companyName.toLowerCase()
    const tracking = form.value.trackingNumber
    let isValid = true
    if (
      (name.includes('thailand post') || name.includes('thailandpost')) &&
      !/^[A-Z]{2}\d{9}TH$/.test(tracking)
    )
      isValid = false
    else if (
      name.includes('kerry') &&
      !/^(KEX)?[A-Z]\d{9,12}$/.test(tracking)
    )
      isValid = false
    else if (
      name.includes('flash') &&
      !/^TH\d{11}[A-Z]$/.test(tracking)
    )
      isValid = false
    else if ((name.includes('j&t') || name.includes('jt')) && !/^JD\d{13}$/.test(tracking))
      isValid = false
    else if (name.includes('dhl') && !/^\d{10,12}$/.test(tracking))
      isValid = false
    else if (name.includes('fedex') && !/^\d{12,22}$/.test(tracking))
      isValid = false

    if (!isValid) {
      trackingNumberFormatError.value = true
      setTimeout(() => (trackingNumberFormatError.value = false), 10000)
      return
    }
  }

  if (!/^[A-Za-zก-๙\s]*$/.test(form.value.senderName || '')) {
    SenderNameError.value = true
    setTimeout(() => (SenderNameError.value = false), 10000)
    return
  }
    if (
    form.value.trackingNumber &&
    !/^[A-Za-z0-9]+$/.test(form.value.trackingNumber)
  ) {
    trackingNumberError.value = true
    setTimeout(() => (trackingNumberError.value = false), 10000)
    return
  }

  // if (!/^[A-Za-z0-9]+$/.test(form.value.trackingNumber)) {
  //   trackingNumberError.value = true
  //   setTimeout(() => (trackingNumberError.value = false), 10000)
  //   return
  // }

  // if (form.value.trackingNumber && form.value.trackingNumber.length > 60) {
  //   trackingNumberError.value = true
  //   setTimeout(() => (trackingNumberError.value = false), 10000)
  //   return
  // }
  if (form.value.senderName && form.value.senderName.length > 100) {
    SenderNameError.value = true
    setTimeout(() => (SenderNameError.value = false), 10000)
    return
  }
  if (form.value.senderName && form.value.senderName.length < 6) {
    showSenderMinLengthError.value = true
    setTimeout(() => {
      showSenderMinLengthError.value = false
    }, 10000)
    return
  }
  try {
    const existingParcels = await getItems(
      `${import.meta.env.VITE_BASE_URL}/api/parcels`,
      router
    )
    if (Array.isArray(existingParcels)) {
      const isDuplicate = existingParcels.some(
        (p) =>
          p.trackingNumber === form.value.trackingNumber 
          // && p.companyId === Number(form.value.companyId)
      )

      if (isDuplicate) {
        duplicateParcelError.value = true
        setTimeout(() => (duplicateParcelError.value = false), 10000)
        return
      }
    }
  } catch (err) {
    console.error(err)
  }

  isLoading.value = true
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
    notificationManager.notifyParcelAdded(savedParcel)
    addSuccess.value = true
    setTimeout(() => (addSuccess.value = false), 10000)

    selectedResidentId.value = null
    recipientSearch.value = ''
    Object.assign(form.value, {
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
  } catch (err) {
    error.value = true
    setTimeout(() => (error.value = false), 10000)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await getItems(
      `${import.meta.env.VITE_BASE_URL}/api/public/parcels/residents`,
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
  if (operate === 'addSuccessMessage') addSuccess.value = false
  if (operate === 'roomNumber') roomNumberError.value = false
  if (operate === 'SenderName') SenderNameError.value = false
  if (operate === 'senderName') senderNameError.value = false
  if (operate === 'parcelType') parcelTypeError.value = false
  if (operate === 'parcelTypeRequired') parcelTypeErrorRequired.value = false
  if (operate === 'trackingNumber') trackingNumberError.value = false
  if (operate === 'trackingNumberFormat') trackingNumberFormatError.value = false
  if (operate === 'recipientName') recipientNameError.value = false
  if (operate === 'companyId') companyIdError.value = false
  if (operate === 'companyId') companyIdError.value = false
  if (operate === 'duplicateParcel') duplicateParcelError.value = false
  if (operate === 'senderNameMin') showSenderMinLengthError.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col pt-16">
    <WebHeader @toggle-sidebar="toggleSidebar" />
    <div class="flex flex-1">
      <main class="flex-1 p-9">
    <div class="flex items-center space-x-2 mb-8 border-l-4 border-[#0E4B90] pl-6 py-1">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-50 rounded-2xl text-[#0E4B90] shadow-sm">
        <svg
              width="24"
              height="24"
              viewBox="0 0 25 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.9674 2.6177C13.0261 2.23608 11.9732 2.23608 11.032 2.6177L8.75072 3.5427L18.7424 7.42812L22.257 6.07083C22.1124 5.95196 21.9509 5.85541 21.7778 5.78437L13.9674 2.6177ZM22.9163 7.49062L13.2809 11.2135V22.5917C13.5143 22.5444 13.7431 22.4753 13.9674 22.3844L21.7778 19.2177C22.1142 19.0814 22.4023 18.8478 22.6051 18.5468C22.808 18.2458 22.9163 17.8911 22.9163 17.5281V7.49062ZM11.7184 22.5917V11.2135L2.08301 7.49062V17.5292C2.08321 17.892 2.19167 18.2464 2.39449 18.5472C2.59732 18.8481 2.88529 19.0815 3.22155 19.2177L11.032 22.3844C11.2563 22.4746 11.4851 22.543 11.7184 22.5917ZM2.74238 6.07083L12.4997 9.84062L16.5799 8.26354L6.63926 4.39895L3.22155 5.78437C3.04377 5.85659 2.88405 5.95208 2.74238 6.07083Z"
                fill="currentColor"
              />
            </svg>
                </div>
                <h2 class="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight whitespace-nowrap">
                <span class="bg-clip-text text-transparent bg-gradient-to-r from-[#0E4B90] to-blue-600">
                     Manage parcel &gt; Add </span>
                </h2>
              </div>
        </div>

        <div
          class="max-w-full mx-auto bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-blue-50/50 overflow-hidden"
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
              operate="parcelType"
              @closePopUp="closePopUp"
            />
            <AlertPopUp
              v-if="trackingNumberError"
         :titles="'Tracking Number must contain only English letters (A–Z) and Arabic digits (0–9). Thai characters and Thai numerals are not allowed.'"
              message="Error!!"
              styleType="red"
              operate="trackingNumber"
              @closePopUp="closePopUp"
            />
            <AlertPopUp
              v-if="trackingNumberFormatError"
              :titles="'Tracking Number format is incorrect for the selected company.'"
              message="Error!!"
              styleType="red"
              operate="trackingNumberFormat"
              @closePopUp="closePopUp"
            />
            <AlertPopUp
              v-if="recipientNameError"
              :titles="'Recipient Name is required.'"
              message="Error!!"
              styleType="red"
              operate="recipientName"
              @closePopUp="closePopUp"
            />

            <AlertPopUp
              v-if="parcelTypeErrorRequired"
              :titles="'Parcel Type is required.'"
              message="Error!!"
              styleType="red"
              operate="parcelTypeRequired"
              @closePopUp="closePopUp"
            />

            <AlertPopUp
              v-if="senderNameError"
              :titles="'Sender Name is required.'"
              message="Error!!"
              styleType="red"
              operate="senderName"
              @closePopUp="closePopUp"
            />

            <AlertPopUp
              v-if="companyIdError"
              :titles="'Company ID is required.'"
              message="Error!!"
              styleType="red"
              operate="companyId"
              @closePopUp="closePopUp"
            />
            <AlertPopUp
              v-if="duplicateParcelError"
              :titles="'This tracking number is already associated with another resident. Please verify the information again.'"
              message="Error!!"
              styleType="red"
              operate="duplicateParcel"
              @closePopUp="closePopUp"
            />
          </div>

          <div class="grid md:grid-cols-2 gap-6 p-6">
            <div class="space-y-6">
              <div
                id="scanner"
                class="w-full h-58 sm:h-64 border-2 border-dashed border-blue-200 rounded-3xl bg-gray-900 flex items-center justify-center relative overflow-hidden shadow-inner"
              >
                <span v-if="!scanningMode && !videoStream" class="text-gray-400 font-medium tracking-wide">
                  Scan QR/Barcode or Take Picture
                </span>

                <div
                  id="scanner-overlay"
                  :class="
                    scanningMode ? 'w-full h-full absolute inset-0' : 'hidden'
                  "
                >
                  <div id="barcode-scanner-container" ref="barcodeReaderRef" v-show="scanningMode === 'barcode'" class="w-full h-full relative"></div>
                  <video id="qr-video-sender" v-show="scanningMode === 'qr'" class="w-full h-full object-cover"></video>
                  <div
                    v-if="scanningMode === 'barcode'"
                    class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden"
                  >
                    <!-- Shadow overlay -->
                    <div class="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"></div>
                    
                    <!-- Scanner Frame -->
                    <div class="relative w-64 h-32 md:w-80 md:h-40 z-20">
                      <!-- Corners -->
                      <div class="absolute top-0 left-0 w-10 h-10 border-t-[4px] border-l-[4px] transition-colors duration-300 rounded-tl-xl" :class="isSuccessScan ? 'border-green-400' : 'border-white/80'"></div>
                      <div class="absolute top-0 right-0 w-10 h-10 border-t-[4px] border-r-[4px] transition-colors duration-300 rounded-tr-xl" :class="isSuccessScan ? 'border-green-400' : 'border-white/80'"></div>
                      <div class="absolute bottom-0 left-0 w-10 h-10 border-b-[4px] border-l-[4px] transition-colors duration-300 rounded-bl-xl" :class="isSuccessScan ? 'border-green-400' : 'border-white/80'"></div>
                      <div class="absolute bottom-0 right-0 w-10 h-10 border-b-[4px] border-r-[4px] transition-colors duration-300 rounded-br-xl" :class="isSuccessScan ? 'border-green-400' : 'border-white/80'"></div>
                      
                      <!-- Scan Line animation -->
                      <div class="absolute left-0 top-0 w-full h-[3px] animate-scan-line" :class="isSuccessScan ? 'bg-green-400 shadow-[0_0_20px_5px_rgba(74,222,128,0.5)]' : 'bg-[#185DC0] shadow-[0_0_15px_3px_rgba(24,93,192,0.6)]'"></div>
                    </div>
                  </div>
                  <ButtonWeb
                    label="Cancel"
                    color="red"
                    class="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-red-600 z-20 cursor-pointer transition-all duration-300"
                    @click="stopScan"
                  />
                </div>

                <video
                  ref="videoRef"
                  :class="
                    videoStream
                      ? 'w-full h-full object-cover rounded-3xl'
                      : 'hidden'
                  "
                ></video>
                <ButtonWeb
                  label="Close Camera"
                  color="red"
                  class="absolute bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-red-600 cursor-pointer transition-all duration-300"
                  v-if="videoStream"
                  @click="stopCameraOnly"
                />
              </div>

              <div class="flex flex-row flex-nowrap gap-3 px-2 overflow-x-auto items-center">
                <ButtonWeb
                  label="Scan"
                  color="blue"
                  class="cursor-pointer hover:opacity-90 rounded-xl transition-all duration-300"
                  @click="startScan('qr')"
                  :disabled="scanningMode || videoStream"
                />
                <ButtonWeb
                  label="Scan Barcode"
                  color="blue"
                  class="cursor-pointer hover:opacity-90 rounded-xl transition-all duration-300"
                  @click="startScan('barcode')"
                  :disabled="scanningMode || videoStream"
                />
              </div>

              <div class="space-y-5">
                <div>
                  <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
                    Tracking number <span class="text-red-500">*</span>
                  </label>
                  <input
                    :value="form.trackingNumber"
                    @input="handleTrackingInput"
                    placeholder="Enter tracking number"
                    class="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-800 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-[#0E4B90]"
                    :class="[
                      showTrackingLengthError
                        ? 'border-red-400 ring-4 ring-red-50'
                        : ''
                    ]"
                  />
                  <div
                    v-if="showTrackingLengthError"
                    class="flex items-center text-sm text-red-600 mt-1.5 ml-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      class="w-4 h-4 mr-1.5"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div class="text-xs font-medium">
                      Tracking number must be at most 22 characters
                    </div>
                  </div>
                </div>
                <div class="relative">
                  <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
                    Recipient <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="recipientSearch"
                    type="text"
                    placeholder="Enter resident name / room number"
                    class="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-800 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-[#0E4B90]"
                  />

                  <ul
                    v-if="showSuggestions"
                    class="absolute z-[60] mt-2 w-full bg-white border border-gray-100 rounded-2xl max-h-60 overflow-y-auto overflow-x-hidden text-sm shadow-2xl py-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
                  >
                    <li
                      v-for="r in filteredResidents"
                      :key="r.userId"
                      @click="selectResident(r)"
                      class="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors flex flex-col gap-0.5"
                    >
                      <span class="font-bold text-gray-800">{{ r.fullName }}</span>
                      <span class="text-xs text-gray-500">Room {{ r.roomNumber }}</span>
                    </li>
                    <li
                      v-if="filteredResidents.length === 0"
                      class="px-4 py-3 text-gray-400 italic text-center"
                    >
                      No residents found matching your search.
                    </li>
                  </ul>
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
                    Parcel type <span class="text-red-500">*</span>
                  </label>

                  <SelectWeb
                    v-model="form.parcelType"
                    :options="parcelTypeOptions"
                    placeholder="Select parcel type"
                  />
                </div>

                <div>
                  <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
                    Status <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.status"
                    class="w-full bg-gray-100/50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-500 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div>
                  <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">Sender name</label>
                  <input
                    :value="form.senderName"
                    @input="handleSenderInput"
                    placeholder="Enter sender name"
                    class="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-800 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-[#0E4B90]"
                    :class="[
                      showSenderLengthError || showSenderMinLengthError
                        ? 'border-red-400 ring-4 ring-red-50'
                        : ''
                    ]"
                  />
                  <div
                    v-if="showSenderLengthError"
                    class="flex items-center text-sm text-red-600 mt-1.5 ml-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      class="w-4 h-4 mr-1.5"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div class="text-xs font-medium">
                      Sender name must be at most 100 characters
                    </div>
                  </div>
                  <div
                    v-if="showSenderMinLengthError"
                    class="flex items-center text-sm text-red-600 mt-1.5 ml-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      class="w-4 h-4 mr-1.5"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div class="text-xs font-medium">
                      Sender name must be at least 6 characters
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-500 mb-2 ml-1">
                    Company <span class="text-red-500">*</span>
                  </label>
                  <SelectWeb
                    v-model="form.companyId"
                    :options="companyOptions"
                    placeholder="Select company"
                    direction="up"
                  />
                </div>
              </div>

              <div class="flex justify-end space-x-3 mt-8 px-7">
                <ButtonWeb
                  label="Reset"
                  color="red"
                  class="block md:hidden cursor-pointer hover:opacity-90 transition-all rounded-xl shadow-lg shadow-red-500/10"
                  @click="cancelParcel"
                />
                <ButtonWeb
                  label="Save"
                  color="green"
                  @click="saveParcel"
                  :loading="isLoading"
                  :class="{
                    'bg-gray-300 text-gray-100 cursor-not-allowed shadow-none': isAllFilled,
                    'bg-[#0E4B90] hover:bg-[#185DC0] text-white shadow-xl shadow-blue-500/20': !isAllFilled
                  }"
                  :disabled="isAllFilled"
                  class="block md:hidden cursor-pointer transition-all rounded-xl"
                />
              </div>
            </div>

            <div
              class="hidden sm:flex flex-col bg-gray-50/50 border-l border-gray-100 p-8 rounded-tr-3xl rounded-br-3xl"
            >
              <div class="flex items-center gap-3 mb-8 border-l-4 border-[#185DC0] pl-6 py-1">
                <h2 class="text-2xl font-bold text-gray-800 tracking-tight">
                  Parcel information
                </h2>
              </div>

              <div class="space-y-4 flex-1">
                <div class="bg-white p-5 rounded-2xl border border-gray-100/50 shadow-sm transition-all hover:shadow-md">
                  <div class="flex items-center justify-between py-2 border-b border-gray-50">
                    <span class="text-sm font-bold text-gray-400">Tracking:</span>
                    <span class="font-bold text-[#185DC0] truncate max-w-[200px]">{{ form.trackingNumber || '-' }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-gray-50">
                    <span class="text-sm font-bold text-gray-400">Recipient:</span>
                    <span class="font-bold text-gray-800 truncate max-w-[200px]">{{
                      selectedResident
                        ? selectedResident.fullName
                        : (form.recipientName || '-')
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-gray-50">
                    <span class="text-sm font-bold text-gray-400">Room:</span>
                    <span class="font-bold text-gray-800">{{
                      selectedResident ? selectedResident.roomNumber : '-'
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-gray-50">
                    <span class="text-sm font-bold text-gray-400">Type:</span>
                    <span class="font-bold text-gray-800">{{ form.parcelType || '-' }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-gray-50">
                    <span class="text-sm font-bold text-gray-400">Status:</span>
                    <span class="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#185DC0]">{{ form.status }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-gray-50">
                    <span class="text-sm font-bold text-gray-400">Company:</span>
                    <span class="font-bold text-gray-800 truncate max-w-[200px]">
                      {{
                        companyList.find((c) => c.companyId === form.companyId)
                          ?.companyName || '-'
                      }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-sm font-bold text-gray-400">Sender:</span>
                    <span class="font-bold text-gray-800 truncate max-w-[200px]">{{ form.senderName || '-' }}</span>
                  </div>
                </div>

                <div v-if="previewUrl" class="mt-6">
                  <span class="block text-sm font-bold text-gray-500 mb-3 ml-1">Parcel picture</span>
                  <div class="relative group">
                    <img
                      :src="previewUrl"
                      class="w-full rounded-2xl shadow-xl border-4 border-white max-h-64 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <button
                      @click="deletePreview"
                      class="absolute -top-3 -right-3 bg-red-500 text-white rounded-full shadow-lg w-8 h-8 flex items-center justify-center hover:bg-red-600 cursor-pointer transition-all duration-300 border-2 border-white"
                      title="Clear photo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex justify-end space-x-3 mt-8 flex-nowrap border-t border-gray-100 pt-8">
                <ButtonWeb
                  label="Reset"
                  color="red"
                  @click="cancelParcel"
                  class="w-auto cursor-pointer hover:opacity-90 transition-all rounded-xl shadow-lg shadow-red-500/10"
                />
                <ButtonWeb
                  label="Save"
                  color="green"
                  @click="saveParcel"
                  :loading="isLoading"
                  :class="{
                    'bg-gray-300 text-gray-100 cursor-not-allowed shadow-none': isAllFilled,
                    'bg-[#0E4B90] hover:bg-[#185DC0] text-white shadow-xl shadow-blue-500/20': !isAllFilled
                  }"
                  :disabled="isAllFilled"
                  class="w-auto cursor-pointer transition-all rounded-xl px-8"
                />
              </div>

              <div class="mt-8">
                <!-- <span class="block text-sm font-bold text-gray-400 mb-4 ml-1">Saved parcels</span> -->
                <ul class="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                  <li
                    v-for="(p, i) in savedParcels"
                    :key="i"
                    class="bg-white border border-gray-50 rounded-2xl p-4 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md hover:border-blue-100 group"
                  >
                    <div class="flex-1 space-y-1">
                      <div class="text-sm font-bold text-gray-800">{{ p.recipientName }}</div>
                      <div class="text-[11px] font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <span class="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        {{ p.trackingNumber }}
                      </div>
                      <div class="text-xs text-gray-500 bg-gray-50 inline-block px-2 py-0.5 rounded-lg">{{ p.parcelType }}</div>
                    </div>
                    <div v-if="p.imageUrl" class="shrink-0">
                      <img
                        :src="p.imageUrl"
                        class="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-100"
                      />
                    </div>
                    <button
                      @click="deleteSaveInformation(i)"
                      class="absolute -top-2 -right-2 bg-white text-red-500 rounded-full shadow-lg w-7 h-7 flex items-center justify-center hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-300 border border-red-50 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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

#barcode-scanner-container :deep(video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}
#barcode-scanner-container :deep(canvas.drawingBuffer) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}
@keyframes scan-line {
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
.animate-scan-line {
  animation: scan-line 2s linear infinite;
}
</style>
