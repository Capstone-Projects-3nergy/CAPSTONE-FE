import { reactive, computed, ref } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useDashboardManager = defineStore('dashboardManager', () => {
  // Current state for navigation - Split for independent charts
  const parcelRefDate = ref(new Date())
  const parcelView = ref('daily') // 'daily' | 'weekly' | 'monthly'
  
  const residentRefDate = ref(new Date())
  const residentView = ref('daily')

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
  const getPeriodBounds = (type = 'parcel') => {
    const refDate = type === 'parcel' ? parcelRefDate.value : residentRefDate.value
    const view = type === 'parcel' ? parcelView.value : residentView.value
    
    const start = new Date(refDate)
    const end = new Date(refDate)
    
    if (view === 'daily') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (view === 'weekly') {
      const day = start.getDay() || 7 // 1-7
      start.setDate(start.getDate() - (day - 1))
      start.setHours(0, 0, 0, 0)
      
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else if (view === 'monthly') {
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
    const oneDayMs = 24 * 60 * 60 * 1000
    overallStats.overdueParcels = allParcels.filter(p => {
      const pStatus = p.status?.toUpperCase() || ''
      if (pStatus === 'PICKED_UP' || pStatus === 'TAKEN') return false
      
      const rDate = new Date(p.receivedAt || p.createdAt || p.date)
      return (today - rDate) > oneDayMs
    }).length

    // Separate bounds for parcel and resident
    const parcelBounds = getPeriodBounds('parcel')
    const residentBounds = getPeriodBounds('resident')
    
    // 2. Filter parcels for the current period for charts
    const parcelsInPeriod = parcels.filter(p => {
      const dStr = p.receivedAt || p.createdAt || p.date || p.updateAt || p.updatedAt
      const d = new Date(dStr)
      return d >= parcelBounds.start && d <= parcelBounds.end
    })

    const periodReceived = parcelsInPeriod.filter(p => p.status?.toUpperCase() !== 'PICKED_UP' && p.status?.toUpperCase() !== 'TAKEN')
    const periodPickedUp = parcelsInPeriod.filter(p => p.status?.toUpperCase() === 'PICKED_UP' || p.status?.toUpperCase() === 'TAKEN')
    
    // Update period-specific stats (based on parcel view)
    stats.totalParcels = parcelsInPeriod.length
    stats.pickedUpParcels = periodPickedUp.length
    stats.awaitingParcels = periodReceived.length
    stats.overdueParcels = parcelsInPeriod.filter(p => {
      const pStatus = p.status?.toUpperCase() || ''
      const isArrived = pStatus.includes('RECEIVED') || pStatus.includes('NOTIFIED') || pStatus.includes('OVERDUE')
      const isPickedUp = pStatus.includes('PICKED') || pStatus.includes('TAKEN')
      if (isPickedUp) return false
      
      const rDate = new Date(p.receivedAt || p.createdAt || p.date)
      const diffHours = (today - rDate) / (1000 * 60 * 60)
      return pStatus.includes('OVERDUE') || (diffHours >= 24 && isArrived)
    }).length

    // 3. Generate Chart Data with separate bounds
    generateParcelChart(parcelsInPeriod, parcelBounds.start, parcelBounds.end)
    generateResidentChart(members, residentBounds.start, residentBounds.end)
    
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

    if (parcelView.value === 'daily') {
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
    } else if (parcelView.value === 'weekly') {
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
    } else if (parcelView.value === 'monthly') {
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
    const view = residentView.value
    
    // Create appropriate labels based on resident view
    let labels = []
    if (view === 'daily') {
      for (let i = 0; i < 24; i++) labels.push(`${i.toString().padStart(2, '0')}:00`)
    } else if (view === 'weekly') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    } else if (view === 'monthly') {
      const daysInMonth = end.getDate()
      for (let i = 1; i <= daysInMonth; i++) labels.push(i.toString())
    }

    residentChartData.labels = labels
    residentChartData.data = new Array(labels.length).fill(0)
    
    // Residents growth in period
    data.forEach(r => {
      const d = new Date(r.updateAt || r.createdAt)
      if (d >= start && d <= end) {
        if (view === 'daily') {
          residentChartData.data[d.getHours()]++
        } else if (view === 'weekly') {
          const dIdx = (d.getDay() + 6) % 7
          if (dIdx >= 0 && dIdx < 7) residentChartData.data[dIdx]++
        } else if (view === 'monthly') {
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

  const nextPeriod = (type = 'parcel') => {
    const refDate = type === 'parcel' ? parcelRefDate : residentRefDate
    const view = type === 'parcel' ? parcelView.value : residentView.value
    
    const d = new Date(refDate.value)
    if (view === 'daily') d.setDate(d.getDate() + 1)
    else if (view === 'weekly') d.setDate(d.getDate() + 7)
    else if (view === 'monthly') d.setMonth(d.getMonth() + 1)
    
    if (d <= new Date()) {
      refDate.value = d
      calculateDashboardData()
    }
  }

  const previousPeriod = (type = 'parcel') => {
    const refDate = type === 'parcel' ? parcelRefDate : residentRefDate
    const view = type === 'parcel' ? parcelView.value : residentView.value
    
    const d = new Date(refDate.value)
    if (view === 'daily') d.setDate(d.getDate() - 1)
    else if (view === 'weekly') d.setDate(d.getDate() - 7)
    else if (view === 'monthly') d.setMonth(d.getMonth() - 1)
    
    refDate.value = d
    calculateDashboardData()
  }

  const setPanelView = (view, type = 'parcel') => {
    if (type === 'parcel') parcelView.value = view
    else residentView.value = view
    calculateDashboardData()
  }

  const isAtCurrentPeriod = (type = 'parcel') => {
    const today = new Date()
    const ref = type === 'parcel' ? parcelRefDate.value : residentRefDate.value
    const view = type === 'parcel' ? parcelView.value : residentView.value
    
    if (view === 'daily') {
      return ref.toDateString() === today.toDateString()
    } else if (view === 'weekly') {
      const getWeek = (date) => {
        const d = new Date(date)
        d.setHours(0,0,0,0)
        d.setDate(d.getDate() + 4 - (d.getDay()||7))
        const yearStart = new Date(d.getFullYear(),0,1)
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
      }
      return getWeek(ref) === getWeek(today) && ref.getFullYear() === today.getFullYear()
    } else if (view === 'monthly') {
      return ref.getMonth() === today.getMonth() && ref.getFullYear() === today.getFullYear()
    }
    return false
  }

  return {
    parcels,
    members,
    announcements,
    chartData,
    residentChartData,
    stats,
    overallStats,
    
    parcelView,
    parcelRefDate,
    residentView,
    residentRefDate,
    
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
