import './assets/style.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from '../router/index.js'
import { createPinia } from 'pinia'
import { useRegisterManager } from '@/stores/RegisterManager'
const app = createApp(App)
app.use(createPinia())
app.use(router)
// ✅ เริ่มติดตามสถานะผู้ใช้
const registerManager = useRegisterManager()
registerManager.initAuthWatcher()
app.mount('#app')
// createApp(App).mount('#app')
