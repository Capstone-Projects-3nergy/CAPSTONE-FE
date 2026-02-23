import { reactive } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useDashboardManager = defineStore('dashboardManager', () => {
  const chartData = reactive({
    labels: [],
    datasets: []
  })
  
  const stats = reactive({
    totalParcels: 0,
    totalResidents: 0,
    totalAnnouncements: 0
  })

  /* ---------- getters ---------- */
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
    chartData,
    stats,
    
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
