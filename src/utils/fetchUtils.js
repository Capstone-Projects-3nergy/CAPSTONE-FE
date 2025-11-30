import { useAuthManager } from '@/stores/AuthManager.js'

async function fetchWithAuth(url, options, router) {
  const authManager = useAuthManager()
  const token = authManager.user?.accessToken

  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  }

  const res = await fetch(url, options)

  if (res.status === 401) {
    const newToken = await authManager.refreshToken()

    if (newToken) {
      options.headers.Authorization = `Bearer ${newToken}`
      const retryRes = await fetch(url, options)

      if (retryRes.ok) return retryRes

      return retryRes
    }

    authManager.logoutAccount(router)
    return null
  }

  return res
}

export async function getItems(url, router) {
  try {
    const options = {
      method: 'GET',
      headers: {}
    }

    const res = await fetchWithAuth(url, options, router)
    if (res) {
      return await res.json()
    }
    return null
  } catch (error) {
    return null
  }
}
async function getItemById(url, id, router) {
  try {
    const options = {
      method: 'GET',
      headers: {}
    }

    const res = await fetchWithAuth(`${url}/${id}`, options, router)
    if (!res) return null
    if (!res.ok) {
      console.error('getItemById failed:', res.status)
      return null
    }

    return await res.json()
  } catch (error) {
    console.error('getItemById error:', error)
    return null
  }
}

async function deleteItemById(url, id, router) {
  try {
    const options = {
      method: 'DELETE',
      headers: {}
    }

    const res = await fetchWithAuth(`${url}/${id}`, options, router)
    if (res.ok) {
      return res.status
    }
    return null
  } catch (error) {
    return null
  }
}

async function deleteAndTransferItem(url, id, newId, router) {
  try {
    const options = {
      method: 'DELETE',
      headers: {}
    }

    const res = await fetchWithAuth(`${url}/${id}/${newId}`, options, router)
    if (res) {
      return res.status
    }
    return null
  } catch (error) {
    return null
  }
}

async function addItem(url, newItem, router) {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newItem)
    }

    const res = await fetchWithAuth(url, options, router)
    if (!res) return null

    if (res.ok) {
      const text = await res.text()

      try {
        const data = JSON.parse(text)
        return data
      } catch (err) {
        return null
      }
    }

    return res.status
  } catch (error) {
    return null
  }
}

async function editItem(url, id, editedItem, router) {
  try {
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editedItem)
    }

    const res = await fetchWithAuth(`${url}/${id}`, options, router)
    if (res) {
      return await res.json()
    }
    return null
  } catch (error) {
    return null
  }
}

async function toggleVisibility(url, id, visibility, router) {
  const options = {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visibility })
  }
  const res = await fetchWithAuth(`${url}/${id}`, options, router)
  if (res.ok) return await res.json()
  return null
}

async function editReadWrite(url, id, readWrite, router) {
  const options = {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessRight: readWrite })
  }
  const res = await fetchWithAuth(`${url}/${id}`, options, router)
  if (res.ok) return await res.json()
  return null
}

async function editInviteReadWrite(url, id, readWrite, router) {
  const options = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessRight: readWrite })
  }
  const res = await fetchWithAuth(`${url}/${id}`, options, router)
  if (res.ok) return await res.json()
  return null
}

async function acceptInvite(url, router) {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const res = await fetchWithAuth(url, options, router)
    if (res.ok) {
      return await res.json()
    }
    return res.status
  } catch (error) {
    return null
  }
}

async function cancelInvite(url, id, router) {
  const options = {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  }
  const res = await fetchWithAuth(`${url}/${id}`, options, router)
  if (res?.ok) return res
  return null
}

async function declineInvite(url, router) {
  const options = {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  }
  const res = await fetchWithAuth(url, options, router)
  if (res?.ok) return res
  return null
}

async function editItemWithFile(url, id, file = null, editedItem, router) {
  const formData = new FormData()

  if (file) {
    file.forEach((file) => {
      formData.append('file', file)
    })
  }
  if (editedItem && Object.keys(editedItem).length > 0) {
    const jsonString = JSON.stringify(editedItem)
    const blob = new Blob([jsonString], { type: 'application/json' })
    formData.append('taskDetails', blob)
  }

  try {
    const options = {
      method: 'PUT',
      body: formData
    }

    const res = await fetchWithAuth(`${url}/${id}`, options, router)
    if (res) {
      return await res.json()
    }
    return null
  } catch (error) {
    return null
  }
}

async function deleteFile(url, id, file, router) {
  try {
    const options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    }
    const res = await fetchWithAuth(
      `${url}/${id}/file/${file}`,
      options,
      router
    )
    if (res.ok) {
      return await res.json()
    }
  } catch (error) {
    return null
  }
}
async function updateParcelStatus(baseUrl, id, newStatus, token) {
  const res = await fetch(`${baseUrl}/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: newStatus })
  })

  if (!res.ok) throw new Error('Update status failed')
  return await res.json()
}

async function confirmParcelPickup(url, id, router) {
  try {
    const options = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'PICKED_UP',
        pickedUpAt: new Date().toISOString()
      })
    }

    const res = await fetchWithAuth(`${url}/${id}/pickup`, options, router)

    if (res?.ok) {
      return await res.json()
    }
    return null
  } catch (error) {
    return null
  }
}
async function confirmParcelReceived(url, id, router) {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const res = await fetchWithAuth(`${url}/${id}/confirm`, options, router)

    if (!res) return null

    if (res.ok) {
      return await res.json()
    }

    return { status: res.status }
  } catch (error) {
    return null
  }
}

export {
  getItemById,
  deleteItemById,
  addItem,
  editItem,
  deleteAndTransferItem,
  toggleVisibility,
  editReadWrite,
  acceptInvite,
  cancelInvite,
  editInviteReadWrite,
  declineInvite,
  editItemWithFile,
  deleteFile,
  updateParcelStatus,
  confirmParcelPickup,
  confirmParcelReceived
}
