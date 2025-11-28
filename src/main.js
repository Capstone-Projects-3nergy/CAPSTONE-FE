import './assets/style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from '../router/index.js'
import { createPinia } from 'pinia'
import { useAuthManager } from '@/stores/AuthManager.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const authManager = useAuthManager()

authManager.loadUserFromBackend()

authManager.useAuthGuard(router)

app.use(router)

app.mount('#app')
