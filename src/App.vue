<script setup>
import { watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthManager } from '@/stores/AuthManager'
import { useNotificationManager } from '@/stores/NotificationManager'

const auth = useAuthManager()
const notiStore = useNotificationManager()

watch(
  [() => auth.isLoggedIn, () => auth.user?.accessToken],
  ([isLoggedIn, token]) => {
    if (isLoggedIn && token) {
      notiStore.connectWebSocket()
    } else if (!isLoggedIn) {
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
