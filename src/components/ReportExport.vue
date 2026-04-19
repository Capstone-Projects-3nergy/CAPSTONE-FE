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
  }
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

// Compute Historical Summaries from all data
const parcelHistory = computed(() => {
  const groups = {};

  const addEvent = (date, type) => {
    if (!date || isNaN(date.getTime())) return;
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
    if (p.statusHistory && Array.isArray(p.statusHistory) && p.statusHistory.length > 0) {
      // Use status history for accurate event timing (supports Waiting/Received transition)
      p.statusHistory.forEach(h => {
        const s = (h.status || '').toUpperCase();
        const d = new Date(h.timestamp || h.updatedAt || h.createdAt);
        
        const isWaiting = s === 'WAITING' || s === 'RECEIVED' || s === 'WAIT' || s === 'WAITING_FOR_STAFF';
        const isPickedUp = s === 'PICKED_UP' || s === 'TAKEN';
        const isOverdue = s.includes('OVERDUE');

        if (isWaiting) {
          addEvent(d, 'received');
        } else if (isPickedUp) {
          addEvent(d, 'pickedUp');
        } else if (isOverdue) {
          addEvent(d, 'overdue');
        }
      });
    } else {
      // Fallback to basic logic for backward compatibility
      const arrivalDate = new Date(p.receiveAt || p.createdAt || p.date);
      addEvent(arrivalDate, 'received');

      const s = (p.status || '').toUpperCase();
      if (s === 'PICKED_UP' || s === 'TAKEN') {
        const pickDate = new Date(p.updatedAt || p.updateAt || p.receiveAt || p.createdAt);
        addEvent(pickDate, 'pickedUp');
      } else if (s.includes('OVERDUE')) {
        const overdueDate = new Date(p.updatedAt || p.updateAt || p.receiveAt || p.createdAt);
        addEvent(overdueDate, 'overdue');
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
  props.members.forEach(m => {
    const d = new Date(m.updateAt || m.createdAt);
    if (isNaN(d.getTime())) return;
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

// Compute Business Insights for Executive Reporting
const businessInsights = computed(() => {
  const os = props.overallStats || {}
  const total = os.totalParcels || 0
  
  if (total === 0) return null;

  // calc rates
  const pickupRate = ((os.pickedUpParcels || 0) / total) * 100;
  const awaitingRate = ((os.awaitingParcels || 0) / total) * 100;
  
  // Align overdue calculation with dashboard logic (excluding Waiting for Staff)
  const overdueCount = overdueParcels.value.length;
  const overdueRate = (overdueCount / total) * 100;
  
  const staffBacklogRate = ((os.waitingForStaffParcels || 0) / total) * 100;
  
  // Resident Verification Insights
  const s = props.stats || {}
  const totalRes = (s.activeResidents || 0) + (s.pendingResidents || 0) + (s.inactiveResidents || 0) || 1;
  const verificationRate = ((s.activeResidents || 0) / totalRes) * 100;
  
  // Processing Lead Time (Received -> Picked Up)
  let totalLeadTimeHours = 0;
  let completedCount = 0;
  
  props.parcels.forEach(p => {
    if (p.statusHistory && Array.isArray(p.statusHistory)) {
      const receiveEvent = p.statusHistory.find(h => 
        ['RECEIVED', 'WAITING', 'WAIT'].includes(h.status?.toUpperCase())
      );
      const pickupEvent = p.statusHistory.find(h => 
        ['PICKED_UP', 'TAKEN'].includes(h.status?.toUpperCase())
      );
      
      if (receiveEvent && pickupEvent) {
        const start = new Date(receiveEvent.timestamp || receiveEvent.updatedAt);
        const end = new Date(pickupEvent.timestamp || pickupEvent.updatedAt);
        if (end > start) {
          totalLeadTimeHours += (end - start) / (1000 * 60 * 60);
          completedCount++;
        }
      }
    }
  });
  
  const avgLeadTime = completedCount > 0 ? (totalLeadTimeHours / completedCount).toFixed(1) : '-';

  // Operational Appraisal
  let healthStatus = 'STABLE';
  let insights = [];
  
  // 1. Storage Integrity (Overdue)
  if (overdueRate > 15) {
    healthStatus = 'CRITICAL BACKLOG';
    insights.push(`Storage Efficiency Alert: ${overdueRate.toFixed(1)}% of inventory is overdue, risking space saturation.`);
  } else if (overdueRate > 5) {
    insights.push(`Monitor Overdue: ${overdueCount} items are currently exceeding the 24h pickup window.`);
  }
  
  // 2. Staff Processing Speed
  if (staffBacklogRate > 10) {
    healthStatus = healthStatus === 'STABLE' ? 'OPERATIONAL DELAY' : healthStatus;
    insights.push(`Processing Bottleneck: Staff intake backlog is currently at ${staffBacklogRate.toFixed(1)}%.`);
  } else if (staffBacklogRate > 0) {
    insights.push(`Staff processing is maintaining an active flow (${staffBacklogRate.toFixed(1)}% pending intake).`);
  }

  // 3. Resident Pickup Engagement
  if (pickupRate > 80) {
    insights.push("High Efficiency: Resident pickup response is excellent for this reporting period.");
  } else if (pickupRate < 40 && total > 20) {
    insights.push("Engagement Warning: Low clearing rate detected. Residents may be unaware of pending items.");
  }

  // 4. Verification Health
  if (verificationRate < 80) {
    insights.push(`Administrative Note: resident verification health is at ${verificationRate.toFixed(1)}%. Recommend vetting pending accounts.`);
  }

  return {
    pickupRate: pickupRate.toFixed(1),
    awaitingRate: awaitingRate.toFixed(1),
    overdueRate: overdueRate.toFixed(1),
    overdueCount,
    staffBacklogRate: staffBacklogRate.toFixed(1),
    verificationRate: verificationRate.toFixed(1),
    avgLeadTime,
    healthStatus,
    insights
  };
});

// Compute overdue parcels based on dashboard logic (> 1 days)
const overdueParcels = computed(() => {
  if (!props.parcels) return []
  const now = new Date()
  const overdueThresholdMs = 1 * 24 * 60 * 60 * 1000
  return props.parcels.filter(p => {
    const s = (p.status || '').toUpperCase()
    // Define intake/active statuses that can become overdue
    // Dashboard Logic: RECEIVED, WAITING, WAIT, NOTIFIED, OVERDUE are overdue candidates
    // EXCLUDE: WAITING_FOR_STAFF
    const isOverdueCandidate = ['RECEIVED', 'WAITING', 'WAIT', 'NOTIFIED', 'OVERDUE'].some(status => s.includes(status))
    const isPickedUp = s.includes('PICKED') || s.includes('TAKEN')
    const isWaitingForStaff = s.includes('WAITING_FOR_STAFF') || s.includes('STAFF')
    
    if (!isOverdueCandidate || isPickedUp || isWaitingForStaff) return false
    
    const date = new Date(p.receiveAt || p.createdAt || p.updatedAt)
    if (isNaN(date.getTime())) return false
    return (now - date) > overdueThresholdMs
  }).sort((a, b) => new Date(b.receiveAt || b.createdAt) - new Date(a.receiveAt || a.createdAt))
})

const handleExportExcel = () => {
  const stats = props.stats;
  const pending = props.pendingResidents;
  const topRes = props.topResidents;
  const recentParcels = props.parcels.slice(0, 10);
  const overdueList = overdueParcels.value;

  // 1. MAIN FILE HEADER
  const finalData = [
    ['Dormitory Management System - Full Dashboard Report'],
    ['Report Issue Date:', new Date().toLocaleString()],
    []
  ];

  const insights = businessInsights.value;
  if (insights) {
    finalData.push(['EXECUTIVE SUMMARY & BUSINESS KPI']);
    finalData.push(['KPI METRIC', 'VALUE (%)', 'OPINION / INSIGHT']);
    finalData.push(['Parcel Clearing Rate (Picked Up)', insights.pickupRate + '%', insights.pickupRate > 80 ? 'Optimal' : 'Standard']);
    finalData.push(['Backlog Rate (Awaiting Pickup)', insights.awaitingRate + '%', '-']);
    finalData.push(['System Efficiency (Staff Processing)', (100 - insights.staffBacklogRate) + '%', insights.staffBacklogRate > 10 ? 'Bottleneck Detected' : 'Excellent']);
    finalData.push(['Average Pickup Turnaround', insights.avgLeadTime + ' Hours', 'Average per unit']);
    finalData.push(['Overdue Risk Level', insights.overdueRate + '%', insights.overdueRate > 15 ? 'CRITICAL' : 'Normal']);
    finalData.push(['Resident Verification Health', insights.verificationRate + '%', '-']);
    finalData.push(['Operational Status', '', insights.healthStatus]);
    finalData.push([]);
  }

  let mainSection = 1;

  // --- SECTION 1: PARCEL MANAGEMENT OVERVIEW ---
  finalData.push([`${mainSection}. PARCEL MANAGEMENT OVERVIEW`]);
  finalData.push(['CATEGORY', 'STATUS ITEM', 'COUNT / VALUE']);
  finalData.push(['Parcels', 'Picked Up', props.overallStats.pickedUpParcels]);
  finalData.push(['', 'Received / Awaiting', props.overallStats.awaitingParcels]);
  finalData.push(['', 'Overdue Parcels', props.overallStats.overdueParcels]);
  finalData.push(['', 'TOTAL UNITS (SYSTEM)', props.overallStats.totalParcels]);
  finalData.push([]);

  if (recentParcels.length > 0) {
    finalData.push(['RECENT PARCELS (Latest Activity)']);
    finalData.push(['Date', 'Resident', 'Tracking No.', 'Current Status', 'Status History']);
    recentParcels.forEach(p => {
      const historyStr = p.statusHistory && p.statusHistory.length > 0 
        ? p.statusHistory.map(h => `${h.status} (${formatDate(h.updatedAt)})`).join(' -> ') 
        : '-';
      finalData.push([formatDate(p.updatedAt), p.residentName, p.trackingNumber, p.status?.toUpperCase(), historyStr]);
    });
    finalData.push(['TOTAL RECENT PARCELS', '', '', recentParcels.length]);
    finalData.push([]);
  }

  if (overdueList.length > 0) {
    finalData.push(['OVERDUE PARCELS (> 1 Day)']);
    finalData.push(['Received At', 'Resident', 'Tracking No.', 'Status']);
    overdueList.forEach(p => {
      finalData.push([formatDate(p.receiveAt || p.createdAt), p.residentName, p.trackingNumber, p.status?.toUpperCase()]);
    });
    finalData.push(['TOTAL OVERDUE PARCELS', '', '', overdueList.length]);
    finalData.push([]);
  }

  // --- NEW: HISTORICAL MONTHLY BREAKDOWN (Parcels) ---
  if (parcelHistory.value.length > 0) {
    parcelHistory.value.forEach(yData => {
      finalData.push([`HISTORICAL MONTHLY SUMMARY (Parcels) - YEAR ${yData.year}`]);
      finalData.push(['Month (MM/YYYY)', 'Total Received', 'Total Picked Up', 'Total Overdue']);
      yData.months.forEach(h => {
        finalData.push([h.monthStr, h.received, h.pickedUp, h.overdue]);
      });
      finalData.push(['TOTAL', yData.totalReceived, yData.totalPickedUp, yData.totalOverdue]);
      finalData.push([]);
    });
  }
  mainSection++;

  // --- SECTION 2: RESIDENT MANAGEMENT OVERVIEW ---
  finalData.push([`${mainSection}. RESIDENT MANAGEMENT OVERVIEW`]);
  finalData.push(['CATEGORY', 'STATUS ITEM', 'COUNT / VALUE']);
  finalData.push(['Residents', 'Active / Verified', stats.activeResidents]);
  finalData.push(['', 'Pending Approvals', stats.pendingResidents]);
  finalData.push(['', 'Inactive', stats.inactiveResidents]);
  finalData.push(['', 'TOTAL RESIDENTS', stats.activeResidents + stats.inactiveResidents]);
  finalData.push([]);

  if (pending && pending.length > 0) {
    finalData.push(['PENDING ACCOUNTS (Awaiting Verification)']);
    finalData.push(['Name', 'Room No.', 'Email', 'Updated At']);
    pending.forEach(r => {
      finalData.push([r.fullName, r.roomNumber, r.email, formatDateTime(r.updateAt)]);
    });
    finalData.push(['TOTAL PENDING ACCOUNTS', '', '', pending.length]);
    finalData.push([]);
  }

  if (topRes && topRes.length > 0) {
    finalData.push(['RESIDENT RANKING (Top Leaders by Volume)']);
    finalData.push(['Rank', 'Name', 'Room No.', 'Parcel Count']);
    let totalTopParcels = 0;
    topRes.forEach((r, i) => {
      totalTopParcels += parseInt(r.parcelCount || r.count || 0);
      finalData.push([i + 1, r.fullName || r.name, r.roomNumber || r.room, r.parcelCount || r.count]);
    });
    finalData.push(['TOTAL PARCELS (Top Leaders)', '', '', totalTopParcels]);
    finalData.push([]);
  }

  // --- NEW: HISTORICAL MONTHLY BREAKDOWN (Residents) ---
  if (residentHistory.value.length > 0) {
    residentHistory.value.forEach(yData => {
      finalData.push([`HISTORICAL MONTHLY SUMMARY (Residents) - YEAR ${yData.year}`]);
      finalData.push(['Month (MM/YYYY)', 'Total Registered']);
      yData.months.forEach(h => {
        finalData.push([h.monthStr, h.joined]);
      });
      finalData.push(['TOTAL', yData.totalJoined]);
      finalData.push([]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(finalData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dashboard Report");

  ws['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 30 }, { wch: 20 }];
  XLSX.writeFile(wb, `Dormitory_Dashboard_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const handleExportPDF = () => {
  const doc = new jsPDF();
  const stats = props.stats;
  const pending = props.pendingResidents;
  const topRes = props.topResidents;
  const recentParcels = props.parcels.slice(0, 10);
  const overdueList = overdueParcels.value;
  const brandColor = [29, 53, 94]; // Navy Blue style

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
    doc.rect(15, y - 6, 180, 10, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(text, 105, y, { align: 'center' });
    y += 12;
  };

  const drawSubHeader = (text) => {
    checkPage(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(text, 15, y);
    y += 6;
  };

  // Main Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(29, 53, 94);
  doc.text("Dormitory Management System - Full Dashboard Report", 105, y, { align: 'center' });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Report Issue Date: ${new Date().toLocaleString()}`, 105, y, { align: 'center' });
  y += 6;
  doc.setDrawColor(29, 53, 94);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 12;

  // --- EXECUTIVE SUMMARY SECTION ---
  const insights = businessInsights.value;
  if (insights) {
    drawMainCategoryHeader("EXECUTIVE SUMMARY & KEY RATIOS");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Grid style for KPIs
    const kpiY = y;
    const boxW = 85;
    const boxH = 20;

    const drawKPIBox = (label, value, x, py) => {
      doc.setDrawColor(220, 220, 220);
      doc.rect(x, py, boxW, boxH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(value, x + 5, py + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(label, x + 5, py + 14);
      doc.setTextColor(0, 0, 0);
    };

    drawKPIBox("Parcel Clearing Rate", insights.pickupRate + "%", 15, y);
    drawKPIBox("Staff Efficiency Rate", (100 - insights.staffBacklogRate) + "%", 110, y);
    y += boxH + 5;
    drawKPIBox("Resident Verification", insights.verificationRate + "%", 15, y);
    drawKPIBox("Avg. Time to Pickup", insights.avgLeadTime + " hrs", 110, y);
    y += boxH + 8;

    doc.setFont("helvetica", "bold");
    doc.text("Operational Insights:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Current operational health: ${insights.healthStatus}`, 15, y);
    y += 5;
    if (insights.insights.length > 0) {
      insights.insights.forEach(msg => {
        doc.text("• " + msg, 15, y);
        y += 4;
      });
    } else {
      doc.text("• No critical anomalies detected in the current activity flow.", 15, y);
      y += 4;
    }
    y += 10;
  }

  // --- 1. PARCEL MANAGEMENT OVERVIEW ---
  drawMainCategoryHeader("1. PARCEL MANAGEMENT OVERVIEW");
  
  // 1.1 Parcel Statistics
  drawSubHeader("Statistics Overview (Parcels)");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const parcelStats = [
    { item: 'Picked Up', val: props.overallStats.pickedUpParcels },
    { item: 'Received / Awaiting', val: props.overallStats.awaitingParcels },
    { item: 'Overdue Parcels', val: props.overallStats.overdueParcels }
  ];

  doc.setFillColor(245, 247, 250);
  doc.rect(15, y - 5, 180, 8, 'F');
  doc.setFont("helvetica", "bold");
  doc.text("PARCEL STATUS ITEM", 18, y); 
  doc.text("COUNT / VALUE", 160, y);
  
  doc.setDrawColor(180, 180, 180);
  const parcelRowsCount = parcelStats.length + 1; // +1 for Total
  doc.rect(15, y - 5, 180, (parcelRowsCount * 8) + 8);
  doc.line(15, y + 3, 195, y + 3);
  doc.line(155, y - 5, 155, y - 5 + (parcelRowsCount * 8) + 8);

  y += 8;
  doc.setFont("helvetica", "normal");
  parcelStats.forEach(row => {
    doc.text(row.item, 18, y);
    doc.text((row.val ?? 0).toString(), 190, y, { align: 'right' });
    doc.setDrawColor(230, 230, 230);
    doc.line(15, y + 2, 195, y + 2);
    y += 8;
  });

  // Render Total row
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL UNITS (SYSTEM)", 18, y);
  doc.text(props.overallStats.totalParcels.toString(), 190, y, { align: 'right' });
  y += 10;

  // 1.2 Recent Parcels
  if (recentParcels.length > 0) {
    drawSubHeader("Recent Parcels (Latest Activity)");
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("DATE", 17, y); 
    doc.text("RESIDENT", 47, y); 
    doc.text("TRACKING NO.", 97, y); 
    doc.text("STATUS", 163, y);
    
    doc.setDrawColor(180, 180, 180);
    doc.rect(15, y - 5, 180, ((recentParcels.length + 1) * 8) + 8);
    doc.line(15, y + 3, 195, y + 3);
    doc.line(45, y - 5, 45, y - 5 + (recentParcels.length * 8) + 8);
    doc.line(95, y - 5, 95, y - 5 + (recentParcels.length * 8) + 8);
    doc.line(160, y - 5, 160, y - 5 + (recentParcels.length * 8) + 8);

    y += 8;
    doc.setFont("helvetica", "normal");
    recentParcels.forEach((p, idx) => {
      doc.text(formatDate(p.updatedAt), 17, y);
      doc.text((p.residentName || '').substring(0, 18), 47, y);
      doc.text((p.trackingNumber || '').substring(0, 20), 97, y);
      doc.text((p.status || '').toUpperCase(), 163, y);
      doc.setDrawColor(230, 230, 230);
      doc.line(15, y + 2, 195, y + 2);
      
      // Add status history in small text if exists
      if (p.statusHistory && p.statusHistory.length > 0) {
        y += 4;
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        const historyStr = "History: " + p.statusHistory.map(h => `${h.status}(${formatDate(h.updatedAt)})`).join(' -> ');
        doc.text(historyStr.substring(0, 100), 47, y);
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        y += 4;
      } else {
        y += 8;
      }
    });

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL RECENT PARCELS", 17, y);
    doc.text(recentParcels.length.toString(), 163, y);
    y += 10;
  }

  // 1.4 Historical Monthly Table (Parcels)
  if (parcelHistory.value.length > 0) {
    parcelHistory.value.forEach((yData, yIdx) => {
      drawSubHeader(`Historical Monthly Summary (Parcels) - ${yData.year}`);
      doc.setFillColor(245, 247, 250);
      doc.rect(15, y - 5, 180, 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.text("MONTH (MM/YYYY)", 17, y);
      doc.text("RECEIVED", 85, y, { align: 'right' });
      doc.text("PICKED UP", 140, y, { align: 'right' });
      doc.text("OVERDUE", 190, y, { align: 'right' });

      doc.setDrawColor(180, 180, 180);
      const rowsCount = yData.months.length + 1; // +1 for Total
      doc.rect(15, y - 5, 180, (rowsCount * 7) + 8);
      y += 8;
      doc.setFont("helvetica", "normal");
      
      yData.months.forEach(h => {
        checkPage(7);
        doc.text(h.monthStr, 17, y);
        doc.text(h.received.toString(), 85, y, { align: 'right' });
        doc.text(h.pickedUp.toString(), 140, y, { align: 'right' });
        doc.text(h.overdue.toString(), 190, y, { align: 'right' });
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y + 2, 195, y + 2);
        y += 7;
      });

      // Render Total row
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL", 17, y);
      doc.text(yData.totalReceived.toString(), 85, y, { align: 'right' });
      doc.text(yData.totalPickedUp.toString(), 140, y, { align: 'right' });
      doc.text(yData.totalOverdue.toString(), 190, y, { align: 'right' });
      y += 7;
      
      if (yIdx < parcelHistory.value.length - 1) y += 5;
    });
    y += 10;
  }
  y += 15;

  // 1.3 Overdue Parcels
  if (overdueList.length > 0) {
    drawSubHeader("Overdue Parcels (> 1 Day)");
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("RECEIVED AT", 17, y); 
    doc.text("RESIDENT", 47, y); 
    doc.text("TRACKING NO.", 97, y); 
    doc.text("STATUS", 163, y);
    
    doc.setDrawColor(180, 180, 180);
    doc.rect(15, y - 5, 180, ((overdueList.length + 1) * 8) + 8);
    doc.line(15, y + 3, 195, y + 3);
    doc.line(45, y - 5, 45, y - 5 + (overdueList.length * 8) + 8);
    doc.line(95, y - 5, 95, y - 5 + (overdueList.length * 8) + 8);
    doc.line(160, y - 5, 160, y - 5 + (overdueList.length * 8) + 8);

    y += 8;
    doc.setFont("helvetica", "normal");
    overdueList.forEach((p, idx) => {
      doc.text(formatDate(p.receiveAt || p.createdAt), 17, y);
      doc.text((p.residentName || '').substring(0, 18), 47, y);
      doc.text((p.trackingNumber || '').substring(0, 20), 97, y);
      doc.text((p.status || '').toUpperCase(), 163, y);
      doc.setDrawColor(230, 230, 230);
      doc.line(15, y + 2, 195, y + 2);
      y += 8;
    });

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL OVERDUE PARCELS", 17, y);
    doc.text(overdueList.length.toString(), 163, y);
  }
  y += 15;

  // --- 2. RESIDENT MANAGEMENT OVERVIEW ---
  drawMainCategoryHeader("2. RESIDENT MANAGEMENT OVERVIEW");
  
  // 2.1 Resident Statistics
  drawSubHeader("Statistics Overview (Residents)");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const residentStats = [
    { item: 'Active / Verified', val: stats.activeResidents },
    { item: 'Pending Approvals', val: stats.pendingResidents },
    { item: 'Inactive Residents', val: stats.inactiveResidents }
  ];

  doc.setFillColor(245, 247, 250);
  doc.rect(15, y - 5, 180, 8, 'F');
  doc.setFont("helvetica", "bold");
  doc.text("RESIDENT STATUS ITEM", 18, y); 
  doc.text("COUNT / VALUE", 160, y);
  
  doc.setDrawColor(180, 180, 180);
  const residentRowsCount = residentStats.length + 1; // +1 for Total
  doc.rect(15, y - 5, 180, (residentRowsCount * 8) + 8);
  doc.line(15, y + 3, 195, y + 3);
  doc.line(155, y - 5, 155, y - 5 + (residentRowsCount * 8) + 8);

  y += 8;
  doc.setFont("helvetica", "normal");
  residentStats.forEach(row => {
    doc.text(row.item, 18, y);
    doc.text((row.val ?? 0).toString(), 190, y, { align: 'right' });
    doc.setDrawColor(230, 230, 230);
    doc.line(15, y + 2, 195, y + 2);
    y += 8;
  });

  doc.setFont("helvetica", "bold");
  doc.text("TOTAL RESIDENTS", 18, y);
  doc.text((stats.activeResidents + stats.inactiveResidents).toString(), 190, y, { align: 'right' });
  y += 10;

  // 2.2 Pending Accounts
  if (pending && pending.length > 0) {
    drawSubHeader("Pending Accounts (Awaiting Verification)");
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("NAME", 17, y); 
    doc.text("ROOM", 72, y); 
    doc.text("EMAIL", 97, y); 
    doc.text("UPDATED AT", 157, y);

    doc.setDrawColor(180, 180, 180);
    doc.rect(15, y - 5, 180, ((pending.length + 1) * 8) + 8);
    doc.line(15, y + 3, 195, y + 3);
    doc.line(70, y - 5, 70, y - 5 + (pending.length * 8) + 8);
    doc.line(95, y - 5, 95, y - 5 + (pending.length * 8) + 8);
    doc.line(155, y - 5, 155, y - 5 + (pending.length * 8) + 8);

    y += 8;
    doc.setFont("helvetica", "normal");
    pending.forEach((res, idx) => {
      doc.text((res.fullName || '').substring(0, 25), 17, y);
      doc.text((res.roomNumber || '-'), 72, y);
      doc.text((res.email || '').substring(0, 30), 97, y);
      doc.text(formatDateTime(res.updateAt), 157, y);
      doc.setDrawColor(230, 230, 230);
      doc.line(15, y + 2, 195, y + 2);
      y += 8;
    });

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL PENDING ACCOUNTS", 17, y);
    doc.text(pending.length.toString(), 157, y);
    y += 10;
  }

  // 2.3 Resident Ranking
  if (topRes && topRes.length > 0) {
    drawSubHeader("Resident Ranking (Top Leaders by Volume)");
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("RANK", 17, y); 
    doc.text("NAME", 37, y); 
    doc.text("ROOM NO.", 102, y); 
    doc.text("PARCELS", 162, y);
    
    doc.setDrawColor(180, 180, 180);
    doc.rect(15, y - 5, 180, ((topRes.length + 1) * 8) + 8);
    doc.line(15, y + 3, 195, y + 3);
    doc.line(33, y - 5, 33, y - 5 + (topRes.length * 8) + 8);
    doc.line(100, y - 5, 100, y - 5 + (topRes.length * 8) + 8);
    doc.line(160, y - 5, 160, y - 5 + (topRes.length * 8) + 8);

    y += 8;
    doc.setFont("helvetica", "normal");
    let sumTopRank = 0;
    topRes.forEach((res, i) => {
      sumTopRank += parseInt(res.parcelCount || res.count || 0);
      doc.text((i + 1).toString(), 22, y, { align: 'center' });
      doc.text((res.fullName || res.name || '').substring(0, 25), 37, y);
      doc.text((res.roomNumber || res.room || '-'), 130, y, { align: 'right' });
      doc.text((res.parcelCount || res.count || 0).toString(), 190, y, { align: 'right' });
      doc.setDrawColor(230, 230, 230);
      doc.line(15, y + 2, 195, y + 2);
      y += 8;
    });

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL PARCELS (Top Leaders)", 17, y);
    doc.text(sumTopRank.toString(), 190, y, { align: 'right' });
    y += 10;
  }

  // 2.3 Historical Monthly Table (Residents)
  if (residentHistory.value.length > 0) {
    residentHistory.value.forEach((yData, yIdx) => {
      drawSubHeader(`Historical Monthly Summary (Residents) - ${yData.year}`);
      doc.setFillColor(245, 247, 250);
      doc.rect(15, y - 5, 180, 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.text("MONTH (MM/YYYY)", 17, y);
      doc.text("TOTAL REGISTERED", 180, y, { align: 'right' });

      doc.setDrawColor(180, 180, 180);
      const rowsCount = yData.months.length + 1; // +1 for Total
      doc.rect(15, y - 5, 180, (rowsCount * 7) + 8);
      y += 8;
      doc.setFont("helvetica", "normal");
      
      yData.months.forEach(h => {
        checkPage(7);
        doc.text(h.monthStr, 17, y);
        doc.text(h.joined.toString(), 180, y, { align: 'right' });
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y + 2, 195, y + 2);
        y += 7;
      });

      // Render Total row
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL", 17, y);
      doc.text(yData.totalJoined.toString(), 180, y, { align: 'right' });
      y += 7;
      
      if (yIdx < residentHistory.value.length - 1) y += 5;
    });
  }

  doc.save(`Dormitory_Dashboard_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
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
              <p class="text-gray-600">Report Issue Date: {{ new Date().toLocaleString() }}</p>
            </div>

            <!-- --- PERFORMANCE SUMMARY SECTION --- -->
            <div v-if="businessInsights" class="print-section">
              <h2 class="print-main-header">Summary of dormitory performance</h2>
              
              <div class="kpi-grid">
                <div class="kpi-card">
                  <span class="kpi-label">Clearing efficiency</span>
                  <span class="kpi-value">{{ businessInsights.pickupRate }}%</span>
                  <span class="kpi-sublabel">Parcels successfully picked up</span>
                </div>
                <div class="kpi-card">
                  <span class="kpi-label">Overdue inventory ratio</span>
                  <span class="kpi-value">{{ businessInsights.overdueRate }}%</span>
                  <span class="kpi-sublabel">Units exceeding 24h threshold</span>
                </div>
                <div class="kpi-card">
                  <span class="kpi-label">Staff processing load</span>
                  <span class="kpi-value">{{ businessInsights.staffBacklogRate }}%</span>
                  <span class="kpi-sublabel">Parcels awaiting intake verification</span>
                </div>
                <div class="kpi-card">
                  <span class="kpi-label">Resident verification</span>
                  <span class="kpi-value">{{ businessInsights.verificationRate }}%</span>
                  <span class="kpi-sublabel">Active versus total accounts</span>
                </div>
              </div>

              <div class="insights-box mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 class="font-bold text-gray-800 mb-2">Operational Analytics:</h4>
                <ul class="list-disc pl-5 space-y-1">
                  <li v-if="businessInsights.insights.length === 0" class="text-gray-600 text-sm">Operation is flowing normally. No interventions required.</li>
                  <li v-for="(msg, i) in businessInsights.insights" :key="i" class="text-sm text-gray-700 font-medium">
                    {{ msg }}
                  </li>
                  <li class="text-sm text-gray-600">Current activity state: {{ businessInsights.healthStatus }}</li>
                </ul>
              </div>
            </div>

            <!-- --- SECTION 1: PARCEL MANAGEMENT OVERVIEW --- -->
            <div class="print-section">
              <h2 class="print-main-header">1. Parcel Management Overview</h2>
              
              <h3 class="print-section-title">Statistics Overview (Parcels)</h3>
              <table class="print-table">
                <thead>
                  <tr>
                    <th>Status Item</th>
                    <th>Count / Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Picked Up</td>
                    <td>{{ overallStats.pickedUpParcels }}</td>
                  </tr>
                  <tr>
                    <td>Received / Awaiting</td>
                    <td>{{ overallStats.awaitingParcels }}</td>
                  </tr>
                  <tr>
                    <td>Overdue Parcels</td>
                    <td>{{ overallStats.overdueParcels }}</td>
                  </tr>
                  <!-- TOTAL ROW -->
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td>TOTAL UNITS (SYSTEM)</td>
                    <td>{{ overallStats.totalParcels }}</td>
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
                      <td>TOTAL</td>
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
                  <tr v-for="parcel in parcels.slice(0, 10)" :key="parcel.id">
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
                    <td>{{ parcel.status }}</td>
                  </tr>
                  <!-- TOTAL ROW -->
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td colspan="3">TOTAL RECENT PARCELS</td>
                    <td>{{ parcels.slice(0, 10).length }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="print-section" v-if="overdueParcels.length > 0">
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
                  <tr v-for="parcel in overdueParcels" :key="parcel.id">
                    <td>{{ formatDate(parcel.receiveAt || parcel.createdAt) }}</td>
                    <td>{{ parcel.residentName }}</td>
                    <td>{{ parcel.trackingNumber }}</td>
                    <td>{{ parcel.status }}</td>
                  </tr>
                  <!-- TOTAL ROW -->
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td colspan="3">TOTAL OVERDUE PARCELS</td>
                    <td>{{ overdueParcels.length }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- --- SECTION 2: RESIDENT MANAGEMENT OVERVIEW --- -->
            <div class="print-section">
              <h2 class="print-main-header">2. Resident Management Overview</h2>
              
              <h3 class="print-section-title">Statistics Overview (Residents)</h3>
              <table class="print-table">
                <thead>
                  <tr>
                    <th>Status Item</th>
                    <th>Count / Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Active / Verified</td>
                    <td>{{ stats.activeResidents }}</td>
                  </tr>
                  <tr>
                    <td>Pending Approvals</td>
                    <td>{{ stats.pendingResidents }}</td>
                  </tr>
                  <tr>
                    <td>Inactive Residents</td>
                    <td>{{ stats.inactiveResidents }}</td>
                  </tr>
                  <!-- TOTAL ROW -->
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td>TOTAL RESIDENTS</td>
                    <td>{{ stats.activeResidents + stats.inactiveResidents }}</td>
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
                      <td>TOTAL</td>
                      <td>{{ yData.totalJoined }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <div class="print-section" v-if="pendingResidents.length > 0">
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
                  <tr v-for="res in pendingResidents" :key="res.id">
                    <td>{{ res.fullName }}</td>
                    <td>{{ res.roomNumber }}</td>
                    <td>{{ res.email }}</td>
                    <td>{{ formatDateTime(res.updateAt) }}</td>
                  </tr>
                  <!-- TOTAL ROW -->
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td colspan="3">TOTAL PENDING ACCOUNTS</td>
                    <td>{{ pendingResidents.length }}</td>
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
                    <td>{{ res.roomNumber || res.room }}</td>
                    <td>{{ res.parcelCount || res.count }}</td>
                  </tr>
                  <!-- TOTAL ROW -->
                  <tr class="font-bold bg-gray-100" style="background-color: #f3f4f6 !important;">
                    <td colspan="3">TOTAL PARCELS (Top Leaders)</td>
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
