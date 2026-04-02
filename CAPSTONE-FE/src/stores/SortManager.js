function normalize(value) {
  return value?.toString().toLowerCase().trim() || ''
}

function getSortableDate(item) {
  if (!item) return 0;
  const rawDate = item.date || item.createdAt || item.datePosted || item.announcementDate || item.updateAt || item.updatedAt || item.postedAt || item.deletedAt || item.joinedAt;
  if (!rawDate) return 0;
  // Handle formatted dates like '28 Jan 2026 - Draft'
  const cleanDateStr = rawDate.toString().split(' - ')[0];
  const parsed = new Date(cleanDateStr).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

function extractDisplayDates(item) {
  const rawDate = item.date || item.createdAt || item.datePosted || item.announcementDate || item.updateAt || item.updatedAt || item.postedAt || item.deletedAt || item.joinedAt;
  if (!rawDate) return { displayDate: '', isoDate: '' };
  
  const cleanDateStr = rawDate.toString().split(' - ')[0];
  const date = new Date(cleanDateStr);
  
  if (isNaN(date.getTime())) {
    return { displayDate: rawDate.toString(), isoDate: rawDate.toString() };
  }
  
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  
  return {
    displayDate: `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`,
    isoDate: `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`,
    slashDate: `${dd}/${mm}/${yyyy} - ${hh}:${min}`,
    originalDate: rawDate.toString(),
    originalDateClean: cleanDateStr
  };
}

// -----------------------------------------
// Parcel Sorting
// -----------------------------------------
function sortByRoomNumber(parcels) {
  parcels.sort((a, b) => (a.roomNumber || 0) - (b.roomNumber || 0))
}

function sortByRoomNumberReverse(parcels) {
  parcels.sort((a, b) => (b.roomNumber || 0) - (a.roomNumber || 0))
}

function sortByStatus(parcels) {
  parcels.sort((a, b) =>
    (a.status || '').localeCompare(b.status || '', 'th', { sensitivity: 'base' })
  )
}

function sortByStatusReverse(parcels) {
  parcels.sort((a, b) =>
    (b.status || '').localeCompare(a.status || '', 'th', { sensitivity: 'base' })
  )
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
    (a.recipientName || a.fullName || '').localeCompare(b.recipientName || b.fullName || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByNameReverse(parcels) {
  parcels.sort((a, b) =>
    (b.recipientName || b.fullName || '').localeCompare(a.recipientName || a.fullName || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByContact(parcels) {
  parcels.sort((a, b) =>
    (a.contact || a.phoneNumber || '').localeCompare(b.contact || b.phoneNumber || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByContactReverse(parcels) {
  parcels.sort((a, b) =>
    (b.contact || b.phoneNumber || '').localeCompare(a.contact || a.phoneNumber || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByFirstName(parcels) {
  parcels.sort((a, b) => {
    const aFirst = (a.recipientName || a.firstName || '').split(' ')[0].toLowerCase()
    const bFirst = (b.recipientName || b.firstName || '').split(' ')[0].toLowerCase()
    return aFirst.localeCompare(bFirst)
  })
}

function sortByFirstNameReverse(parcels) {
  parcels.sort((a, b) => {
    const aFirst = (a.recipientName || a.firstName || '').split(' ')[0].toLowerCase()
    const bFirst = (b.recipientName || b.firstName || '').split(' ')[0].toLowerCase()
    return bFirst.localeCompare(aFirst)
  })
}

function sortByLastName(parcels) {
  parcels.sort((a, b) => {
    const aLast = (a.recipientName || a.lastName || '').split(' ').slice(-1)[0].toLowerCase()
    const bLast = (b.recipientName || b.lastName || '').split(' ').slice(-1)[0].toLowerCase()
    return aLast.localeCompare(bLast)
  })
}

function sortByLastNameReverse(parcels) {
  parcels.sort((a, b) => {
    const aLast = (a.recipientName || a.lastName || '').split(' ').slice(-1)[0].toLowerCase()
    const bLast = (b.recipientName || b.lastName || '').split(' ').slice(-1)[0].toLowerCase()
    return bLast.localeCompare(aLast)
  })
}

// -----------------------------------------
// Announcement Sorting
// -----------------------------------------
function sortByTitle(items) {
  items.sort((a, b) =>
    (a.title || a.header || '').localeCompare(b.title || b.header || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByTitleReverse(items) {
  items.sort((a, b) =>
    (b.title || b.header || '').localeCompare(a.title || a.header || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByCategory(items) {
  items.sort((a, b) =>
    (a.category || a.tag || a.type || '').localeCompare(b.category || b.tag || b.type || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByCategoryReverse(items) {
  items.sort((a, b) =>
    (b.category || b.tag || b.type || '').localeCompare(a.category || a.tag || a.type || '', 'th', {
      sensitivity: 'base'
    })
  )
}

// -----------------------------------------
// User Sorting
// -----------------------------------------
function sortByLineId(items) {
  items.sort((a, b) =>
    (a.lineId || '').localeCompare(b.lineId || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByLineIdReverse(items) {
  items.sort((a, b) =>
    (b.lineId || '').localeCompare(a.lineId || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByPhoneNumber(items) {
  items.sort((a, b) =>
    (a.phoneNumber || '').localeCompare(b.phoneNumber || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByPhoneNumberReverse(items) {
  items.sort((a, b) =>
    (b.phoneNumber || '').localeCompare(a.phoneNumber || '', 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByPosition(items) {
  items.sort((a, b) => {
    const aPos = (a.position || a.role || '').toLowerCase()
    const bPos = (b.position || b.role || '').toLowerCase()
    return aPos.localeCompare(bPos, 'th', { sensitivity: 'base' })
  })
}

function sortByPositionReverse(items) {
  items.sort((a, b) => {
    const aPos = (a.position || a.role || '').toLowerCase()
    const bPos = (b.position || b.role || '').toLowerCase()
    return bPos.localeCompare(aPos, 'th', { sensitivity: 'base' })
  })
}

function sortByDormName(items) {
  items.sort((a, b) => {
    const aDorm = (a.dormId?.dormName || a.dormName || '').toLowerCase()
    const bDorm = (b.dormId?.dormName || b.dormName || '').toLowerCase()
    return aDorm.localeCompare(bDorm, 'th', { sensitivity: 'base' })
  })
}

function sortByDormNameReverse(items) {
  items.sort((a, b) => {
    const aDorm = (a.dormId?.dormName || a.dormName || '').toLowerCase()
    const bDorm = (b.dormId?.dormName || b.dormName || '').toLowerCase()
    return bDorm.localeCompare(aDorm, 'th', { sensitivity: 'base' })
  })
}

function sortByDormNameUser(users) {
  sortByDormName(users)
}

function sortByDormNameUserReverse(users) {
  sortByDormNameReverse(users)
}

function sortByFullName(users) {
  users.sort((a, b) =>
    (a.fullName || `${a.firstName || ''} ${a.lastName || ''}`).trim().localeCompare((b.fullName || `${b.firstName || ''} ${b.lastName || ''}`).trim(), 'th', {
      sensitivity: 'base'
    })
  )
}

function sortByFullNameReverse(users) {
  users.sort((a, b) =>
    (b.fullName || `${b.firstName || ''} ${b.lastName || ''}`).trim().localeCompare((a.fullName || `${a.firstName || ''} ${a.lastName || ''}`).trim(), 'th', {
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

function sortByRoomNumberUser(users) {
  users.sort((a, b) => (a.roomNumber || 0) - (b.roomNumber || 0))
}

function sortByRoomNumberUserReverse(users) {
  users.sort((a, b) => (b.roomNumber || 0) - (a.roomNumber || 0))
}

// -----------------------------------------
// Global Date Sorting (Supports Backend and Frontend)
// -----------------------------------------
function sortByDate(items) {
  items.sort((a, b) => getSortableDate(a) - getSortableDate(b))
}

function sortByDateReverse(items) {
  items.sort((a, b) => getSortableDate(b) - getSortableDate(a))
}

function sortByDeleteDate(items) {
  items.sort((a, b) => getSortableDate(a) - getSortableDate(b))
}

function sortByDeleteDateReverse(items) {
  items.sort((a, b) => getSortableDate(b) - getSortableDate(a))
}

function sortByUserDate(items) {
  items.sort((a, b) => getSortableDate(a) - getSortableDate(b))
}

function sortByUserDateReverse(items) {
  items.sort((a, b) => getSortableDate(b) - getSortableDate(a))
}


// -----------------------------------------
// Searching
// -----------------------------------------
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
      normalize(p.contact),
      normalize(p.email),
      normalize(p.status)
    ]

    const { displayDate, isoDate, slashDate, originalDate, originalDateClean } = extractDisplayDates(p);
    if(displayDate) fields.push(normalize(displayDate));
    if(isoDate && isoDate !== displayDate) fields.push(normalize(isoDate));
    if(slashDate) fields.push(normalize(slashDate));
    if(originalDate) fields.push(normalize(originalDate));
    if(originalDateClean) fields.push(normalize(originalDateClean));

    // Full name fallback
    const fullNameSplice = normalize(`${p.firstName ?? ''} ${p.lastName ?? ''}`)
    fields.push(fullNameSplice)

    // exact match
    const isExact = fields.some((f) => f === key)

    // partial match
    const isPartial = fields.some((f) => f.includes(key))

    if (isExact) {
      exactMatches.push(p)
    } else if (isPartial) {
      partialMatches.push(p)
    }
  })

  // If there are exact matches, prioritize them
  return exactMatches.length > 0 ? exactMatches : partialMatches
}

function searchAnnouncements(announcements, keyword) {
  if (!keyword) return announcements

  const key = normalize(keyword)

  const exactMatches = []
  const partialMatches = []

  announcements.forEach((a) => {
    const fields = [
      normalize(a.title),
      normalize(a.header),
      normalize(a.subject),
      normalize(a.subtitle),
      normalize(a.content),
      normalize(a.description),
      normalize(a.category),
      normalize(a.categoryName),
      normalize(a.tag),
      normalize(a.author),
      normalize(a.status),
      normalize(a.type),
      normalize(a.views),
      normalize(a.viewCount),
      normalize(a.deletedBy),
      normalize(a.announcementId)
    ]

    const { displayDate, isoDate, slashDate, originalDate, originalDateClean } = extractDisplayDates(a);
    if(displayDate) fields.push(normalize(displayDate));
    if(isoDate && isoDate !== displayDate) fields.push(normalize(isoDate));
    if(slashDate) fields.push(normalize(slashDate));
    if(originalDate) fields.push(normalize(originalDate));
    if(originalDateClean) fields.push(normalize(originalDateClean));
    if (a.deletedAt) {
      const delDates = extractDisplayDates({ deletedAt: a.deletedAt });
      if (delDates.displayDate) fields.push(normalize(delDates.displayDate));
      if (delDates.isoDate) fields.push(normalize(delDates.isoDate));
      if (delDates.slashDate) fields.push(normalize(delDates.slashDate));
    }

    const isExact = fields.some((f) => f === key)
    const isPartial = fields.some((f) => f.includes(key))

    if (isExact) {
      exactMatches.push(a)
    } else if (isPartial) {
      partialMatches.push(a)
    }
  })

  return exactMatches.length > 0 ? exactMatches : partialMatches
}

function searchUsers(users, keyword) {
  if (!keyword) return users

  const key = normalize(keyword)

  const exactMatches = []
  const partialMatches = []

  users.forEach((u) => {
    const fields = [
      normalize(u.firstName),
      normalize(u.lastName),
      normalize(u.fullName),
      normalize(u.email),
      normalize(u.phoneNumber),
      normalize(u.roomNumber),
      normalize(u.role),
      normalize(u.status),
      normalize(u.dormName),
      normalize(u.position),
      normalize(u.lineId)
    ]

    const { displayDate, isoDate, slashDate, originalDate, originalDateClean } = extractDisplayDates(u);
    if(displayDate) fields.push(normalize(displayDate));
    if(isoDate && isoDate !== displayDate) fields.push(normalize(isoDate));
    if(slashDate) fields.push(normalize(slashDate));
    if(originalDate) fields.push(normalize(originalDate));
    if(originalDateClean) fields.push(normalize(originalDateClean));

    const fullNameSplice = normalize(`${u.firstName ?? ''} ${u.lastName ?? ''}`)
    fields.push(fullNameSplice)

    const isExact = fields.some((f) => f === key)
    const isPartial = fields.some((f) => f.includes(key))

    if (isExact) {
      exactMatches.push(u)
    } else if (isPartial) {
      partialMatches.push(u)
    }
  })

  return exactMatches.length > 0 ? exactMatches : partialMatches
}

// -----------------------------------------
// Date Filters (Supports Backend and Frontend)
// -----------------------------------------
function filterByDay(items, targetDate = new Date()) {
  const filtered = items.filter((p) => {
    const sortable = getSortableDate(p);
    if (!sortable) return false;
    const d = new Date(sortable);
    return (
      d.getDate() === targetDate.getDate() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getFullYear() === targetDate.getFullYear()
    )
  })

  return filtered.sort((a, b) => getSortableDate(a) - getSortableDate(b))
}

function filterByMonth(items, targetDate = new Date()) {
  const filtered = items.filter((p) => {
    const sortable = getSortableDate(p);
    if (!sortable) return false;
    const d = new Date(sortable);
    return (
      d.getMonth() === targetDate.getMonth() &&
      d.getFullYear() === targetDate.getFullYear()
    )
  })

  return filtered.sort((a, b) => getSortableDate(a) - getSortableDate(b))
}

function filterByYear(items, targetDate = new Date()) {
  const filtered = items.filter((p) => {
    const sortable = getSortableDate(p);
    if (!sortable) return false;
    const d = new Date(sortable);
    return d.getFullYear() === targetDate.getFullYear()
  })

  return filtered.sort((a, b) => getSortableDate(a) - getSortableDate(b))
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
  searchAnnouncements,
  searchUsers,
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
  sortByUserDateReverse,
  sortByCategory,
  sortByCategoryReverse,
  sortByTitle,
  sortByTitleReverse
}
