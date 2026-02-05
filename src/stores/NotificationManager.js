import { defineStore } from 'pinia'
import { ref ,  computed } from 'vue'
import { getNotifications } from '@/utils/fetchUtils'

export const useNotificationManager = defineStore('notificationManager', () => {
  const defaultNotifications = [
    {
      id: 1,
      type: 'new',
      label: 'New Parcel Arrived',
      title: 'A new parcel has arrived at the dormitory office',
      user: 'Parcel System',
      time: '15 Jan 2026 · 09:10 AM',
      isRead: false
    },
    {
      id: 2,
      type: 'message',
      label: 'Pickup Reminder',
      title: 'You have a parcel waiting for pickup',
      user: 'Dormitory Office',
      time: '15 Jan 2026 · 10:30 AM',
      isRead: false
    },
    {
      id: 3,
      type: 'comment',
      label: 'Parcel Note',
      title: 'Staff added a note to your parcel record',
      user: 'Admin Staff',
      time: '15 Jan 2026 · 11:00 AM',
      isRead: false
    },
    {
      id: 4,
      type: 'connect',
      label: 'Parcel Assigned',
      title: 'A parcel has been assigned to your room',
      user: 'Parcel Management System',
      time: '15 Jan 2026 · 11:45 AM',
      isRead: false
    },
    {
      id: 5,
      type: 'message',
      label: 'Pickup Confirmation',
      title: 'Your parcel has been successfully picked up',
      user: 'Dormitory Office',
      time: '15 Jan 2026 · 01:15 PM',
      isRead: false
    },
    {
      id: 6,
      type: 'new',
      label: 'New Parcel Arrived',
      title: 'A new parcel has arrived for Room 304',
      user: 'Parcel System',
      time: '15 Jan 2026 · 02:40 PM',
      isRead: false
    },
    {
      id: 7,
      type: 'comment',
      label: 'Delivery Update',
      title: 'Courier updated the delivery status of your parcel',
      user: 'Courier Service',
      time: '15 Jan 2026 · 03:20 PM',
      isRead: false
    },
    {
      id: 8,
      type: 'connect',
      label: 'Room Verification',
      title: 'Your room number has been verified for parcel delivery',
      user: 'Dormitory Admin',
      time: '15 Jan 2026 · 04:05 PM',
      isRead: false
    },
    {
      id: 9,
      type: 'message',
      label: 'Parcel Reminder',
      title: 'Please collect your parcel before storage deadline',
      user: 'Dormitory Office',
      time: '15 Jan 2026 · 05:30 PM',
      isRead: false
    },
    {
      id: 10,
      type: 'new',
      label: 'Parcel Stored',
      title: 'Your parcel is stored safely at the dormitory office',
      user: 'Parcel System',
      time: '15 Jan 2026 · 06:10 PM',
      isRead: false
    }
  ]

  // Load from localStorage or use defaults
  const storedNotifications = localStorage.getItem('notifications')
  const initialNotifications = storedNotifications ? JSON.parse(storedNotifications) : [...defaultNotifications]
  
  const notifications = ref(initialNotifications)

  const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

  // Helper to save to localStorage
  const saveToLocalStorage = () => {
    localStorage.setItem('notifications', JSON.stringify(notifications.value))
  }

  const markAsRead = (id) => {
    if (id) {
        const notification = notifications.value.find(n => n.id === id)
        if (notification) {
            notification.isRead = true
            saveToLocalStorage()
        }
    } else {
        // Mark all as read
        notifications.value.forEach(n => n.isRead = true)
        saveToLocalStorage()
    }
  }

  const addNotification = (note) => {
    // Generate a simple ID (in real app, use UUID or backend id)
    const newId = notifications.value.length > 0 ? Math.max(...notifications.value.map(n => n.id)) + 1 : 1
    // Mark manual notifications as local so they aren't overwritten easily by full refreshes if we merge
    notifications.value.unshift({ ...note, id: newId, isRead: false, isLocal: true })
    saveToLocalStorage()
  }

  const fetchNotifications = async (router) => {
    // Replace with your actual backend endpoint
    const data = await getNotifications(`${import.meta.env.VITE_API_URL}/notifications`, router)
    
    if (data && Array.isArray(data) && data.length > 0) {
      const backendNotifications = data.map((n) => {
          // Map Backend DB Schema to Frontend Model
        return {
          id: n.notification_id,
          type: n.notification_type || 'message', // Default to message if missing
          label: n.noti_title || 'Notification', // Header
          title: n.noti_message || '', // Body/Content
          message: n.noti_message || '', // Explicit mapping for clarity
          user: n.sender_name || 'System', // Adjust if backend sends sender info, else default
          time: n.sent_at 
            ? new Date(n.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '',
          sentAt: n.sent_at, // Raw sent_at
          createdAt: n.created_at,
          updatedAt: n.updated_at,
          isRead: n.status === 'read', // Assuming 'read' vs 'unread'
          status: n.status, // Keep raw status too just in case
          // Keep raw data if needed
          parcelId: n.parcel_id,
          userId: n.user_id,
          isLocal: false // Mark as coming from backend
        }
      })

      // MERGE STRATEGY: Keep local notifications that are NOT in backend (e.g. temporary alerts like Welcome)
      const localNotifications = notifications.value.filter(n => n.isLocal)
      
      // Combine: Local first (usually newer) or sort by time if prefer
      // For now, let's put local ones at the top or try to merge intelligently.
      // Simple merge: Properties from backend override, but we keep purely local ones.
      
      notifications.value = [...localNotifications, ...backendNotifications]
      
      // Optional: Sort by time desc if we had reliable date objects, but 'time' string is fmt. 
      // If we use created_at/sentAt validation?
      // Let's rely on unshift order for locals for now, assuming they are "new".

      saveToLocalStorage()
    } else {
      // Fallback to default if backend returns nothing or specific error
      // Only reset to defaults if we have absolutely nothing in the current state (no local, no backend)
      if (notifications.value.length === 0) {
         const currentStored = localStorage.getItem('notifications')
         if (!currentStored) {
             notifications.value = [...defaultNotifications]
             saveToLocalStorage()
         }
      }
    }
  }

  const clearNotifications = () => {
    notifications.value = []
    localStorage.removeItem('notifications')
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    addNotification,
    fetchNotifications,
    clearNotifications,
    notifyParcelAdded: (parcel) => {
      addNotification({
        type: 'new',
        label: 'New Parcel Arrived',
        title: `A new parcel (${parcel.trackingNumber}) has arrived for ${parcel.recipientName}`,
        user: 'Parcel System',
        time: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        isRead: false
      })
    },
    notifyParcelReceived: (parcel) => {
      addNotification({
        type: 'connect',
        label: 'Parcel Received',
        title: `Parcel ${parcel.trackingNumber} has been marked as Received`,
        user: 'Parcel System',
        time: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        isRead: false
      })
    },
    notifyParcelPickup: (parcel) => {
      addNotification({
        type: 'connect',
        label: 'Parcel Picked Up',
        title: `Parcel ${parcel.trackingNumber} has been picked up`,
        user: 'Parcel System',
        time: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        isRead: false
      })
    },
    notifyWelcome: (username, role = 'RESIDENT') => {
      const roleText = role === 'RESIDENT' ? 'resident' : 'user'
      addNotification({
        type: 'message',
        label: 'Welcome',
        title: `Welcome ${username}! Your ${roleText} account has been created.`,
        user: 'Dormitory Office',
        time: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        isRead: false
      })
    },
    notifyLogin: (username, role = 'RESIDENT') => {
      addNotification({
        type: 'message',
        label: 'Login Success',
        title: `Welcome back, ${username}! Login successful.`,
        user: 'System',
        time: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        isRead: false
      })
    },
    parcelNotifications: computed(() => {
        const PARCEL_TYPES = ['new', 'comment', 'connect']
        return notifications.value.filter(n => PARCEL_TYPES.includes(n.type))
    }),
    announcementNotifications: computed(() => {
        const ACCOUNT_TYPES = ['message']
        return notifications.value.filter(n => ACCOUNT_TYPES.includes(n.type))
    })
  }
})
