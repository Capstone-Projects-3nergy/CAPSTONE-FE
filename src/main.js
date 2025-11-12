// main.js
import './assets/style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from '../router/index.js'
import { createPinia } from 'pinia'
import { useAuthManager } from '@/stores/AuthManager.js'

const app = createApp(App)
const pinia = createPinia()

// ต้องใช้ Pinia ก่อนเรียกใช้ store ใด ๆ
app.use(pinia)

// ✅ เรียกใช้ store หลังจาก app.use(pinia)
const authManager = useAuthManager()

// ✅ โหลดข้อมูลผู้ใช้จาก backend (แทน localStorage)
authManager.loadUserFromBackend()

// ✅ ติดตั้ง Navigation Guard
authManager.useAuthGuard(router)

// ✅ จากนั้นค่อยใช้ router
app.use(router)

// ✅ Mount App
app.mount('#app')

// import './assets/style.css'
// import { createApp } from 'vue'
// import App from './App.vue'
// import router from '../router/index.js'
// import { createPinia } from 'pinia'
// import { useAuthManager } from '@/stores/AuthManager.js'

// const app = createApp(App)
// const pinia = createPinia()

// // ต้องใช้ Pinia ก่อนเรียกใช้ store ใด ๆ
// app.use(pinia)

// // ✅ เรียกใช้ store หลังจาก app.use(pinia)
// const authManager = useAuthManager()

// // โหลดข้อมูลผู้ใช้จาก localStorage
// authManager.loadUserFromLocalStorage()

// // ติดตั้ง Navigation Guard
// authManager.useAuthGuard(router)

// // จากนั้นค่อยใช้ router
// app.use(router)

// // Mount App
// app.mount('#app')

// import './assets/style.css'
// import { createApp } from 'vue'
// import App from './App.vue'
// import router from '../router/index.js'
// import { createPinia } from 'pinia'

// // ✅ เปลี่ยนจาก useLoginManager → useAuthManager
// import { useAuthManager } from '@/stores/AuthManager.js'

// const app = createApp(App)
// const pinia = createPinia()

// // ✅ ต้องใช้ Pinia ก่อน ถึงจะเรียก store ได้
// app.use(pinia)
// app.use(router)

// // ✅ เรียกใช้ AuthManager store
// const authManager = useAuthManager()

// // ♻️ โหลดข้อมูลผู้ใช้จาก localStorage
// authManager.loadUserFromLocalStorage()

// // 🧩 ติดตั้ง Navigation Guard (กันหน้าโดย role)
// if (authManager.useAuthGuard) {
//   authManager.useAuthGuard(router)
// }

// app.mount('#app')
// import './assets/style.css'
// import { createApp } from 'vue'
// import App from './App.vue'
// import router from '../router/index.js'
// import { createPinia } from 'pinia'
// import { useLoginManager } from '@/stores/LoginManager.js'

// const app = createApp(App)
// const pinia = createPinia()

// // ✅ ต้อง use Pinia ก่อนถึงจะเรียก store ได้
// app.use(pinia)
// app.use(router)

// // ✅ ตอนนี้ค่อยเรียกใช้ store ได้
// const loginManager = useLoginManager()

// // ♻️ restore user + ติดตั้ง guard
// loginManager.restoreUserFromLocalStorage()
// loginManager.useAuthGuard(router)

// app.mount('#app')
