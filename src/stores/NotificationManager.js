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

  const notifications = ref([...defaultNotifications])

  const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

  const markAsRead = (id) => {
    if (id) {
        const notification = notifications.value.find(n => n.id === id)
        if (notification) {
            notification.isRead = true
        }
    } else {
        // Mark all as read
        notifications.value.forEach(n => n.isRead = true)
    }
  }

  const addNotification = (note) => {
    // Generate a simple ID (in real app, use UUID or backend id)
    const newId = notifications.value.length > 0 ? Math.max(...notifications.value.map(n => n.id)) + 1 : 1
    notifications.value.unshift({ ...note, id: newId, isRead: false })
  }

  const fetchNotifications = async (router) => {
    // Replace with your actual backend endpoint
    const data = await getNotifications(`${import.meta.env.VITE_API_URL}/notifications`, router)
    if (data && Array.isArray(data) && data.length > 0) {
      notifications.value = data.map((n, index) => ({
          ...n,
          id: n.id || index + 1, // Ensure ID existence
          isRead: n.isRead !== undefined ? n.isRead : false
      }))
    } else {
      // Fallback to default if backend returns nothing or specific error
      if (notifications.value.length === 0) {
         notifications.value = [...defaultNotifications]
      }
    }
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    addNotification,
    fetchNotifications
  }
})
