import { reactive } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useParcelManager = defineStore('parcelManager', () => {
  // 📦 State
  const parcel = reactive([])

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
  // const getParcels = () => parcel
  const getParcels = function () {
    return parcel
  }

  // 🟩 Setter
  // const setParcels = (parcelList = []) => {
  //   parcel.length = 0
  //   if (parcelList != null) {
  //     parcelList.forEach((p) => parcel.push(p))
  //   }
  //   console.log('✅ Parcels set:', parcel)
  // }
  const setParcels = (parcelList = []) => {
    parcel.length = 0
    const list = Array.isArray(parcelList) ? parcelList : [parcelList]
    list.forEach((p) => parcel.push(p))
    console.log('✅ Parcels set:', parcel)
  }

  // 🟨 Add
  const addParcel = function (newParcel) {
    if (!newParcel) {
      console.error('Cannot add empty parcel')
      return
    }
    parcel.push(newParcel)
    console.log('Parcel added:', newParcel)
  }

  // const addParcel = (newParcel) => {
  //   if (!newParcel || newParcel.status >= 400) {
  //     console.error('Invalid parcel data:', newParcel)
  //     return null
  //   }

  //   const parcelWithId = {
  //     parcelId: Date.now(),
  //     ...newParcel
  //   }
  //   parcel.push(parcelWithId)
  //   console.log('🆕 Parcel added:', parcelWithId)
  //   return parcelWithId
  // }

  // const addParcel = (newParcel) => {
  //   parcel.push({
  //     parcelId: Date.now(), // 🔹 ใช้ parcelId แทน id
  //     ...newParcel
  //   })
  //   console.log('🆕 Parcel added:', newParcel)
  // }

  // 🟧 Edit
  const findIndexByParcelId = (parcelId) =>
    parcel.findIndex((el) => el.parcelId === parcelId)

  const editParcel = (parcelId, updatedParcel) => {
    const index = findIndexByParcelId(parcelId)
    if (index !== -1) {
      parcel[index] = { ...parcel[index], ...updatedParcel }
      console.log('✏️ Edited parcel:', parcel[index])
    }
  }

  // 🟥 Delete
  const deleteParcels = (parcelId) => {
    const index = findIndexByParcelId(parcelId)
    if (index !== -1) {
      console.log('🗑️ Deleted parcel:', parcel[index])
      parcel.splice(index, 1)
    }
  }

  // 🔍 Find by status or tracking number
  const findByStatus = (status) => parcel.filter((el) => el.status === status)
  const findByTracking = (trackingNumber) =>
    parcel.find((el) => el.trackingNumber === trackingNumber)

  const updateParcelStatus = (parcelId, newStatus) => {
    const index = findIndexByParcelId(parcelId)
    if (index !== -1) {
      parcel[index].status = newStatus
      parcel[index].updatedAt = new Date().toISOString()
      console.log(`📦 Updated status of parcel ${parcelId} → ${newStatus}`)
    } else {
      console.warn(`Parcel with id ${parcelId} not found`)
    }
  }

  return {
    updateParcelStatus,
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
