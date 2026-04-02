import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useParcelVerificationManager = defineStore('parcelVerificationManager', () => {
  const verifiedParcels = ref([])

  const addVerifiedParcel = (parcel) => {
    verifiedParcels.value.push(parcel)
  }

  return {
    verifiedParcels,
    addVerifiedParcel
  }
})
