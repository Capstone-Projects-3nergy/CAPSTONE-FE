import './assets/style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from '../router/index.js'
import { createPinia } from 'pinia'
import { useLoginManager } from '@/stores/LoginManager.js'

const app = createApp(App)
const pinia = createPinia()

// ✅ ต้อง use Pinia ก่อนถึงจะเรียก store ได้
app.use(pinia)
app.use(router)

// ✅ ตอนนี้ค่อยเรียกใช้ store ได้
const loginManager = useLoginManager()

// ♻️ restore user + ติดตั้ง guard
loginManager.restoreUserFromLocalStorage()
loginManager.useAuthGuard(router)

app.mount('#app')
