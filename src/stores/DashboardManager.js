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

  const calculateDashboardData = (parcelsRaw = null, residentsRaw = null, announcementsRaw = null) => {
    // 1. Update internal state if new data is provided
    if (parcelsRaw && parcelsRaw.length > 0) setParcels(parcelsRaw)
    if (residentsRaw && residentsRaw.length > 0) setMembers(residentsRaw)
    if (announcementsRaw && announcementsRaw.length > 0) setAnnouncements(announcementsRaw)

    // 2. Decide which data to use (internal state or mock fallback)
    const parcelsData = parcels.length > 0 ? parcels : []
    const residentsData = members.length > 0 ? members : []
    const announcementsData = announcements.length > 0 ? announcements : []

    // If NO data at all (not even in store), don't overwrite the initial view
    if (parcelsData.length === 0 && residentsData.length === 0 && announcementsData.length === 0) {
      return
    }

    // Populate Chart Data if we have parcels
    if (parcelsData.length > 0) {
      // Reset parcel stats
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

      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      const currentWeekIdx = getWeekIndex(today)

      parcelsData.forEach(p => {
        // Calculate Stats
        const pStatus = p.status?.toUpperCase() || ''
        if (pStatus === 'PICKED UP' || pStatus === 'PICKED_UP') {
          stats.pickedUpParcels++
        } else if (pStatus === 'OVERDUE') {
          stats.overdueParcels++
        } else {
          stats.awaitingParcels++
        }

        // Populate Chart Data
        const date = new Date(p.createdAt || p.date || p.updateAt || p.updatedAt)
        if (isNaN(date.getTime())) return // skip invalid dates

        const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear
        const isCurrentWeek = isCurrentMonth && getWeekIndex(date) === currentWeekIdx
        
        const monthIdx = date.getMonth()
        const weekIdx = getWeekIndex(date)
        const dayIdx = getDayIndex(date)

        // Ensure week index bounds
        const safeWeekIdx = weekIdx >= 0 && weekIdx <= 4 ? weekIdx : 4

        // Monthly
        if (date.getFullYear() === currentYear) {
           if (pStatus === 'RECEIVED' || pStatus === 'NOTIFIED' || pStatus === 'WAITING_FOR_STAFF') chartData.monthly.received[monthIdx]++
           else if (pStatus === 'PICKED_UP' || pStatus === 'PICKED UP') chartData.monthly.pickedUp[monthIdx]++
           else if (pStatus === 'OVERDUE') chartData.monthly.overdue[monthIdx]++
        }
        
        // Weekly
        if (isCurrentMonth) {
           if (pStatus === 'RECEIVED' || pStatus === 'NOTIFIED' || pStatus === 'WAITING_FOR_STAFF') chartData.weekly.received[safeWeekIdx]++
           else if (pStatus === 'PICKED_UP' || pStatus === 'PICKED UP') chartData.weekly.pickedUp[safeWeekIdx]++
           else if (pStatus === 'OVERDUE') chartData.weekly.overdue[safeWeekIdx]++
        }

        // Daily
        if (isCurrentWeek) {
           if (pStatus === 'RECEIVED' || pStatus === 'NOTIFIED' || pStatus === 'WAITING_FOR_STAFF') chartData.daily.received[dayIdx]++
           else if (pStatus === 'PICKED_UP' || pStatus === 'PICKED UP') chartData.daily.pickedUp[dayIdx]++
           else if (pStatus === 'OVERDUE') chartData.daily.overdue[dayIdx]++
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
    // Generate some mock parcels to fill the initial stats
    const mockParcels = []
    const today = new Date()
    
    // 86 Picked up
    for (let i = 0; i < 86; i++) {
      mockParcels.push({ status: 'PICKED_UP', createdAt: today.toISOString() })
    }
    // 38 Awaiting
    for (let i = 0; i < 38; i++) {
      mockParcels.push({ status: 'RECEIVED', createdAt: today.toISOString() })
    }
    // 5 Overdue
    for (let i = 0; i < 5; i++) {
      mockParcels.push({ status: 'OVERDUE', createdAt: today.toISOString() })
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

  // Auto-init with mock data
  initMockData()

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

    // Keep legacy getters/setters for compatibility if needed
    getStats: () => stats,
    getChartData: () => chartData,
    updateStat: (key, value) => { if (stats.hasOwnProperty(key)) stats[key] = value }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardManager, import.meta.hot))
}
