import { defineStore } from 'pinia'
import { addItem } from '@/utils/fetchUtils'

export const useParcelVerificationManager = defineStore('parcelVerificationManager', () => {
  const saveParcelVerification = async (verificationData, router) => {
    const url = `${import.meta.env.VITE_BASE_URL}/api/verify`
    try {
      const result = await addItem(url, verificationData, router)
      return result
    } catch (error) {
      console.error('Error verifying parcel:', error)
      return null
    }
  }

  return {
    saveParcelVerification
  }
})
