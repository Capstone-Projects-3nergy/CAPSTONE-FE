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
      return { success: true, mock: true }
    } catch (error) {
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
      return { success: true, mock: true }
    } catch (error) {
      console.error('[LineNotification] notifyAdmin Error:', error.message)
      throw error
    }
  }

  async notifyNewParcel(parcel, router = null) {
    const message = `📦 New Parcel Arrived!\n📌 Tracking: ${parcel.trackingNumber}\n👤 Recipient: ${parcel.receiverName || 'Awaiting Staff'}\n🏠 Room: ${parcel.roomNumber || 'Awaiting Staff'}\n🚚 Courier: ${parcel.courier || 'Awaiting Staff'}`
    return this.notifyAdmin(message, router)
  }

  async notifyNewAnnouncement(announcement, router = null) {
    const message = `📢 New Announcement!\n📌 Title: ${announcement.title}\n📂 Category: ${announcement.category}${announcement.subtitle ? `\n📝 Subtitle: ${announcement.subtitle}` : ''}`
    return this.notifyAdmin(message, router)
  }

  /**
   * ส่งข้อความหา User รายบุคคลผ่าน LINE
   * @param {string} userId - ID ของผู้รับในระบบ
   * @param {string} message 
   * @param {Object} router - Vue Router object for session management
   */
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
    const message = `📦 Your parcel has arrived!\n📌 Tracking: ${parcel.trackingNumber}\n🚚 Courier: ${parcel.courier || 'Awaiting Staff'}\n📍 You can pick it up at the juristic office.`
    return this.sendToUser(userId, message, router)
  }

  async notifyAnnouncementCreated(announcement, router = null) {
    return this.notifyNewAnnouncement(announcement, router)
  }
}

export default new LineNotificationManager()

