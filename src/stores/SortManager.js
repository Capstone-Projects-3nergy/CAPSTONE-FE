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
// 🧩 Helper: แปลง string "05 Oct 2025" เป็น Date object
function parseDate(dateStr) {
  return new Date(dateStr)
}

// 🔹 กรองข้อมูลตามวัน (Day)
function filterByDay(parcels, targetDate = new Date()) {
  return parcels.filter((p) => {
    const d = parseDate(p.date)
    return (
      d.getDate() === targetDate.getDate() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getFullYear() === targetDate.getFullYear()
    )
  })
}

// 🔹 กรองข้อมูลตามเดือน (Month)
function filterByMonth(parcels, targetDate = new Date()) {
  return parcels.filter((p) => {
    const d = parseDate(p.date)
    return (
      d.getMonth() === targetDate.getMonth() &&
      d.getFullYear() === targetDate.getFullYear()
    )
  })
}

// 🔹 กรองข้อมูลตามปี (Year)
function filterByYear(parcels, targetDate = new Date()) {
  return parcels.filter((p) => {
    const d = parseDate(p.date)
    return d.getFullYear() === targetDate.getFullYear()
  })
}

export {
  sortByRoomNumber,
  sortByRoomNumberReverse,
  sortByStatus,
  sortByStatusReverse,
  sortByDate,
  sortByDateReverse,
  searchParcels,
  filterByDay,
  filterByMonth,
  filterByYear
}
