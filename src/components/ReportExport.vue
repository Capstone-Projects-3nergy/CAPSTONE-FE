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
  },
  endDate: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'daily'
  }
})

const displayDate = computed(() => {
  if (props.mode === 'daily') {
    const d = new Date(props.selectedDate || new Date());
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (props.mode === 'range') {
    const d1 = new Date(props.selectedDate);
    const d2 = new Date(props.endDate);
    return `${d1.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${d2.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  if (props.mode === 'weekly') {
    const { start, end } = dateRange.value;
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  if (props.mode === 'monthly') {
    const [year, month] = props.selectedDate.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  return props.selectedDate;
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

const dateRange = computed(() => {
  const parse = (s) => {
    if (!s) return new Date();
    const parts = s.split('-');
    if (parts.length === 3) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (parts.length === 2) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return new Date(s);
  };

  let start = parse(props.selectedDate);
  let end = parse(props.endDate || props.selectedDate);

  if (props.mode === 'daily') {
    start = parse(props.selectedDate);
    end = parse(props.selectedDate);
  } else if (props.mode === 'weekly') {
    const [year, week] = props.selectedDate.split('-W').map(Number);
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    start = new Date(simple);
    if (dow <= 4) start.setDate(simple.getDate() - simple.getDay() + 1);
    else start.setDate(simple.getDate() + 8 - simple.getDay());
    
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else if (props.mode === 'monthly') {
    const [year, month] = props.selectedDate.split('-').map(Number);
    start = new Date(year, month - 1, 1);
    end = new Date(year, month, 0);
  }

  start.setHours(0, 0, 0, 0);
  
  const now = new Date();
  const compareEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const compareToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (compareEnd >= compareToday) {
    end = now;
  } else {
    end.setHours(23, 59, 59, 999);
  }
  
  return { start, end };
})

const snapshotDate = computed(() => dateRange.value.end)

const getStatusAtDate = (parcel, date) => {
  const arrivalDate = new Date(parcel.receiveAt || parcel.createdAt || parcel.date);
  if (arrivalDate > date) return null;

  if (parcel.statusHistory && Array.isArray(parcel.statusHistory) && parcel.statusHistory.length > 0) {
    const validHistory = parcel.statusHistory
      .map(h => ({ ...h, ts: new Date(h.timestamp || h.updatedAt || h.createdAt || h.date) }))
      .filter(h => h.ts <= date)
      .sort((a, b) => b.ts - a.ts);

    if (validHistory.length > 0) return validHistory[0].status;
  }

  const currentStatus = (parcel.status || '').toUpperCase().replace(/_/g, ' ');
  
  if (currentStatus.includes('PICKED UP') || currentStatus.includes('TAKEN')) {
    const pickupDate = new Date(parcel.pickedUpAt || parcel.updatedAt);
    if (pickupDate > date) {
      const verifiedDate = new Date(parcel.updatedAt);
      if (verifiedDate > date) {
         return 'WAITING FOR STAFF';
      }
      return 'WAITING';
    }
    return 'PICKED UP';
  }

  if (currentStatus.includes('OVERDUE')) {
    return 'OVERDUE';
  }

  if (currentStatus === 'WAITING' || currentStatus === 'RECEIVED' || currentStatus.includes('NOTIFIED')) {
    const verifiedDate = new Date(parcel.updatedAt);
    if (verifiedDate > date) {
      return 'WAITING FOR STAFF';
    }
    return 'WAITING';
  }
  
  if (currentStatus.includes('STAFF') || currentStatus.includes('PENDING')) {
    return 'WAITING FOR STAFF';
  }
  
  return parcel.status || 'WAITING';
}



const yearlyStats = computed(() => {
  const endLimit = snapshotDate.value;
  const year = endLimit.getFullYear();
  const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);

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
        
        if (p.statusHistory) {
          const waitingEvent = p.statusHistory.find(h => ['RECEIVED', 'WAITING', 'WAIT'].includes(h.status?.toUpperCase()));
          const pickupEvent = p.statusHistory.find(h => {
            const st = (h.status || '').toUpperCase().replace(/_/g, ' ');
            const ts = new Date(h.timestamp || h.updatedAt || h.createdAt || h.date);
            return (st.includes('PICKED UP') || st.includes('TAKEN')) && ts <= endLimit;
          });

          if (waitingEvent && pickupEvent) {
            const start = new Date(waitingEvent.timestamp || waitingEvent.updatedAt);
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
      } else if (s.includes('OVERDUE')) {
        res.overdue++;
      } else {
        res.awaiting++;
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

const dynamicStats = computed(() => {
  const { start, end } = dateRange.value;
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

  props.parcels.forEach(p => {
    const arrivalDate = new Date(p.receiveAt || p.createdAt || p.date);
    const updateDate = new Date(p.updatedAt || p.updateAt);
    const currentStatus = (p.status || '').toUpperCase().replace(/[\s_-]/g, '');
    
    const isArrivalInRange = !isNaN(arrivalDate.getTime()) && arrivalDate >= start && arrivalDate <= end;
    const isUpdateInRange = !isNaN(updateDate.getTime()) && updateDate >= start && updateDate <= end;
    
    const history = p.statusHistory || [];
    const hasStatusInRange = (keywords) => history.some(h => {
      const s = (h.status || '').toUpperCase().replace(/[\s_-]/g, '');
      const d = new Date(h.timestamp || h.updatedAt || h.createdAt);
      return !isNaN(d.getTime()) && d >= start && d <= end && keywords.some(kw => s.includes(kw));
    });

    const isPickedUpInRange = hasStatusInRange(['PICKEDUP', 'TAKEN']) || 
                             ((currentStatus === 'PICKEDUP' || currentStatus === 'TAKEN') && isUpdateInRange);
    if (isPickedUpInRange) result.pickedUp++;
    const isStaffInRange = hasStatusInRange(['STAFF', 'PENDING']) ||
                          ((currentStatus.includes('STAFF') || currentStatus.includes('PENDING')) && isArrivalInRange);
    if (isStaffInRange) result.waitingForStaff++;

    const isWaitingInRange = (currentStatus === 'WAITING' || currentStatus === 'RECEIVED' || currentStatus === 'WAIT' || currentStatus.includes('NOTIFIED')) && 
                             !currentStatus.includes('STAFF') && isArrivalInRange && !currentStatus.includes('OVERDUE');
    if (isWaitingInRange) result.awaiting++;

    const isOverdueInRange = hasStatusInRange(['OVERDUE']) || (currentStatus.includes('OVERDUE') && isUpdateInRange);
    if (isOverdueInRange) result.overdue++;

    if (isArrivalInRange || isUpdateInRange || isPickedUpInRange || isStaffInRange || isOverdueInRange) {
      result.total++;
    }
  });

  props.members.forEach(m => {
    const joinDate = new Date(m.createdAt || m.updateAt);
    if (joinDate > end) return;

    const role = (m.role || m.Role || '').toUpperCase();
    if (role !== 'RESIDENT') return;

    const s = (m.status || '').toUpperCase();
    if (s === 'PENDING') {
      result.pendingResidents++;
    } else if (s === 'INACTIVE') {
      result.inactiveResidents++;
    } else {
      result.activeResidents++;
    }
  });

  return result;
});

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
  
  return props.parcels.filter(p => {
    const arrivalDate = new Date(p.receiveAt || p.createdAt || p.date);
    if (isNaN(arrivalDate.getTime()) || arrivalDate > date) return false;

   
    const statusAtDate = getStatusAtDate(p, date);
    if (!statusAtDate) return false;

    const s = statusAtDate.toUpperCase().replace(/[\s_-]/g, '');
    const isOverdueAtDate = s.includes('OVERDUE');

    return isOverdueAtDate;
  });
});

const filteredPendingResidents = computed(() => {
  const { end } = dateRange.value;
  return props.pendingResidents.filter(r => new Date(r.createdAt || r.updateAt) <= end);
});

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
        totalWaiting: 0, 
        totalPickedUp: 0, 
        totalOverdue: 0, 
        totalStaff: 0,
        months: {} 
      };
    }
    if (!groups[year].months[month]) {
      groups[year].months[month] = { 
        month: month, 
        monthStr: `${month.toString().padStart(2, '0')}/${year}`, 
        waiting: 0, 
        pickedUp: 0, 
        overdue: 0,
        staff: 0
      };
    }

    if (type === 'waiting') {
      groups[year].months[month].waiting++;
      groups[year].totalWaiting++;
    } else if (type === 'pickedUp') {
      groups[year].months[month].pickedUp++;
      groups[year].totalPickedUp++;
    } else if (type === 'overdue') {
      groups[year].months[month].overdue++;
      groups[year].totalOverdue++;
    } else if (type === 'staff') {
      groups[year].months[month].staff++;
      groups[year].totalStaff++;
    }
  };

  props.parcels.forEach(p => {
    const arrivalDate = new Date(p.receiveAt || p.createdAt || p.date);
    if (!isNaN(arrivalDate.getTime()) && arrivalDate <= limitDate) {
      addEvent(arrivalDate, 'waiting');
    }

    let pDate = null;
    if (p.statusHistory && Array.isArray(p.statusHistory)) {
      const pickupEvent = p.statusHistory.find(h => {
        const s = (h.status || '').toUpperCase().replace(/_/g, ' ');
        return s.includes('PICKED UP') || s.includes('TAKEN');
      });
      if (pickupEvent) {
        pDate = new Date(pickupEvent.timestamp || pickupEvent.updatedAt || pickupEvent.createdAt || pickupEvent.date);
      }
    }
    
    if (!pDate) {
      const s = (p.status || '').toUpperCase().replace(/_/g, ' ');
      if (s.includes('PICKED UP') || s.includes('TAKEN')) {
        pDate = new Date(p.pickedUpAt || p.updatedAt);
      }
    }

    if (pDate && !isNaN(pDate.getTime()) && pDate <= limitDate) {
      addEvent(pDate, 'pickedUp');
    }
    const becomesOverdueAt = null; // We no longer auto-calculate overdue time in history
    
    if (p.statusHistory && Array.isArray(p.statusHistory)) {
      p.statusHistory.forEach(h => {
        const s = (h.status || '').toUpperCase().replace(/[\s_-]/g, '');
        if (s.includes('OVERDUE')) {
          const oDate = new Date(h.timestamp || h.updatedAt || h.createdAt);
          if (oDate <= limitDate) addEvent(oDate, 'overdue');
        }
      });
    } else {
      const s = (p.status || '').toUpperCase().replace(/[\s_-]/g, '');
      if (s.includes('OVERDUE')) {
        const oDate = new Date(p.updatedAt || p.updateAt);
        if (oDate <= limitDate) addEvent(oDate, 'overdue');
      }
    }

   
    const currentStatus = (p.status || '').toUpperCase().replace(/[\s_-]/g, '');
    let staffDate = null;
    if (p.statusHistory && Array.isArray(p.statusHistory)) {
      const staffEvent = p.statusHistory.find(h => {
        const s = (h.status || '').toUpperCase().replace(/[\s_-]/g, '');
        return s.includes('STAFF') || s.includes('PENDING');
      });
      if (staffEvent) {
        staffDate = new Date(staffEvent.timestamp || staffEvent.updatedAt || staffEvent.createdAt);
      }
    }
    if (!staffDate && (currentStatus.includes('STAFF') || currentStatus.includes('PENDING'))) {
      staffDate = arrivalDate;
    }

    if (staffDate && !isNaN(staffDate.getTime()) && staffDate <= limitDate) {
      addEvent(staffDate, 'staff');
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
  
  const yearStr = snapshotDate.value.getFullYear();

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

const handleExportExcel = () => {
  const stats = dailyStats.value;
  const snapshot = dynamicStats.value;
  const overdueList = filteredOverdue.value;
  const pending = filteredPendingResidents.value;
  const topRes = props.topResidents;
  const recentParcels = filteredParcels.value.slice(0, 10);

  const finalData = [
    ['Dormitory Management System - Summary Report'],
    ['Reporting Period:', displayDate.value],
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

  finalData.push([`${mainSection}. Parcel Management Overview`]);
  finalData.push(['Parcel Statistics', 'Status', 'Amount']);
  finalData.push(['', 'Waiting', snapshot.awaiting]);
  finalData.push(['', 'Waiting for Staff', snapshot.waitingForStaff]);
  finalData.push(['', 'Picked Up', snapshot.pickedUp]);
  finalData.push(['', 'Overdue', snapshot.overdue]);
  finalData.push(['', 'Total Activity', snapshot.total]);
  finalData.push([]);

  if (parcelHistory.value.length > 0) {
    parcelHistory.value.forEach(yData => {
      finalData.push([`Historical Monthly Summary (Parcels) - Year ${yData.year}`]);
      finalData.push(['Month (MM/YYYY)', 'Total Waiting', 'Waiting for Staff', 'Total Picked Up', 'Total Overdue']);
      yData.months.forEach(h => {
        finalData.push([h.monthStr, h.waiting, h.staff, h.pickedUp, h.overdue]);
      });
      finalData.push(['Total', yData.totalWaiting, yData.totalStaff, yData.totalPickedUp, yData.totalOverdue]);
      finalData.push([]);
    });
  }

  if (recentParcels.length > 0) {
    finalData.push(['Recent Parcels (Latest Activity)']);
    finalData.push(['Date', 'Resident', 'Tracking No.', 'Status']);
    recentParcels.forEach(p => {
      finalData.push([formatDate(p.updatedAt), p.residentName, p.trackingNumber, (p.currentStatus || p.status)?.replace('RECEIVED', 'WAITING')]);
    });
    finalData.push(['Total recent parcels', '', '', recentParcels.length]);
    finalData.push([]);
  }

  if (overdueList.length > 0) {
    finalData.push(['Overdue Parcels (> 1 Day)']);
    finalData.push(['Waiting At', 'Resident', 'Tracking No.', 'Status']);
    overdueList.forEach(p => {
      finalData.push([formatDate(p.receiveAt || p.createdAt), p.residentName, p.trackingNumber, (p.currentStatus || p.status)?.replace('RECEIVED', 'WAITING')]);
    });
    finalData.push(['Total overdue parcels', '', '', overdueList.length]);
    finalData.push([]);
  }

  mainSection++;

  finalData.push([`${mainSection}. Resident Management Overview`]);
  finalData.push(['Residents Statistics', 'Status', 'Amount']);
  finalData.push(['', 'Active', snapshot.activeResidents]);
  finalData.push(['', 'Pending', snapshot.pendingResidents]);
  finalData.push(['', 'Inactive', snapshot.inactiveResidents]);
  finalData.push(['', 'Total Registered', snapshot.activeResidents + snapshot.pendingResidents + snapshot.inactiveResidents]);
  finalData.push([]);

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
  const sanitizedDate = displayDate.value.replace(/ /g, '_').replace(/\//g, '-');
  XLSX.writeFile(wb, `Dormitory_Dashboard_${sanitizedDate}.xlsx`);
};

const handleExportPDF = () => {
  const doc = new jsPDF();
  const snapshot = dynamicStats.value;
  const overdueList = filteredOverdue.value;
  const pending = filteredPendingResidents.value;
  const topRes = props.topResidents;
  const recentParcels = filteredParcels.value.slice(0, 10);
  const brandColor = [29, 53, 94]; 
  const textColor = [31, 41, 55];
  const mutedColor = [100, 100, 100];
  const lightGray = [249, 250, 251];
  const borderGray = [229, 231, 235];

  let y = 20;

  const checkPage = (heightNeeded) => {
    if (y + heightNeeded > 275) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  const drawMainCategoryHeader = (text, forceNewPage = false) => {
    if (forceNewPage) {
      doc.addPage();
      y = 20;
    } else {
      checkPage(25);
    }
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.rect(15, y - 6, 180, 10, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(text.toUpperCase(), 105, y + 0.5, { align: 'center' });
    y += 14;
    doc.setTextColor(0, 0, 0);
  };

  const drawSubHeader = (text) => {
    checkPage(15);
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.rect(15, y - 4, 1.5, 5.5, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(text, 18, y);
    y += 8;
    doc.setTextColor(0, 0, 0);
  };

  const drawTable = (headers, data, columnWidths, hasTotal = false) => {
    const rowHeight = 8;
    const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
    
    checkPage(rowHeight * 2);
    doc.setFillColor(243, 244, 246);
    doc.rect(15, y - 5, tableWidth, rowHeight, 'F');
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.rect(15, y - 5, tableWidth, rowHeight, 'D');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    let currentX = 15;
    headers.forEach((h, i) => {
      const align = (i === headers.length - 1 && i !== 0) ? 'right' : 'left';
      const textX = align === 'right' ? currentX + columnWidths[i] - 3 : currentX + 3;
      doc.text(h, textX, y, { align });
      if (i < headers.length - 1) {
        doc.line(currentX + columnWidths[i], y - 5, currentX + columnWidths[i], y + 3);
      }
      currentX += columnWidths[i];
    });
    
    y += rowHeight;

    doc.setFont("helvetica", "normal");
    data.forEach((row, rowIndex) => {
      checkPage(rowHeight);
      const isTotalRow = hasTotal && rowIndex === data.length - 1;

      if (isTotalRow) {
        doc.setFillColor(243, 244, 246); 
        doc.rect(15, y - 5, tableWidth, rowHeight, 'F');
        doc.setFont("helvetica", "bold");
      } else if (rowIndex % 2 === 1) {
        doc.setFillColor(251, 252, 253);
        doc.rect(15, y - 5, tableWidth, rowHeight, 'F');
      }

      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.rect(15, y - 5, tableWidth, rowHeight, 'D');

      let rowX = 15;
      row.forEach((cell, i) => {
        const align = (i === headers.length - 1 && i !== 0) ? 'right' : 'left';
        const textX = align === 'right' ? rowX + columnWidths[i] - 3 : rowX + 3;
        const cellValue = (cell === null || cell === undefined || cell === '') ? '' : String(cell);
        doc.text(cellValue, textX, y, { align });
        
        const nextCell = row[i+1];
        const nextHasValue = nextCell !== null && nextCell !== undefined && nextCell !== '';
        const shouldShowDivider = isTotalRow ? nextHasValue : (i < headers.length - 1);
        
        if (shouldShowDivider && i < headers.length - 1) {
          doc.line(rowX + columnWidths[i], y - 5, rowX + columnWidths[i], y + 3);
        }
        rowX += columnWidths[i];
      });
      y += rowHeight;
      if (isTotalRow) doc.setFont("helvetica", "normal");
    });

    y += 4;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text("Dormitory Management System - Summary Report", 105, y, { align: 'center' });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(`Reporting Period: ${displayDate.value}`, 105, y, { align: 'center' });
  y += 6;
  doc.setDrawColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 15;

  const insights = businessInsights.value;
  if (insights) {
    drawMainCategoryHeader(`Summary of performance as of ${insights.dateLabel}`);
    
    const boxW = 43;
    const boxH = 22;
    const gap = 3;
    let startX = 15;

    const drawKPIBox = (label, value, subLabel, x, py) => {
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.rect(x, py, boxW, boxH, 'FD');
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(label, x + boxW/2, py + 6, { align: 'center' });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text(value, x + boxW/2, py + 13, { align: 'center' });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(subLabel, x + boxW/2, py + 18, { align: 'center' });
    };

    drawKPIBox("Clearing efficiency", insights.pickupRate + "%", "Yearly pickup performance", startX, y);
    drawKPIBox("Overdue ratio", insights.overdueRate + "%", "Yearly overdue percentage", startX + boxW + gap, y);
    drawKPIBox("Staff load", insights.staffBacklogRate + "%", "Yearly intake backlog avg", startX + (boxW + gap)*2, y);
    drawKPIBox("Resident verification", insights.verificationRate + "%", "Yearly verification health", startX + (boxW + gap)*3, y);
    y += boxH + 10;

    doc.setFillColor(249, 250, 251); 
    doc.setDrawColor(229, 231, 235);
    doc.rect(15, y, 180, 25, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    doc.text("Yearly Operational Analytics:", 20, y + 7);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    if (insights.insights.length > 0) {
      insights.insights.forEach(msg => {
        doc.text("• " + msg, 20, y);
        y += 4.5;
      });
    } else {
      doc.text("• Annual operation is flowing normally.", 20, y);
      y += 4.5;
    }
    doc.setFont("helvetica", "bold");
    doc.text(`Current annual state: ${insights.healthStatus}`, 20, y);
    y += 12;
  }

  drawMainCategoryHeader("1. Parcel Management Overview", true);
  drawSubHeader("1. Parcel Statistics");
  drawTable(
    ['Status', 'Amount'],
    [
      ['Waiting', snapshot.awaiting],
      ['Waiting for Staff', snapshot.waitingForStaff],
      ['Picked Up', snapshot.pickedUp],
      ['Overdue', snapshot.overdue],
      ['Total Activity', snapshot.total]
    ],
    [130, 50],
    true
  );

  if (parcelHistory.value.length > 0) {
    parcelHistory.value.forEach((yData) => {
      drawSubHeader(`2. Historical Monthly Summary (Parcels) - Year ${yData.year}`);
      const hData = yData.months.map(h => [h.monthStr, h.waiting, h.staff, h.pickedUp, h.overdue]);
      hData.push(['Total', yData.totalWaiting, yData.totalStaff, yData.totalPickedUp, yData.totalOverdue]);
      drawTable(
        ['Month (MM/YYYY)', 'Total Waiting', 'Waiting for Staff', 'Total Picked Up', 'Total Overdue'],
        hData,
        [45, 30, 35, 35, 35],
        true
      );
    });
  }

  if (recentParcels.length > 0) {
    drawSubHeader("3. Recent Parcels (Latest Activity)");
    const rData = recentParcels.map(p => [
      formatDate(p.updatedAt), 
      (p.residentName || '').substring(0, 20), 
      p.trackingNumber, 
      (p.currentStatus || p.status || '').replace('RECEIVED', 'WAITING')
    ]);
    rData.push(['Total recent parcels', '', '', recentParcels.length]);
    drawTable(
      ['Date', 'Resident', 'Tracking No.', 'Status'],
      rData,
      [35, 50, 55, 40],
      true
    );
  }

  if (overdueList.length > 0) {
    drawSubHeader("4. Overdue Parcels (> 1 Day)");
    const oData = overdueList.map(p => [
      formatDate(p.receiveAt || p.createdAt), 
      (p.residentName || '').substring(0, 20), 
      p.trackingNumber, 
      (p.currentStatus || p.status || '').replace('RECEIVED', 'WAITING')
    ]);
    oData.push(['Total overdue parcels', '', '', overdueList.length]);
    drawTable(
      ['Waiting At', 'Resident', 'Tracking No.', 'Status'],
      oData,
      [35, 50, 55, 40],
      true
    );
  }

  drawMainCategoryHeader("2. Resident Management Overview", true);
  drawSubHeader("1. Residents Statistics");
  drawTable(
    ['Status', 'Amount'],
    [
      ['Active', snapshot.activeResidents],
      ['Pending', snapshot.pendingResidents],
      ['Inactive', snapshot.inactiveResidents],
      ['Total Registered', (snapshot.activeResidents + snapshot.pendingResidents + snapshot.inactiveResidents)]
    ],
    [130, 50],
    true
  );

  if (residentHistory.value.length > 0) {
    residentHistory.value.forEach((yData) => {
      drawSubHeader(`2. Historical Monthly Summary (Residents) - Year ${yData.year}`);
      const rhData = yData.months.map(h => [h.monthStr, h.joined]);
      rhData.push(['Total', yData.totalJoined]);
      drawTable(
        ['Month (MM/YYYY)', 'Total Registered'],
        rhData,
        [130, 50],
        true
      );
    });
  }

  if (pending && pending.length > 0) {
    drawSubHeader("3. Pending Accounts (Awaiting Verification)");
    const pData = pending.map(res => [
      (res.fullName || '').substring(0, 25), 
      (res.roomNumber || '-'), 
      (res.email || '').substring(0, 25), 
      formatDateTime(res.updateAt)
    ]);
    pData.push(['Total pending accounts', '', '', pending.length]);
    drawTable(
      ['Name', 'Room', 'Email', 'Updated At'],
      pData,
      [50, 30, 60, 40],
      true
    );
  }

  if (topRes && topRes.length > 0) {
    drawSubHeader("4. Resident Ranking (Top Leaders by Volume)");
    let totalTop = 0;
    const trData = topRes.map((res, i) => {
      const count = parseInt(res.parcelCount || res.count || 0);
      totalTop += count;
      return [
        (i + 1).toString(),
        (res.fullName || res.name || '').substring(0, 30),
        (res.room || res.roomNumber || '-'),
        count
      ];
    });
    trData.push(['Total parcels (Top Leaders)', '', '', totalTop]);
    drawTable(
      ['Rank', 'Name', 'Room No.', 'Parcels'],
      trData,
      [20, 80, 40, 40],
      true
    );
  }

  const sanitizedDate = displayDate.value.replace(/ /g, '_').replace(/\//g, '-');
  doc.save(`Dormitory_Summary_Report_${sanitizedDate}.pdf`);
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
    <table class="report-table-wrapper">
      <thead>
        <tr><td><div class="report-page-margin-top"></div></td></tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="print-header">
              <h1>Dormitory Management System - Summary Report</h1>
              <p class="text-gray-600">Reporting Period: {{ displayDate }}</p>
            </div>

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

            <div class="print-section">
              <h2 class="print-main-header">1. Parcel Management Overview</h2>
              
              <h3 class="print-section-title">Parcel Statistics</h3>
              <table class="print-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Waiting</td>
                    <td>{{ dynamicStats.awaiting }}</td>
                  </tr>
                  <tr>
                    <td>Waiting for Staff</td>
                    <td>{{ dynamicStats.waitingForStaff }}</td>
                  </tr>
                  <tr>
                    <td>Picked Up</td>
                    <td>{{ dynamicStats.pickedUp }}</td>
                  </tr>
                  <tr>
                    <td>Overdue</td>
                    <td>{{ dynamicStats.overdue }}</td>
                  </tr>
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td>Total Activity</td>
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
                      <th>Total Waiting</th>
                      <th>Waiting for Staff</th>
                      <th>Total Picked Up</th>
                      <th>Total Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="h in yData.months" :key="h.monthStr">
                      <td>{{ h.monthStr }}</td>
                      <td>{{ h.waiting }}</td>
                      <td>{{ h.staff }}</td>
                      <td>{{ h.pickedUp }}</td>
                      <td>{{ h.overdue }}</td>
                    </tr>
                    <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                      <td>Total</td>
                      <td>{{ yData.totalWaiting }}</td>
                      <td>{{ yData.totalStaff }}</td>
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
                    <th>Waiting At</th>
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
                    <td>{{ (parcel.currentStatus || parcel.status)?.replace('RECEIVED', 'WAITING') }}</td>
                  </tr>
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td colspan="3">Total overdue parcels</td>
                    <td>{{ filteredOverdue.length }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="print-section">
              <h2 class="print-main-header">2. Resident Management Overview</h2>
              
              <h3 class="print-section-title">Residents Statistics</h3>
              <table class="print-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Active</td>
                    <td>{{ dynamicStats.activeResidents }}</td>
                  </tr>
                  <tr>
                    <td>Pending</td>
                    <td>{{ dynamicStats.pendingResidents }}</td>
                  </tr>
                  <tr>
                    <td>Inactive</td>
                    <td>{{ dynamicStats.inactiveResidents }}</td>
                  </tr>
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td>Total Registered</td>
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
@page {
  margin: 0;
}

@media print {
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
    height: 1.5cm;
  }

  .report-page-margin-bottom {
    height: 1cm;
  }
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

  .print-report {
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 1cm !important;
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

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}

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
