import { reactive } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useParcelManager = defineStore('parcelManager', () => {
  const parcel = reactive([])
  const trash = reactive([])

  const getParcels = () => parcel
  const getTrash = () => trash

  const findIndexByParcelId = (list, parcelId) =>
    list.findIndex((el) => el.parcelId === parcelId)

  const findIndexById = (list, id) => list.findIndex((el) => el.id === id)
  const setParcels = (parcelList = []) => {
    parcel.length = 0
    const list = Array.isArray(parcelList) ? parcelList : [parcelList]
    list.forEach((p) => parcel.push(p))
  }
  const setTrash = (trashList = []) => {
    trash.length = 0
    const list = Array.isArray(trashList) ? trashList : [trashList]
    list.forEach((t) => trash.push(t))
  }

  const addParcel = (newParcel) => {
    if (!newParcel) return
    parcel.push(newParcel)
  }
  const findIndexByParcelIds = (parcelId) =>
    parcel.findIndex((el) => el.parcelId === parcelId)
  const editParcel = (parcelId, updatedParcel) => {
    const index = findIndexByParcelIds(parcelId)
    if (index !== -1) {
      parcel.splice(index, 1, { ...parcel[index], ...updatedParcel })
    }
  }

  const updateParcelStatus = (id, newStatus) => {
    const index = findIndexByParcelId(parcel, id)
    if (index !== -1) {
      parcel.splice(index, 1, {
        ...parcel[index],
        status: newStatus,
        updatedAt: new Date().toISOString(),
        receivedAt:
          newStatus.toUpperCase() === 'RECEIVED'
            ? new Date().toISOString()
            : parcel[index].receivedAt
      })
    }
  }

  const updateParcel = (updatedParcel) => {
    const index = findIndexById(parcel, updatedParcel.id)
    if (index !== -1) {
      parcel.splice(index, 1, { ...parcel[index], ...updatedParcel })
    }
  }
  const moveToTrash = (id) => {
    const index = findIndexById(parcel, id)
    if (index !== -1) {
      const removed = parcel.splice(index, 1)[0]
      trash.push({
        ...removed,
        original: { ...removed }, // เก็บสภาพก่อนลบ
        deletedAt: new Date().toISOString()
      })
    }
  }
  const restoreFromTrash = (id) => {
    const index = findIndexById(trash, id)
    if (index !== -1) {
      const removed = trash.splice(index, 1)[0]
      const originals = removed.original || removed

      parcel.push({
        ...originals,
        isDeleted: false,
        status: originals.status,
        deletedAt: null,
        updatedAt: new Date().toISOString()
      })
    }
  }

  const deletePermanent = (id) => {
    const index = findIndexById(trash, id)
    if (index !== -1) {
      trash.splice(index, 1)
    }
  }

  const findByStatus = (status) => parcel.filter((el) => el.status === status)

  const findByTracking = (trackingNumber) =>
    parcel.find((el) => el.trackingNumber === trackingNumber)

  return {
    parcel,
    trash,
    getParcels,
    getTrash,
    setParcels,
    editParcel,
    addParcel,
    updateParcel,
    updateParcelStatus,
    moveToTrash,
    restoreFromTrash,
    deletePermanent,
    findByStatus,
    findByTracking,
    setTrash
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useParcelManager, import.meta.hot))
}