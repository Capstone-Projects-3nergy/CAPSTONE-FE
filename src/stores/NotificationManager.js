import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNotificationManager = defineStore('notificationManager', () => {
  const notifications = ref([
    {
      type: 'new',
      label: 'New Parcel Arrived',
      title: 'A new parcel has arrived at the dormitory office',
      user: 'Parcel System',
      time: '15 Jan 2026 · 09:10 AM'
    },
    {
      type: 'message',
      label: 'Pickup Reminder',
      title: 'You have a parcel waiting for pickup',
      user: 'Dormitory Office',
      time: '15 Jan 2026 · 10:30 AM'
    },
    {
      type: 'comment',
      label: 'Parcel Note',
      title: 'Staff added a note to your parcel record',
      user: 'Admin Staff',
      time: '15 Jan 2026 · 11:00 AM'
    },
    {
      type: 'connect',
      label: 'Parcel Assigned',
      title: 'A parcel has been assigned to your room',
      user: 'Parcel Management System',
      time: '15 Jan 2026 · 11:45 AM'
    },
    {
      type: 'message',
      label: 'Pickup Confirmation',
      title: 'Your parcel has been successfully picked up',
      user: 'Dormitory Office',
      time: '15 Jan 2026 · 01:15 PM'
    },
    {
      type: 'new',
      label: 'New Parcel Arrived',
      title: 'A new parcel has arrived for Room 304',
      user: 'Parcel System',
      time: '15 Jan 2026 · 02:40 PM'
    },
    {
      type: 'comment',
      label: 'Delivery Update',
      title: 'Courier updated the delivery status of your parcel',
      user: 'Courier Service',
      time: '15 Jan 2026 · 03:20 PM'
    },
    {
      type: 'connect',
      label: 'Room Verification',
      title: 'Your room number has been verified for parcel delivery',
      user: 'Dormitory Admin',
      time: '15 Jan 2026 · 04:05 PM'
    },
    {
      type: 'message',
      label: 'Parcel Reminder',
      title: 'Please collect your parcel before storage deadline',
      user: 'Dormitory Office',
      time: '15 Jan 2026 · 05:30 PM'
    },
    {
      type: 'new',
      label: 'Parcel Stored',
      title: 'Your parcel is stored safely at the dormitory office',
      user: 'Parcel System',
      time: '15 Jan 2026 · 06:10 PM'
    }
  ])

  const unreadCount = ref(notifications.value.length)

  const markAsRead = () => {
    unreadCount.value = 0
  }

  const addNotification = (note) => {
    notifications.value.unshift(note)
    unreadCount.value++
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    addNotification
  }
})
