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

// async function restoreParcel(url, id, router) {
//   try {
//     const options = {
//       method: 'PUT',
//       headers: {}
//     }

//     const res = await fetchWithAuth(`${url}/${id}/restore`, options, router)

//     if (res?.ok) {
//       return true
//     }
//     return false
//   } catch (error) {
//     return false
//   }
// }

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
async function updateDetailWithFile(url, payload, router) {
  const formData = new FormData()

  const { profileImage, ...residentData } = payload

  formData.append(
    'data',
    new Blob([JSON.stringify(residentData)], {
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
    console.error('updateDetailWithFile error:', err)
    return null
  }
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
// ใช้ร่วมกับ Pinia (ตัวอย่างจริง)
// const members = await getMembers('/api/members', router)
// userStore.setMembers(members)

// const staffs = await getStaffs('/api/staffs', router)
// userStore.setStaffs(staffs)
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
  updateDetailWithFile
}
