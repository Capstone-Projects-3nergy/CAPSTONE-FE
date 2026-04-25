import { reactive, computed, ref } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { fetchDashboardData } from '@/utils/fetchUtils'

export const useDashboardManager = defineStore('dashboardManager', () => {
  const parcelRefDate = ref(new Date())
  const parcelView = ref('daily') 
  
  const residentRefDate = ref(new Date())
  const residentView = ref('daily')

  const parcels = reactive([])
  const members = reactive([])
  const announcements = reactive([])

  const stats = reactive({
    totalParcels: 0,
    pickedUpParcels: 0,
    awaitingParcels: 0,
    waitingForStaffParcels: 0,
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
    waitingForStaffParcels: 0,
    overdueParcels: 0
  })

  const chartData = reactive({
    labels: [],
    datasets: [
      { 
        label: 'Waiting', 
        data: [], 
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1 
      },
      { 
        label: 'Waiting for Staff', 
        data: [], 
        backgroundColor: 'rgba(234, 179, 8, 0.85)', 
        borderColor: 'rgba(234, 179, 8, 1)',
        borderWidth: 1 
      },
      { 
        label: 'Picked Up', 
        data: [], 
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1 
      },
      { 
        label: 'Overdue', 
        data: [], 
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1 
      }
    ]
  })

  const residentChartData = reactive({
    labels: [],
    data: [],
    statusBreakdown: [], 
    total: 0,
    peak: '-'
  })
  const getPeriodBounds = (type = 'parcel') => {
    const refDate = type === 'parcel' ? parcelRefDate.value : residentRefDate.value
    const view = type === 'parcel' ? parcelView.value : residentView.value
    
    const start = new Date(refDate)
    const end = new Date(refDate)
    
    if (view === 'daily') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (view === 'weekly') {
      const day = start.getDay() || 7 
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
      trackingNumber: p.trackingNumber || 'Awaiting Staff',
      residentName: p.ownerName || p.residentName || 'Awaiting Staff',
      roomNumber: p.roomNumber || 'Awaiting Staff',
      status: mapStatus(p.status),
      receiveAt: p.receivedAt || p.createdAt || p.date || p.updateAt || p.updatedAt || new Date().toISOString(),
      updatedAt: p.updatedAt || p.updateAt || p.createdAt || p.date || new Date().toISOString(),
      statusHistory: p.statusHistory || []
    }))
  })

  const mapStatus = (status) => {
    const s = status?.toUpperCase().replace(/[\s_-]/g, '') || ''
    
    if (s.includes('PICKED') || s.includes('TAKEN')) return 'Picked Up'
    if (s.includes('STAFF') || s.includes('PENDING')) return 'Waiting for Staff'
    if (s === 'WAITING' || s === 'RECEIVED' || s === 'WAIT') return 'Waiting'
    if (s.includes('OVERDUE')) return 'Overdue'
    if (s.includes('NOTIFIED')) return 'Notified'
    
    return 'Waiting'
  }

  const calculateDashboardData = (parcelsRaw = null, residentsRaw = null, announcementsRaw = null) => {
    if (Array.isArray(parcelsRaw)) setParcels(parcelsRaw)
    if (Array.isArray(residentsRaw)) setMembers(residentsRaw)
    if (Array.isArray(announcementsRaw)) setAnnouncements(announcementsRaw)

    const today = new Date()
    
    const allParcels = parcels || []
    overallStats.totalParcels = allParcels.length
    overallStats.pickedUpParcels = allParcels.filter(p => {
       const s = p.status?.toUpperCase() || ''
       return s === 'PICKED_UP' || s === 'TAKEN'
    }).length
    overallStats.waitingForStaffParcels = allParcels.filter(p => {
       const s = p.status?.toUpperCase().replace(/[\s_-]/g, '') || ''
       return s.includes('STAFF') || s.includes('PENDING')
    }).length
    overallStats.awaitingParcels = allParcels.filter(p => {
       const s = p.status?.toUpperCase().replace(/[\s_-]/g, '') || ''
       const isWaiting = s === 'WAITING' || s === 'RECEIVED' || s === 'WAIT' || s.includes('NOTIFIED')
       const isStaff = s.includes('STAFF') || s.includes('PENDING')
       return isWaiting && !isStaff && !s.includes('OVERDUE')
    }).length
    const oneDayMs = 24 * 60 * 60 * 1000
    overallStats.overdueParcels = allParcels.filter(p => {
      const s = p.status?.toUpperCase().replace(/[\s_-]/g, '') || ''
      return s.includes('OVERDUE')
    }).length

    const parcelBounds = getPeriodBounds('parcel')
    const residentBounds = getPeriodBounds('resident')
    
    const parcelsWithActivity = parcels.filter(p => {
      const start = parcelBounds.start;
      const end = parcelBounds.end;
      
      const dArrival = new Date(p.receivedAt || p.createdAt || p.date)
      const isArrivalInRange = !isNaN(dArrival.getTime()) && dArrival >= start && dArrival <= end
      if (isArrivalInRange) return true
      
      const dUpdate = new Date(p.updatedAt || p.updateAt)
      const isUpdateInRange = !isNaN(dUpdate.getTime()) && dUpdate >= start && dUpdate <= end
      if (isUpdateInRange) return true
      
      if (p.statusHistory && Array.isArray(p.statusHistory)) {
        return p.statusHistory.some(h => {
          const d = new Date(h.timestamp || h.updatedAt || h.createdAt)
          return !isNaN(d.getTime()) && d >= start && d <= end
        })
      }
      return false
    })

    const getEventsInRange = (parcel, category) => {
      const history = parcel.statusHistory || []
      const start = parcelBounds.start
      const end = parcelBounds.end
      
      const hasHistoryEvent = history.some(h => {
        const s = (h.status || '').toUpperCase().replace(/[\s_-]/g, '')
        const d = new Date(h.timestamp || h.updatedAt || h.createdAt)
        const inRange = !isNaN(d.getTime()) && d >= start && d <= end
        
        if (category === 'pickedUp') return inRange && (s === 'PICKEDUP' || s === 'TAKEN')
        if (category === 'staff') return inRange && (s.includes('STAFF') || s.includes('PENDING'))
        if (category === 'overdue') return inRange && s.includes('OVERDUE')
        if (category === 'waiting') return inRange && (s === 'WAITING' || s === 'RECEIVED' || s === 'WAIT' || s === 'NOTIFIED') && !s.includes('STAFF')
        return false
      })
      
      if (hasHistoryEvent) return true
      
      const currentStatus = (parcel.status || '').toUpperCase().replace(/[\s_-]/g, '')
      const arrivalDate = new Date(parcel.receivedAt || parcel.createdAt || parcel.date)
      const isArrivalInRange = !isNaN(arrivalDate.getTime()) && arrivalDate >= start && arrivalDate <= end
      const updateDate = new Date(parcel.updatedAt || parcel.updateAt)
      const isUpdateInRange = !isNaN(updateDate.getTime()) && updateDate >= start && updateDate <= end

      if (category === 'pickedUp') return (currentStatus === 'PICKEDUP' || currentStatus === 'TAKEN') && isUpdateInRange
      if (category === 'staff') return (currentStatus.includes('STAFF') || currentStatus.includes('PENDING')) && isArrivalInRange
      if (category === 'overdue') return currentStatus.includes('OVERDUE') && isUpdateInRange
      if (category === 'waiting') return (currentStatus === 'WAITING' || currentStatus === 'RECEIVED' || currentStatus === 'WAIT' || currentStatus === 'NOTIFIED') && !currentStatus.includes('STAFF') && isArrivalInRange && !currentStatus.includes('OVERDUE')
      
      return false
    }
    
    stats.totalParcels = parcelsWithActivity.length
    stats.pickedUpParcels = parcelsWithActivity.filter(p => getEventsInRange(p, 'pickedUp')).length
    stats.waitingForStaffParcels = parcelsWithActivity.filter(p => getEventsInRange(p, 'staff')).length
    stats.awaitingParcels = parcelsWithActivity.filter(p => getEventsInRange(p, 'waiting')).length
    stats.overdueParcels = parcelsWithActivity.filter(p => getEventsInRange(p, 'overdue')).length

    const allResidents = members.filter(m => (m.role || '').toUpperCase() === 'RESIDENT')
    
    generateParcelChart(parcelsWithActivity, parcelBounds.start, parcelBounds.end)
    generateResidentChart(allResidents, residentBounds.start, residentBounds.end)
    
    const uniqueResidentsMap = new Map()
    allResidents.forEach(r => {
      const email = r.email || `${r.firstName}_${r.lastName}`
      if (!uniqueResidentsMap.has(email)) {
        uniqueResidentsMap.set(email, r)
      } else {
        const existing = uniqueResidentsMap.get(email)
        const existingDate = new Date(existing.updateAt || existing.createdAt || 0)
        const currentDate = new Date(r.updateAt || r.createdAt || 0)
        if (currentDate > existingDate) {
          uniqueResidentsMap.set(email, r)
        }
      }
    })
    
    const uniqueResidents = Array.from(uniqueResidentsMap.values())
    
    stats.totalResidents = uniqueResidents.length
    stats.activeResidents = uniqueResidents.filter(r => r.status?.toUpperCase() === 'VERIFIED' || r.status?.toUpperCase() === 'ACTIVE').length
    stats.pendingResidents = uniqueResidents.filter(r => r.status?.toUpperCase() === 'PENDING').length
    stats.inactiveResidents = uniqueResidents.filter(r => r.status?.toUpperCase() === 'INACTIVE').length
    stats.totalAnnouncements = announcements.length
  }

  const generateParcelChart = (data, start, end) => {
    chartData.labels = []
    const view = parcelView.value
    
    let slotCount = 0
    if (view === 'daily') {
      slotCount = 24
      for (let i = 0; i < 24; i++) chartData.labels.push(`${i.toString().padStart(2, '0')}:00`)
    } else if (view === 'weekly') {
      slotCount = 7
      chartData.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    } else if (view === 'monthly') {
      slotCount = end.getDate()
      for (let i = 1; i <= slotCount; i++) chartData.labels.push(i.toString())
    }

    const waitingData = new Array(slotCount).fill(0)
    const staffWaitingData = new Array(slotCount).fill(0)
    const pickedUpData = new Array(slotCount).fill(0)
    const overdueData = new Array(slotCount).fill(0)

    data.forEach(p => {
      const sRaw = (p.status || '').toUpperCase().replace(/[\s_-]/g, '')
      const isWaitingForStaffStatus = sRaw.includes('STAFF') || sRaw.includes('PENDING')
      const isWaitingResidentStatus = (sRaw === 'WAITING' || sRaw === 'RECEIVED' || sRaw === 'WAIT' || sRaw.includes('NOTIFIED')) && !isWaitingForStaffStatus

      let arrivals = []
      if (p.statusHistory && Array.isArray(p.statusHistory) && p.statusHistory.length > 0) {
        arrivals = p.statusHistory
          .filter(h => {
             const s = h.status?.toUpperCase().replace(/[\s_-]/g, '') || ''
             return (s === 'WAITING' || s === 'RECEIVED' || s === 'WAIT' || s.includes('NOTIFIED')) && !s.includes('STAFF')
          })
          .map(h => new Date(h.timestamp || h.updatedAt || h.createdAt || h.date))
      }
      
      if (isWaitingResidentStatus && arrivals.length === 0) {
        arrivals.push(new Date(p.receivedAt || p.createdAt || p.date || p.updateAt || p.updatedAt))
      }

      arrivals.forEach(d => {
        if (d >= start && d <= end) {
          let idx = -1
          if (view === 'daily') idx = d.getHours()
          else if (view === 'weekly') idx = (d.getDay() + 6) % 7
          else if (view === 'monthly') idx = d.getDate() - 1
          
          if (idx >= 0 && idx < slotCount) waitingData[idx]++
        }
      })

      let staffArrivals = []
      if (p.statusHistory && Array.isArray(p.statusHistory) && p.statusHistory.length > 0) {
        staffArrivals = p.statusHistory
          .filter(h => {
             const s = h.status?.toUpperCase().replace(/[\s_-]/g, '') || ''
             return s.includes('STAFF') || s.includes('PENDING')
          })
          .map(h => new Date(h.timestamp || h.updatedAt || h.createdAt || h.date))
      }
      
      if (isWaitingForStaffStatus && staffArrivals.length === 0) {
        staffArrivals.push(new Date(p.receivedAt || p.createdAt || p.date))
      }

      staffArrivals.forEach(d => {
        if (d >= start && d <= end) {
          let idx = -1
          if (view === 'daily') idx = d.getHours()
          else if (view === 'weekly') idx = (d.getDay() + 6) % 7
          else if (view === 'monthly') idx = d.getDate() - 1
          
          if (idx >= 0 && idx < slotCount) staffWaitingData[idx]++
        }
      })

      const currentStatus = (p.status || '').toUpperCase()
      const isPickedUpNow = currentStatus.includes('PICKED') || currentStatus.includes('TAKEN')
      
      let completions = []
      if (p.statusHistory && Array.isArray(p.statusHistory) && p.statusHistory.length > 0) {
        completions = p.statusHistory
          .filter(h => {
             const s = h.status?.toUpperCase() || ''
             return s === 'PICKED_UP' || s === 'TAKEN'
          })
          .map(h => new Date(h.timestamp || h.updatedAt || h.createdAt || h.date))
      }

      if (isPickedUpNow && completions.length === 0) {
        completions.push(new Date(p.updatedAt || p.updateAt || p.receivedAt || p.createdAt || p.date))
      }

      completions.forEach(d => {
        if (d >= start && d <= end) {
          let idx = -1
          if (view === 'daily') idx = d.getHours()
          else if (view === 'weekly') idx = (d.getDay() + 6) % 7
          else if (view === 'monthly') idx = d.getDate() - 1
          
          if (idx >= 0 && idx < slotCount) pickedUpData[idx]++
        }
      })

      const isOverdueNow = currentStatus.includes('OVERDUE')
      let overdues = []
      if (p.statusHistory && Array.isArray(p.statusHistory) && p.statusHistory.length > 0) {
        overdues = p.statusHistory
          .filter(h => h.status?.toUpperCase().includes('OVERDUE'))
          .map(h => new Date(h.timestamp || h.updatedAt || h.createdAt || h.date))
      }



      if (isOverdueNow && overdues.length === 0) {
        overdues.push(new Date(p.updatedAt || p.updateAt || p.receivedAt || p.createdAt || p.date))
      }

      overdues.forEach(d => {
        if (d >= start && d <= end) {
          let idx = -1
          if (view === 'daily') idx = d.getHours()
          else if (view === 'weekly') idx = (d.getDay() + 6) % 7
          else if (view === 'monthly') idx = d.getDate() - 1
          
          if (idx >= 0 && idx < slotCount) overdueData[idx]++
        }
      })
    })

    chartData.datasets[0].data = waitingData
    chartData.datasets[1].data = staffWaitingData
    chartData.datasets[2].data = pickedUpData
    chartData.datasets[3].data = overdueData
  }

  const generateResidentChart = (data, start, end) => {
    const view = residentView.value
    
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
    residentChartData.statusBreakdown = new Array(labels.length).fill(null).map(() => ({ active: 0, pending: 0, inactive: 0 }))
    
    data.forEach(r => {
      const d = new Date(r.updateAt || r.createdAt)
      if (d >= start && d <= end) {
        let idx = -1
        if (view === 'daily') {
          idx = d.getHours()
        } else if (view === 'weekly') {
          idx = (d.getDay() + 6) % 7
        } else if (view === 'monthly') {
          idx = d.getDate() - 1
        }

        if (idx >= 0 && idx < residentChartData.data.length) {
          residentChartData.data[idx]++
          
          const status = (r.status || '').toUpperCase()
          if (status === 'ACTIVE' || status === 'VERIFIED') {
            residentChartData.statusBreakdown[idx].active++
          } else if (status === 'PENDING') {
            residentChartData.statusBreakdown[idx].pending++
          } else if (status === 'INACTIVE') {
            residentChartData.statusBreakdown[idx].inactive++
          }
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

  const loadDetailedDashboard = async (router) => {
    try {
      const url = `${import.meta.env.VITE_BASE_URL}/api/dashboard/detailed`
      const data = await fetchDashboardData(url, router)
      
      if (data && data.parcels) {
        calculateDashboardData(
          data.parcels,
          data.members || data.residents,
          data.announcements
        )
        return true
      }
      return false
    } catch (err) {
      console.warn('loadDetailedDashboard failed, using fallback', err)
      return false
    }
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
    loadDetailedDashboard,
    getMappedParcels,
    nextPeriod,
    previousPeriod,
    setPanelView
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardManager, import.meta.hot))
}
