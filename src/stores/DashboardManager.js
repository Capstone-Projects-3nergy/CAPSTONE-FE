import { reactive, computed, ref } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { getItems, getDashboardData } from '@/utils/fetchUtils'

export const useDashboardManager = defineStore('dashboardManager', () => {
  const monthsTH = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.'
  ]

  const packagesPerMonth = [
    120, 95, 130, 110, 150, 170, 160, 145, 155, 180, 200, 190
  ]

  const chartData = reactive({
    daily: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      received: [12, 19, 15, 8, 22, 14, 10],
      pickedUp: [10, 15, 12, 6, 18, 11, 8],
      overdue: [2, 4, 3, 2, 4, 3, 2]
    },
    weekly: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
      received: [45, 52, 38, 65, 0],
      pickedUp: [40, 48, 32, 58, 0],
      overdue: [5, 4, 6, 7, 0]
    },
    monthly: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      received: [120, 150, 180, 140, 210, 190, 230, 210, 250, 220, 280, 310],
      pickedUp: [110, 140, 170, 130, 190, 180, 210, 195, 230, 210, 260, 290],
      overdue: [10, 10, 10, 10, 20, 10, 20, 15, 20, 10, 20, 20]
    },
    // ข้อมูลสำหรับ Chart.js (จะถูกอัปเดตตาม View ที่เลือก)
    labels: [],
    datasets: [
      { 
        label: 'Received', 
        data: [], 
        backgroundColor: '#4e73df',
        borderColor: '#4e73df',
        borderWidth: 1 
      },
      { 
        label: 'Picked Up', 
        data: [], 
        backgroundColor: '#1cc88a',
        borderColor: '#1cc88a',
        borderWidth: 1 
      },
      { 
        label: 'Overdue', 
        data: [], 
        backgroundColor: '#e74a3b',
        borderColor: '#e74a3b',
        borderWidth: 1 
      }
    ]
  })
  
  const currentView = ref('daily')
  const parcels = reactive([])
  const members = reactive([])
  const announcements = reactive([])

  const stats = reactive({
    totalParcels: 0,
    pickedUpParcels: 0,
    awaitingParcels: 0,
    overdueParcels: 0,
    totalResidents: 0,
    activeResidents: 0,
    pendingResidents: 0,
    inactiveResidents: 0,
    totalAnnouncements: 0
  })

  // helper functions for date mapping
  const getDayIndex = (date) => (date.getDay() + 6) % 7 // Monday = 0, Sunday = 6
  const getWeekIndex = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return Math.floor((date.getDate() + (firstDay === 0 ? 6 : firstDay - 1) - 1) / 7)
  }

  const setParcels = (list = []) => {
    parcels.length = 0
    const items = Array.isArray(list) ? list : [list]
    items.forEach((p) => parcels.push(p))
  }

  const setMembers = (list = []) => {
    members.length = 0
    const items = Array.isArray(list) ? list : [list]
    items.forEach((m) => members.push(m))
  }

  const setAnnouncements = (list = []) => {
    announcements.length = 0
    const items = Array.isArray(list) ? list : [list]
    items.forEach((a) => announcements.push(a))
  }

  const getMappedParcels = computed(() => {
    return parcels.map(p => ({
      id: p.parcelId || p.id,
      trackingNumber: p.trackingNumber || 'N/A',
      residentName: p.ownerName || p.residentName || 'N/A',
      roomNumber: p.roomNumber || 'N/A',
      status: mapStatus(p.status),
      receiveAt: p.receivedAt || p.createdAt || p.date || p.updateAt || p.updatedAt || new Date().toISOString(),
      updatedAt: p.updatedAt || p.updateAt || p.createdAt || p.date || new Date().toISOString()
    }))
  })

  const mapStatus = (status) => {
    const s = status?.toUpperCase() || ''
    if (s.includes('PICKED') || s.includes('TAKEN')) return 'Picked Up'
    if (s.includes('WAITING')) return 'Waiting for Staff'
    if (s.includes('OVERDUE')) return 'Overdue'
    if (s.includes('NOTIFIED')) return 'Notified'
    return 'Received'
  }

  const calculateDashboardData = (parcelsRaw = null, residentsRaw = null, announcementsRaw = null, startDate = null, endDate = null) => {
    // 1. Update internal state if new data is provided
    if (Array.isArray(parcelsRaw)) setParcels(parcelsRaw)
    if (Array.isArray(residentsRaw)) setMembers(residentsRaw)
    if (Array.isArray(announcementsRaw)) setAnnouncements(announcementsRaw)

    // 2. Filter parcels by range if provided
    let parcelsData = parcels.length > 0 ? parcels : []
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null
      if (end) end.setHours(23, 59, 59, 999)

      parcelsData = parcelsData.filter(p => {
        const receivedDate = p.receivedAt || p.createdAt || p.date || p.updateAt || p.updatedAt
        const date = receivedDate ? new Date(receivedDate) : null
        if (!date || isNaN(date.getTime())) return true // Include if date is unknown
        
        let inRange = true
        if (start) inRange = inRange && (date >= start)
        if (end) inRange = inRange && (date <= end)
        return inRange
      })
    }

    let residentsData = members.length > 0 ? members : []
    const announcementsData = announcements.length > 0 ? announcements : []

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null
      if (end) end.setHours(23, 59, 59, 999)

      residentsData = residentsData.filter(r => {
        const dateStr = r.updatedAt || r.updateAt || r.createdAt
        const date = dateStr ? new Date(dateStr) : null
        if (!date || isNaN(date.getTime())) return true
        
        let inRange = true
        if (start) inRange = inRange && (date >= start)
        if (end) inRange = inRange && (date <= end)
        return inRange
      })
    }

    // 3. Reset stats and charts before recalculating
    stats.totalParcels = parcelsData.length
    stats.pickedUpParcels = 0
    stats.awaitingParcels = 0
    stats.overdueParcels = 0

    // Reset charts
    chartData.daily.received.fill(0)
    chartData.daily.pickedUp.fill(0)
    chartData.daily.overdue.fill(0)
    
    chartData.weekly.received.fill(0)
    chartData.weekly.pickedUp.fill(0)
    chartData.weekly.overdue.fill(0)

    chartData.monthly.received.fill(0)
    chartData.monthly.pickedUp.fill(0)
    chartData.monthly.overdue.fill(0)

    // 4. Continue with calculations ONLY if we have data
    if (parcelsData.length > 0) {
      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      const currentWeekIdx = getWeekIndex(today)
      const threeDaysAgo = new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000))

      parcelsData.forEach(p => {
        // Calculate Stats
        const pStatus = p.status?.toUpperCase() || ''
        const receivedDate = p.receivedAt || p.createdAt || p.date || p.updateAt || p.updatedAt
        const rDate = receivedDate ? new Date(receivedDate) : null
        
        const isPickedUp = pStatus.includes('PICKED') || pStatus.includes('TAKEN')
        const isArrived = pStatus.includes('RECEIVED') || pStatus.includes('NOTIFIED') || pStatus.includes('OVERDUE')
        const isExplicitOverdue = pStatus.includes('OVERDUE')
        const isOld = rDate && rDate < threeDaysAgo && isArrived && !isPickedUp

        if (isPickedUp) {
          stats.pickedUpParcels++
        } else if (isExplicitOverdue || isOld) {
          stats.overdueParcels++
        } else {
          stats.awaitingParcels++
        }

        // Populate Chart Data
        const dateStr = receivedDate
        const date = dateStr ? new Date(dateStr) : new Date()
        if (isNaN(date.getTime())) return // skip invalid dates

        const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear
        const isCurrentWeek = isCurrentMonth && (getWeekIndex(date) === currentWeekIdx || Math.abs(date - today) < 7 * 24 * 60 * 60 * 1000)
        
        const monthIdx = date.getMonth()
        const weekIdx = getWeekIndex(date)
        const dayIdx = getDayIndex(date)

        // Ensure week index bounds
        const safeWeekIdx = weekIdx >= 0 && weekIdx <= 4 ? weekIdx : 4

        // Monthly
        if (date.getFullYear() === currentYear) {
           if (pStatus.includes('PICKED') || pStatus.includes('TAKEN')) chartData.monthly.pickedUp[monthIdx]++
           else if (pStatus.includes('OVERDUE')) chartData.monthly.overdue[monthIdx]++
           else chartData.monthly.received[monthIdx]++
        }
        
        // Weekly
        if (isCurrentMonth) {
           if (pStatus.includes('PICKED') || pStatus.includes('TAKEN')) chartData.weekly.pickedUp[safeWeekIdx]++
           else if (pStatus.includes('OVERDUE')) chartData.weekly.overdue[safeWeekIdx]++
           else chartData.weekly.received[safeWeekIdx]++
        }

        // Daily
        if (isCurrentWeek || true) { // Temporarily allow more items in daily to check data
           if (pStatus.includes('PICKED') || pStatus.includes('TAKEN')) chartData.daily.pickedUp[dayIdx]++
           else if (pStatus.includes('OVERDUE')) chartData.daily.overdue[dayIdx]++
           else chartData.daily.received[dayIdx]++
        }
      })
    }

    // Calculate Resident Stats
    stats.totalResidents = residentsData.length
    stats.activeResidents = residentsData.filter(r => r.status?.toUpperCase() === 'VERIFIED' || r.status?.toUpperCase() === 'ACTIVE').length
    stats.pendingResidents = residentsData.filter(r => r.status?.toUpperCase() === 'PENDING').length
    stats.inactiveResidents = residentsData.filter(r => r.status?.toUpperCase() === 'INACTIVE').length
    
    // Calculate Announcement Stats
    stats.totalAnnouncements = announcementsData.length

    // Update the active chart view after calculation
    setChartView(currentView.value)
  }

  const setChartView = (view) => {
    if (!chartData[view]) return
    currentView.value = view
    
    chartData.labels = chartData[view].labels
    chartData.datasets[0].data = chartData[view].received
    chartData.datasets[1].data = chartData[view].pickedUp
    chartData.datasets[2].data = chartData[view].overdue
  }

  /* ---------- actions ---------- */
  // Initial Hydration with mock data if necessary
  const initMockData = () => {
    // Generate some mock parcels to fill the initial stats with distributed dates
    const mockParcels = []
    const today = new Date()
    
    // Helper to get a date X days ago
    const daysAgo = (days) => {
      const d = new Date()
      d.setDate(today.getDate() - days)
      return d.toISOString()
    }

    // Distribute 86 Picked up across the month
    for (let i = 0; i < 86; i++) {
      const offset = Math.floor(Math.random() * 25) // 0-24 days ago
      mockParcels.push({ status: 'PICKED_UP', createdAt: daysAgo(offset) })
    }
    // Distribute 38 Awaiting/Received across the current week
    for (let i = 0; i < 38; i++) {
      const offset = Math.floor(Math.random() * 7) // 0-6 days ago
      mockParcels.push({ status: 'RECEIVED', createdAt: daysAgo(offset) })
    }
    // Distribute 5 Overdue across the month
    for (let i = 0; i < 5; i++) {
      const offset = Math.floor(Math.random() * 20) + 3 // 3-23 days ago (old enough to be overdue)
      mockParcels.push({ status: 'OVERDUE', createdAt: daysAgo(offset) })
    }
    
    setParcels(mockParcels)
    
    setMembers([
      { status: 'ACTIVE' },
      { status: 'PENDING' },
      { status: 'PENDING' },
      { status: 'INACTIVE' }
    ])
    
    calculateDashboardData()
  }

  // Auto-init removed to prevent mock data override
  // initMockData()

  return {
    parcels,
    members,
    announcements,
    chartData,
    stats,
    currentView,

    setParcels,
    setMembers,
    setAnnouncements,
    setChartView,
    calculateDashboardData,
    getMappedParcels,

    // Keep legacy getters/setters for compatibility if needed
    getStats: () => stats,
    getChartData: () => chartData,
    updateStat: (key, value) => { if (stats.hasOwnProperty(key)) stats[key] = value }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardManager, import.meta.hot))
}
