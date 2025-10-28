// เรียงตาม Room Number (น้อย → มาก)
function sortByRoomNumber(parcels) {
  parcels.sort((a, b) => a.room - b.room)
}

// เรียงตาม Room Number (มาก → น้อย)
function sortByRoomNumberReverse(parcels) {
  parcels.sort((a, b) => b.room - a.room)
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
  parcels.sort((a, b) => new Date(a.date) - new Date(b.date))
}

// เรียงตามวันที่ (ใหม่ → เก่า)
function sortByDateReverse(parcels) {
  parcels.sort((a, b) => new Date(b.date) - new Date(a.date))
}

// ค้นหาพัสดุจากคีย์เวิร์ด
function searchParcels(parcels, keywords) {
  const lower = keywords.toLowerCase()
  return parcels.filter(
    (p) =>
      (p.tracking && p.tracking.toLowerCase().includes(lower)) ||
      (p.recipient && p.recipient.toLowerCase().includes(lower)) ||
      (p.room && p.room.toString().includes(lower)) ||
      (p.contact && p.contact.includes(lower)) ||
      (p.status && p.status.toLowerCase().includes(lower)) ||
      (p.date && p.date.toLowerCase().includes(lower))
  )
}

export {
  sortByRoomNumber,
  sortByRoomNumberReverse,
  sortByStatus,
  sortByStatusReverse,
  sortByDate,
  sortByDateReverse,
  searchParcels
}
