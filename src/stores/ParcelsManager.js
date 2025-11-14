import { reactive } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useParcelManager = defineStore('parcelManager', () => {
  // 📦 State
  const parcels = reactive([])

  // 📄 โครงสร้างข้อมูลแต่ละพัสดุ (ตัวอย่าง)
  // {
  //   parcelId: 1,
  //   trackingNumber: '',
  //   recipientName: '',
  //   roomNumber: '',
  //   parcelType: '',
  //   contact: '',
  //   status: '',
  //   pickupAt: '',
  //   updateAt: '',
  //   senderName: '',
  //   companyId: '',
  //   receiveAt: ''
  // }

  // 🟦 Getter
  const getParcels = () => parcels

  // 🟩 Setter
  const setParcels = (parcelList = []) => {
    parcels.length = 0
    if (parcelList != null) {
      parcelList.forEach((p) => parcels.push(p))
    }
    console.log('✅ Parcels set:', parcels)
  }

  // 🟨 Add
  const addParcel = (newParcel) => {
    parcels.push({
      parcelId: Date.now(), // 🔹 ใช้ parcelId แทน id
      ...newParcel
    })
    console.log('🆕 Parcel added:', newParcel)
  }

  // 🟧 Edit
  const findIndexByParcelId = (parcelId) =>
    parcels.findIndex((el) => el.parcelId === parcelId)

  const editParcel = (parcelId, updatedParcel) => {
    const index = findIndexByParcelId(parcelId)
    if (index !== -1) {
      parcels[index] = { ...parcels[index], ...updatedParcel }
      console.log('✏️ Edited parcel:', parcels[index])
    }
  }

  // 🟥 Delete
  const deleteParcels = (parcelId) => {
    const index = findIndexByParcelId(parcelId)
    if (index !== -1) {
      console.log('🗑️ Deleted parcel:', parcels[index])
      parcels.splice(index, 1)
    }
  }

  // 🔍 Find by status or tracking number
  const findByStatus = (status) => parcels.filter((el) => el.status === status)
  const findByTracking = (trackingNumber) =>
    parcels.find((el) => el.trackingNumber === trackingNumber)

  return {
    parcels,
    getParcels,
    setParcels,
    addParcel,
    editParcel,
    deleteParcels,
    findByStatus,
    findByTracking
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useParcelManager, import.meta.hot))
}
