<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { linkLineAccount } from '@/utils/fetchUtils';
import { useAuthManager } from '@/stores/AuthManager';
import LoadingPopUp from './LoadingPopUp.vue';
import AlertPopUp from './AlertPopUp.vue';

const route = useRoute();
const router = useRouter();
const authManager = useAuthManager();

const isLoading = ref(true);
const showError = ref(false);
const errorMessage = ref('');

onMounted(async () => {
  const code = route.query.code;
  const state = route.query.state;
  const savedState = sessionStorage.getItem('line_auth_state');

  console.log('LINE Callback received:', { code, state });

  if (!code) {
    errorMessage.value = 'Authorization code not found.';
    showError.value = true;
    isLoading.value = false;
    return;
  }

  // Optional: Verify state to prevent CSRF
  if (state !== savedState) {
    console.warn('State mismatch:', { state, savedState });
  }

  try {
    // ส่งทั้ง code และ state (ซึ่งเป็น Firebase Token) ไปให้ Backend
    const result = await linkLineAccount(code, state, router);
    if (result) {
      console.log('LINE account linked successfully:', result);
      
      // Refresh ข้อมูล user เพื่อให้ได้ lineId ล่าสุด
      await authManager.loadUserFromBackend();
      
      // Redirect กลับหน้าโปรไฟล์พร้อมแนบ query เพื่อแสดงแจ้งเตือนความสำเร็จ
      const userId = authManager.user?.id;
      const targetRoute = authManager.user?.role === 'RESIDENT' ? 'profileresident' : 'profilestaff';
      
      router.push({ 
        name: targetRoute, 
        params: { id: userId },
        query: { line: 'success' } 
      });
    } else {
      errorMessage.value = 'Failed to link LINE account. Please try again.';
      showError.value = true;
    }
  } catch (error) {
    console.error('Error during LINE callback:', error);
    errorMessage.value = 'An unexpected error occurred.';
    showError.value = true;
  } finally {
    isLoading.value = false;
  }
});

const closeError = () => {
  showError.value = false;
  router.push({ name: 'login' });
};
</script>

