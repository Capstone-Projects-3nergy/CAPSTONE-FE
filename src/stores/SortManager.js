function sortByRoomNumber(parcels) {
  parcels.sort((a, b) => a.roomNumber - b.roomNumber)
}

function sortByRoomNumberReverse(parcels) {
  parcels.sort((a, b) => b.roomNumber - a.roomNumber)
}

function sortByStatus(parcels) {
  parcels.sort((a, b) =>
    a.status.localeCompare(b.status, 'th', { sensitivity: 'base' })
  )
}

function sortByStatusReverse(parcels) {
  parcels.sort((a, b) =>
    b.status.localeCompare(a.status, 'th', { sensitivity: 'base' })
  )
}
function sortByDeleteDate(parcels) {
  parcels.sort((a, b) => new Date(a.deletedAt) - new Date(b.deletedAt))
}

function sortByDeleteDateReverse(parcels) {
  parcels.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt))
}

function sortByDate(parcels) {
  parcels.sort((a, b) => new Date(a.updateAt) - new Date(b.updateAt))
}

function sortByDateReverse(parcels) {
  parcels.sort((a, b) => new Date(b.updateAt) - new Date(a.updateAt))
}

function sortByTracking(parcels) {
  parcels.sort((a, b) =>
    (a.trackingNumber || '').localeCompare(b.trackingNumber || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByTrackingReverse(parcels) {
  parcels.sort((a, b) =>
    (b.trackingNumber || '').localeCompare(a.trackingNumber || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByName(parcels) {
  parcels.sort((a, b) =>
    (a.recipientName || '').localeCompare(b.recipientName || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByNameReverse(parcels) {
  parcels.sort((a, b) =>
    (b.recipientName || '').localeCompare(a.recipientName || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByContact(parcels) {
  parcels.sort((a, b) =>
    (a.contact || '').localeCompare(b.contact || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByContactReverse(parcels) {
  parcels.sort((a, b) =>
    (b.contact || '').localeCompare(a.contact || '', 'th', {
      sensitivity: 'base'
    })
  )
}
function normalize(value) {
  return value?.toString().toLowerCase().trim() || ''
}

function searchParcels(parcels, keyword) {
  if (!keyword) return parcels

  const key = normalize(keyword)

  const exactMatches = []
  const partialMatches = []

  parcels.forEach((p) => {
    const fields = [
      normalize(p.roomNumber),
      normalize(p.trackingNumber),
      normalize(p.recipientName),
      normalize(p.firstName),
      normalize(p.lastName),
      normalize(p.fullName),
      normalize(p.phoneNumber),
      normalize(p.email),
      normalize(p.status)
    ]

    // วันที่
    let displayDate = ''
    let isoDate = ''

    if (p.updateAt || p.deletedAt) {
      const date = new Date(p.updateAt || p.deletedAt)

      const dd = String(date.getDate()).padStart(2, '0')
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const yyyy = date.getFullYear()
      const hh = String(date.getHours()).padStart(2, '0')
      const min = String(date.getMinutes()).padStart(2, '0')
      const ss = String(date.getSeconds()).padStart(2, '0')

      displayDate = `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`
      isoDate = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`

      fields.push(normalize(displayDate))
      fields.push(normalize(isoDate))
    }

    // 🔥 full name แบบเว้นวรรค
    const fullNameSplice = normalize(`${p.firstName ?? ''} ${p.lastName ?? ''}`)
    fields.push(fullNameSplice)

    // ✅ exact match
    const isExact = fields.some((f) => f === key)

    // ✅ partial match
    const isPartial = fields.some((f) => f.includes(key))

    if (isExact) {
      exactMatches.push(p)
    } else if (isPartial) {
      partialMatches.push(p)
    }
  })

  // 🔥 ถ้ามี exact → เอาเฉพาะ exact
  return exactMatches.length > 0 ? exactMatches : partialMatches
}

function parseDate(dateStr) {
  return new Date(dateStr)
}

function filterByDay(parcels, targetDate = new Date()) {
  const filtered = parcels.filter((p) => {
    const d = parseDate(p.date)
    return (
      d.getDate() === targetDate.getDate() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getFullYear() === targetDate.getFullYear()
    )
  })

  return filtered.sort((a, b) => parseDate(a.date) - parseDate(b.date))
}

function filterByMonth(parcels, targetDate = new Date()) {
  const filtered = parcels.filter((p) => {
    const d = parseDate(p.date)
    return (
      d.getMonth() === targetDate.getMonth() &&
      d.getFullYear() === targetDate.getFullYear()
    )
  })

  return filtered.sort((a, b) => parseDate(a.date) - parseDate(b.date))
}

function filterByYear(parcels, targetDate = new Date()) {
  const filtered = parcels.filter((p) => {
    const d = parseDate(p.date)
    return d.getFullYear() === targetDate.getFullYear()
  })

  return filtered.sort((a, b) => parseDate(a.date) - parseDate(b.date))
}

function sortByFirstName(parcels) {
  parcels.sort((a, b) => {
    const aFirst = (a.recipientName || '').split(' ')[0].toLowerCase()
    const bFirst = (b.recipientName || '').split(' ')[0].toLowerCase()
    return aFirst.localeCompare(bFirst)
  })
}

function sortByFirstNameReverse(parcels) {
  parcels.sort((a, b) => {
    const aFirst = (a.recipientName || '').split(' ')[0].toLowerCase()
    const bFirst = (b.recipientName || '').split(' ')[0].toLowerCase()
    return bFirst.localeCompare(aFirst)
  })
}

function sortByLastName(parcels) {
  parcels.sort((a, b) => {
    const aLast = (a.recipientName || '').split(' ').slice(-1)[0].toLowerCase()
    const bLast = (b.recipientName || '').split(' ').slice(-1)[0].toLowerCase()
    return aLast.localeCompare(bLast)
  })
}

function sortByLastNameReverse(parcels) {
  parcels.sort((a, b) => {
    const aLast = (a.recipientName || '').split(' ').slice(-1)[0].toLowerCase()
    const bLast = (b.recipientName || '').split(' ').slice(-1)[0].toLowerCase()
    return bLast.localeCompare(aLast)
  })
}
function sortByLineId(parcels) {
  parcels.sort((a, b) =>
    (a.lineId || '').localeCompare(b.lineId || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByLineIdReverse(parcels) {
  parcels.sort((a, b) =>
    (b.lineId || '').localeCompare(a.lineId || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByPhoneNumber(parcels) {
  parcels.sort((a, b) =>
    (a.phoneNumber || '').localeCompare(b.phoneNumber || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByPhoneNumberReverse(parcels) {
  parcels.sort((a, b) =>
    (b.phoneNumber || '').localeCompare(a.phoneNumber || '', 'th', {
      sensitivity: 'base'
    })
  )
}
function sortByPosition(parcels) {
  parcels.sort((a, b) => {
    const aPos = (a.position || '').toLowerCase()
    const bPos = (b.position || '').toLowerCase()
    return aPos.localeCompare(bPos, 'th', { sensitivity: 'base' })
  })
}

function sortByPositionReverse(parcels) {
  parcels.sort((a, b) => {
    const aPos = (a.position || '').toLowerCase()
    const bPos = (b.position || '').toLowerCase()
    return bPos.localeCompare(aPos, 'th', { sensitivity: 'base' })
  })
}
function sortByDormName(parcels) {
  parcels.sort((a, b) => {
    const aDorm = (a.dormId?.dormName || '').toLowerCase()
    const bDorm = (b.dormId?.dormName || '').toLowerCase()
    return aDorm.localeCompare(bDorm, 'th', { sensitivity: 'base' })
  })
}

function sortByDormNameReverse(parcels) {
  parcels.sort((a, b) => {
    const aDorm = (a.dormId?.dormName || '').toLowerCase()
    const bDorm = (b.dormId?.dormName || '').toLowerCase()
    return bDorm.localeCompare(aDorm, 'th', { sensitivity: 'base' })
  })
}
function sortByDormNameUser(users) {
  users.sort((a, b) =>
    (a.dormName || '').localeCompare(b.dormName || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByDormNameUserReverse(users) {
  users.sort((a, b) =>
    (b.dormName || '').localeCompare(a.dormName || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByFullName(users) {
  users.sort((a, b) =>
    (a.fullName || '').localeCompare(b.fullName || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByFullNameReverse(users) {
  users.sort((a, b) =>
    (b.fullName || '').localeCompare(a.fullName || '', 'th', {
      sensitivity: 'base'
    })
  )
}
function sortByEmail(users) {
  users.sort((a, b) =>
    (a.email || '').localeCompare(b.email || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByEmailReverse(users) {
  users.sort((a, b) =>
    (b.email || '').localeCompare(a.email || '', 'th', {
      sensitivity: 'base'
    })
  )
}
function sortByUserStatus(users) {
  users.sort((a, b) =>
    (a.status || '').localeCompare(b.status || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByUserStatusReverse(users) {
  users.sort((a, b) =>
    (b.status || '').localeCompare(a.status || '', 'th', {
      sensitivity: 'base'
    })
  )
}
function sortByUserDate(users) {
  users.sort((a, b) => new Date(a.updateAt) - new Date(b.updateAt))
}

function sortByUserDateReverse(users) {
  users.sort((a, b) => new Date(b.updateAt) - new Date(a.updateAt))
}
function sortByRoomNumberUser(users) {
  users.sort((a, b) => (a.roomNumber || 0) - (b.roomNumber || 0))
}

function sortByRoomNumberUserReverse(users) {
  users.sort((a, b) => (b.roomNumber || 0) - (a.roomNumber || 0))
}

export {
  sortByRoomNumber,
  sortByRoomNumberReverse,
  sortByStatus,
  sortByStatusReverse,
  sortByDate,
  sortByDateReverse,
  sortByTracking,
  sortByTrackingReverse,
  sortByName,
  sortByNameReverse,
  sortByContact,
  sortByContactReverse,
  sortByFirstName,
  sortByLastName,
  sortByFirstNameReverse,
  sortByLastNameReverse,
  searchParcels,
  filterByDay,
  filterByMonth,
  filterByYear,
  sortByLineId,
  sortByLineIdReverse,
  sortByPhoneNumber,
  sortByPhoneNumberReverse,
  sortByPosition,
  sortByPositionReverse,
  sortByDormName,
  sortByDormNameReverse,
  sortByFullName,
  sortByFullNameReverse,
  sortByEmail,
  sortByEmailReverse,
  sortByDormNameUser,
  sortByDormNameUserReverse,
  sortByRoomNumberUser,
  sortByRoomNumberUserReverse,
  sortByUserStatus,
  sortByDeleteDate,
  sortByDeleteDateReverse,
  sortByUserStatusReverse,
  sortByUserDate,
  sortByUserDateReverse
}
