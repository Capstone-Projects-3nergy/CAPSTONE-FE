import { reactive } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useUserManager = defineStore('userManager', () => {
  // ===== STATE =====
  const members = reactive([])
  const staffs = reactive([])
  const trash = reactive([])

  // ===== GETTERS =====
  const getMembers = () => members
  const getStaffs = () => staffs
  const getTrash = () => trash

  // ===== UTILS =====
  const findIndexById = (list, id) => list.findIndex((el) => el.id === id)

  // ===== ADD =====
  const addMember = (member) => {
    if (!member) return
    members.push(member)
  }

  const addStaff = (staff) => {
    if (!staff) return
    staffs.push(staff)
  }

  // ===== EDIT =====
  const editMember = (updatedMember) => {
    const index = findIndexById(members, updatedMember.id)
    if (index !== -1) {
      members.splice(index, 1, {
        ...members[index],
        ...updatedMember,
        updatedAt: new Date().toISOString()
      })
    }
  }

  const editStaff = (updatedStaff) => {
    const index = findIndexById(staffs, updatedStaff.id)
    if (index !== -1) {
      staffs.splice(index, 1, {
        ...staffs[index],
        ...updatedStaff,
        updatedAt: new Date().toISOString()
      })
    }
  }

  // ===== MOVE TO TRASH =====
  const moveToTrash = (type, id) => {
    const source = type === 'member' ? members : staffs
    const index = findIndexById(source, id)

    if (index !== -1) {
      const removed = source.splice(index, 1)[0]
      trash.push({
        ...removed,
        userType: type, // member | staff
        original: { ...removed },
        deletedAt: new Date().toISOString()
      })
    }
  }

  // ===== RESTORE =====
  const restoreFromTrash = (id) => {
    const index = findIndexById(trash, id)
    if (index !== -1) {
      const removed = trash.splice(index, 1)[0]
      const target = removed.userType === 'member' ? members : staffs

      target.push({
        ...removed.original,
        deletedAt: null,
        updatedAt: new Date().toISOString()
      })
    }
  }

  // ===== DELETE PERMANENT =====
  const deletePermanent = (id) => {
    const index = findIndexById(trash, id)
    if (index !== -1) {
      trash.splice(index, 1)
    }
  }

  return {
    members,
    staffs,
    trash,
    getMembers,
    getStaffs,
    getTrash,
    addMember,
    addStaff,
    editMember,
    editStaff,
    moveToTrash,
    restoreFromTrash,
    deletePermanent
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserManager, import.meta.hot))
}
