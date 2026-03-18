import { defineStore } from 'pinia'
import { ref, onMounted, onUnmounted } from 'vue'

export const useSidebarManager = defineStore('sidebarManager', () => {
  const isMobile = () => window.innerWidth < 768
  
  // Use localStorage to persist the state even after refresh, but default to collapsed on mobile
  const storedState = localStorage.getItem('sidebar_collapsed')
  const isCollapsed = ref(storedState === null ? isMobile() : storedState === 'true')

  const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value
    localStorage.setItem('sidebar_collapsed', isCollapsed.value)
  }

  const checkScreenSize = () => {
    if (isMobile()) {
      isCollapsed.value = true
    }
  }

  const resetSidebar = () => {
    localStorage.removeItem('sidebar_collapsed')
    isCollapsed.value = isMobile()
  }

  // Set up listener for window resizing
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkScreenSize)
  }

  return { isCollapsed, toggleSidebar, checkScreenSize, resetSidebar }
})
