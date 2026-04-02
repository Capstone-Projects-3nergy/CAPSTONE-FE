import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyBYkEV_G3V9VWUhNtUKWHFrBzEGDPZ-zHU',
  authDomain: 'tractify-dpms-capstone-3nergy.firebaseapp.com',
  projectId: 'tractify-dpms-capstone-3nergy',
  storageBucket: 'tractify-dpms-capstone-3nergy.firebasestorage.app',
  messagingSenderId: '386564914515',
  appId: '1:386564914515:web:987e9d2e81ce6e5df5b5a6',
  measurementId: 'G-89K9YDLX4N'
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export default app
