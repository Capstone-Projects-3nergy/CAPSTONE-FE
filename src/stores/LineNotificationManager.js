// src/stores/LineNotificationManager.js
import axios from 'axios'
import { LINE_CONFIG } from '@/lineApi/line.config.js'
import { useAuthManager } from '@/stores/AuthManager.js'

class LineNotificationManager {
  /**
   * Helper to get headers with Auth token
   */
  _getHeaders() {
    const authManager = useAuthManager()
    const token = authManager.user?.accessToken
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  }

  /**
   * Helper to get base URL
   */
  _getBaseURL() {
    return import.meta.env.VITE_BASE_URL || ''
  }

  /**
   * ขอให้ backend ส่งข้อความเข้า LINE Group
   * @param {string} groupId
   * @param {string} message
   */
  async sendToGroup(groupId, message) {
    const baseURL = this._getBaseURL()
    const url = `${baseURL}${LINE_CONFIG.API_URL}`
    
    try {
      const response = await axios.post(url, {
        groupId,
        message
      }, {
        headers: this._getHeaders()
      })
      return response.data
    } catch (error) {
      console.error(error.response?.data || error.message)
      throw error
    }
  }

  /**
   * ส่ง Event ให้ Backend ทำหน้าที่แจ้งเตือน Admin ผ่าน LINE 
   * @param {string} message 
   */
  async notifyAdmin(message) {
    const baseURL = this._getBaseURL()
    const url = `${baseURL}/api/notify-line`
    
    try {
      // ให้ Frontend ส่ง event เพื่อไปเรียกใช้ Backend API
      const response = await axios.post(url, {
        message
      }, {
        headers: this._getHeaders()
      })
      return response.data
    } catch (error) {
      console.error(error.response?.data || error.message)
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

}

export default new LineNotificationManager()

