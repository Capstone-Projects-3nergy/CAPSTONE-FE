export const LINE_CONFIG = {
  API_URL: import.meta.env.VITE_LINE_API_URL || '/api/line/send',
  NOTIFY_ADMIN_URL: '/api/notify-line',
  LINK_URL: '/api/line/link',
  UNLINK_URL: '/api/line/unlink',
  SEND_PRIVATE_URL: '/api/line/send-private',
  CHANNEL_ID: import.meta.env.VITE_LINE_CHANNEL_ID,
  REDIRECT_URI: import.meta.env.VITE_LINE_REDIRECT_URI
}

