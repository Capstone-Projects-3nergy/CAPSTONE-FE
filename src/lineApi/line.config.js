// src/lineApi/line.config.js
export const LINE_CONFIG = {
  API_URL: import.meta.env.VITE_LINE_API_URL || '/api/line/send',
  NOTIFY_ADMIN_URL: '/api/notify-line',
  LINK_URL: '/api/line/link',
  UNLINK_URL: '/api/line/unlink',
  SEND_PRIVATE_URL: '/api/line/send-private',
  CHANNEL_ID: import.meta.env.VITE_LINE_CHANNEL_ID,
  REDIRECT_URI: import.meta.env.VITE_LINE_REDIRECT_URI
}

// export const LINE_CONFIG = {
//   CHANNEL_ACCESS_TOKEN: import.meta.env.VITE_LINE_CHANNEL_ACCESS_TOKEN,
//   API_URL: '/line-api/v2/bot/message/push'
// }
