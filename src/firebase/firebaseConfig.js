// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyBYkEV_G3V9VWUhNtUKWHFrBzEGDPZ-zHU',
  authDomain: 'tractify-dpms-capstone-3nergy.firebaseapp.com',
  projectId: 'tractify-dpms-capstone-3nergy',
  storageBucket: 'tractify-dpms-capstone-3nergy.firebasestorage.app',
  messagingSenderId: '386564914515',
  appId: '1:386564914515:web:987e9d2e81ce6e5df5b5a6',
  measurementId: 'G-89K9YDLX4N'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
export const auth = getAuth(app)
export default app
