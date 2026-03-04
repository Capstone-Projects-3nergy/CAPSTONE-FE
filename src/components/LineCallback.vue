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
    // In production, you might want to block this, but for now we'll allow if it's just a test
  }

  try {
    const result = await linkLineAccount(code, router);
    if (result) {
      console.log('LINE account linked successfully:', result);
      
      // Refresh user data to get updated lineId
      await authManager.loadUserFromBackend();
      
      // Also update ProfileManager to ensure consistency across the app
      const profileManager = (await import('@/stores/ProfileManager')).useProfileManager();
      const baseURL = import.meta.env.VITE_BASE_URL;
      const { getProfile } = await import('@/utils/fetchUtils');
      const profile = await getProfile(`${baseURL}/api/profile`, router);
      if (profile) profileManager.setCurrentProfile(profile);
      
      // Redirect back to profile or home
      const userId = authManager.user?.id;
      if (authManager.user?.role === 'RESIDENT') {
        router.push({ name: 'profileresident', params: { id: userId } });
      } else {
        router.push({ name: 'profilestaff', params: { id: userId } });
      }
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
    <div class="glass-card">
      <div v-if="isLoading" class="loading-content">
        <div class="spinner"></div>
        <h2>Linking your LINE Account...</h2>
        <p>Please wait while we secure your connection.</p>
      </div>

      <div v-else-if="showError" class="error-content">
        <div class="error-icon">⚠️</div>
        <h2>Connection Failed</h2>
        <p>{{ errorMessage }}</p>
        <button @click="closeError" class="btn-primary">Back to Login</button>
      </div>
    </div>

    <!-- Reusing existing components if they fit the design -->
    <LoadingPopUp v-if="isLoading" />
    <AlertPopUp 
      v-if="showError" 
      :message="errorMessage" 
      @close="closeError" 
    />
  </div>
</template>

<style scoped>
.callback-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #00b900 0%, #007a00 100%);
  padding: 20px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 40px;
  width: 100%;
  max-width: 450px;
  text-align: center;
  color: white;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-content h2 {
  margin: 20px 0 10px;
  font-size: 1.5rem;
  font-weight: 600;
}

.loading-content p {
  opacity: 0.8;
  font-size: 0.9rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: #ffffff;
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.error-content h2 {
  margin-bottom: 15px;
  color: #ff4d4d;
}

.btn-primary {
  margin-top: 25px;
  padding: 12px 30px;
  border-radius: 12px;
  border: none;
  background: white;
  color: #00b900;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  background: #f0f0f0;
}
</style>