<template>
  <div class="callback-container">
    <!-- Animated background patterns -->
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>

    <div class="glass-card">
      <div v-if="isLoading" class="content loading-content">
        <div class="icon-wrapper loading">
          <svg class="line-logo" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
            <path d="M200.533 256H55.467C24.834 256 0 231.166 0 200.533V55.467C0 24.834 24.834 0 55.467 0h145.067C231.166 0 256 24.834 256 55.467v145.067C256 231.166 231.166 256 200.533 256" fill="#00b900"/>
            <path d="M220.792 116.744c0-41.707-41.81-75.64-93.207-75.64-51.4 0-93.205 33.933-93.205 75.64 0 37.39 33.158 68.704 77.95 74.624 3.036.655 7.166 2.003 8.21 4.597.94 2.355.614 6.048.3 8.43l-1.33 7.98c-.407 2.355-1.875 9.216 8.073 5.024s53.68-31.607 73.233-54.116h-.004c13.508-14.812 19.98-29.845 19.98-46.537" fill="#fff"/>
            <g fill="#00b900">
              <path d="M108.647 96.6h-6.54c-1.003 0-1.815.813-1.815 1.813v40.612c0 .998.813 1.8 1.815 1.8h6.54c1.003 0 1.815-.8 1.815-1.8V98.403c0-1-.813-1.813-1.815-1.813m45 .01H147.1c-1.005 0-1.815.813-1.815 1.813v24.128l-18.613-25.135c-.043-.064-.092-.126-.14-.183l-.01-.013-.143-.143-.098-.08c-.015-.013-.03-.026-.047-.036l-.094-.064c-.017-.013-.036-.02-.055-.032l-.096-.055-.058-.028-.105-.045-.058-.02a.83.83 0 0 0-.11-.036l-.064-.017-.102-.02c-.026-.006-.053-.01-.077-.01-.032-.006-.064-.01-.096-.013l-.094-.006c-.023 0-.043-.002-.064-.002h-6.537c-1.003 0-1.815.813-1.815 1.813v40.612c0 .998.813 1.8 1.815 1.8h6.537c1.005 0 1.818-.8 1.818-1.8v-24.122l18.633 25.167a1.81 1.81 0 0 0 .463.448c.004.004.01.01.017.015l.113.066.05.03a1.1 1.1 0 0 0 .087.041l.087.038.053.02.126.038c.006.002.017.004.026.006a1.75 1.75 0 0 0 .465.06h6.537c1.003 0 1.815-.8 1.815-1.8V98.402c0-1-.813-1.813-1.815-1.813"/><path d="M92.887 130.657H75.122V98.403c0-1.003-.813-1.815-1.813-1.815h-6.54c-1.003 0-1.815.813-1.815 1.815v40.6a1.8 1.8 0 0 0 .508 1.254.09.09 0 0 0 .024.028c.01.008.02.017.028.026a1.81 1.81 0 0 0 1.252.506h26.12c1.003 0 1.813-.815 1.813-1.815v-6.54c0-1.003-.8-1.815-1.813-1.815m96.864-23.897c1.003 0 1.813-.813 1.813-1.815v-6.54c0-1.003-.8-1.815-1.813-1.815h-26.12a1.8 1.8 0 0 0-1.259.512c-.006.006-.015.013-.02.02s-.02.02-.028.032c-.3.324-.503.764-.503 1.25v40.613c0 .486.194.928.508 1.254l.023.026.026.024c.326.314.768.508 1.254.508h26.12c1.003 0 1.813-.813 1.813-1.813v-6.54c0-1.003-.8-1.815-1.813-1.815H172v-6.865h17.762a1.81 1.81 0 0 0 1.813-1.815v-6.537c0-1.003-.8-1.818-1.813-1.818H172v-6.863h17.762z"/></g>
          </svg>
          <div class="loader-ring"></div>
        </div>
        <h2 class="title">Verifying Account</h2>
        <p class="subtitle">Please wait while we link your LINE account to your profile.</p>
      </div>

      <div v-else-if="showError" class="content error-content">
        <div class="icon-wrapper error">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="title error-title">Connection Failed</h2>
        <p class="subtitle">{{ errorMessage }}</p>
        <button @click="closeError" class="btn-retry">
          Back to Login
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.callback-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #00b900;
  background: radial-gradient(circle at center, #00d500 0%, #008a00 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Background glows */
.bg-glow {
  position: absolute;
  width: 100vh;
  height: 100vh;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.4;
  pointer-events: none;
}

.bg-glow-1 {
  background: #ffffff;
  top: -20%;
  left: -20%;
  animation: float 15s infinite alternate ease-in-out;
}

.bg-glow-2 {
  background: #004d00;
  bottom: -20%;
  right: -20%;
  animation: float 18s infinite alternate-reverse ease-in-out;
}

@keyframes float {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(10%, 10%) scale(1.1); }
}

.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 60px 40px;
  width: 100%;
  max-width: 480px;
  text-align: center;
  color: white;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  z-index: 10;
  animation: cardEnter 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

@keyframes cardEnter {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
}

.line-logo {
  width: 80px;
  height: 80px;
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.3));
  z-index: 2;
  transition: transform 0.3s ease;
}

.loader-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #ffffff;
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.icon-wrapper.error {
  background: rgba(255, 59, 48, 0.2);
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.error-title {
  color: #ffffff;
}

.subtitle {
  font-size: 1.05rem;
  line-height: 1.6;
  opacity: 0.9;
  max-width: 300px;
}

.btn-retry {
  margin-top: 40px;
  padding: 16px 40px;
  border-radius: 20px;
  border: none;
  background: #ffffff;
  color: #00b900;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.btn-retry:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  background: #f8f8f8;
}

.btn-retry:active {
  transform: translateY(0);
}

@media (max-width: 480px) {
  .glass-card {
    padding: 40px 20px;
    border-radius: 32px;
  }
  .title {
    font-size: 1.75rem;
  }
}
</style>
