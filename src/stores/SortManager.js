// เรียงตาม Room Number (น้อย → มาก)
function sortByRoomNumber(parcels) {
  parcels.sort((a, b) => a.roomNumber - b.roomNumber)
}

// เรียงตาม Room Number (มาก → น้อย)
function sortByRoomNumberReverse(parcels) {
  parcels.sort((a, b) => b.roomNumber - a.roomNumber)
}

// เรียงตาม Status (A → Z)
function sortByStatus(parcels) {
  parcels.sort((a, b) =>
    a.status.localeCompare(b.status, 'th', { sensitivity: 'base' })
  )
}

// เรียงตาม Status (Z → A)
function sortByStatusReverse(parcels) {
  parcels.sort((a, b) =>
    b.status.localeCompare(a.status, 'th', { sensitivity: 'base' })
  )
}

// เรียงตามวันที่ (เก่า → ใหม่)
function sortByDate(parcels) {
  parcels.sort((a, b) => new Date(a.receiveAt) - new Date(b.receiveAt))
}

// เรียงตามวันที่ (ใหม่ → เก่า)
function sortByDateReverse(parcels) {
  parcels.sort((a, b) => new Date(b.receiveAt) - new Date(a.receiveAt))
}
// เรียงตาม Tracking (A → Z)
function sortByTracking(parcels) {
  parcels.sort((a, b) =>
    (a.tracking || '').localeCompare(b.tracking || '', 'th', {
      sensitivity: 'base'
    })
  )
}

// เรียงตาม Tracking (Z → A)
function sortByTrackingReverse(parcels) {
  parcels.sort((a, b) =>
    (b.tracking || '').localeCompare(a.tracking || '', 'th', {
      sensitivity: 'base'
    })
  )
}

// เรียงตามชื่อผู้รับ (Name) (A → Z)
function sortByName(parcels) {
  parcels.sort((a, b) =>
    (a.recipient || '').localeCompare(b.recipient || '', 'th', {
      sensitivity: 'base'
    })
  )
}

// เรียงตามชื่อผู้รับ (Name) (Z → A)
function sortByNameReverse(parcels) {
  parcels.sort((a, b) =>
    (b.recipient || '').localeCompare(a.recipient || '', 'th', {
      sensitivity: 'base'
    })
  )
}

// เรียงตามเบอร์ติดต่อ (Contact) (น้อย → มาก)
function sortByContact(parcels) {
  parcels.sort((a, b) =>
    (a.contact || '').localeCompare(b.contact || '', 'th', {
      sensitivity: 'base'
    })
  )
}

// เรียงตามเบอร์ติดต่อ (Contact) (มาก → น้อย)
function sortByContactReverse(parcels) {
  parcels.sort((a, b) =>
    (b.contact || '').localeCompare(a.contact || '', 'th', {
      sensitivity: 'base'
    })
  )
}

// ค้นหาพัสดุจากคีย์เวิร์ด
function searchParcels(parcels, keyword) {
  const lowerKeyword = keyword.toLowerCase()
  return parcels.filter((p) => {
    return (
      (p.trackingNumber &&
        p.trackingNumber.toLowerCase().includes(lowerKeyword)) ||
      (p.recipientName &&
        p.recipientName.toLowerCase().includes(lowerKeyword)) ||
      (p.roomNumber && p.roomNumber.toLowerCase().includes(lowerKeyword)) ||
      (p.email && p.email.toLowerCase().includes(lowerKeyword)) ||
      (p.status && p.status.toLowerCase().includes(lowerKeyword)) ||
      (p.receiveAt && p.receiveAt.toLowerCase().includes(lowerKeyword))
    )
  })
}
// function searchParcels(parcels, keywords) {
//   const lower = keywords.toLowerCase()
//   return parcels.filter(
//     (p) =>
//       (p.tracking && p.tracking.toLowerCase().includes(lower)) ||
//       (p.recipient && p.recipient.toLowerCase().includes(lower)) ||
//       (p.room && p.room.toString().includes(lower)) ||
//       (p.contact && p.contact.includes(lower)) ||
//       (p.status && p.status.toLowerCase().includes(lower)) ||
//       (p.date && p.date.toLowerCase().includes(lower))
//   )
// }

// 🧩 Helper: แปลง string "05 Oct 2025" เป็น Date object
function parseDate(dateStr) {
  return new Date(dateStr)
}

// แปลง string เป็น Date
// function parseDate(dateStr) {
//   // สมมติ dateStr = "05 Jan 2024"
//   return new Date(dateStr)
// }

// 🔹 กรองข้อมูลตามวันและเรียงตามวันที่ (DD MMM YYYY)
function filterByDay(parcels, targetDate = new Date()) {
  const filtered = parcels.filter((p) => {
    const d = parseDate(p.date)
    return (
      d.getDate() === targetDate.getDate() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getFullYear() === targetDate.getFullYear()
    )
  })
  // เรียงตามวันที่เต็ม
  return filtered.sort((a, b) => parseDate(a.date) - parseDate(b.date))
}

// 🔹 กรองข้อมูลตามเดือนและเรียงแบบ MMM DD YYYY
function filterByMonth(parcels, targetDate = new Date()) {
  const filtered = parcels.filter((p) => {
    const d = parseDate(p.date)
    return (
      d.getMonth() === targetDate.getMonth() &&
      d.getFullYear() === targetDate.getFullYear()
    )
  })
  // เรียงวันที่ภายในเดือน
  return filtered.sort((a, b) => parseDate(a.date) - parseDate(b.date))
}

// 🔹 กรองข้อมูลตามปีและเรียงแบบ MMM DD YYYY
function filterByYear(parcels, targetDate = new Date()) {
  const filtered = parcels.filter((p) => {
    const d = parseDate(p.date)
    return d.getFullYear() === targetDate.getFullYear()
  })
  // เรียงวันที่ภายในปี
  return filtered.sort((a, b) => parseDate(a.date) - parseDate(b.date))
}
// เรียงตาม First Name (A → Z)
function sortByFirstName(parcels) {
  parcels.sort((a, b) => {
    const aFirst = (a.recipient || '').split(' ')[0].toLowerCase()
    const bFirst = (b.recipient || '').split(' ')[0].toLowerCase()
    return aFirst.localeCompare(bFirst)
  })
}

// เรียงตาม First Name (Z → A)
function sortByFirstNameReverse(parcels) {
  parcels.sort((a, b) => {
    const aFirst = (a.recipient || '').split(' ')[0].toLowerCase()
    const bFirst = (b.recipient || '').split(' ')[0].toLowerCase()
    return bFirst.localeCompare(aFirst)
  })
}

// เรียงตาม Last Name (A → Z)
function sortByLastName(parcels) {
  parcels.sort((a, b) => {
    const aLast = (a.recipient || '').split(' ').slice(-1)[0].toLowerCase()
    const bLast = (b.recipient || '').split(' ').slice(-1)[0].toLowerCase()
    return aLast.localeCompare(bLast)
  })
}

// เรียงตาม Last Name (Z → A)
function sortByLastNameReverse(parcels) {
  parcels.sort((a, b) => {
    const aLast = (a.recipient || '').split(' ').slice(-1)[0].toLowerCase()
    const bLast = (b.recipient || '').split(' ').slice(-1)[0].toLowerCase()
    return bLast.localeCompare(aLast)
  })
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
  filterByYear
}
