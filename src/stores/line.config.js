import 'dotenv/config'

export const LINE_CONFIG = {
  CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  API_URL: 'https://api.line.me/v2/bot/message/push'
}
