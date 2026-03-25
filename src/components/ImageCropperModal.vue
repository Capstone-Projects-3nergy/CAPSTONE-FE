<script setup>
import { ref, watch } from 'vue'
import ButtonWeb from './ButtonWeb.vue'

const props = defineProps({
  isOpen: Boolean,
  imageSrc: String
})

const emit = defineEmits(['close', 'crop'])

const containerRef = ref(null)
const imageRef = ref(null)

const scale = ref(1)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const startPos = ref({ x: 0, y: 0 })


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
  if (!props.isOpen) return
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


const onTouchStart = (e) => {
  if (!props.isOpen) return
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
  
  if (aspect >= 1) {
    imageStyle.value = {
      height: '100%',
      width: 'auto',
      maxWidth: 'none'
    }
  } else {
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

  const size = 500
  canvas.width = size
  canvas.height = size

  const containerRect = container.getBoundingClientRect()
  const imgRect = img.getBoundingClientRect()
  const pixelRatio = size / containerRect.width

  const relativeLeft = (imgRect.left - containerRect.left) * pixelRatio
  const relativeTop = (imgRect.top - containerRect.top) * pixelRatio
  const scaledWidth = imgRect.width * pixelRatio
  const scaledHeight = imgRect.height * pixelRatio

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, size, size)

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
    }
  }, 'image/jpeg', 0.9)
}
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[999] flex items-center justify-center p-4">
   
      <div 
        class="absolute inset-0 bg-[#07192F]/80 backdrop-blur-md" 
        @click="$emit('close')"
      ></div>
      

      <div class="relative bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(7,25,47,0.3)] w-full max-w-md overflow-hidden animate-premium-in">
  
        <div class="px-8 pt-8 pb-4 flex flex-col items-center text-center">
          <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-[#0E4B90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 class="text-2xl font-black text-[#07192F] tracking-tight">Adjust Image</h3>
          <p class="text-gray-400 text-sm mt-1">Drag and scale to fit the frame</p>
        </div>

    
        <div class="flex justify-center p-0 bg-[#07192F] overflow-hidden">
       
          <div 
            class="relative w-full aspect-square max-w-[360px] flex items-center justify-center cursor-move touch-none p-8"
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
              class="absolute origin-center pointer-events-none select-none max-w-none"
              :style="[
                imageStyle,
                { 
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                  left: '50%',
                  top: '50%'
                }
              ]"
            />

         
            <div 
              ref="containerRef"
              class="relative w-64 h-64 rounded-full border-[4px] border-white/90 shadow-[0_0_0_999px_rgba(7,25,47,0.7)] z-10 pointer-events-none"
            >
              <div class="absolute inset-0 rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]"></div>
            </div>
          </div>
        </div>

        <div class="px-8 py-6 space-y-6">
          <div class="space-y-3">
            <div class="flex justify-between items-center px-1">
              <label class="text-xs font-bold text-gray-400 tracking-widest">Zoom Level</label>
              <span class="text-xs font-bold text-[#0E4B90]">{{ Math.round(scale * 100) }}%</span>
            </div>
            <div class="relative flex items-center group">
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.01" 
                v-model.number="scale"
                class="premium-slider"
              />
            </div>
          </div>

          <div class="flex gap-4 pt-2">
            <ButtonWeb 
              label="Cancel"
              color="white-outline"
              @click="$emit('close')"
              class="flex-1 !py-4"
            />
            <ButtonWeb 
              label="Save Change"
              color="navy"
              @click="cropImage"
              class="flex-1 !py-4"
            />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.animate-premium-in {
  animation: premiumIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes premiumIn {
  from { transform: translateY(20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.premium-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: #f1f5f9;
  border-radius: 10px;
  outline: none;
  transition: all 0.3s;
}

.premium-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: #ffffff;
  border: 2px solid #0E4B90;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(14, 75, 144, 0.15);
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.premium-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: #0E4B90;
  border-color: #ffffff;
}

.premium-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: #ffffff;
  border: 2px solid #0E4B90;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(14, 75, 144, 0.15);
  transition: all 0.2s;
}
</style>
