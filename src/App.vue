<script setup>
import { watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthManager } from '@/stores/AuthManager'
import { useNotificationManager } from '@/stores/NotificationManager'

const auth = useAuthManager()
const notiStore = useNotificationManager()

// ✅ Auto Connect/Disconnect WebSocket based on login status & token availability
watch(
  [() => auth.isLoggedIn, () => auth.user?.accessToken],
  ([isLoggedIn, token]) => {
    if (isLoggedIn && token) {
      console.log('App: User ready with token, connecting WebSocket...')
      notiStore.connectWebSocket()
    } else if (!isLoggedIn) {
      console.log('App: User logged out, disconnecting WebSocket...')
      notiStore.disconnectWebSocket()
    }
  },
  { immediate: true }
)
</script>

<template>
  <router-view></router-view>
</template>
<style scoped></style>
