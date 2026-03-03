// src/stores/LineNotificationManager.js
import { sendLineNotification } from '@/utils/fetchUtils.js'
import { LINE_CONFIG } from '@/lineApi/line.config.js'

class LineNotificationManager {
  /**
   * ขอให้ backend ส่งข้อความเข้า LINE Group
   * @param {string} groupId
   * @param {string} message
   * @param {Object} router - Vue Router object for session management
   */
  async sendToGroup(groupId, message, router = null) {
    try {
      const payload = { groupId, message }
      const url = `${import.meta.env.VITE_BASE_URL}${LINE_CONFIG.API_URL}`
      const response = await sendLineNotification(payload, router, url)
      return response
    } catch (error) {
      console.error('[LineNotification] sendToGroup Error:', error.message)
      throw error
    }
  }

  /**
   * ส่ง Event ให้ Backend ทำหน้าที่แจ้งเตือน Admin ผ่าน LINE 
   * @param {string} message 
   * @param {Object} router - Vue Router object for session management
   */
  async notifyAdmin(message, router = null) {
    try {
      const payload = { message }
      const url = `${import.meta.env.VITE_BASE_URL}${LINE_CONFIG.NOTIFY_ADMIN_URL}`
      const response = await sendLineNotification(payload, router, url)
      return response
    } catch (error) {
      console.error('[LineNotification] notifyAdmin Error:', error.message)
      throw error
    }
  }

  /**
   * Notify Admin about new parcel
   */
  async notifyNewParcel(parcel, router = null) {
    const message = `📦 New Parcel Arrived!\n📌 Tracking: ${parcel.trackingNumber}\n👤 Recipient: ${parcel.receiverName || 'N/A'}\n🏠 Room: ${parcel.roomNumber || 'N/A'}\n🚚 Courier: ${parcel.courier || 'N/A'}`
    return this.notifyAdmin(message, router)
  }

  /**
   * Notify Admin about new announcement
   */
  async notifyNewAnnouncement(announcement, router = null) {
    const message = `📢 New Announcement!\n📌 Title: ${announcement.title}\n📂 Category: ${announcement.category}${announcement.subtitle ? `\n📝 Subtitle: ${announcement.subtitle}` : ''}`
    return this.notifyAdmin(message, router)
  }

  /**
   * Notify through generic event
   */
  async notifyAnnouncementCreated(announcement, router = null) {
    return this.notifyNewAnnouncement(announcement, router)
  }
}

export default new LineNotificationManager()

