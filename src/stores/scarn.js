let countdownTimer
let html5QrCode = null
let currentMode = null // 'QR', 'BARCODE', 'FILE', 'CAPTURE'
let captureStream = null

function showResult(decodedText, type = 'ไม่ทราบ') {
  const resultDiv = document.getElementById('result')
  const typeDiv = document.getElementById('type')
  const countdownDiv = document.getElementById('countdown')

  if (type && type.toLowerCase().includes('code')) type = type.toUpperCase()

  if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
    resultDiv.innerHTML = `✅ สแกนได้: <a href="${decodedText}" target="_blank" class="text-blue-600 underline">${decodedText}</a>`
  } else {
    resultDiv.innerHTML = `✅ สแกนได้: ${decodedText}`
  }

  typeDiv.innerText = `📌 ประเภทโค้ด: ${type}`

  clearInterval(countdownTimer)
  let timeLeft = 60
  countdownDiv.innerText = `ข้อมูลจะหายใน ${timeLeft} วินาที`

  countdownTimer = setInterval(() => {
    timeLeft--
    if (timeLeft > 0) {
      countdownDiv.innerText = `ข้อมูลจะหายใน ${timeLeft} วินาที`
    } else {
      clearInterval(countdownTimer)
      resultDiv.innerHTML = '👉 รอสแกน...'
      typeDiv.innerHTML = ''
      countdownDiv.innerHTML = ''
    }
  }, 1000)
}

function stopScan() {
  if (html5QrCode) {
    html5QrCode.stop().catch(() => {})
    html5QrCode.clear()
    html5QrCode = null
  }
  if (captureStream) {
    captureStream.getTracks().forEach((track) => track.stop())
    captureStream = null
  }
  document.getElementById('scanner').innerHTML = ''
}

// สแกน QR
function startQrScan() {
  currentMode = 'QR'
  toggleView('scanner')

  stopScan()
  html5QrCode = new Html5Qrcode('scanner')
  html5QrCode
    .start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      (decodedText, decodedResult) => {
        showResult(
          decodedText,
          decodedResult.result.format.formatName || 'QR_CODE'
        )
      }
    )
    .catch((err) => console.error('ไม่สามารถเปิดกล้องได้', err))
}

// สแกน Barcode
function startBarcodeScan() {
  currentMode = 'BARCODE'
  toggleView('scanner')

  stopScan()
  html5QrCode = new Html5Qrcode('scanner')
  html5QrCode
    .start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: 250,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E
        ]
      },
      (decodedText, decodedResult) => {
        showResult(
          decodedText,
          decodedResult.result.format.formatName || 'BAR_CODE'
        )
      }
    )
    .catch((err) => console.error('ไม่สามารถเปิดกล้องได้', err))
}

// toggle UI
function toggleView(mode) {
  document.getElementById('scanner').classList.add('hidden')
  document.getElementById('file-input-container').classList.add('hidden')
  document.getElementById('uploaded-image').classList.add('hidden')
  document.getElementById('capture-canvas').classList.add('hidden')
  document.getElementById('download-btn').classList.add('hidden')

  if (mode === 'scanner')
    document.getElementById('scanner').classList.remove('hidden')
  if (mode === 'file')
    document.getElementById('file-input-container').classList.remove('hidden')
  if (mode === 'canvas')
    document.getElementById('capture-canvas').classList.remove('hidden')

  document.getElementById('home-btn').classList.remove('hidden')
}

// สแกนจากไฟล์
document.getElementById('start-file').addEventListener('click', () => {
  stopScan()
  toggleView('file')
})

const fileInput = document.getElementById('file-input')
const uploadedImage = document.getElementById('uploaded-image')
document
  .getElementById('file-input-container')
  .addEventListener('click', () => fileInput.click())

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length === 0) return
  const file = e.target.files[0]

  const reader = new FileReader()
  reader.onload = function (event) {
    uploadedImage.src = event.target.result
    uploadedImage.classList.remove('hidden')

    const html5QrCodeFile = new Html5Qrcode('scanner')
    html5QrCodeFile
      .scanFile(file, true)
      .then((decodedText) => showResult(decodedText, 'FILE_SCAN'))
      .catch(() => alert('❌ ไม่พบ QR หรือ Barcode ในรูป'))
  }
  reader.readAsDataURL(file)
})

// ถ่ายรูปพัสดุ
document.getElementById('start-capture').addEventListener('click', async () => {
  stopScan()
  currentMode = 'CAPTURE'
  toggleView('scanner')

  const videoContainer = document.getElementById('scanner')
  videoContainer.innerHTML = ''

  const video = document.createElement('video')
  video.className = 'w-80 h-60 rounded-lg border'
  videoContainer.appendChild(video)

  try {
    captureStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    })
    video.srcObject = captureStream
    video.play()
  } catch (err) {
    alert('❌ ไม่สามารถเข้าถึงกล้องได้')
    console.error(err)
    return
  }

  const snapBtn = document.createElement('button')
  snapBtn.innerText = '📸 ถ่ายรูปพัสดุ'
  snapBtn.className =
    'mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition'
  videoContainer.appendChild(snapBtn)

  snapBtn.addEventListener('click', () => {
    const canvas = document.getElementById('capture-canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.classList.remove('hidden')

    const downloadBtn = document.getElementById('download-btn')
    downloadBtn.classList.remove('hidden')
    downloadBtn.onclick = () => {
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = 'parcel.png'
      link.click()
    }
  })
})

// ปุ่ม Home
document.getElementById('home-btn').addEventListener('click', () => {
  stopScan()
  document.getElementById('scanner').classList.add('hidden')
  document.getElementById('file-input-container').classList.add('hidden')
  document.getElementById('uploaded-image').classList.add('hidden')
  document.getElementById('capture-canvas').classList.add('hidden')
  document.getElementById('download-btn').classList.add('hidden')
  document.getElementById('home-btn').classList.add('hidden')
  document.getElementById('result').innerHTML = '👉 รอสแกน...'
  document.getElementById('type').innerHTML = ''
  document.getElementById('countdown').innerHTML = ''
  fileInput.value = ''
})

document.getElementById('start-qr').addEventListener('click', startQrScan)
document
  .getElementById('start-barcode')
  .addEventListener('click', startBarcodeScan)
