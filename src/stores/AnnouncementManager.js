import { reactive } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useAnnouncementManager = defineStore('announcementManager', () => {
  const announcements = reactive([])
  const trash = reactive([])

  /* ---------- helpers ---------- */
  const findIndexById = (list, id) => list.findIndex((el) => el.id === id)

  /* ---------- getters ---------- */
  const getAnnouncements = () => announcements
  const getTrash = () => trash

  /* ---------- setters ---------- */
  const setAnnouncements = (list = []) => {
    announcements.length = 0
    ;(Array.isArray(list) ? list : [list]).forEach((a) => announcements.push(a))
  }

  const setTrash = (list = []) => {
    trash.length = 0
    ;(Array.isArray(list) ? list : [list]).forEach((t) => trash.push(t))
  }

  /* ---------- add ---------- */
  const addAnnouncement = (item) => {
    if (!item) return
    announcements.push(item)
  }

  /* ---------- update ---------- */
  const updateAnnouncement = (updated) => {
    const index = findIndexById(announcements, updated.id)
    if (index !== -1) {
      announcements.splice(index, 1, {
        ...announcements[index],
        ...updated,
        updatedAt: new Date().toISOString()
      })
    }
  }

  const editAnnouncement = (id, updatedItem) => {
    const index = findIndexById(announcements, id)
    if (index !== -1) {
      announcements.splice(index, 1, {
        ...announcements[index],
        ...updatedItem,
        updatedAt: new Date().toISOString()
      })
    }
  }

  /* ---------- move to trash ---------- */
  const moveAnnouncementToTrash = (id) => {
    const index = findIndexById(announcements, id)
    if (index !== -1) {
      const removed = announcements.splice(index, 1)[0]
      trash.push({
        ...removed,
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

      announcements.push({
        ...original,
        deletedAt: null,
        updatedAt: new Date().toISOString()
      })
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
  const findAnnouncementById = (id) => announcements.find((a) => a.id === id)

  return {
    announcements,
    trash,

    getAnnouncements,
    getTrash,

    setAnnouncements,
    setTrash,

    addAnnouncement,

    updateAnnouncement,
    editAnnouncement,

    moveAnnouncementToTrash,
    restoreFromTrash,
    deletePermanent,

    findAnnouncementById
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnnouncementManager, import.meta.hot))
}
