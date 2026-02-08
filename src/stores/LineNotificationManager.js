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

      console.log('✅ ส่งคำขอ LINE สำเร็จ')
      return response.data
    } catch (error) {
      console.error('❌ ส่งคำขอ LINE ล้มเหลว')
      console.error(error.response?.data || error.message)
      throw error
    }
  }
}

export default new LineNotificationManager()

