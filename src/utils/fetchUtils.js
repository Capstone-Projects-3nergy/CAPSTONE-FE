import { useAuthManager } from '@/stores/AuthManager.js'
async function fetchWithAuth(url, optionsOrFactory, router) {
  const authManager = useAuthManager()
  const buildOptions = (token) => {
    const options =
      typeof optionsOrFactory === 'function'
        ? optionsOrFactory()
        : { ...optionsOrFactory }

    // 🔥 บังคับมี headers เสมอ
    options.headers = {
      Accept: 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }

    return options
  }

  let res = await fetch(url, buildOptions(authManager.user?.accessToken))

  if (res.status === 401) {
    const newToken = await authManager.refreshToken()

    if (!newToken) {
      authManager.logoutAccount(router)
      return null
    }

    res = await fetch(url, buildOptions(newToken))
  }

  return res
}

// async function fetchWithAuth(url, options, router) {
//   const authManager = useAuthManager()
//   const token = authManager.user?.accessToken

//   if (token) {
//     options.headers = {
//       ...options.headers,
//       Authorization: `Bearer ${token}`
//     }
//   }

//   const res = await fetch(url, options)

//   if (res.status === 401) {
//     const newToken = await authManager.refreshToken()

//     if (newToken) {
//       options.headers.Authorization = `Bearer ${newToken}`
//       const retryRes = await fetch(url, options)

//       if (retryRes.ok) return retryRes

//       return retryRes
//     }

//     authManager.logoutAccount(router)
//     return null
//   }

//   return res
// }

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
async function restoreParcel(url, id, router) {
  try {
    const options = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }

    const res = await fetchWithAuth(`${url}/${id}/restore`, options, router)
    return res
  } catch (error) {
    {
      return null
    }
  }
}
export async function getProfile(url, router) {
  try {
    const res = await fetchWithAuth(url, { method: 'GET' }, router)
    if (!res || !res.ok) return null
    return await res.json()
  } catch (err) {
    console.error('getProfile error:', err)
    return null
  }
}

//Member and stadd
async function getMembers(url, router) {
  return await getItems(url, router)
}

async function getStaffs(url, router) {
  return await getItems(url, router)
}

async function getMemberById(url, id, router) {
  return await getItemById(url, id, router)
}

async function getStaffById(url, id, router) {
  return await getItemById(url, id, router)
}

// วิธีใช้
// getMembers('/api/members', router)
// getStaffs('/api/staffs', router)
async function addMember(url, member, router) {
  return await addItem(url, member, router)
}

async function addStaff(url, staff, router) {
  return await addItem(url, staff, router)
}

// addMember('/api/members', newMember, router)
// addStaff('/api/staffs', newStaff, router)
async function editMember(url, id, editedMember, router) {
  return await editItem(url, id, editedMember, router)
}

async function editStaff(url, id, editedStaff, router) {
  return await editItem(url, id, editedStaff, router)
}
async function deleteMember(url, id, router) {
  return await deleteItemById(url, id, router)
}

async function deleteStaff(url, id, router) {
  return await deleteItemById(url, id, router)
}
async function updateUserRole(url, id, role, router) {
  const options = {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  }

  const res = await fetchWithAuth(`${url}/${id}/role`, options, router)
  if (res?.ok) return await res.json()
  return null
}
// updateUserRole('/api/staffs', staffId, 'ADMIN', router)
async function toggleUserActive(url, id, isActive, router) {
  const options = {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive })
  }

  const res = await fetchWithAuth(`${url}/${id}/active`, options, router)
  if (res?.ok) return await res.json()
  return null
}
async function updateProfileWithFile(url, payload, router) {
  const formData = new FormData()

  const { profileImage, ...profileData } = payload

  formData.append(
    'data',
    new Blob([JSON.stringify(profileData)], {
      type: 'application/json'
    })
  )

  if (profileImage instanceof File) {
    formData.append('profileImage', profileImage)
  }

  try {
    const res = await fetchWithAuth(
      url,
      () => ({
        method: 'PUT',
        body: formData // ✅ ต้องส่ง
        // ❌ ห้ามตั้ง Content-Type เอง
      }),
      router
    )

    if (!res || !res.ok) return null
    return await res.json()
  } catch (err) {
    console.error('updateProfileWithFile error:', err)
    return null
  }
}
async function updateDetailWithFile(url, userId, body, router) {
  const formData = new FormData()

  // ✅ สร้าง plain object เอง
  const data = {
    firstName: body.firstName,
    lastName: body.lastName,
    roomNumber: body.roomNumber,
    phoneNumber: body.phoneNumber,
    lineId: body.lineId,
    dormId: body.dormId
  }

  formData.append(
    'data',
    new Blob([JSON.stringify(data)], { type: 'application/json' })
  )

  if (body.profileImage instanceof File) {
    formData.append('profileImage', body.profileImage)
  }

  const res = await fetchWithAuth(
    `${url}/${userId}`,
    () => ({
      method: 'PUT',
      body: formData
    }),
    router
  )

  if (!res?.ok) return null
  return await res.json()
}

