import axios from 'axios'
import { LINE_CONFIG } from '@/lineApi/line.config.js'

class LineNotificationManager {
  constructor() {
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_CONFIG.CHANNEL_ACCESS_TOKEN}`
    }
  }

  /**
   * ส่งข้อความเข้ากลุ่ม LINE
   * @param {string} groupId - LINE Group ID
   * @param {string} message - ข้อความที่ต้องการส่ง
   */
  async sendToGroup(groupId, message) {
    try {
      const payload = {
        to: groupId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      }

      const response = await axios.post(LINE_CONFIG.API_URL, payload, {
        headers: this.headers
      })

      console.log('✅ ส่ง LINE แจ้งเตือนสำเร็จ')
      return response.data
    } catch (error) {
      console.error('❌ ส่ง LINE แจ้งเตือนล้มเหลว')
      console.error(error.response?.data || error.message)
      throw error
    }
  }
}

export default new LineNotificationManager()
