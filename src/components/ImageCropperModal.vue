<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  imageSrc: String
})

const emit = defineEmits(['close', 'crop'])

const canvasRef = ref(null)
const containerRef = ref(null)
const imageRef = ref(null)

const scale = ref(1)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const startPos = ref({ x: 0, y: 0 })

// Reset when opening
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      scale.value = 1
      position.value = { x: 0, y: 0 }
    }
  }
)

const onMouseDown = (e) => {
  isDragging.value = true
  startPos.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
}

const onMouseMove = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  position.value = {
    x: e.clientX - startPos.value.x,
    y: e.clientY - startPos.value.y
  }
}

const onMouseUp = () => {
  isDragging.value = false
}

// Touch support
const onTouchStart = (e) => {
  isDragging.value = true
  const touch = e.touches[0]
  startPos.value = {
    x: touch.clientX - position.value.x,
    y: touch.clientY - position.value.y
  }
}

const onTouchMove = (e) => {
  if (!isDragging.value) return
  const touch = e.touches[0]
  position.value = {
    x: touch.clientX - startPos.value.x,
    y: touch.clientY - startPos.value.y
  }
}

const imageStyle = ref({})

const onImageLoad = (e) => {
  const img = e.target
  const aspect = img.naturalWidth / img.naturalHeight
  
  // Container is square
  if (aspect >= 1) {
    // Landscape or Square: Fit Height, Width auto
    imageStyle.value = {
      height: '100%',
      width: 'auto',
      maxWidth: 'none'
    }
  } else {
    // Portrait: Fit Width, Height auto
    imageStyle.value = {
      width: '100%',
      height: 'auto',
      maxHeight: 'none'
    }
  }
}

const cropImage = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = imageRef.value
  const container = containerRef.value

  if (!img || !container) return
  if (img.naturalWidth === 0 || img.naturalHeight === 0) return

  // Output size (e.g., 500x500 for profile)
  const size = 500
  canvas.width = size
  canvas.height = size

  // Get bounding rects (visual position)
  const containerRect = container.getBoundingClientRect()
  const imgRect = img.getBoundingClientRect()

  // Calculate scaling relative to the output canvas size
  // We want to map the visual representation in the container (256x256 visually)
  // to the 500x500 canvas.
  const pixelRatio = size / containerRect.width

  // Calculate position relative to container
  const relativeLeft = (imgRect.left - containerRect.left) * pixelRatio
  const relativeTop = (imgRect.top - containerRect.top) * pixelRatio
  const scaledWidth = imgRect.width * pixelRatio
  const scaledHeight = imgRect.height * pixelRatio

  // Clear background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, size, size)

  // Draw image
  ctx.drawImage(
    img, 
    0, 0, img.naturalWidth, img.naturalHeight,
    relativeLeft, 
    relativeTop, 
    scaledWidth, 
    scaledHeight
  )

  canvas.toBlob((blob) => {
    if (blob) {
      emit('crop', blob)
    } else {
      console.error('Canvas to Blob failed')
    }
  }, 'image/jpeg', 0.9)
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div class="bg-white rounded-2xl p-6 w-[90%] max-w-md flex flex-col items-center gap-4 animate-scale-in">
      <h3 class="text-xl font-semibold text-gray-800">Adjust Image</h3>
      
      <!-- Viewport (Crop Area) -->
      <div 
        ref="containerRef"
        class="relative w-64 h-64 rounded-full overflow-hidden border-4 border-blue-500 shadow-inner bg-gray-100 cursor-move touch-none"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onMouseUp"
      >
        <img 
          ref="imageRef"
          :src="imageSrc" 
          @load="onImageLoad"
          class="absolute origin-center pointer-events-none select-none"
          :style="[
            imageStyle,
            { 
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
              left: '50%',
              top: '50%'
            }
          ]"
        />
      </div>

      <!-- Controls -->
      <div class="w-full px-4">
        <label class="text-xs text-gray-500 mb-1 block">Zoom</label>
        <input 
          type="range" 
          min="1" 
          max="3" 
          step="0.01" 
          v-model.number="scale"
          class="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div class="flex gap-3 w-full mt-2">
        <button 
          @click="$emit('close')"
          class="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition cursor-pointer"
        >
          Cancel
        </button>
        <button 
          @click="cropImage"
          class="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition shadow-md cursor-pointer"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}
@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
