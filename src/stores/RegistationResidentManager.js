// stores/RegistrationResidentManager.js
import { reactive } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useRegistrationResidentManager = defineStore(
  'registrationResidentManager',
  () => {
    const residents = reactive([])

    const setResidents = (list = []) => {
      residents.length = 0
      const data = Array.isArray(list) ? list : [list]
      data.forEach((r) => residents.push(r))
    }

    const addResident = (resident) => {
      if (!resident) return
      residents.push(resident)
    }

    const updateResident = (updatedResident) => {
      const index = residents.findIndex(
        (r) => r.userId === updatedResident.userId
      )
      if (index !== -1) {
        residents.splice(index, 1, {
          ...residents[index],
          ...updatedResident
        })
      }
    }

    const findByUserId = (userId) => residents.find((r) => r.userId === userId)

    return {
      residents,
      setResidents,
      addResident,
      updateResident,
      findByUserId
    }
  }
)

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useRegistrationResidentManager, import.meta.hot)
  )
}
