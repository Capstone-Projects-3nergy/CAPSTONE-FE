import { reactive, ref } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useProfileManager = defineStore('profileManager', () => {
  // ------------------------
  // state
  // ------------------------
  const profiles = reactive([]) // profile list
  const trash = reactive([]) // deleted profiles

  const loading = ref(false)
  const error = ref(false)

  // ------------------------
  // helpers
  // ------------------------
  const findIndexById = (list, id) => list.findIndex((el) => el.id === id)

  // ------------------------
  // getters
  // ------------------------
  const getProfiles = () => profiles
  const getProfileById = (id) => profiles.find((p) => p.id === id) || null
  const getTrash = () => trash

  // ------------------------
  // setters
  // ------------------------
  const setProfiles = (profileList = []) => {
    profiles.length = 0
    const list = Array.isArray(profileList) ? profileList : [profileList]
    list.forEach((p) => profiles.push(p))
  }

  const setTrash = (trashList = []) => {
    trash.length = 0
    const list = Array.isArray(trashList) ? trashList : [trashList]
    list.forEach((t) => trash.push(t))
  }

  // ------------------------
  // CRUD (เหมือน parcel)
  // ------------------------
  const addProfile = (newProfile) => {
    if (!newProfile) return
    profiles.push(newProfile)
  }

  const updateProfile = (updatedProfile) => {
    if (!updatedProfile) return
    const index = findIndexById(profiles, updatedProfile.id)
    if (index !== -1) {
      profiles.splice(index, 1, {
        ...profiles[index],
        ...updatedProfile,
        updatedAt: new Date().toISOString()
      })
    }
  }

  const moveToTrash = (id) => {
    const index = findIndexById(profiles, id)
    if (index !== -1) {
      const removed = profiles.splice(index, 1)[0]
      trash.push({
        ...removed,
        original: { ...removed },
        deletedAt: new Date().toISOString()
      })
    }
  }

  const restoreFromTrash = (id) => {
    const index = findIndexById(trash, id)
    if (index !== -1) {
      const removed = trash.splice(index, 1)[0]
      const original = removed.original || removed

      profiles.push({
        ...original,
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

  const clearProfiles = () => {
    profiles.length = 0
    trash.length = 0
  }

  return {
    // state
    profiles,
    trash,
    loading,
    error,

    // getters
    getProfiles,
    getProfileById,
    getTrash,

    // actions
    setProfiles,
    setTrash,
    addProfile,
    updateProfile,
    moveToTrash,
    restoreFromTrash,
    deletePermanent,
    clearProfiles
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileManager, import.meta.hot))
}
// import { reactive } from 'vue'
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
