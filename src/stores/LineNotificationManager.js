// src/lineApi/LineNotificationManager.js
import axios from 'axios'
import { LINE_CONFIG } from '@/lineApi/line.config.js'

class LineNotificationManager {
  /**
   * ขอให้ backend ส่งข้อความเข้า LINE Group
   * @param {string} groupId
   * @param {string} message
   */
  async sendToGroup(groupId, message) {
    try {
      const response = await axios.post(LINE_CONFIG.API_URL, {
        groupId,
        message
      })
      return response.data
    } catch (error) {
      console.error('❌ ส่งคำขอ LINE ล้มเหลว')
      console.error(error.response?.data || error.message)
      throw error
    }
  }

  /**
   * ส่ง Event ให้ Backend ทำหน้าที่แจ้งเตือน Admin ผ่าน LINE 
   * @param {string} message 
   */
  async notifyAdmin(message) {
    try {
      // ให้ Frontend ส่ง event เพื่อไปเรียกใช้ Backend API
      const response = await axios.post('/api/notify-line', {
        message
      })
      return response.data
    } catch (error) {
      console.error('❌ แจ้งเตือน Admin ล้มเหลว')
      console.error(error.response?.data || error.message)
      throw error
    }
  }
}

export default new LineNotificationManager()