async function addMemberWithFile(url, payload, router) {
  const formData = new FormData()

  const { profileImage, ...profileData } = payload

  formData.append(
    'data',
    new Blob([JSON.stringify(profileData)], {
      type: 'application/json'
    })
  )

  if (profileImage instanceof File) {
    formData.append('profileImage', profileImage)
  }

  try {
    const res = await fetchWithAuth(
      url,
      () => ({
        method: 'POST',
        body: formData // ✅ ต้องส่ง
        // ❌ ห้ามตั้ง Content-Type เอง
      }),
      router
    )

    if (!res || !res.ok) return null
    return await res.json()
  } catch (err) {
    console.error('updateProfileWithFile error:', err)
    return null
  }
}

async function getNotifications(url, router) {
  return await getItems(url, router)
}

// used by ParcelResidentVerification
async function verifyParcelItem(url, payload, router) {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }

    const res = await fetchWithAuth(url, options, router)
    if (!res) return { success: false, status: 'network_error' }

    if (res.ok) {
      return { success: true }
    }

    // Attempt to read error message
    try {
      const errData = await res.json()
      return { success: false, status: res.status, message: errData.message }
    } catch (e) {
      return { success: false, status: res.status }
    }
  } catch (error) {
    return { success: false, status: 'exception' }
  }
}

async function markNotificationAsRead(url, id, router) {
  try {
    const options = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Explicitly send empty body
    }

    const res = await fetchWithAuth(`${url}/${id}/read`, options, router)
    if (!res) return null // Auth failed or network error

    if (res.ok) {
        return { success: true }
    }
    return { success: false, status: res.status, statusText: res.statusText }
  } catch (error) {
    console.error('markNotificationAsRead error:', error)
    return { success: false, error }
  }
}

// async function createWelcomeNotification(url, router) {
//   try {
//     const options = {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({})
//     }

//     const res = await fetchWithAuth(`${url}/welcome`, options, router)
//     if (!res) return null

//     if (res.ok) {
//         return { success: true }
//     }
//     return { success: false, status: res.status, statusText: res.statusText }
//   } catch (error) {
//     console.error('createWelcomeNotification error:', error)
//     return { success: false, error }
//   }
// }


// Announcement
async function getAnnouncements(url, router) {
  return await getItems(url, router)
}
async function getAnnouncementById(url, id, router) {
  return await getItemById(url, id, router)
}
async function addAnnouncement(url, announcement, router) {
  return await addItem(url, announcement, router)
}
async function editAnnouncement(url, id, editedAnnouncement, router) {
  return await editItem(url, id, editedAnnouncement, router)
}
async function deleteAnnouncement(url, id, router) {
  return await deleteItemById(url, id, router)
}

async function recordAnnouncementView(url, id, router) {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const res = await fetchWithAuth(`${url}/${id}/view`, options, router)
    if (res && res.ok) {
      return true
    }
    return false
  } catch (error) {
    console.error('recordAnnouncementView error:', error)
    return false
  }
}

async function addAnnouncementWithFile(url, payload, router) {
  const formData = new FormData()

  const { coverImage, ...announcementData } = payload

  formData.append(
    'data',
    new Blob([JSON.stringify(announcementData)], { type: 'application/json' })
  )

  if (coverImage instanceof File || coverImage instanceof Blob) {
    formData.append('image', coverImage)
  }

  try {
    const res = await fetchWithAuth(
      url,
      () => ({
        method: 'POST',
        body: formData // ✅ ต้องส่ง
        // ❌ ห้ามตั้ง Content-Type เอง
      }),
      router
    )

    if (!res || !res.ok) return null
    return await res.json()
  } catch (err) {
    console.error('addAnnouncementWithFile error:', err)
    return null
  }
}

