import { reactive, computed, ref } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useDashboardManager = defineStore('dashboardManager', () => {
  // Current state for navigation
  const referenceDate = ref(new Date())
  const currentView = ref('daily') // 'daily' | 'weekly' | 'monthly'

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

  const overallStats = reactive({
    totalParcels: 0,
    pickedUpParcels: 0,
    awaitingParcels: 0,
    overdueParcels: 0
  })

  // Chart data structure for Parcel Activity
  const chartData = reactive({
    labels: [],
    datasets: [
      { 
        label: 'Received', 
        data: [], 
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1 
      },
      { 
        label: 'Picked Up', 
        data: [], 
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1 
      }
      // Overdue removed as per previous request
    ]
  })

  // Resident Data Chart structure
  const residentChartData = reactive({
    labels: [],
    data: [],
    total: 0,
    peak: '-'
  })

  // Helper: Get start/end dates for the current view and reference date
  const getPeriodBounds = () => {
    const start = new Date(referenceDate.value)
    const end = new Date(referenceDate.value)
    
    if (currentView.value === 'daily') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (currentView.value === 'weekly') {
      // Find Monday
      const day = start.getDay() || 7 // 1-7
      start.setDate(start.getDate() - (day - 1))
      start.setHours(0, 0, 0, 0)
      
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else if (currentView.value === 'monthly') {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
      end.setHours(23, 59, 59, 999)
    }
    
    return { start, end }
  }

  const setParcels = (list = []) => {
    parcels.length = 0
    parcels.push(...list)
  }

  const setMembers = (list = []) => {
    members.length = 0
    members.push(...list)
  }

  const setAnnouncements = (list = []) => {
    announcements.length = 0
    announcements.push(...list)
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
    if (s.includes('WAITING') || s.includes('PENDING')) return 'Waiting for Staff'
    if (s.includes('OVERDUE')) return 'Overdue'
    if (s.includes('NOTIFIED')) return 'Notified'
    return 'Received'
  }

  const calculateDashboardData = (parcelsRaw = null, residentsRaw = null, announcementsRaw = null) => {
    if (Array.isArray(parcelsRaw)) setParcels(parcelsRaw)
    if (Array.isArray(residentsRaw)) setMembers(residentsRaw)
    if (Array.isArray(announcementsRaw)) setAnnouncements(announcementsRaw)

    const today = new Date()
    
    // 1. Calculate OVERALL Stats (Global, not period-dependent)
    const allParcels = parcels || []
    overallStats.totalParcels = allParcels.length
    overallStats.pickedUpParcels = allParcels.filter(p => {
       const s = p.status?.toUpperCase() || ''
       return s === 'PICKED_UP' || s === 'TAKEN'
    }).length
    overallStats.awaitingParcels = allParcels.filter(p => {
       const s = p.status?.toUpperCase() || ''
       return s !== 'PICKED_UP' && s !== 'TAKEN' && !s.includes('OVERDUE')
    }).length
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000
    overallStats.overdueParcels = allParcels.filter(p => {
      const pStatus = p.status?.toUpperCase() || ''
      if (pStatus === 'PICKED_UP' || pStatus === 'TAKEN') return false
      
      const rDate = new Date(p.receivedAt || p.createdAt || p.date)
      return (today - rDate) > threeDaysMs
    }).length

    const { start, end } = getPeriodBounds()
    
    // 2. Filter parcels for the current period for charts
    const parcelsInPeriod = parcels.filter(p => {
      const dStr = p.receivedAt || p.createdAt || p.date || p.updateAt || p.updatedAt
      const d = new Date(dStr)
      return d >= start && d <= end
    })

    const periodReceived = parcelsInPeriod.filter(p => p.status?.toUpperCase() !== 'PICKED_UP' && p.status?.toUpperCase() !== 'TAKEN')
    const periodPickedUp = parcelsInPeriod.filter(p => p.status?.toUpperCase() === 'PICKED_UP' || p.status?.toUpperCase() === 'TAKEN')
    
    // Update period-specific stats
    stats.totalParcels = parcelsInPeriod.length
    stats.pickedUpParcels = periodPickedUp.length
    stats.awaitingParcels = periodReceived.length
    stats.overdueParcels = parcelsInPeriod.filter(p => {
      const pStatus = p.status?.toUpperCase() || ''
      const isArrived = pStatus.includes('RECEIVED') || pStatus.includes('NOTIFIED') || pStatus.includes('OVERDUE')
      const isPickedUp = pStatus.includes('PICKED') || pStatus.includes('TAKEN')
      if (isPickedUp) return false
      
      const rDate = new Date(p.receivedAt || p.createdAt || p.date)
      const diffMin = (today - rDate) / (1000 * 60)
      return pStatus.includes('OVERDUE') || (diffMin >= 1 && isArrived)
    }).length

    // 3. Generate Chart Data
    generateParcelChart(parcelsInPeriod, start, end)
    generateResidentChart(members, start, end)
    
    stats.totalResidents = members.length
    stats.activeResidents = members.filter(r => r.status?.toUpperCase() === 'VERIFIED' || r.status?.toUpperCase() === 'ACTIVE').length
    stats.pendingResidents = members.filter(r => r.status?.toUpperCase() === 'PENDING').length
    stats.inactiveResidents = members.filter(r => r.status?.toUpperCase() === 'INACTIVE').length
    stats.totalAnnouncements = announcements.length
  }

  const generateParcelChart = (data, start, end) => {
    chartData.labels = []
    chartData.datasets[0].data = []
    chartData.datasets[1].data = []

    if (currentView.value === 'daily') {
      // 24 Hours
      for (let i = 0; i < 24; i++) {
        chartData.labels.push(`${i.toString().padStart(2, '0')}:00`)
        let received = 0
        let pickedUp = 0
        data.forEach(p => {
          const d = new Date(p.receivedAt || p.createdAt || p.date)
          if (d.getHours() === i) {
            if (p.status?.toUpperCase().includes('PICKED') || p.status?.toUpperCase().includes('TAKEN')) pickedUp++
            else received++
          }
        })
        chartData.datasets[0].data.push(received)
        chartData.datasets[1].data.push(pickedUp)
      }
    } else if (currentView.value === 'weekly') {
      // 7 Days (Mon-Sun)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      chartData.labels = days
      days.forEach((day, idx) => {
        let received = 0
        let pickedUp = 0
        data.forEach(p => {
          const d = new Date(p.receivedAt || p.createdAt || p.date)
          const dIdx = (d.getDay() + 6) % 7 // Mon=0
          if (dIdx === idx) {
            if (p.status?.toUpperCase().includes('PICKED') || p.status?.toUpperCase().includes('TAKEN')) pickedUp++
            else received++
          }
        })
        chartData.datasets[0].data.push(received)
        chartData.datasets[1].data.push(pickedUp)
      })
    } else if (currentView.value === 'monthly') {
      // 28-31 Days
      const daysInMonth = end.getDate()
      for (let i = 1; i <= daysInMonth; i++) {
        chartData.labels.push(i.toString())
        let received = 0
        let pickedUp = 0
        data.forEach(p => {
          const d = new Date(p.receivedAt || p.createdAt || p.date)
          if (d.getDate() === i) {
            if (p.status?.toUpperCase().includes('PICKED') || p.status?.toUpperCase().includes('TAKEN')) pickedUp++
            else received++
          }
        })
        chartData.datasets[0].data.push(received)
        chartData.datasets[1].data.push(pickedUp)
      }
    }
  }

  const generateResidentChart = (data, start, end) => {
    residentChartData.labels = chartData.labels
    residentChartData.data = new Array(chartData.labels.length).fill(0)
    
    // Residents growth in period
    data.forEach(r => {
      const d = new Date(r.updateAt || r.createdAt)
      if (d >= start && d <= end) {
        if (currentView.value === 'daily') {
          residentChartData.data[d.getHours()]++
        } else if (currentView.value === 'weekly') {
          const dIdx = (d.getDay() + 6) % 7
          if (dIdx >= 0 && dIdx < 7) residentChartData.data[dIdx]++
        } else if (currentView.value === 'monthly') {
          const dIdx = d.getDate() - 1
          if (dIdx >= 0 && dIdx < residentChartData.data.length) residentChartData.data[dIdx]++
        }
      }
    })
    
    residentChartData.total = residentChartData.data.reduce((a, b) => a + b, 0)
    const max = Math.max(...residentChartData.data)
    if (max === 0) {
      residentChartData.peak = '-'
    } else {
      const idx = residentChartData.data.indexOf(max)
      residentChartData.peak = residentChartData.labels[idx]
    }
  }

  const nextPeriod = () => {
    const d = new Date(referenceDate.value)
    if (currentView.value === 'daily') d.setDate(d.getDate() + 1)
    else if (currentView.value === 'weekly') d.setDate(d.getDate() + 7)
    else if (currentView.value === 'monthly') d.setMonth(d.getMonth() + 1)
    
    if (d <= new Date()) {
      referenceDate.value = d
      calculateDashboardData()
    }
  }

  const previousPeriod = () => {
    const d = new Date(referenceDate.value)
    if (currentView.value === 'daily') d.setDate(d.getDate() - 1)
    else if (currentView.value === 'weekly') d.setDate(d.getDate() - 7)
    else if (currentView.value === 'monthly') d.setMonth(d.getMonth() - 1)
    referenceDate.value = d
    calculateDashboardData()
  }

  const setPanelView = (view) => {
    currentView.value = view
    calculateDashboardData()
  }

  const isAtCurrentPeriod = computed(() => {
    const today = new Date()
    const ref = referenceDate.value
    if (currentView.value === 'daily') {
      return ref.toDateString() === today.toDateString()
    } else if (currentView.value === 'weekly') {
      const getWeek = (date) => {
        const d = new Date(date)
        d.setHours(0,0,0,0)
        d.setDate(d.getDate() + 4 - (d.getDay()||7))
        const yearStart = new Date(d.getFullYear(),0,1)
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
      }
      return getWeek(ref) === getWeek(today) && ref.getFullYear() === today.getFullYear()
    } else if (currentView.value === 'monthly') {
      return ref.getMonth() === today.getMonth() && ref.getFullYear() === today.getFullYear()
    }
    return false
  })

  return {
    parcels,
    members,
    announcements,
    chartData,
    residentChartData,
    stats,
    overallStats,
    currentView,
    referenceDate,
    isAtCurrentPeriod,

    setParcels,
    setMembers,
    setAnnouncements,
    calculateDashboardData,
    getMappedParcels,
    nextPeriod,
    previousPeriod,
    setPanelView
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardManager, import.meta.hot))
}
