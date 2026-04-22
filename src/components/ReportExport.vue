<script setup>
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

const props = defineProps({
  stats: {
    type: Object,
    required: true
  },
  pendingResidents: {
    type: Array,
    default: () => []
  },
  topResidents: {
    type: Array,
    default: () => []
  },
  announcements: {
    type: Array,
    default: () => []
  },
  overallStats: {
    type: Object,
    required: true
  },
  parcels: {
    type: Array,
    default: () => []
  },
  members: {
    type: Array,
    default: () => []
  },
  selectedDate: {
    type: String,
    default: () => new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  }
})

const displayDate = computed(() => {
  if (!props.selectedDate) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const d = new Date(props.selectedDate);
  if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString()
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '-' : d.toLocaleString()
}

// Base date for calculations (end of selected day)
const snapshotDate = computed(() => {
  const d = props.selectedDate ? new Date(props.selectedDate) : new Date();
  d.setHours(23, 59, 59, 999);
  return d;
})

// Helper to get parcel status at specific date
const getStatusAtDate = (parcel, date) => {
  if (!parcel.statusHistory || !Array.isArray(parcel.statusHistory) || parcel.statusHistory.length === 0) {
    const createdAt = new Date(parcel.createdAt || parcel.receiveAt || parcel.date);
    return createdAt <= date ? (parcel.status || 'RECEIVED') : null;
  }

  // Find the last status update before or on the target date
  const validHistory = parcel.statusHistory
    .map(h => ({ ...h, ts: new Date(h.timestamp || h.updatedAt || h.createdAt || h.date) }))
    .filter(h => h.ts <= date)
    .sort((a, b) => b.ts - a.ts);

  if (validHistory.length > 0) return validHistory[0].status;
  
  // If no history before date, check if it was created before date
  const createdAt = new Date(parcel.createdAt || parcel.receiveAt || parcel.date);
  return createdAt <= date ? 'RECEIVED' : null;
}

// Calculate Daily Activity Stats (What happened ON the selected date)
const dailyStats = computed(() => {
  const dateStr = props.selectedDate || new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const targetDate = new Date(dateStr);
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const res = {
    received: 0,
    pickedUp: 0,
    overdueToday: 0, // Items that became overdue on this day? No, usually just total currently overdue on this day.
    joined: 0,
    verified: 0
  };

  props.parcels.forEach(p => {
    const arrivalDate = new Date(p.receiveAt || p.createdAt || p.date);
    if (arrivalDate >= startOfDay && arrivalDate <= endOfDay) {
      res.received++;
    }

    let isPickedUpOnDay = false;
    if (p.statusHistory && Array.isArray(p.statusHistory)) {
      isPickedUpOnDay = p.statusHistory.some(h => {
        const s = (h.status || '').toUpperCase().replace(/_/g, ' ');
        const ts = new Date(h.timestamp || h.updatedAt || h.createdAt || h.date);
        return (s.includes('PICKED UP') || s.includes('TAKEN')) && (ts >= startOfDay && ts <= endOfDay);
      });
    }

    // Fallback: if not found in history, check current status and last update time
    if (!isPickedUpOnDay) {
      const s = (p.status || '').toUpperCase().replace(/_/g, ' ');
      const ts = new Date(p.updatedAt || p.date);
      if ((s.includes('PICKED UP') || s.includes('TAKEN')) && (ts >= startOfDay && ts <= endOfDay)) {
        isPickedUpOnDay = true;
      }
    }

    if (isPickedUpOnDay) res.pickedUp++;
  });

  props.members.forEach(m => {
    const joinDate = new Date(m.createdAt || m.updateAt);
    if (joinDate >= startOfDay && joinDate <= endOfDay) {
      res.joined++;
      const s = (m.status || '').toUpperCase();
      if (s !== 'PENDING') res.verified++;
    }
  });

  return res;
});

// Calculate Yearly Stats for the year of selectedDate (for KPI Summary)
const yearlyStats = computed(() => {
  const date = props.selectedDate ? new Date(props.selectedDate) : new Date();
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
  const endLimit = snapshotDate.value;

  const res = {
    total: 0,
    pickedUp: 0,
    awaiting: 0,
    overdue: 0,
    waitingForStaff: 0,
    activeResidents: 0,
    totalResidents: 0,
    totalLeadTimeHours: 0,
    completedCount: 0
  };

  props.parcels.forEach(p => {
    const arrivalDate = new Date(p.receiveAt || p.createdAt || p.date);
    if (arrivalDate >= startOfYear && arrivalDate <= endLimit) {
      res.total++;
      
      const status = getStatusAtDate(p, endLimit);
      if (!status) return;

      const s = status.toUpperCase().replace(/_/g, ' ');
      if (s.includes('PICKED UP') || s.includes('TAKEN')) {
        res.pickedUp++;
        
        // Lead time calculation
        if (p.statusHistory) {
          const receiveEvent = p.statusHistory.find(h => ['RECEIVED', 'WAITING', 'WAIT'].includes(h.status?.toUpperCase()));
          const pickupEvent = p.statusHistory.find(h => {
            const st = (h.status || '').toUpperCase().replace(/_/g, ' ');
            const ts = new Date(h.timestamp || h.updatedAt || h.createdAt || h.date);
            return (st.includes('PICKED UP') || st.includes('TAKEN')) && ts <= endLimit;
          });

          if (receiveEvent && pickupEvent) {
            const start = new Date(receiveEvent.timestamp || receiveEvent.updatedAt);
            const end = new Date(pickupEvent.timestamp || pickupEvent.updatedAt);
            if (end > start) {
              res.totalLeadTimeHours += (end - start) / (1000 * 60 * 60);
              res.completedCount++;
            }
          }
        }
      } else if (s.includes('WAITING FOR STAFF') || s.includes('STAFF')) {
        res.waitingForStaff++;
        res.awaiting++;
      } else {
        const overdueThresholdMs = 24 * 60 * 60 * 1000;
        if ((endLimit - arrivalDate) > overdueThresholdMs) {
          res.overdue++;
        } else {
          res.awaiting++;
        }
      }
    }
  });

  props.members.forEach(m => {
    const joinDate = new Date(m.createdAt || m.updateAt);
    if (joinDate >= startOfYear && joinDate <= endLimit) {
      res.totalResidents++;
      const s = (m.status || '').toUpperCase();
      if (s !== 'PENDING') res.activeResidents++;
    }
  });

  return res;
});

// Calculate Dynamic Stats for the Snapshot Date (Cumulative up to that date)
const dynamicStats = computed(() => {
  const date = snapshotDate.value;
  const result = {
    total: 0,
    pickedUp: 0,
    awaiting: 0,
    overdue: 0,
    waitingForStaff: 0,
    activeResidents: 0,
    pendingResidents: 0,
    inactiveResidents: 0
  };

  // Parcel Stats at Date
  props.parcels.forEach(p => {
    const status = getStatusAtDate(p, date);
    if (!status) return;

    result.total++;
    const s = status.toUpperCase().replace(/_/g, ' ');
    
    if (s.includes('PICKED UP') || s.includes('TAKEN')) {
      result.pickedUp++;
    } else if (s.includes('WAITING FOR STAFF') || s.includes('STAFF')) {
      result.waitingForStaff++;
      result.awaiting++;
    } else {
      // Check if it's overdue at that point in time (matching HomePageStaff logic)
      const receiveDate = new Date(p.receiveAt || p.createdAt || p.date);
      const overdueThresholdMs = 1 * 24 * 60 * 60 * 1000;
      if ((date - receiveDate) > overdueThresholdMs) {
        result.overdue++;
      } else {
        result.awaiting++;
      }
    }
  });

  // Resident Stats at Date
  props.members.forEach(m => {
    const joinDate = new Date(m.createdAt || m.updateAt);
    if (joinDate > date) return;

    const s = (m.status || '').toUpperCase();
    if (s !== 'PENDING') result.activeResidents++;
    else result.pendingResidents++;
    // Note: inactiveResidents is now essentially merged into activeResidents for KPI purposes
    // but if we need a separate count for lists, we can keep the logic consistent.
    if (s === 'INACTIVE') result.inactiveResidents++;
  });

  return result;
});

// Filtered Lists for the Snapshot Date
const filteredParcels = computed(() => {
  const date = snapshotDate.value;
  return props.parcels
    .filter(p => new Date(p.createdAt || p.receiveAt || p.date) <= date)
    .map(p => ({ ...p, currentStatus: getStatusAtDate(p, date) }))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
});

const filteredOverdue = computed(() => {
  const date = snapshotDate.value;
  const overdueThresholdMs = 24 * 60 * 60 * 1000;
  return filteredParcels.value.filter(p => {
    const s = (p.currentStatus || '').toUpperCase();
    // Allow 'Received', 'Waiting', 'Notified', or 'Overdue' statuses to be in overdue list
    // Exclude Picked Up and Waiting for Staff (matching HomePageStaff logic)
    if (s.includes('PICKED UP') || s.includes('TAKEN') || s.includes('STAFF')) return false;
    
    const receiveDate = new Date(p.receiveAt || p.createdAt || p.date);
    return (date - receiveDate) > overdueThresholdMs;
  });
});

const filteredPendingResidents = computed(() => {
  const date = snapshotDate.value;
  return props.pendingResidents.filter(r => new Date(r.createdAt || r.updateAt) <= date);
});

// Compute Historical Summaries from all data
const parcelHistory = computed(() => {
  const groups = {};
  const limitDate = snapshotDate.value;

  const addEvent = (date, type) => {
    if (!date || isNaN(date.getTime()) || date > limitDate) return;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (!groups[year]) {
      groups[year] = { 
        year, 
        totalReceived: 0, 
        totalPickedUp: 0, 
        totalOverdue: 0, 
        months: {} 
      };
    }
    if (!groups[year].months[month]) {
      groups[year].months[month] = { 
        month: month, 
        monthStr: `${month.toString().padStart(2, '0')}/${year}`, 
        received: 0, 
        pickedUp: 0, 
        overdue: 0 
      };
    }

    if (type === 'received') {
      groups[year].months[month].received++;
      groups[year].totalReceived++;
    } else if (type === 'pickedUp') {
      groups[year].months[month].pickedUp++;
      groups[year].totalPickedUp++;
    } else if (type === 'overdue') {
      groups[year].months[month].overdue++;
      groups[year].totalOverdue++;
    }
  };

  props.parcels.forEach(p => {
    const arrivalDate = new Date(p.receiveAt || p.createdAt || p.date);
    if (!isNaN(arrivalDate.getTime()) && arrivalDate <= limitDate) {
      addEvent(arrivalDate, 'received');
    }

    // Check when it was picked up
    if (p.statusHistory && Array.isArray(p.statusHistory)) {
      const pickupEvent = p.statusHistory.find(h => {
        const s = (h.status || '').toUpperCase().replace(/_/g, ' ');
        return s.includes('PICKED UP') || s.includes('TAKEN');
      });
      if (pickupEvent) {
        const d = new Date(pickupEvent.timestamp || pickupEvent.updatedAt);
        if (d <= limitDate) addEvent(d, 'pickedUp');
      }
    }
    // Calculate if it became overdue before limitDate
    const overdueThresholdMs = 24 * 60 * 60 * 1000;
    const becomesOverdueAt = new Date(arrivalDate.getTime() + overdueThresholdMs);
    
    if (becomesOverdueAt <= limitDate) {
      // Check if it was already picked up or in staff verification before it became overdue
      const statusAtOverdue = getStatusAtDate(p, becomesOverdueAt);
      const s = (statusAtOverdue || '').toUpperCase();
      const isAlreadyPickedUp = s.includes('PICKED UP') || s.includes('TAKEN');
      const isStaff = s.includes('STAFF');
      
      if (!isAlreadyPickedUp && !isStaff) {
        addEvent(becomesOverdueAt, 'overdue');
      }
    }
  });

  return Object.values(groups)
    .sort((a, b) => b.year - a.year)
    .map(y => ({ 
      ...y, 
      months: Object.values(y.months).sort((a, b) => a.month - b.month) 
    }));
});

const residentHistory = computed(() => {
  const groups = {};
  const limitDate = snapshotDate.value;
  props.members.forEach(m => {
    const d = new Date(m.createdAt || m.updateAt);
    if (isNaN(d.getTime()) || d > limitDate) return;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    
    if (!groups[year]) groups[year] = { year, totalJoined: 0, months: {} };
    if (!groups[year].months[month]) {
      groups[year].months[month] = { month: month, monthStr: `${month.toString().padStart(2, '0')}/${year}`, joined: 0 };
    }
    
    groups[year].months[month].joined++;
    groups[year].totalJoined++;
  });

  return Object.values(groups)
    .sort((a, b) => b.year - a.year)
    .map(y => ({ ...y, months: Object.values(y.months).sort((a, b) => a.month - b.month) }));
});

// Compute Business Insights for Executive Reporting (YEARLY performance)
const businessInsights = computed(() => {
  const ys = yearlyStats.value;
  const total = ys.total;
  
  if (total === 0) return null;

  const pickupRate = (ys.pickedUp / total) * 100;
  const overdueRate = (ys.overdue / total) * 100;
  const staffBacklogRate = (ys.waitingForStaff / total) * 100;
  
  const totalRes = ys.totalResidents || 1;
  const verificationRate = (ys.activeResidents / totalRes) * 100;
  
  const avgLeadTime = ys.completedCount > 0 ? (ys.totalLeadTimeHours / ys.completedCount).toFixed(1) : '-';

  let healthStatus = 'STABLE';
  let insights = [];
  
  const yearStr = props.selectedDate ? new Date(props.selectedDate).getFullYear() : new Date().getFullYear();

  if (overdueRate > 15) {
    healthStatus = 'CRITICAL BACKLOG';
    insights.push(`[${yearStr} Year] Efficiency Alert: ${overdueRate.toFixed(1)}% yearly inventory became overdue.`);
  }
  
  if (staffBacklogRate > 10) {
    insights.push(`[${yearStr} Year] Note: Intake verification backlog average is ${staffBacklogRate.toFixed(1)}%.`);
  }

  if (pickupRate > 80) {
    insights.push(`[${yearStr} Year] High Performance: Yearly pickup response is excellent.`);
  }

  return {
    pickupRate: pickupRate.toFixed(1),
    overdueRate: overdueRate.toFixed(1),
    staffBacklogRate: staffBacklogRate.toFixed(1),
    verificationRate: verificationRate.toFixed(1),
    avgLeadTime,
    healthStatus,
    insights,
    year: yearStr,
    dateLabel: displayDate.value
  };
});

// (Removed overdueParcels computed property in favor of dynamic filteredOverdue)

const handleExportExcel = () => {
  const stats = dailyStats.value;
  const snapshot = dynamicStats.value;
  const overdueList = filteredOverdue.value;
  const pending = filteredPendingResidents.value;
  const topRes = props.topResidents;
  const recentParcels = filteredParcels.value.slice(0, 10);

  // 1. MAIN FILE HEADER
  const finalData = [
    ['Dormitory Management System - Summary Report'],
    ['Report Issue Date:', displayDate.value],
    []
  ];

  const insights = businessInsights.value;
  if (insights) {
    finalData.push([`Performance Summary as of ${insights.dateLabel}`]);
    finalData.push(['KPI METRIC', 'YEARLY VALUE (%)', 'OPINION / INSIGHT']);
    finalData.push(['Clearing efficiency', insights.pickupRate + '%', insights.pickupRate > 80 ? 'Optimal' : 'Standard']);
    finalData.push(['Overdue ratio', insights.overdueRate + '%', insights.overdueRate > 15 ? 'CRITICAL' : 'Stable']);
    finalData.push(['Staff load', insights.staffBacklogRate + '%', insights.staffBacklogRate > 10 ? 'Bottleneck' : 'Excellent']);
    finalData.push(['Resident verification', insights.verificationRate + '%', '-']);
    finalData.push(['Average Pickup Turnaround', insights.avgLeadTime + ' Hours', 'Average for ' + insights.year]);
    finalData.push(['Current annual state', '', insights.healthStatus]);
    
    finalData.push(['Yearly Analytics:']);
    if (insights.insights.length > 0) {
      insights.insights.forEach(msg => {
        finalData.push(['', '', '• ' + msg]);
      });
    } else {
      finalData.push(['', '', '• Operation is flowing normally. No interventions required.']);
    }
    finalData.push([]);
  }

  let mainSection = 1;

  // --- SECTION 1: PARCEL MANAGEMENT OVERVIEW ---
  finalData.push([`${mainSection}. Parcel Management Overview (Daily Activity)`]);
  finalData.push(['Daily Statistics (Parcels)', 'Daily Status (Activity)', 'Amount']);
  finalData.push(['', 'Received', stats.received]);
  finalData.push(['', 'Picked Up', stats.pickedUp]);
  finalData.push(['', 'Overdue', overdueList.length]);
  finalData.push(['', 'Total', snapshot.total]);
  finalData.push([]);

  // Historical Summary (Parcels) - Moved before lists to match Print
  if (parcelHistory.value.length > 0) {
    parcelHistory.value.forEach(yData => {
      finalData.push([`Historical Monthly Summary (Parcels) - Year ${yData.year}`]);
      finalData.push(['Month (MM/YYYY)', 'Total Received', 'Total Picked Up', 'Total Overdue']);
      yData.months.forEach(h => {
        finalData.push([h.monthStr, h.received, h.pickedUp, h.overdue]);
      });
      finalData.push(['Total', yData.totalReceived, yData.totalPickedUp, yData.totalOverdue]);
      finalData.push([]);
    });
  }

  if (recentParcels.length > 0) {
    finalData.push(['Recent Parcels (Latest Activity)']);
    finalData.push(['Date', 'Resident', 'Tracking No.', 'Status']);
    recentParcels.forEach(p => {
      finalData.push([formatDate(p.updatedAt), p.residentName, p.trackingNumber, (p.currentStatus || p.status)]);
    });
    finalData.push(['Total recent parcels', '', '', recentParcels.length]);
    finalData.push([]);
  }

  if (overdueList.length > 0) {
    finalData.push(['Overdue Parcels (> 1 Day)']);
    finalData.push(['Received At', 'Resident', 'Tracking No.', 'Status']);
    overdueList.forEach(p => {
      finalData.push([formatDate(p.receiveAt || p.createdAt), p.residentName, p.trackingNumber, (p.currentStatus || p.status)]);
    });
    finalData.push(['Total overdue parcels', '', '', overdueList.length]);
    finalData.push([]);
  }

  mainSection++;

  // --- SECTION 2: RESIDENT MANAGEMENT OVERVIEW ---
  finalData.push([`${mainSection}. Resident Management Overview (Daily Activity)`]);
  finalData.push(['Daily Statistics (Residents)', 'Daily Status (Activity)', 'Amount']);
  finalData.push(['', 'Joined', stats.joined]);
  finalData.push(['', 'Verified', stats.verified]);
  finalData.push(['', 'Total Active Members', snapshot.activeResidents]);
  finalData.push(['', 'Total registered', snapshot.activeResidents + snapshot.pendingResidents + snapshot.inactiveResidents]);
  finalData.push([]);

  // Historical Summary (Residents) - Moved before lists
  if (residentHistory.value.length > 0) {
    residentHistory.value.forEach(yData => {
      finalData.push([`Historical Monthly Summary (Residents) - Year ${yData.year}`]);
      finalData.push(['Month (MM/YYYY)', 'Total Registered']);
      yData.months.forEach(h => {
        finalData.push([h.monthStr, h.joined]);
      });
      finalData.push(['Total', yData.totalJoined]);
      finalData.push([]);
    });
  }

  if (pending && pending.length > 0) {
    finalData.push(['Pending Accounts (Awaiting Verification)']);
    finalData.push(['Name', 'Room No.', 'Email', 'Updated At']);
    pending.forEach(r => {
      finalData.push([r.fullName, r.roomNumber, r.email, formatDateTime(r.updateAt)]);
    });
    finalData.push(['Total pending accounts', '', '', pending.length]);
    finalData.push([]);
  }

  if (topRes && topRes.length > 0) {
    finalData.push(['Resident Ranking (Top Leaders by Volume)']);
    finalData.push(['Rank', 'Name', 'Room No.', 'Parcel Count']);
    let totalTopParcels = 0;
    topRes.forEach((r, i) => {
      totalTopParcels += parseInt(r.parcelCount || r.count || 0);
      finalData.push([i + 1, r.fullName || r.name, r.room || r.roomNumber || '-', r.parcelCount || r.count]);
    });
    finalData.push(['Total parcels (Top Leaders)', '', '', totalTopParcels]);
    finalData.push([]);
  }

  const ws = XLSX.utils.aoa_to_sheet(finalData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Summary Report");

  ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
  XLSX.writeFile(wb, `Dormitory_Dashboard_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const handleExportPDF = () => {
  const doc = new jsPDF();
  const stats = dailyStats.value;
  const snapshot = dynamicStats.value;
  const overdueList = filteredOverdue.value;
  const pending = filteredPendingResidents.value;
  const topRes = props.topResidents;
  const recentParcels = filteredParcels.value.slice(0, 10);
  const brandColor = [29, 53, 94]; // Navy Blue style (#1D355E)

  let y = 20;

  const checkPage = (heightNeeded) => {
    if (y + heightNeeded > 275) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  const drawMainCategoryHeader = (text) => {
    checkPage(20);
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(text, 105, y + 1.5, { align: 'center' });
    y += 12;
  };

  const drawSubHeader = (text) => {
    checkPage(12);
    // Left-accent border like Print style
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.rect(15, y - 3.5, 1.2, 4.5, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(text, 18, y);
    y += 6;
  };

  // Main Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(29, 53, 94);
  doc.text("Dormitory Management System - Summary Report", 105, y, { align: 'center' });
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Report Issue Date: ${displayDate.value}`, 105, y, { align: 'center' });
  y += 5;
  doc.setDrawColor(29, 53, 94);
  doc.setLineWidth(0.4);
  doc.line(15, y, 195, y);
  y += 12;

  // --- EXECUTIVE SUMMARY SECTION ---
  const insights = businessInsights.value;
  if (insights) {
    drawMainCategoryHeader(`Performance Summary as of ${insights.dateLabel}`);
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    // KPI Grid logic
    const boxW = 85;
    const boxH = 18;

    const drawKPIBox = (label, value, subLabel, x, py) => {
      doc.setDrawColor(226, 232, 240);
      doc.rect(x, py, boxW, boxH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(value, x + boxW/2, py + 7, { align: 'center' });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text(label, x + boxW/2, py + 11, { align: 'center' });
      doc.setFontSize(6.5);
      doc.text(subLabel, x + boxW/2, py + 15, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    };

    drawKPIBox("Clearing efficiency", insights.pickupRate + "%", "Annual pickup performance", 15, y);
    drawKPIBox("Overdue ratio", insights.overdueRate + "%", "Annual overdue percentage", 110, y);
    y += boxH + 4;
    drawKPIBox("Staff load", insights.staffBacklogRate + "%", "Annual average intake backlog", 15, y);
    drawKPIBox("Resident verification", insights.verificationRate + "%", "Annual verification health", 110, y);
    y += boxH + 8;

    // Insights Box
    doc.setFillColor(249, 250, 251); 
    doc.setDrawColor(229, 231, 235);
    doc.rect(15, y, 180, 22, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Yearly Analytics:", 20, y + 5);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    if (insights.insights.length > 0) {
      insights.insights.forEach(msg => {
        doc.text("• " + msg, 20, y);
        y += 3.5;
      });
    } else {
      doc.text("• Annual operation is flowing normally.", 20, y);
      y += 3.5;
    }
    doc.text(`Current annual state: ${insights.healthStatus}`, 20, y);
    y += 12;
  }

  // --- 1. Parcel Management Overview ---
  drawMainCategoryHeader("1. Parcel Management Overview (Daily)");
  
  // 1.1 Statistics
  drawSubHeader("Statistics Overview (Daily Parcels)");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  
  const parcelStats = [
    { item: 'Received', val: stats.received },
    { item: 'Picked Up', val: stats.pickedUp },
    { item: 'Overdue', val: overdueList.length }
  ];

  doc.setFont("helvetica", "bold");
  doc.text("Daily Status (Activity)", 18, y); 
  doc.text("Amount", 160, y);
  
  doc.setDrawColor(180, 180, 180);
  const pRows = parcelStats.length + 1;
  doc.rect(15, y - 4, 180, (pRows * 7) + 6);
  doc.line(15, y + 2, 195, y + 2);
  doc.line(155, y - 4, 155, y - 4 + (pRows * 7) + 6);

  y += 7;
  doc.setFont("helvetica", "normal");
  parcelStats.forEach(row => {
    doc.text(row.item, 18, y);
    doc.text((row.val ?? 0).toString(), 190, y, { align: 'right' });
    y += 7;
  });

  doc.setFont("helvetica", "bold");
  doc.text("Total", 18, y);
  doc.text(snapshot.total.toString(), 190, y, { align: 'right' });
  y += 12;

  // 1.2 Historical Monthly Table (Parcels) - Moved before lists
  if (parcelHistory.value.length > 0) {
    parcelHistory.value.forEach((yData) => {
      drawSubHeader(`Historical Monthly Summary (Parcels) - Year ${yData.year}`);
      doc.setFillColor(245, 247, 250);
      doc.rect(15, y - 4, 180, 7, 'F');
      doc.setFont("helvetica", "bold");
      doc.text("Month (MM/YYYY)", 17, y + 1);
      doc.text("RECEIVED", 85, y + 1, { align: 'right' });
      doc.text("PICKED UP", 140, y + 1, { align: 'right' });
      doc.text("OVERDUE", 190, y + 1, { align: 'right' });

      doc.setDrawColor(180, 180, 180);
      const rowsCount = yData.months.length + 1;
      doc.rect(15, y - 4, 180, (rowsCount * 6) + 7);
      y += 7;
      doc.setFont("helvetica", "normal");
      
      yData.months.forEach(h => {
        checkPage(6);
        doc.text(h.monthStr, 17, y);
        doc.text(h.received.toString(), 85, y, { align: 'right' });
        doc.text(h.pickedUp.toString(), 140, y, { align: 'right' });
        doc.text(h.overdue.toString(), 190, y, { align: 'right' });
        doc.line(15, y + 1, 195, y + 1);
        y += 6;
      });

      doc.setFont("helvetica", "bold");
      doc.text("Total", 17, y);
      doc.text(yData.totalReceived.toString(), 85, y, { align: 'right' });
      doc.text(yData.totalPickedUp.toString(), 140, y, { align: 'right' });
      doc.text(yData.totalOverdue.toString(), 190, y, { align: 'right' });
      y += 12;
    });
  }

  // 1.3 Recent Parcels
  if (recentParcels.length > 0) {
    drawSubHeader("Recent Parcels (Latest Activity)");
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 4, 180, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("DATE", 17, y + 1); 
    doc.text("RESIDENT", 45, y + 1); 
    doc.text("TRACKING NO.", 95, y + 1); 
    doc.text("STATUS", 160, y + 1);
    
    doc.setDrawColor(180, 180, 180);
    doc.rect(15, y - 4, 180, ((recentParcels.length + 1) * 7) + 7);
    doc.line(15, y + 3, 195, y + 3);
    doc.line(43, y - 4, 43, y - 4 + (recentParcels.length * 7) + 7);
    doc.line(93, y - 4, 93, y - 4 + (recentParcels.length * 7) + 7);
    doc.line(158, y - 4, 158, y - 4 + (recentParcels.length * 7) + 7);

    y += 7;
    doc.setFont("helvetica", "normal");
    recentParcels.forEach((p) => {
      checkPage(7);
      doc.text(formatDate(p.updatedAt), 17, y);
      doc.text((p.residentName || '').substring(0, 18), 45, y);
      doc.text((p.trackingNumber || '').substring(0, 20), 95, y);
      doc.text((p.currentStatus || p.status || ''), 160, y);
      doc.line(15, y + 1.5, 195, y + 1.5);
      y += 7;
    });

    doc.setFont("helvetica", "bold");
    doc.text("Total recent parcels", 17, y);
    doc.text(recentParcels.length.toString(), 160, y);
    y += 12;
  }

  // 1.4 Overdue Parcels
  if (overdueList.length > 0) {
    drawSubHeader("Overdue Parcels (> 1 Day)");
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 4, 180, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("RECEIVED AT", 17, y + 1); 
    doc.text("RESIDENT", 45, y + 1); 
    doc.text("TRACKING NO.", 95, y + 1); 
    doc.text("STATUS", 160, y + 1);
    
    doc.setDrawColor(180, 180, 180);
    doc.rect(15, y - 4, 180, ((overdueList.length + 1) * 7) + 7);
    doc.line(15, y + 3, 195, y + 3);
    doc.line(43, y - 4, 43, y - 4 + (overdueList.length * 7) + 7);
    doc.line(93, y - 4, 93, y - 4 + (overdueList.length * 7) + 7);
    doc.line(158, y - 4, 158, y - 4 + (overdueList.length * 7) + 7);

    y += 7;
    doc.setFont("helvetica", "normal");
    overdueList.forEach((p) => {
      checkPage(7);
      doc.text(formatDate(p.receiveAt || p.createdAt), 17, y);
      doc.text((p.residentName || '').substring(0, 18), 45, y);
      doc.text((p.trackingNumber || '').substring(0, 20), 95, y);
      doc.text((p.currentStatus || p.status || ''), 160, y);
      doc.line(15, y + 1.5, 195, y + 1.5);
      y += 7;
    });

    doc.setFont("helvetica", "bold");
    doc.text("Total overdue parcels", 17, y);
    doc.text(overdueList.length.toString(), 160, y);
    y += 12;
  }

  // --- 2. Resident Management Overview ---
  drawMainCategoryHeader("2. Resident Management Overview (Daily)");
  
  // 2.1 Statistics
  drawSubHeader("Statistics Overview (Daily Residents)");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  
  const resStats = [
    { item: 'Joined', val: stats.joined },
    { item: 'Verified', val: stats.verified },
    { item: 'Total Active Members', val: snapshot.activeResidents }
  ];

  doc.setFillColor(245, 247, 250);
  doc.rect(15, y - 4, 180, 7, 'F');
  doc.setFont("helvetica", "bold");
  doc.text("Daily Status (Activity)", 18, y + 1); 
  doc.text("Amount", 160, y + 1);
  
  doc.setDrawColor(180, 180, 180);
  const rRows = resStats.length + 1;
  doc.rect(15, y - 4, 180, (rRows * 7) + 6);
  doc.line(15, y + 2, 195, y + 2);
  doc.line(155, y - 4, 155, y - 4 + (rRows * 7) + 6);

  y += 7;
  doc.setFont("helvetica", "normal");
  resStats.forEach(row => {
    doc.text(row.item, 18, y);
    doc.text((row.val ?? 0).toString(), 190, y, { align: 'right' });
    y += 7;
  });

  doc.setFont("helvetica", "bold");
  doc.text("Total registered", 18, y);
  doc.text((snapshot.activeResidents + snapshot.pendingResidents + snapshot.inactiveResidents).toString(), 190, y, { align: 'right' });
  y += 12;

  // 2.2 Historical Monthly Table (Residents) - Before lists
  if (residentHistory.value.length > 0) {
    residentHistory.value.forEach((yData) => {
      drawSubHeader(`Historical Monthly Summary (Residents) - Year ${yData.year}`);
      doc.setFillColor(245, 247, 250);
      doc.rect(15, y - 4, 180, 7, 'F');
      doc.setFont("helvetica", "bold");
      doc.text("Month (MM/YYYY)", 17, y + 1);
      doc.text("TOTAL REGISTERED", 180, y + 1, { align: 'right' });

      doc.setDrawColor(180, 180, 180);
      const rowCount = yData.months.length + 1;
      doc.rect(15, y - 4, 180, (rowCount * 6) + 7);
      y += 7;
      doc.setFont("helvetica", "normal");
      
      yData.months.forEach(h => {
        checkPage(6);
        doc.text(h.monthStr, 17, y);
        doc.text(h.joined.toString(), 180, y, { align: 'right' });
        doc.line(15, y + 1, 195, y + 1);
        y += 6;
      });

      doc.setFont("helvetica", "bold");
      doc.text("Total", 17, y);
      doc.text(yData.totalJoined.toString(), 180, y, { align: 'right' });
      y += 12;
    });
  }

  // 2.3 Pending Accounts
  if (pending && pending.length > 0) {
    drawSubHeader("Pending Accounts (Awaiting Verification)");
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 4, 180, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("NAME", 17, y + 1); 
    doc.text("ROOM", 70, y + 1); 
    doc.text("EMAIL", 95, y + 1); 
    doc.text("UPDATED AT", 155, y + 1);

    doc.setDrawColor(180, 180, 180);
    doc.rect(15, y - 4, 180, ((pending.length + 1) * 7) + 7);
    doc.line(15, y + 3, 195, y + 3);
    doc.line(68, y - 4, 68, y - 4 + (pending.length * 7) + 7);
    doc.line(93, y - 4, 93, y - 4 + (pending.length * 7) + 7);
    doc.line(153, y - 4, 153, y - 4 + (pending.length * 7) + 7);

    y += 7;
    doc.setFont("helvetica", "normal");
    pending.forEach((res) => {
      checkPage(7);
      doc.text((res.fullName || '').substring(0, 25), 17, y);
      doc.text((res.roomNumber || '-'), 70, y);
      doc.text((res.email || '').substring(0, 30), 95, y);
      doc.text(formatDateTime(res.updateAt), 155, y);
      doc.line(15, y + 1.5, 195, y + 1.5);
      y += 7;
    });

    doc.setFont("helvetica", "bold");
    doc.text("Total pending accounts", 17, y);
    doc.text(pending.length.toString(), 155, y);
    y += 12;
  }

  // 2.4 Resident Ranking
  if (topRes && topRes.length > 0) {
    drawSubHeader("Resident Ranking (Top Leaders by Volume)");
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 4, 180, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("RANK", 17, y + 1); 
    doc.text("NAME", 37, y + 1); 
    doc.text("ROOM NO.", 102, y + 1); 
    doc.text("PARCELS", 162, y + 1);
    
    doc.setDrawColor(180, 180, 180);
    doc.rect(15, y - 4, 180, ((topRes.length + 1) * 7) + 7);
    doc.line(15, y + 3, 195, y + 3);
    doc.line(33, y - 4, 33, y - 4 + (topRes.length * 7) + 7);
    doc.line(100, y - 4, 100, y - 4 + (topRes.length * 7) + 7);
    doc.line(160, y - 4, 160, y - 4 + (topRes.length * 7) + 7);

    y += 7;
    doc.setFont("helvetica", "normal");
    let totalTop = 0;
    topRes.forEach((res, i) => {
      checkPage(7);
      totalTop += parseInt(res.parcelCount || res.count || 0);
      doc.text((i + 1).toString(), 22, y, { align: 'center' });
      doc.text((res.fullName || res.name || '').substring(0, 25), 37, y);
      doc.text((res.room || res.roomNumber || '-'), 130, y, { align: 'right' });
      doc.text((res.parcelCount || res.count || 0).toString(), 190, y, { align: 'right' });
      doc.line(15, y + 1.5, 195, y + 1.5);
      y += 7;
    });

    doc.setFont("helvetica", "bold");
    doc.text("Total parcels (Top Leaders)", 17, y);
    doc.text(totalTop.toString(), 190, y, { align: 'right' });
  }

  doc.save(`Dormitory_Summary_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

const handlePrintSummary = () => {
  window.print();
};

defineExpose({
  handleExportExcel,
  handleExportPDF,
  handlePrintSummary
});
</script>

<template>
  <div class="print-report">
    <!-- 
      TABLE HACK: Used to force margins on every page when @page { margin: 0 } is used. 
      thead and tfoot will repeat on each page, creating a visual margin.
    -->
    <table class="report-table-wrapper">
      <thead>
        <tr><td><div class="report-page-margin-top"></div></td></tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="print-header">
              <h1>Dormitory Management System - Summary Report</h1>
              <p class="text-gray-600">Report Issue Date: {{ displayDate }}</p>
            </div>

            <!-- --- PERFORMANCE SUMMARY SECTION --- -->
            <div v-if="businessInsights" class="print-section">
              <h2 class="print-main-header">Summary of performance as of {{ displayDate }}</h2>
              
              <div class="kpi-grid">
                <div class="kpi-card">
                  <span class="kpi-label">Clearing efficiency</span>
                  <span class="kpi-value">{{ businessInsights.pickupRate }}%</span>
                  <span class="kpi-sublabel">Yearly pickup performance</span>
                </div>
                <div class="kpi-card">
                  <span class="kpi-label">Overdue ratio</span>
                  <span class="kpi-value">{{ businessInsights.overdueRate }}%</span>
                  <span class="kpi-sublabel">Yearly overdue percentage</span>
                </div>
                <div class="kpi-card">
                  <span class="kpi-label">Staff load</span>
                  <span class="kpi-value">{{ businessInsights.staffBacklogRate }}%</span>
                  <span class="kpi-sublabel">Yearly intake backlog avg</span>
                </div>
                <div class="kpi-card">
                  <span class="kpi-label">Resident verification</span>
                  <span class="kpi-value">{{ businessInsights.verificationRate }}%</span>
                  <span class="kpi-sublabel">Yearly verification health</span>
                </div>
              </div>

              <div class="insights-box mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 class="font-bold text-gray-800 mb-2">Yearly Operational Analytics:</h4>
                <ul class="list-disc pl-5 space-y-1">
                  <li v-if="businessInsights.insights.length === 0" class="text-gray-600 text-sm">Annual operation is flowing normally.</li>
                  <li v-for="(msg, i) in businessInsights.insights" :key="i" class="text-sm text-gray-700 font-medium">
                    {{ msg }}
                  </li>
                  <li class="text-sm text-gray-600">Current annual state: {{ businessInsights.healthStatus }}</li>
                </ul>
              </div>
            </div>

            <!-- --- SECTION 1: PARCEL MANAGEMENT OVERVIEW --- -->
            <div class="print-section">
              <h2 class="print-main-header">1. Parcel Management Overview (Daily Activity)</h2>
              
              <h3 class="print-section-title">Daily Statistics (Parcels)</h3>
              <table class="print-table">
                <thead>
                  <tr>
                    <th>Daily Status (Activity)</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Received</td>
                    <td>{{ dailyStats.received }}</td>
                  </tr>
                  <tr>
                    <td>Picked Up</td>
                    <td>{{ dailyStats.pickedUp }}</td>
                  </tr>
                  <tr>
                    <td>Overdue</td>
                    <td>{{ filteredOverdue.length }}</td>
                  </tr>
                  <!-- TOTAL ROW -->
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td>Total</td>
                    <td>{{ dynamicStats.total }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <template v-if="parcelHistory.length > 0">
              <div class="print-section" v-for="yData in parcelHistory" :key="'parcel-' + yData.year">
                <h3 class="print-section-title">Historical Monthly Summary (Parcels) - Year {{ yData.year }}</h3>
                <table class="print-table">
                  <thead>
                    <tr>
                      <th>Month (MM/YYYY)</th>
                      <th>Total Received</th>
                      <th>Total Picked Up</th>
                      <th>Total Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="h in yData.months" :key="h.monthStr">
                      <td>{{ h.monthStr }}</td>
                      <td>{{ h.received }}</td>
                      <td>{{ h.pickedUp }}</td>
                      <td>{{ h.overdue }}</td>
                    </tr>
                    <!-- TOTAL ROW -->
                    <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                      <td>Total</td>
                      <td>{{ yData.totalReceived }}</td>
                      <td>{{ yData.totalPickedUp }}</td>
                      <td>{{ yData.totalOverdue }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <div class="print-section" v-if="parcels.length > 0">
              <h3 class="print-section-title">Recent Parcels (Latest Activity)</h3>
              <table class="print-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Resident</th>
                    <th>Tracking No.</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="parcel in filteredParcels.slice(0, 10)" :key="parcel.id">
                    <td>{{ formatDate(parcel.updatedAt) }}</td>
                    <td>{{ parcel.residentName }}</td>
                    <td>
                      <div>{{ parcel.trackingNumber }}</div>
                      <div v-if="parcel.statusHistory && parcel.statusHistory.length > 0" class="text-[10px] text-gray-400 mt-1">
                        History: <span v-for="(h, i) in parcel.statusHistory" :key="i">
                          {{ h.status }} ({{ formatDate(h.updatedAt) }})<span v-if="i < parcel.statusHistory.length - 1"> → </span>
                        </span>
                      </div>
                    </td>
                    <td>{{ parcel.currentStatus || parcel.status }}</td>
                  </tr>
                  <!-- TOTAL ROW -->
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td colspan="3">Total recent parcels</td>
                    <td>{{ filteredParcels.slice(0, 10).length }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="print-section" v-if="filteredOverdue.length > 0">
              <h3 class="print-section-title">Overdue Parcels (> 1 Day)</h3>
              <table class="print-table">
                <thead>
                  <tr>
                    <th>Received At</th>
                    <th>Resident</th>
                    <th>Tracking No.</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="parcel in filteredOverdue" :key="parcel.id">
                    <td>{{ formatDate(parcel.receiveAt || parcel.createdAt) }}</td>
                    <td>{{ parcel.residentName }}</td>
                    <td>{{ parcel.trackingNumber }}</td>
                    <td>{{ parcel.currentStatus || parcel.status }}</td>
                  </tr>
                  <!-- TOTAL ROW -->
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td colspan="3">Total overdue parcels</td>
                    <td>{{ filteredOverdue.length }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- --- SECTION 2: RESIDENT MANAGEMENT OVERVIEW --- -->
            <div class="print-section">
              <h2 class="print-main-header">2. Resident Management Overview (Daily Activity)</h2>
              
              <h3 class="print-section-title">Daily Statistics (Residents)</h3>
              <table class="print-table">
                <thead>
                  <tr>
                    <th>Daily Status (Activity)</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Joined</td>
                    <td>{{ dailyStats.joined }}</td>
                  </tr>
                  <tr>
                    <td>Verified</td>
                    <td>{{ dailyStats.verified }}</td>
                  </tr>
                  <tr>
                    <td>Total Active Members</td>
                    <td>{{ dynamicStats.activeResidents }}</td>
                  </tr>
                  <!-- TOTAL ROW -->
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td>Total registered</td>
                    <td>{{ dynamicStats.activeResidents + dynamicStats.pendingResidents + dynamicStats.inactiveResidents }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <template v-if="residentHistory.length > 0">
              <div class="print-section" v-for="yData in residentHistory" :key="'resident-' + yData.year">
                <h3 class="print-section-title">Historical Monthly Summary (Residents) - Year {{ yData.year }}</h3>
                <table class="print-table">
                  <thead>
                    <tr>
                      <th>Month (MM/YYYY)</th>
                      <th>Total Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="h in yData.months" :key="h.monthStr">
                      <td>{{ h.monthStr }}</td>
                      <td>{{ h.joined }}</td>
                    </tr>
                    <!-- TOTAL ROW -->
                    <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                      <td>Total</td>
                      <td>{{ yData.totalJoined }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <div class="print-section" v-if="filteredPendingResidents.length > 0">
              <h3 class="print-section-title">Pending Accounts (Awaiting Verification)</h3>
              <table class="print-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Room No.</th>
                    <th>Email</th>
                    <th>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="res in filteredPendingResidents" :key="res.id">
                    <td>{{ res.fullName }}</td>
                    <td>{{ res.roomNumber }}</td>
                    <td>{{ res.email }}</td>
                    <td>{{ formatDateTime(res.updateAt) }}</td>
                  </tr>
                  <!-- TOTAL ROW -->
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td colspan="3">Total pending accounts</td>
                    <td>{{ filteredPendingResidents.length }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="print-section" v-if="topResidents.length > 0">
              <h3 class="print-section-title">Resident Ranking (Top Leaders by Volume)</h3>
              <table class="print-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Room</th>
                    <th>Parcels</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(res, idx) in topResidents" :key="idx">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ res.fullName || res.name }}</td>
                    <td>{{ res.room || res.roomNumber || '-' }}</td>
                    <td>{{ res.parcelCount || res.count }}</td>
                  </tr>
                  <!-- TOTAL ROW -->
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td colspan="3">Total parcels (Top Leaders)</td>
                    <td>{{ topResidents.reduce((sum, r) => sum + parseInt(r.parcelCount || r.count || 0), 0) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr><td><div class="report-page-margin-bottom"></div></td></tr>
      </tfoot>
    </table>
  </div>
</template>

<style>
/* Global @page rule to hide browser headers/footers */
@page {
  margin: 0;
}

@media print {
  /* Hides browser headers but table logic below manages the fake margins */
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  .report-table-wrapper {
    width: 100% !important;
    border: none !important;
  }

  .report-page-margin-top {
    height: 1.5cm; /* THIS CREATES THE TOP MARGIN ON EVERY PAGE */
  }

  .report-page-margin-bottom {
    height: 1cm; /* THIS CREATES THE BOTTOM MARGIN ON EVERY PAGE */
  }
  /* Critical cleanup: Hide all UI elements outside the print report */
  .no-print,
  aside, 
  header, 
  nav,
  button,
  .fixed,
  .activity-filters,
  #app > div > aside,
  #app > div > header,
  .alert-popup-overlay {
    display: none !important;
  }

  /* Reset body and main containers for clean printing */
  html, body {
    height: auto !important;
    overflow: visible !important;
    background-color: white !important;
  }

  .min-h-screen {
    padding: 0 !important;
    margin: 0 !important;
    background-color: white !important;
    width: 100% !important;
    display: block !important;
    position: static !important;
  }

  /* Force the report to show during print */
  .print-report {
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 1cm !important; /* Internal buffer */
    background-color: white !important;
    counter-reset: section;
  }

  .print-header {
    display: block !important;
    text-align: center;
    border-bottom: 2px solid #1D355E;
    padding-bottom: 1.5rem;
    margin-bottom: 2.5rem;
  }

  .print-header h1 {
    font-size: 28px !important;
    font-weight: 800 !important;
    color: #1D355E !important;
    margin: 0 0 0.5rem 0 !important;
  }

  .print-header p {
    font-size: 14px !important;
    color: #4b5563 !important;
  }

  .print-section {
    margin-bottom: 2.5rem;
    page-break-inside: avoid;
    width: 100% !important;
  }

  .print-main-header {
    display: block !important;
    font-size: 22px !important;
    font-weight: 800 !important;
    color: white !important;
    background-color: #1D355E !important;
    padding: 10px 15px !important;
    margin-bottom: 1.5rem !important;
    text-align: center !important;
  }

  .print-section-title {
    display: block !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    color: #1D355E !important;
    margin-bottom: 1rem !important;
    border-left: 4px solid #1D355E !important;
    padding-left: 0.75rem !important;
  }

  .print-section-title::before {
    counter-increment: section;
    content: counter(section) ". ";
  }

  .print-table {
    width: 100% !important;
    border-collapse: collapse !important;
    border: 1px solid #e5e7eb !important;
  }

  .print-table th {
    background-color: #f9fafb !important;
    color: #374151 !important;
    font-weight: 700 !important;
    font-size: 14px !important;
    border: 1px solid #e5e7eb !important;
    padding: 12px 16px !important;
    text-align: left !important;
  }

  .print-table td {
    border: 1px solid #e5e7eb !important;
    padding: 12px 16px !important;
    font-size: 14px !important;
    color: #1f2937 !important;
    vertical-align: middle !important;
  }

  .print-table tr:nth-child(even) {
    background-color: #fbfcfd !important;
  }

  .font-bold {
    font-weight: 700 !important;
    color: #111827 !important;
  }

  /* Color adjustments for print quality */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}

/* Hide report on screen */
@media screen {
  .print-report, .print-header {
    display: none !important;
  }
}

.kpi-grid {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 15px !important;
  margin-top: 20px !important;
}

.kpi-card {
  padding: 15px !important;
  border: 1px solid #e2e8f0 !important;
  background-color: #fff !important;
  text-align: center !important;
  border-radius: 8px !important;
}

.kpi-label {
  display: block !important;
  font-size: 11px !important;
  color: #64748b !important;
  margin-bottom: 5px !important;
}

.kpi-value {
  display: block !important;
  font-size: 22px !important;
  font-weight: 800 !important;
  color: #1e293b !important;
}

.kpi-sublabel {
  display: block !important;
  font-size: 10px !important;
  color: #94a3b8 !important;
  margin-top: 4px !important;
}
</style>
