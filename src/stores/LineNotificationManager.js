import { sendLineNotification } from '@/utils/fetchUtils.js'
import { LINE_CONFIG } from '@/lineApi/line.config.js'

class LineNotificationManager {
  async sendToGroup(groupId, message, router = null) {
    try {
      const payload = { groupId, message }
      const url = `${import.meta.env.VITE_BASE_URL}${LINE_CONFIG.API_URL}`
      return { success: true, mock: true }
    } catch (error) {
      throw error
    }
  }
  async notifyAdmin(message, router = null) {
    try {
      const payload = { message }
      const url = `${import.meta.env.VITE_BASE_URL}${LINE_CONFIG.NOTIFY_ADMIN_URL}`
      return { success: true, mock: true }
    } catch (error) {
      console.error('[LineNotification] notifyAdmin Error:', error.message)
      throw error
    }
  }

  async notifyNewParcel(parcel, router = null) {
    const message = `New Parcel Arrived!\nTracking: ${parcel.trackingNumber}\nRecipient: ${parcel.receiverName || 'Awaiting Staff'}\nRoom: ${parcel.roomNumber || 'Awaiting Staff'}\nCourier: ${parcel.courier || 'Awaiting Staff'}`
    return this.notifyAdmin(message, router)
  }

  async notifyNewAnnouncement(announcement, router = null) {
    const message = `New Announcement!\nTitle: ${announcement.title}\nCategory: ${announcement.category}${announcement.subtitle ? `\nSubtitle: ${announcement.subtitle}` : ''}`
    return this.notifyAdmin(message, router)
  }
  async sendToUser(userId, message, router = null) {
    try {
      const payload = { userId, message }
      const url = `${import.meta.env.VITE_BASE_URL}${LINE_CONFIG.SEND_PRIVATE_URL}`
      return { success: true, mock: true }
    } catch (error) {
      throw error
    }
  }

  async notifyParcelRecipient(userId, parcel, router = null) {
    const message = `Your parcel has arrived!\nTracking: ${parcel.trackingNumber}\nCourier: ${parcel.courier || 'Awaiting Staff'}\nYou can pick it up at the juristic office.`
    return this.sendToUser(userId, message, router)
  }

  async notifyAnnouncementCreated(announcement, router = null) {
    return this.notifyNewAnnouncement(announcement, router)
  }
}

export default new LineNotificationManager()

