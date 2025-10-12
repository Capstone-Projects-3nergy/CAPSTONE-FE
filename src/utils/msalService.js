import { msalInstance, state } from '../stores/msalConfig.js'

export function msalService() {
  const initialize = async () => {
    try {
      await msalInstance.initialize()
    } catch (error) {
      console.error('Initialization error:', error)
    }
  }

  const loginMicrosoft = async () => {
    try {
      if (!msalInstance) {
        throw new Error(
          'MSAL not initialized. Call initialize() before using MSAL API.'
        )
      }
      await msalInstance.loginRedirect()
      state.isAuthenticated = true
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const msalLogout = () => {
    if (!msalInstance) {
      throw new Error(
        'MSAL not initialized. Call initialize() before using MSAL API.'
      )
    }
    msalInstance.logoutRedirect()
    state.isAuthenticated = false
    state.user = null
  }

  const handleRedirect = async () => {
    try {
      await msalInstance.handleRedirectPromise() // Handles the redirect and processes tokens
      const accounts = msalInstance.getAllAccounts()
      state.isAuthenticated = accounts.length > 0

      if (state.isAuthenticated) {
        state.user = accounts[0] // Set the authenticated user's account
        console.log('User logged in:', state.user)
      }
    } catch (error) {
      console.error('Error handling redirect:', error)
    }
  }

  const getToken = async () => {
    if (!msalInstance) {
      throw new Error(
        'MSAL not initialized. Call initialize() before using MSAL API.'
      )
    }
    try {
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please login first.')
      }
      const silentRequest = {
        scopes: ['api://79f1f415-f349-4008-affd-18cbb6c54b95/Po.Read'],
        account: accounts[0]
      }
      const silentResponse = await msalInstance.acquireTokenSilent(
        silentRequest
      )
      return silentResponse.accessToken
    } catch (error) {
      console.error('Silent token acquisition error:', error)
    }
  }

  return {
    initialize,
    loginMicrosoft,
    msalLogout,
    handleRedirect,
    getToken
  }
}