async function editAnnouncementWithFile(url, id, payload, router) {
  const formData = new FormData()

  const { coverImage, ...announcementData } = payload

  formData.append(
    'data',
    new Blob([JSON.stringify(announcementData)], { type: 'application/json' })
  )

  if (coverImage instanceof File || coverImage instanceof Blob) {
    formData.append('image', coverImage)
  }

  try {
    const res = await fetchWithAuth(
      `${url}/${id}`,
      () => ({
        method: 'PUT',
        body: formData // ✅ ต้องส่ง
        // ❌ ห้ามตั้ง Content-Type เอง
      }),
      router
    )

    if (!res || !res.ok) return null
    return await res.json()
  } catch (err) {
    console.error('editAnnouncementWithFile error:', err)
    return null
  }
}

// Dashboard
async function getDashboardData(url, router) {
  return await getItems(url, router)
}

// LINE API Helpers
async function sendParcelNotification(parcelId, router) {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const url = `${import.meta.env.VITE_BASE_URL}/api/line/parcel-notify/${parcelId}`

    const res = await fetchWithAuth(
      url,
      options,
      router
    )
    if (res && res.ok) {
      return await res.json()
    }
    return null
  } catch (error) {
    console.error('sendParcelNotification error:', error)
    return null
  }
}

async function sendLineNotification(payload, router, customUrl = null) {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }

    const url = customUrl || `${import.meta.env.VITE_BASE_URL}/api/line/send`

    const res = await fetchWithAuth(
      url,
      options,
      router
    )
    if (res && res.ok) {
      return await res.json()
    }
    return null
  } catch (error) {
    console.error('sendLineNotification error:', error)
    return null
  }
}

async function unlinkLineAccount(router) {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const res = await fetchWithAuth(
      `${import.meta.env.VITE_BASE_URL}/api/profile/disconnect-line`,
      options,
      router
    )
    if (res && res.ok) {
      return true
    }
    return false
  } catch (error) {
    console.error('unlinkLineAccount error:', error)
    return false
  }
}

async function connectLineAccount(lineUserId, router) {
  try {
    const baseURL = import.meta.env.VITE_BASE_URL
    const url = `${baseURL}/api/profile/connect-line?lineUserId=${lineUserId}`

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const res = await fetchWithAuth(url, options, router)
    if (res && res.ok) {
      return true
    }
    return false
  } catch (error) {
    console.error('connectLineAccount error:', error)
    return false
  }
}

async function linkLineAccount(code, state, router) {
  try {
    const baseURL = import.meta.env.VITE_BASE_URL
    // ตามโค้ด Java Backend ของคุณที่ใช้ @GetMapping("/callback") และรับ code, state
    const url = `${baseURL}/api/line/callback?code=${code}&state=${encodeURIComponent(state)}`

    const res = await fetchWithAuth(url, { method: 'GET' }, router)
    if (res && res.ok) {
      // ตรวจสอบว่า Backend คืนค่าเป็น JSON หรือไม่
      const contentType = res.headers.get('content-type')  
      if (contentType && contentType.includes('application/json')) {
        return await res.json()
      }
      return { success: true }
    }
    return null
  } catch (error) {
    console.error('linkLineAccount error:', error)
    return null
  }
}

async function getLineConnectUrl(firebaseToken, router) {
  try {
    const baseURL = import.meta.env.VITE_BASE_URL
    const currentPath = window.location.pathname
    const url = `${baseURL}/api/line/connect?firebaseToken=${encodeURIComponent(firebaseToken)}&returnUrl=${encodeURIComponent(currentPath)}`

    const res = await fetchWithAuth(url, { method: 'GET' }, router)
    if (res && res.ok) {
      return await res.text()
    }
    return null
  } catch (error) {
    console.error('getLineConnectUrl error:', error)
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
  confirmParcelReceived,
  restoreParcel,
  getMembers,
  getStaffs,
  getMemberById,
  getStaffById,
  addMember,
  addStaff,
  editMember,
  editStaff,
  deleteMember,
  deleteStaff,
  updateUserRole,
  toggleUserActive,
  updateProfileWithFile,
  addMemberWithFile,
  updateDetailWithFile,
  getNotifications,
  verifyParcelItem,
  markNotificationAsRead,
  getAnnouncements,
  getAnnouncementById,
  addAnnouncement,
  editAnnouncement,
  deleteAnnouncement,
  recordAnnouncementView,
  addAnnouncementWithFile,
  editAnnouncementWithFile,
  getDashboardData,
  sendLineNotification,
  sendParcelNotification,
  unlinkLineAccount,
  connectLineAccount,
  linkLineAccount,
  getLineConnectUrl
}

