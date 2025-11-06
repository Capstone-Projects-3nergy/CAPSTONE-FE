import { reactive } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useParcelManager = defineStore('parcelManager', () => {
  // 📦 State
  const parcels = reactive([])

  // 📄 Structure of one parcel (for reference)
  // {
  //   id: 1,
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
      id: Date.now(), // สร้าง id อัตโนมัติ
      ...newParcel
    })
    console.log('🆕 Parcel added:', newParcel)
  }

  // 🟧 Edit
  const findIndexById = (id) => parcels.findIndex((el) => el.id === id)

  const editParcel = (id, updatedParcel) => {
    const index = findIndexById(id)
    if (index !== -1) {
      parcels[index] = { ...parcels[index], ...updatedParcel }
      console.log('✏️ Edited parcel:', parcels[index])
    }
  }

  // 🟥 Delete
  const deleteParcel = (id) => {
    const index = findIndexById(id)
    if (index !== -1) {
      console.log('🗑️ Deleted parcel:', parcels[index])
      parcels.splice(index, 1)
    }
  }

  // 🔍 Find by status or tracking
  const findByStatus = (status) => parcels.filter((el) => el.status === status)
  const findByTracking = (trackingNumber) =>
    parcels.find((el) => el.trackingNumber === trackingNumber)

  return {
    parcels,
    getParcels,
    setParcels,
    addParcel,
    editParcel,
    deleteParcel,
    findByStatus,
    findByTracking
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useParcelManager, import.meta.hot))
}
