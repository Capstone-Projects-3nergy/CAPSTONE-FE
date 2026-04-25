import { reactive, computed } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useAnnouncementManager = defineStore('announcementManager', () => {
  const announcements = reactive([])
  const trash = reactive([])


  const findIndexById = (list, id) => list.findIndex((el) => el.id === id)


  const getAnnouncements = () => announcements
  const getTrash = () => trash


  const mapItem = (item) => {
    if (!item) return null
    if (item._isMapped) return item

    const category = item.category || 'General'
    
    return {
      id: item.id,
      title: item.title || '',
      subtitle: item.subtitle || item.content || '',
      content: item.content || '',
      category: category,
      pinned: item.pinned || false,
      datePosted: item.publishAt || item.date || item.createdAt || 'Just now',
      publishAt: item.publishAt || item.date || item.createdAt,
      status: item.status || 'PUBLISHED',
      author: item.author || 'Staff Portal',
      views: item.viewCount || item.views || 0,
      type: category.toLowerCase().includes('event') ? 'event' : 'news',
      coverImage: item.coverImageUrl || item.coverImage || '',
      deletedAt: item.deletedAt || null,
      _isMapped: true
    }
  }


  const setAnnouncements = (list = []) => {
    announcements.length = 0
    const items = Array.isArray(list) ? list : [list]
    items.forEach((a) => {
      const mapped = mapItem(a)
      if (mapped) announcements.push(mapped)
    })
  }

  const setTrash = (list = []) => {
    trash.length = 0
    const items = Array.isArray(list) ? list : [list]
    items.forEach((t) => {
      const mapped = mapItem(t)
      if (mapped) trash.push(mapped)
    })
  }


  const addAnnouncement = (item) => {
    const mapped = mapItem(item)
    if (mapped) announcements.push(mapped)
  }


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


  const moveAnnouncementToTrash = (id) => {
    const index = findIndexById(announcements, id)
    if (index !== -1) {
      const removed = announcements.splice(index, 1)[0]
      trash.push({
        ...removed,
        deletedAt: new Date().toISOString()
      })
    }
  }


  const restoreFromTrash = (id) => {
    const index = findIndexById(trash, id)
    if (index !== -1) {
      const removed = trash.splice(index, 1)[0]
      
      announcements.push({
        ...removed,
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


  const findAnnouncementById = (id) => announcements.find((a) => a.id === id)

  const totalPinned = computed(() => announcements.filter((a) => a.pinned).length)

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

    findAnnouncementById,
    totalPinned
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnnouncementManager, import.meta.hot))
}
