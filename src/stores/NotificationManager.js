import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getNotifications, markNotificationAsRead } from '@/utils/fetchUtils'
import { useAuthManager } from '@/stores/AuthManager'
import LineNotificationManager from '@/stores/LineNotificationManager'
import SockJS from 'sockjs-client'
import Stomp from 'stompjs'

export const useNotificationManager = defineStore('notificationManager', () => {
  const defaultNotifications = []
  const storedNotifications = localStorage.getItem('notifications')
  const initialNotifications = storedNotifications ? JSON.parse(storedNotifications) : [...defaultNotifications]
  
  const notifications = ref(initialNotifications)
  const welcomePopupVisible = ref(false)
  const welcomePopupMessage = ref('')
  const hasShownWelcome = ref(false)


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
          stompClient.value.subscribe('/user/queue/notifications', (sdkEvent) => {
            try {
              const data = JSON.parse(sdkEvent.body)
              handleNewIncomingNotification(data)
            } catch (e) {
            }
          })
        },
        (error) => {
          connected.value = false
          stompClient.value = null
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
      })
      stompClient.value = null
      connected.value = false
    }
  }

  
  const mapBackendToModel = (n) => {
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
    const mapped = mapBackendToModel(newNoti)
    const exists = notifications.value.some(n => n.id === mapped.id)
    if (!exists) {
      notifications.value.unshift(mapped)
      saveToLocalStorage()
    }
  }

  const markAsRead = async (id, router) => {
    if (id) {
        const notification = notifications.value.find(n => n.id === id)
        if (notification) {
            notification.isRead = 1
            saveToLocalStorage()
        }

        const result = await markNotificationAsRead(`${import.meta.env.VITE_BASE_URL}/api/notifications`, id, router)
        
        if (!result || !result.success) {
             console.error('Failed to mark notification as read on backend:', result ? result.status : 'Unknown error')
       
             if (notification) {
                notification.isRead = 0
                saveToLocalStorage()
             }
        }
    } else {
        notifications.value.forEach(n => {
            n.isRead = 1
        })
        saveToLocalStorage()
    }
  }



  const fetchNotifications = async (router) => {
    const data = await getNotifications(`${import.meta.env.VITE_BASE_URL}/api/notifications`, router)
    
    const localNotifications = notifications.value.filter(n => n.isLocal || (typeof n.id === 'string' && n.id.startsWith('local-')))

    if (data && Array.isArray(data)) { 
      const backendNotifications = data.map((n) => {
          
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
             if (titleLower.includes('overdue')) derivedType = 'overdue'
             else if (titleLower.includes('new parcel') || titleLower.includes('arrived')) derivedType = 'new'
             else if (titleLower.includes('picked up') || titleLower.includes('collected')) derivedType = 'connect'
             else if (titleLower.includes('received')) derivedType = 'connect'
             else if (titleLower.includes('updated')) derivedType = 'comment'
          }

          const timeValue = n.sentAt || n.createdAt;
          const isReadVal = (n.isRead === true || n.isRead === 1 || n.is_read === true || n.is_read === 1) ? 1 : 0;
          
        return {
          id: n.notificationId, 
          type: derivedType,
          label: backendTitle || 'Notification', 
          title: backendMessage || '', 
          message: backendMessage || '', 
          user: 'Dormitory Office', 
          time: timeValue ? new Date(timeValue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
          sentAt: n.sentAt, 
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          status: n.status || 'PENDING', 
          isRead: isReadVal, 
          parcelId: backendParcelId,
          parcel: n.parcel || n.Parcel, 
          userId: n.user ? n.user.userId : null,
          isLocal: false 
        }
      })
      const allNotifications = [...localNotifications, ...backendNotifications]
      
      notifications.value = allNotifications
      saveToLocalStorage()
    } else {
      console.warn('Failed to fetch notifications from backend or empty response. Using local cache.')
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
      await LineNotificationManager.notifyNewAnnouncement(announcement).catch(e => console.error("Line notification failed", e))
      await fetchNotifications(router)
    },
    notifyParcelSaved: async (parcel, router) => {
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
    connected,
    connectWebSocket,
    disconnectWebSocket
  }
})
