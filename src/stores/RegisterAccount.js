// RegisterAccount.js
// Tractify (Dorm Parcel Management System)
// This component handles user registration for new dorm residents or staff.

import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

export default {
  name: 'RegisterAccount',
  setup() {
    const router = useRouter()

    // Form fields
    const fullName = ref('')
    const email = ref('')
    const phone = ref('')
    const dormRoom = ref('')
    const username = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const role = ref('resident') // default: Resident, can switch to Staff

    // Feedback states
    const loading = ref(false)
    const errorMessage = ref('')
    const successMessage = ref('')

    // API endpoint (example)
    const API_URL = 'https://api.tractify.app/register'

    // Register function
    const registerAccount = async () => {
      errorMessage.value = ''
      successMessage.value = ''

      // Basic validation
      if (password.value !== confirmPassword.value) {
        errorMessage.value = 'Passwords do not match.'
        return
      }

      if (!fullName.value || !username.value || !password.value) {
        errorMessage.value = 'Please fill in all required fields.'
        return
      }

      const newUser = {
        fullName: fullName.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        dormRoom: dormRoom.value.trim(),
        username: username.value.trim(),
        password: password.value.trim(),
        role: role.value // "resident" or "staff"
      }

      try {
        loading.value = true
        const response = await axios.post(API_URL, newUser)

        if (response.status === 201 || response.data.success) {
          successMessage.value = 'Account created successfully!'
          setTimeout(() => router.push('/login'), 1500)
        } else {
          errorMessage.value = response.data.message || 'Registration failed.'
        }
      } catch (err) {
        errorMessage.value =
          err.response?.data?.message || 'Error connecting to the server.'
      } finally {
        loading.value = false
      }
    }

    return {
      fullName,
      email,
      phone,
      dormRoom,
      username,
      password,
      confirmPassword,
      role,
      loading,
      errorMessage,
      successMessage,
      registerAccount
    }
  }
}
