import { reactive } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useAnnouncementManager = defineStore('announcementManager', () => {
  const announcements = reactive([
    {
      id: 1,
      title: 'Temporary Water Shutoff — Plumbing Repair',
      subtitle: 'Water will be shut off from 08:00–14:00 on February 20, 2026.',
      content: 'Water will be shut off from 08:00–14:00 on February 20, 2026, for main plumbing repairs. Please reserve water in advance. We apologize for the inconvenience. If you have any questions, please contact the staff at the counter.',
      category: 'Urgent',
      status: 'Published',
      pinned: true,
      createdAt: '2026-02-19T10:30:00Z',
      author: 'Staff Portal',
      views: 82
    },
    {
      id: 2,
      title: 'Temporary Elevator Shutdown',
      subtitle: 'The elevator will be closed for service on February 21-22, 2026.',
      content: 'The elevator will be closed for service on February 21-22, 2026, for annual inspection and maintenance by specialized technicians. Residents may use the stairs on the left side of the building.',
      category: 'Maintenance',
      status: 'Published',
      pinned: true,
      createdAt: '2026-02-18T15:00:00Z',
      author: 'Staff Portal',
      views: 54
    },
    {
      id: 3,
      title: 'New Regulations for Parcel Collection',
      subtitle: 'Residents must collect their parcels within 7 days.',
      content: 'Starting from March 1, 2026, residents must collect their parcels within 7 days of notification. A storage fee may apply if overdue.',
      category: 'General',
      status: 'Published',
      pinned: false,
      createdAt: '2026-02-17T09:00:00Z',
      author: 'Staff Portal',
      views: 61
    },
    {
      id: 4,
      title: 'Community Garden Workshop',
      subtitle: 'Join us for a hands-on gardening session this Saturday.',
      content: 'Learn how to start your own balcony garden. We provide seeds and tools. Meeting point: Roof garden, Building B.',
      category: 'Events',
      status: 'Published',
      pinned: true,
      createdAt: '2026-02-25T14:00:00Z',
      author: 'Green Team',
      views: 124
    },
    {
      id: 5,
      title: 'Yoga in the Park',
      subtitle: 'Free morning yoga session for all skill levels.',
      content: 'Start your Sunday with relaxation and stretching. Bring your own mat and water. Professional instructor provided by the community center.',
      category: 'Events',
      status: 'Published',
      pinned: false,
      createdAt: '2026-02-24T08:00:00Z',
      author: 'Wellness Corner',
      views: 89
    },
    {
      id: 6,
      title: 'Weekend Food Fair',
      subtitle: 'Taste delicacies from around the world.',
      content: 'Over 20 stalls featuring international cuisine. Live music and children\'s activities. Entrance is free for residents.',
      category: 'Events',
      status: 'Published',
      pinned: false,
      createdAt: '2026-02-23T12:00:00Z',
      author: 'Events Committee',
      views: 215
    },
    {
      id: 7,
      title: 'Neighborhood Watch Meeting',
      subtitle: 'Discussing security and safety measures for our area.',
      content: 'An informative session with local police officers to discuss safety tips and neighborhood vigilance. Highly recommended for all heads of households.',
      category: 'Events',
      status: 'Published',
      pinned: false,
      createdAt: '2026-02-22T18:30:00Z',
      author: 'Security Dept',
      views: 47
    },
    {
      id: 8,
      title: 'Movie Night under the Stars',
      subtitle: 'A family-friendly screening of the latest animation hit.',
      content: 'Popcorn and soft drinks will be provided. Bring your own blankets or folding chairs. Screening starts at 7:30 PM in the central courtyard.',
      category: 'Events',
      status: 'Published',
      pinned: false,
      createdAt: '2026-02-21T19:00:00Z',
      author: 'Media Team',
      views: 312
    },
    {
      id: 9,
      title: 'Charity Run 2026',
      subtitle: 'Run for a cause! 5km fun run around the estate.',
      content: 'All registration fees will be donated to the local children\'s hospital. T-shirts and medals for all participants. Register at the front office.',
      category: 'Events',
      status: 'Published',
      pinned: false,
      createdAt: '2026-02-20T07:30:00Z',
      author: 'Sport Hub',
      views: 156
    }
  ])
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
