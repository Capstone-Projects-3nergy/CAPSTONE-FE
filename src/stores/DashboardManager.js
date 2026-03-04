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
  
  const currentView = ref('monthly') // 'daily', 'weekly', 'monthly'
  
  const stats = reactive({
    totalParcels: 124,
    pickedUpParcels: 86,
    awaitingParcels: 38,
    overdueParcels: 5,
    totalResidents: 4,
    activeResidents: 1,
    pendingResidents: 2,
    inactiveResidents: 1,
    totalAnnouncements: 0
  })

  // helper functions for date mapping
  const getDayIndex = (date) => (date.getDay() + 6) % 7 // Monday = 0, Sunday = 6
  const getWeekIndex = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return Math.floor((date.getDate() + (firstDay === 0 ? 6 : firstDay - 1) - 1) / 7)
  }

  
  const calculateDashboardData = (parcelsRaw = [], residentsRaw = [], announcementsRaw = []) => {
    // Ensure we are working with arrays
    const parcelsData = Array.isArray(parcelsRaw) ? parcelsRaw : []
    const residentsData = Array.isArray(residentsRaw) ? residentsRaw : []
    const announcementsData = Array.isArray(announcementsRaw) ? announcementsRaw : []

    // If no data is available yet, don't overwrite the mock data
    if (parcelsData.length === 0 && residentsData.length === 0 && announcementsData.length === 0) {
      return;
    }

    // Populate Chart Data if we have parcels
    if (parcelsData.length > 0) {
      // Reset parcel stats
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
  const fetchDashboardData = async (router) => {
    try {
      const baseURL = import.meta.env.VITE_BASE_URL
      
      // 1. ลองดึงข้อมูลจาก Dashboard API โดยตรงก่อน
      const directData = await getDashboardData(`${baseURL}/api/dashboard`, router)
      
      if (directData) {
        if (directData.stats) setStats(directData.stats)
        if (directData.chartData) {
          if (directData.chartData.labels) chartData.labels = directData.chartData.labels
          if (directData.chartData.datasets) chartData.datasets = directData.chartData.datasets
        }
      }

      // 2. ดึงข้อมูลดิบมาคำนวณเองเสริม
      const [parcels, residents, announcements] = await Promise.all([
        getItems(`${baseURL}/api/staff/parcels`, router),
        getItems(`${baseURL}/api/staff/users`, router),
        getItems(`${baseURL}/api/announcements`, router)
      ])

      calculateDashboardData(parcels || [], residents || [], announcements || [])
      
      return true
    } catch (error) {
      console.error('[DashboardManager] Fetch Error:', error)
      return false
    }
  }

  /* ---------- getters ---------- */
  const getMonthsTH = () => monthsTH
  const getPackagesPerMonth = () => packagesPerMonth
  const getChartData = () => chartData
  const getStats = () => stats

  /* ---------- setters ---------- */
  const setChartData = (labels, datasets) => {
    chartData.labels = labels
    chartData.datasets = datasets
  }

  const setStats = (newStats) => {
    Object.assign(stats, newStats)
  }

  /* ---------- updates ---------- */
  const updateStat = (key, value) => {
    if (stats.hasOwnProperty(key)) {
      stats[key] = value
    }
  }

  return {
    monthsTH,
    packagesPerMonth,
    chartData,
    stats,
    
    getMonthsTH,
    getPackagesPerMonth,
    getChartData,
    getStats,
    
    setChartData,
    setStats,
    
    updateStat,
    calculateDashboardData,
    fetchDashboardData,
    currentView,
    setChartView
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardManager, import.meta.hot))
}
