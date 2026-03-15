<script setup>
import UserInfo from '@/components/UserInfo.vue'
import { computed, ref } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'

const authStore = useAuthManager()
const userFullName = computed(() => authStore.user?.fullName || 'User')
const userInfoRef = ref(null)

defineProps({
  title: String,
  collapsed: Boolean
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
  <div class="flex flex-col">
    <!-- Main Sidebar Item - Hidden for 'Log Out' to consolidate with UserInfo -->
    <div
      v-if="title !== 'Log Out'"
      @click="$emit('click')"
      class="flex items-center cursor-pointer rounded-none transition-all duration-300 ease-in-out hover:scale-[1.02]"
      :class="[
        title !== 'Tractify' 
          ? (collapsed ? '!px-0 !justify-center hover:bg-white/20 hover:shadow-lg py-4' : 'hover:bg-white/20 hover:shadow-lg p-4 gap-3') 
          : 'py-4 pr-4 pl-2 gap-5',
        collapsed && title === 'Tractify' ? '!px-0 !justify-center' : ''
      ]"
    >
      <div 
        class="flex-shrink-0 flex items-center justify-center transition-all duration-300"
        :class="collapsed && title === 'Tractify' ? 'scale-110' : ''"
      >
        <slot name="icon"></slot>
      </div>
      <span
        v-if="!collapsed"
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

    <!-- UserInfo component used as the final sidebar item, replacing 'Log Out' -->
    <div 
      v-if="title === 'Log Out'" 
      class="flex flex-col mt-auto border-t border-white/10 pt-4 mb-4"
    >
      <div 
        @click="userInfoRef?.toggleDropdown"
        class="group/user flex items-center cursor-pointer transition-all duration-300 hover:bg-white/20 hover:shadow-lg rounded-none w-full py-4 active:bg-white/30"
        :class="collapsed ? '!justify-start !pl-1' : 'px-4 gap-3'"
      >
        <div class="flex-shrink-0">
          <UserInfo ref="userInfoRef" align="left" manual-trigger />
        </div>
        
        <div 
          v-if="!collapsed" 
          class="flex flex-col min-w-0 transition-all duration-300"
        >
          <span class="text-[14px] font-bold text-white truncate">
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
/* Ensure the container transitions smoothly */
.user-info-wrapper {
  transition: all 0.3s ease-in-out;
}
</style>
