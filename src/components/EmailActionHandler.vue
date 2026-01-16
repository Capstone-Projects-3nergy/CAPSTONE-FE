<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/firebase/firebaseConfig'

const router = useRouter()

onMounted(async () => {
  // รอ Firebase restore session
  await auth.authStateReady?.()

  const user = auth.currentUser
  if (!user) {
    router.replace('/login')
    return
  }

  // 🔎 redirect ตาม role
  if (user.role === 'staff') {
    router.replace(`/homepage/staff/${user.uid}/profile`)
  } else {
    router.replace(`/homepage/resident/${user.uid}/profile`)
  }
})
</script>

<template>
  <div class="p-6 text-center">✅ Email verified. Redirecting...</div>
</template>
