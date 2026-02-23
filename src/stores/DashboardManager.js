import { reactive, computed } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

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
    labels: ['Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Parcel Volume',
        data: [24, 15, 31, 40, 23, 15, 33],
        backgroundColor: (context) => {
          const index = context.dataIndex
          return index === 3
            ? 'rgba(37, 99, 235, 0.9)'
            : 'rgba(59, 130, 246, 0.3)'
        },
        borderRadius: 8,
        barThickness: 30
      }
    ]
  })
  
  const stats = reactive({
    totalParcels: 0,
    totalResidents: 0,
    totalAnnouncements: 0
  })

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
    
    updateStat
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardManager, import.meta.hot))
}
