import { createApp } from 'vue'
import App from './App.vue'
import router from '../router/index.js'
import './assets/style.css'
// import { createPinia } from 'pinia'
const app = createApp(App)
// app.use(createPinia())
app.use(router)
app.mount('#app')
// createApp(App).mount('#app')
