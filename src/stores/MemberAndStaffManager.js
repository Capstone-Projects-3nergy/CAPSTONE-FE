import { reactive } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useUserManager = defineStore('userManager', () => {
  const members = reactive([])
  const staffs = reactive([])
  const trash = reactive([])

  /* ---------- helpers ---------- */
  const findIndexById = (list, id) => list.findIndex((el) => el.id === id)

  /* ---------- getters ---------- */
  const getMembers = () => members
  const getStaffs = () => staffs
  const getTrash = () => trash

  /* ---------- setters ---------- */
  const setMembers = (list = []) => {
    members.length = 0
    ;(Array.isArray(list) ? list : [list]).forEach((m) => members.push(m))
  }

  const setStaffs = (list = []) => {
    staffs.length = 0
    ;(Array.isArray(list) ? list : [list]).forEach((s) => staffs.push(s))
  }

  const setTrash = (list = []) => {
    trash.length = 0
    ;(Array.isArray(list) ? list : [list]).forEach((t) => trash.push(t))
  }

  /* ---------- add ---------- */
  const addMember = (member) => {
    if (!member) return
    members.push(member)
  }

  const addStaff = (staff) => {
    if (!staff) return
    staffs.push(staff)
  }

  /* ---------- update ---------- */
  const updateMember = (updated) => {
    const index = findIndexById(members, updated.id)
    if (index !== -1) {
      members.splice(index, 1, {
        ...members[index],
        ...updated,
        updatedAt: new Date().toISOString()
      })
    }
  }

  const updateStaff = (updated) => {
    const index = findIndexById(staffs, updated.id)
    if (index !== -1) {
      staffs.splice(index, 1, {
        ...staffs[index],
        ...updated,
        updatedAt: new Date().toISOString()
      })
    }
  }
  const editMember = (memberId, updatedMember) => {
    const index = findIndexById(members, memberId)
    if (index !== -1) {
      members.splice(index, 1, {
        ...members[index],
        ...updatedMember,
        updatedAt: new Date().toISOString()
      })
    }
  }
  const editStaff = (staffId, updatedStaff) => {
    const index = findIndexById(staffs, staffId)
    if (index !== -1) {
      staffs.splice(index, 1, {
        ...staffs[index],
        ...updatedStaff,
        updatedAt: new Date().toISOString()
      })
    }
  }

  /* ---------- move to trash ---------- */
  const moveMemberToTrash = (id) => {
    const index = findIndexById(members, id)
    if (index !== -1) {
      const removed = members.splice(index, 1)[0]
      trash.push({
        ...removed,
        role: removed.role || 'RESIDENT', // ✅ ใช้ role เดิม
        original: { ...removed },
        deletedAt: new Date().toISOString()
      })

      console.log('✅ Moved to trash:', removed) // debug
    } else {
      console.log('❌ Member not found:', id) // debug
    }
  }
  // const moveMemberToTrash = (id) => {
  //   const index = findIndexById(members, id)
  //   if (index !== -1) {
  //     const removed = members.splice(index, 1)[0]
  //     trash.push({
  //       ...removed,
  //       role: 'RESIDENT',
  //       original: { ...removed },
  //       deletedAt: new Date().toISOString()
  //     })
  //   }
  // }

  const moveStaffToTrash = (id) => {
    const index = findIndexById(staffs, id)
    if (index !== -1) {
      const removed = staffs.splice(index, 1)[0]
      trash.push({
        ...removed,
        role: 'STAFF',
        original: { ...removed },
        deletedAt: new Date().toISOString()
      })
    }
  }

  /* ---------- restore ---------- */
  const restoreFromTrash = (id) => {
    const index = findIndexById(trash, id)
    if (index !== -1) {
      const removed = trash.splice(index, 1)[0]
      const original = removed.original || removed

      if (removed.role === 'STAFF') {
        staffs.push({
          ...original,
          deletedAt: null,
          updatedAt: new Date().toISOString()
        })
      } else {
        members.push({
          ...original,
          deletedAt: null,
          updatedAt: new Date().toISOString()
        })
      }
    }
  }

  /* ---------- delete permanent ---------- */
  const deletePermanent = (id) => {
    const index = findIndexById(trash, id)
    if (index !== -1) {
      trash.splice(index, 1)
    }
  }

  /* ---------- find ---------- */
  const findMemberByEmail = (email) => members.find((m) => m.email === email)

  const findStaffByRole = (role) => staffs.filter((s) => s.role === role)

  return {
    members,
    staffs,
    trash,

    getMembers,
    getStaffs,
    getTrash,

    setMembers,
    setStaffs,
    setTrash,

    addMember,
    addStaff,

    updateMember,
    updateStaff,

    editMember,
    editStaff,

    moveMemberToTrash,
    moveStaffToTrash,
    restoreFromTrash,
    deletePermanent,

    findMemberByEmail,
    findStaffByRole
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserManager, import.meta.hot))
}
