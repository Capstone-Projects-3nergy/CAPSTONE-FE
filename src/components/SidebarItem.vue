<script setup>
import UserInfo from '@/components/UserInfo.vue'
import { computed, ref } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'
import { useSidebarManager } from '@/stores/SidebarManager'

const authStore = useAuthManager()
const sidebarManager = useSidebarManager()
const userFullName = computed(() => authStore.user?.fullName || 'User')
const userInfoRef = ref(null)

const props = defineProps({
  title: String,
  collapsed: {
    type: Boolean,
    default: null
  }
})

const isCollapsed = computed(() => {
  if (props.collapsed !== null) return props.collapsed
  return sidebarManager.isCollapsed
})

defineEmits(['click'])

const userRole = computed(() => {
  const role = authStore.user?.role
  if (!role) return ''
  switch (role.toUpperCase()) {
    case 'STAFF':
      return authStore.user.position
    case 'RESIDENT':
      return 'Resident' 
    default:
      return 'User'
  }
})
</script>

<template>
  <div class="flex flex-col w-full">
    <div
      v-if="title !== 'Log Out'"
      @click="$emit('click')"
      class="flex items-center cursor-pointer rounded-none transition-all duration-300 ease-in-out hover:scale-[1.02] w-full"
      :class="[
        title !== 'Tractify' 
          ? (isCollapsed ? '!px-0 !justify-center hover:bg-white/20 hover:shadow-lg py-4' : 'hover:bg-white/20 hover:shadow-lg p-4 gap-3') 
          : 'py-4 pr-4 pl-2 gap-5',
        isCollapsed && title === 'Tractify' ? '!px-0 !justify-center' : ''
      ]"
    >
      <div 
        class="flex-shrink-0 flex items-center justify-center transition-all duration-300"
        :class="isCollapsed && title === 'Tractify' ? 'scale-110' : ''"
      >
        <slot name="icon"></slot>
      </div>
      <span
        v-if="!isCollapsed"
        class="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left"
        :class="
          title === 'Tractify'
            ? 'text-[24px] font-black text-white tracking-wide'
            : 'text-[14px] font-bold text-gray-300'
        "
      >
        {{ title }}
      </span>
    </div>

    <div 
      v-if="title === 'Log Out'" 
      class="flex flex-col mt-auto border-t border-white/10 pt-4 mb-4 w-full"
    >
      <div 
        @click="userInfoRef?.toggleDropdown"
        class="group/user flex items-center cursor-pointer transition-all duration-300 hover:bg-white/20 hover:shadow-lg rounded-none w-full py-4 active:bg-white/30"
        :class="isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'"
      >
        <div class="flex-shrink-0">
          <UserInfo ref="userInfoRef" align="left" manual-trigger />
        </div>
        
        <div 
          v-if="!isCollapsed" 
          class="flex flex-col min-w-0 transition-all duration-300"
        >
          <span class="text-[14px] font-bold text-gray-300 truncate">
            {{ userFullName }}
          </span>
          <span class="text-[11px] text-gray-400/80 font-medium truncate tracking-tight">
            {{ userRole }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-info-wrapper {
  transition: all 0.3s ease-in-out;
}
</style>
