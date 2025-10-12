import { PublicClientApplication } from '@azure/msal-browser'
import { reactive } from 'vue'

export const msalConfig = {
  auth: {
    clientId: 'd129054b-4326-426a-a979-999c98603cc6',
    authority:
      'https://login.microsoftonline.com/79845616-9df0-43e0-8842-e300feb2642a',
    redirectUri: 'http://localhost:5173/callback/login',
    postLogoutRedirectUri: 'https://intproj23.sit.kmutt.ac.th/pl2/login'
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  },
  system: {
    responseMode: 'query'
  }
}

export const graphScopes = {
  scopes: ['user.read', 'openid', 'profile', 'offline_access', 'email']
}

export const state = reactive({
  isAuthenticated: false,
  user: null
})

export const msalInstance = new PublicClientApplication(msalConfig)
