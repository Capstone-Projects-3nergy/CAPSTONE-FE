// src/stores/LineNotificationManager.js
import { sendLineNotification } from '@/utils/fetchUtils.js'
import { LINE_CONFIG } from '@/lineApi/line.config.js'

class LineNotificationManager {
  /**
   * ขอให้ backend ส่งข้อความเข้า LINE Group
   * @param {string} groupId
   * @param {string} message
   */
  async sendToGroup(groupId, message) {
    try {
      const payload = { groupId, message }
      // ใช้ API_URL จาก config หรือ default
      const url = `${import.meta.env.VITE_BASE_URL}${LINE_CONFIG.API_URL}`
      const response = await sendLineNotification(payload, null, url)
      return response
    } catch (error) {
      console.error('[LineNotification] sendToGroup Error:', error.message)
      throw error
    }
  }

  /**
   * ส่ง Event ให้ Backend ทำหน้าที่แจ้งเตือน Admin ผ่าน LINE 
   * @param {string} message 
   */
  async notifyAdmin(message) {
    try {
      const payload = { message }
      const url = `${import.meta.env.VITE_BASE_URL}/api/notify-line`
      const response = await sendLineNotification(payload, null, url)
      return response
    } catch (error) {
      console.error('[LineNotification] notifyAdmin Error:', error.message)
      throw error
    }
  }

  /**
   * Notify Admin about new parcel
   * @param {Object} parcel 
   */
  async notifyNewParcel(parcel) {
    const message = `📦 New Parcel Arrived!\n📌 Tracking: ${parcel.trackingNumber}\n👤 Recipient: ${parcel.receiverName || 'N/A'}\n🏠 Room: ${parcel.roomNumber || 'N/A'}\n🚚 Courier: ${parcel.courier || 'N/A'}`
    return this.notifyAdmin(message)
  }

  /**
   * Notify Admin about new announcement
   * @param {Object} announcement 
   */
  async notifyNewAnnouncement(announcement) {
    const message = `📢 New Announcement!\n📌 Title: ${announcement.title}\n📂 Category: ${announcement.category}${announcement.subtitle ? `\n📝 Subtitle: ${announcement.subtitle}` : ''}`
    return this.notifyAdmin(message)
  }

  /**
   * Notify through generic event (handled by backend)
   */
  async notifyAnnouncementCreated(announcement) {
    return this.notifyNewAnnouncement(announcement)
  }
}

export default new LineNotificationManager()

