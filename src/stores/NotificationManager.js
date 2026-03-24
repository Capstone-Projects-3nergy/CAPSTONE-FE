import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getNotifications, markNotificationAsRead } from '@/utils/fetchUtils'
import { useAuthManager } from '@/stores/AuthManager'
import LineNotificationManager from '@/stores/LineNotificationManager'
import SockJS from 'sockjs-client'
import Stomp from 'stompjs'

export const useNotificationManager = defineStore('notificationManager', () => {
  const defaultNotifications = [
    // {
    //   id: 1,
    //   type: 'new',
    //   label: 'New Parcel Arrived',
    //   title: 'A new parcel has arrived at the dormitory office',
    //   user: 'Parcel System',
    //   time: '15 Jan 2026 · 09:10 AM',
    //   isRead: false
    // },
    // {
    //   id: 2,
    //   type: 'message',
    //   label: 'Pickup Reminder',
    //   title: 'You have a parcel waiting for pickup',
    //   user: 'Dormitory Office',
    //   time: '15 Jan 2026 · 10:30 AM',
    //   isRead: false
    // },
    // {
    //   id: 3,
    //   type: 'comment',
    //   label: 'Parcel Note',
    //   title: 'Staff added a note to your parcel record',
    //   user: 'Admin Staff',
    //   time: '15 Jan 2026 · 11:00 AM',
    //   isRead: false
    // },
    // {
    //   id: 4,
    //   type: 'connect',
    //   label: 'Parcel Assigned',
    //   title: 'A parcel has been assigned to your room',
    //   user: 'Parcel Management System',
    //   time: '15 Jan 2026 · 11:45 AM',
    //   isRead: false
    // },
    // {
    //   id: 5,
    //   type: 'message',
    //   label: 'Pickup Confirmation',
    //   title: 'Your parcel has been successfully picked up',
    //   user: 'Dormitory Office',
    //   time: '15 Jan 2026 · 01:15 PM',
    //   isRead: false
    // },
    // {
    //   id: 6,
    //   type: 'new',
    //   label: 'New Parcel Arrived',
    //   title: 'A new parcel has arrived for Room 304',
    //   user: 'Parcel System',
    //   time: '15 Jan 2026 · 02:40 PM',
    //   isRead: false
    // },
    // {
    //   id: 7,
    //   type: 'comment',
    //   label: 'Delivery Update',
    //   title: 'Courier updated the delivery status of your parcel',
    //   user: 'Courier Service',
    //   time: '15 Jan 2026 · 03:20 PM',
    //   isRead: false
    // },
    // {
    //   id: 8,
    //   type: 'connect',
    //   label: 'Room Verification',
    //   title: 'Your room number has been verified for parcel delivery',
    //   user: 'Dormitory Admin',
    //   time: '15 Jan 2026 · 04:05 PM',
    //   isRead: false
    // },
    // {
    //   id: 9,
    //   type: 'message',
    //   label: 'Parcel Reminder',
    //   title: 'Please collect your parcel before storage deadline',
    //   user: 'Dormitory Office',
    //   time: '15 Jan 2026 · 05:30 PM',
    //   isRead: false
    // },
    // {
    //   id: 10,
    //   type: 'new',
    //   label: 'Parcel Stored',
    //   title: 'Your parcel is stored safely at the dormitory office',
    //   user: 'Parcel System',
    //   time: '15 Jan 2026 · 06:10 PM',
    //   isRead: false
    // }
  ]

  // Load from localStorage or use defaults
  const storedNotifications = localStorage.getItem('notifications')
  const initialNotifications = storedNotifications ? JSON.parse(storedNotifications) : [...defaultNotifications]
  
  const notifications = ref(initialNotifications)
  const welcomePopupVisible = ref(false)
  const welcomePopupMessage = ref('')
  const hasShownWelcome = ref(false)

  // ✅ New WebSocket State
  const stompClient = ref(null)
  const connected = ref(false)
  const authManager = useAuthManager()

  const closeWelcomePopup = () => {
    welcomePopupVisible.value = false
    setTimeout(() => {
      welcomePopupMessage.value = ''
    }, 300)
  }

  const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

  // Helper to save to localStorage
  const saveToLocalStorage = () => {
    localStorage.setItem('notifications', JSON.stringify(notifications.value))
  }

  // ✅ WebSocket logic
  const connectWebSocket = async () => {
    if (connected.value || stompClient.value) return

    const token = authManager.user?.accessToken
    if (!token) {
      console.warn('Cannot connect WebSocket: No access token')
      return
    }

    try {
      const socket = new SockJS(`${import.meta.env.VITE_BASE_URL}/ws`)
      stompClient.value = Stomp.over(socket)
      stompClient.value.debug = null // (Optional) Hide logs

      stompClient.value.connect(
        { Authorization: `Bearer ${token}` },
        (frame) => {
          connected.value = true
          console.log('✅ WebSocket Connected')
          
          // Subscribe to private notifications
          stompClient.value.subscribe('/user/queue/notifications', (sdkEvent) => {
            console.log('📬 WebSocket Message Received on /user/queue/notifications')
            try {
              const data = JSON.parse(sdkEvent.body)
              handleNewIncomingNotification(data)
            } catch (e) {
              console.error('❌ Error parsing WebSocket message:', e)
            }
          })
        },
        (error) => {
          console.error('❌ WebSocket Connect Error:', error)
          connected.value = false
          stompClient.value = null
          // Retry after 5 seconds
          setTimeout(connectWebSocket, 5000)
        }
      )
    } catch (err) {
      console.error('WebSocket Exception:', err)
    }
  }

  const disconnectWebSocket = () => {
    if (stompClient.value) {
      stompClient.value.disconnect(() => {
        console.log('WebSocket Disconnected')
      })
      stompClient.value = null
      connected.value = false
    }
  }

  // Helper to standardizing notification object (same as mapping in fetch)
  const mapBackendToModel = (n) => {
    // Backend อาจจะส่งมาในรูปแบบ notificationId หรือ id
    const id = n.notificationId || n.id || Date.now()
    const backendTitle = n.title || n.notiTitle || n.label || 'Notification'
    const backendMessage = n.message || n.notiMessage || n.title || ''
    const backendType = n.type || n.notificationType || 'message'
    const backendParcelId = n.parcelId || (n.parcel ? n.parcel.parcelId : null)

    let derivedType = 'announcement'
    const titleLower = backendTitle.toLowerCase()
    if (backendType === 'LINE' || backendType === 'EMAIL' || backendType === 'MESSAGE') {
      derivedType = 'announcement'
    } else if (backendType?.includes('OVERDUE')) {
      derivedType = 'overdue'
    } else {
      if (titleLower.includes('overdue')) derivedType = 'overdue'
      else if (titleLower.includes('new parcel') || titleLower.includes('arrived')) derivedType = 'new'
      else if (titleLower.includes('picked up') || titleLower.includes('collected')) derivedType = 'connect'
      else if (titleLower.includes('updated')) derivedType = 'comment'
      else if (backendParcelId) derivedType = 'new'
      else derivedType = 'announcement'
    }

    const timeValue = n.sentAt || n.createdAt || new Date();
    // รองรับทั้ง boolean, 1/0, หรือ string 'true'/'false'
    const isReadVal = (n.isRead === true || n.isRead === 1 || n.isRead === 'true' || n.is_read === 1) ? 1 : 0;

    return {
      id: id,
      type: derivedType,
      label: backendTitle,
      title: backendMessage,
      message: backendMessage,
      user: 'Dormitory Office',
      time: timeValue ? new Date(timeValue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
      sentAt: n.sentAt || timeValue,
      createdAt: n.createdAt || timeValue,
      isRead: isReadVal,
      parcelId: backendParcelId,
      isLocal: false
    }
  }

  const handleNewIncomingNotification = (newNoti) => {
    console.log('📩 RAW WebSocket message received:', newNoti)
    const mapped = mapBackendToModel(newNoti)
    
    // ตรวจสอบว่ามีอยู่แล้วหรือยังเพื่อป้องกันซ้ำ
    const exists = notifications.value.some(n => n.id === mapped.id)
    if (!exists) {
      notifications.value.unshift(mapped)
      saveToLocalStorage()
      console.log('✅ Notification added to store:', mapped)
    }
  }

  const markAsRead = async (id, router) => {
    if (id) {
        // Optimistic UI update for immediate feedback
        const notification = notifications.value.find(n => n.id === id)
        if (notification) {
            notification.isRead = 1
            saveToLocalStorage()
        }

        // Call backend to mark as read
        const result = await markNotificationAsRead(`${import.meta.env.VITE_BASE_URL}/api/notifications`, id, router)
        
        if (!result || !result.success) {
             console.error('Failed to mark notification as read on backend:', result ? result.status : 'Unknown error')
             // Revert optimistic update
             if (notification) {
                notification.isRead = 0
                saveToLocalStorage()
             }
        }
    } else {
        // Mark all as read (if supported by backend, otherwise loop or just local)
        // For now, keep local loop but consider backend bulk endpoint if available
        notifications.value.forEach(n => {
            n.isRead = 1
        })
        saveToLocalStorage()
    }
  }



  const fetchNotifications = async (router) => {
    // Replace with your actual backend endpoint
    // Using VITE_BASE_URL to match other components
    const data = await getNotifications(`${import.meta.env.VITE_BASE_URL}/api/notifications`, router)
    
    // Always preserve local notifications (e.g. Welcome)
    // Harden: Check for isLocal flag OR if the ID starts with 'local-' to catch legacy items
    const localNotifications = notifications.value.filter(n => n.isLocal || (typeof n.id === 'string' && n.id.startsWith('local-')))

    if (data && Array.isArray(data)) { 
      // If we got a valid array (empty or not), update the state
      const backendNotifications = data.map((n) => {
          // Map Backend DB Schema to Frontend Model
          // Backend uses DTO: title, message, type, parcelId, trackingNumber
          // Fallback to Entity fields: notiTitle, notiMessage, notificationType, Parcel
          
          const backendTitle = n.title || n.notiTitle || ''
          const backendMessage = n.message || n.notiMessage || ''
          const backendType = n.type || n.notificationType
          const backendParcelId = n.parcelId || (n.parcel ? n.parcel.parcelId : null) || (n.Parcel ? n.Parcel.parcelId : null)

          let derivedType = 'announcement'
          const titleLower = backendTitle.toLowerCase()
          
          if (backendType === 'LINE' || backendType === 'EMAIL' || backendType === 'MESSAGE') {
             derivedType = 'announcement'
          } else if (backendType?.includes('OVERDUE')) {
             derivedType = 'overdue'
          } else {
             // Heuristics based on title
             if (titleLower.includes('overdue')) derivedType = 'overdue'
             else if (titleLower.includes('new parcel') || titleLower.includes('arrived')) derivedType = 'new'
             else if (titleLower.includes('picked up') || titleLower.includes('collected')) derivedType = 'connect'
             else if (titleLower.includes('received')) derivedType = 'connect'
             else if (titleLower.includes('updated')) derivedType = 'comment'
          }

          // Use createdAt if sentAt is null
          const timeValue = n.sentAt || n.createdAt;
          const isReadVal = (n.isRead === true || n.isRead === 1 || n.is_read === true || n.is_read === 1) ? 1 : 0;
          
          // Trigger Line Admin Notification for ALL unread notifications from backend if not already notified
          // if (isReadVal === 0) {
          //     const notifiedKey = `line_notified_${n.notificationId}`
          //     if (!localStorage.getItem(notifiedKey)) {
          //         // Fire and forget Line Notify
          //         LineNotificationManager.notifyAdmin(`🔔 New Notification: ${backendTitle}\nDetails: ${backendMessage}`).catch(e => console.error("Line notification failed in background", e))
          //         localStorage.setItem(notifiedKey, 'true')
          //     }
          // }

        return {
          id: n.notificationId, // Ensure this is unique from local IDs
          type: derivedType,
          label: backendTitle || 'Notification', // Header
          title: backendMessage || '', // Body/Content
          message: backendMessage || '', // Explicit mapping for clarity
          user: 'Dormitory Office', // Backend 'user' is recipient. Notification sender is effectively the System/Office.
          time: timeValue ? new Date(timeValue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
          sentAt: n.sentAt, // Raw sent_at
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          // Ensure status is handled correctly
          status: n.status || 'PENDING', // Default to PENDING if missing
          isRead: isReadVal, 
          // Keep raw data if needed
          parcelId: backendParcelId,
          parcel: n.parcel || n.Parcel, // Keep original if available
          userId: n.user ? n.user.userId : null,
          isLocal: false // Mark as coming from backend
        }
      })

      // Combine: Local first (allow them to float to top if new) or backend first? 
      // Usually we want newest on top.
      const allNotifications = [...localNotifications, ...backendNotifications]
      
      // Optional: Sort by time if needed, but for now just replacing state
      notifications.value = allNotifications
      saveToLocalStorage()
    } else {
      console.warn('Failed to fetch notifications from backend or empty response. Using local cache.')
      // Fallback if backend returns null/undefined (error case)
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
    welcomePopupVisible.value = false
    welcomePopupMessage.value = ''
    hasShownWelcome.value = false
  }

  return {
    notifications,
    unreadCount,
    markAsRead,

    fetchNotifications,
    clearNotifications,
    notifyParcelAdded: async (parcel, router) => {
      await fetchNotifications(router)
    },
    notifyParcelReceived: async (parcel, router) => {
      await fetchNotifications(router)
    },
    notifyParcelPickup: async (parcel, router) => {
      await fetchNotifications(router)
    },
    notifyParcelUpdate: async (updatedParcel, router) => {
      await fetchNotifications(router)
    },
    notifyAnnouncementCreated: async (announcement, router) => {
      // Direct Line Notify for immediate feedback
      await LineNotificationManager.notifyNewAnnouncement(announcement).catch(e => console.error("Line notification failed", e))
      await fetchNotifications(router)
    },
    notifyParcelSaved: async (parcel, router) => {
      // Direct Line Notify for immediate feedback
      await LineNotificationManager.notifyNewParcel(parcel).catch(e => console.error("Line notification failed", e))
      await fetchNotifications(router)
    },

    welcomePopupVisible,
    welcomePopupMessage,
    hasShownWelcome,
    closeWelcomePopup,
    notifyLogin: (username, role = 'RESIDENT') => {
      if (hasShownWelcome.value) return
      
      const roleText = role === 'RESIDENT' ? 'resident' : 'user'
      welcomePopupMessage.value = `Welcome , ${username}!`
      welcomePopupVisible.value = true
      hasShownWelcome.value = true

      setTimeout(() => {
        closeWelcomePopup()
      }, 4000)
    },
    parcelNotifications: computed(() => {
        const PARCEL_TYPES = ['new', 'comment', 'connect', 'overdue']
        return notifications.value.filter(n => PARCEL_TYPES.includes(n.type))
    }),
    announcementNotifications: computed(() => {
        const ANNOUNCEMENT_TYPES = ['announcement', 'message']
        return notifications.value.filter(n => ANNOUNCEMENT_TYPES.includes(n.type))
    }),

    // ✅ Expose WebSocket actions
    connected,
    connectWebSocket,
    disconnectWebSocket
  }
})
