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

  // const updateParcel = (updatedParcel) => {
  //   const index = findIndexByParcelId(parcel, updatedParcel.parcelId)
  //   if (index !== -1) {
  //     parcel.splice(index, 1, { ...parcel[index], ...updatedParcel })
  //   }
  // }

  const updateParcelStatus = (parcelId, newStatus) => {
    const index = findIndexByParcelId(parcel, parcelId)
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

  // const moveToTrash = (parcelId) => {
  //   const index = findIndexByParcelId(parcel, parcelId)
  //   if (index !== -1) {
  //     const removed = parcel.splice(index, 1)[0]
  //     trash.push({
  //       ...removed,
  //       status: 'TRASH',
  //       trashedAt: new Date().toISOString()
  //     })
  //   }
  // }
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
        status: 'TRASH',
        trashedAt: new Date().toISOString()
      })
    }
  }

  const restoreFromTrash = (parcelId) => {
    const index = findIndexByParcelId(trash, parcelId)
    if (index !== -1) {
      const restored = trash.splice(index, 1)[0]
      parcel.push({
        ...restored,
        status: 'ACTIVE',
        restoredAt: new Date().toISOString()
      })
    }
  }

  const deletePermanent = (parcelId) => {
    const index = findIndexByParcelId(trash, parcelId)
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
} // import { reactive } from 'vue'
// import { defineStore, acceptHMRUpdate } from 'pinia'

// export const useParcelManager = defineStore('parcelManager', () => {
//   const parcel = reactive([])
//   const getParcels = function () {
//     return parcel
//   }

//   const setParcels = (parcelList = []) => {
//     parcel.length = 0
//     const list = Array.isArray(parcelList) ? parcelList : [parcelList]
//     list.forEach((p) => parcel.push(p))
//   }

//   const addParcel = function (newParcel) {
//     if (!newParcel) {
//       return
//     }
//     parcel.push(newParcel)
//   }

//   const findIndexByParcelId = (parcelId) =>
//     parcel.findIndex((el) => el.parcelId === parcelId)

//   const editParcel = (parcelId, updatedParcel) => {
//     const index = findIndexByParcelId(parcelId)
//     if (index !== -1) {
//       parcel.splice(index, 1, { ...parcel[index], ...updatedParcel })
//     }
//   }

//   const updateParcel = (updatedParcel) => {
//     const index = parcel.findIndex((p) => p.parcelId === updatedParcel.parcelId)
//     if (index !== -1) {
//       parcel.splice(index, 1, { ...parcel[index], ...updatedParcel })
//     }
//   }

//   const deleteParcels = (parcelId) => {
//     const index = findIndexByParcelId(parcelId)
//     if (index !== -1) {
//       parcel.splice(index, 1)
//     }
//   }

//   const findByStatus = (status) => parcel.filter((el) => el.status === status)
//   const findByTracking = (trackingNumber) =>
//     parcel.find((el) => el.trackingNumber === trackingNumber)

//   const updateParcelStatus = (parcelId, newStatus) => {
//     const index = findIndexByParcelId(parcelId)
//     if (index !== -1) {
//       const updated = {
//         ...parcel[index],
//         status: newStatus,
//         updatedAt: new Date().toISOString(),
//         receivedAt:
//           newStatus.toUpperCase() === 'RECEIVED'
//             ? new Date().toISOString()
//             : parcel[index].receivedAt
//       }
//       parcel.splice(index, 1, updated)
//     }
//   }

//   return {
//     updateParcelStatus,
//     updateParcel,
//     getParcels,
//     setParcels,
//     addParcel,
//     editParcel,
//     deleteParcels,
//     findByStatus,
//     findByTracking
//   }
// })

// if (import.meta.hot) {
//   import.meta.hot.accept(acceptHMRUpdate(useParcelManager, import.meta.hot))
// }
