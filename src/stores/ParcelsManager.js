import { reactive } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useParcelManager = defineStore('parcelManager', () => {
  const parcel = reactive([])
  const getParcels = function () {
    return parcel
  }

  const setParcels = (parcelList = []) => {
    parcel.length = 0
    const list = Array.isArray(parcelList) ? parcelList : [parcelList]
    list.forEach((p) => parcel.push(p))
  }

  const addParcel = function (newParcel) {
    if (!newParcel) {
      return
    }
    parcel.push(newParcel)
  }

  const findIndexByParcelId = (parcelId) =>
    parcel.findIndex((el) => el.parcelId === parcelId)

  const editParcel = (parcelId, updatedParcel) => {
    const index = findIndexByParcelId(parcelId)
    if (index !== -1) {
      parcel.splice(index, 1, { ...parcel[index], ...updatedParcel })
    }
  }

  const updateParcel = (updatedParcel) => {
    const index = parcel.findIndex((p) => p.parcelId === updatedParcel.parcelId)
    if (index !== -1) {
      parcel.splice(index, 1, { ...parcel[index], ...updatedParcel })
    }
  }

  const deleteParcels = (parcelId) => {
    const index = findIndexByParcelId(parcelId)
    if (index !== -1) {
      parcel.splice(index, 1)
    }
  }

  const findByStatus = (status) => parcel.filter((el) => el.status === status)
  const findByTracking = (trackingNumber) =>
    parcel.find((el) => el.trackingNumber === trackingNumber)

  const updateParcelStatus = (parcelId, newStatus) => {
    const index = findIndexByParcelId(parcelId)
    if (index !== -1) {
      const updated = {
        ...parcel[index],
        status: newStatus,
        updatedAt: new Date().toISOString(),
        receivedAt:
          newStatus.toUpperCase() === 'RECEIVED'
            ? new Date().toISOString()
            : parcel[index].receivedAt
      }
      parcel.splice(index, 1, updated)
    }
  }

  return {
    updateParcelStatus,
    updateParcel,
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
