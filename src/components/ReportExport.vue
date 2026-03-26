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
  parcels: {
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
// Compute overdue parcels based on dashboard logic (> 3 days)
const overdueParcels = computed(() => {
  if (!props.parcels) return []
  const now = new Date()
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000
  return props.parcels.filter(p => {
    if (!['Received', 'Notified', 'Overdue'].includes(p.status)) return false
    const date = new Date(p.receiveAt || p.createdAt || p.updatedAt)
    if (isNaN(date.getTime())) return false
    return (now - date) > threeDaysMs
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
    ['Generated Date', new Date().toLocaleString()],
    []
  ];

  let mainSection = 1;

  // --- SECTION 1: PARCEL MANAGEMENT OVERVIEW ---
  finalData.push([`${mainSection}. PARCEL MANAGEMENT OVERVIEW`]);
  finalData.push(['CATEGORY', 'STATUS ITEM', 'COUNT / VALUE']);
  finalData.push(['Parcels', 'Total Units (System)', stats.totalParcels]);
  finalData.push(['', 'Picked Up', stats.pickedUpParcels]);
  finalData.push(['', 'Received / Awaiting', stats.awaitingParcels]);
  finalData.push(['', 'Overdue Parcels', stats.overdueParcels]);
  finalData.push([]);

  if (recentParcels.length > 0) {
    finalData.push(['RECENT PARCELS (Latest Activity)']);
    finalData.push(['Date', 'Resident', 'Tracking No.', 'Status']);
    recentParcels.forEach(p => {
      finalData.push([formatDate(p.updatedAt), p.residentName, p.trackingNumber, p.status?.toUpperCase()]);
    });
    finalData.push([]);
  }

  if (overdueList.length > 0) {
    finalData.push(['OVERDUE PARCELS (> 3 Days)']);
    finalData.push(['Received At', 'Resident', 'Tracking No.', 'Status']);
    overdueList.forEach(p => {
      finalData.push([formatDate(p.receiveAt || p.createdAt), p.residentName, p.trackingNumber, p.status?.toUpperCase()]);
    });
    finalData.push([]);
  }
  mainSection++;

  // --- SECTION 2: RESIDENT MANAGEMENT OVERVIEW ---
  finalData.push([`${mainSection}. RESIDENT MANAGEMENT OVERVIEW`]);
  finalData.push(['CATEGORY', 'STATUS ITEM', 'COUNT / VALUE']);
  finalData.push(['Residents', 'Total Registered', stats.totalResidents]);
  finalData.push(['', 'Active / Verified', stats.activeResidents]);
  finalData.push(['', 'Pending Approvals', stats.pendingResidents]);
  finalData.push(['', 'Inactive', stats.inactiveResidents]);
  finalData.push(['Communications', 'Total Announcements', stats.totalAnnouncements]);
  finalData.push([]);

  if (pending && pending.length > 0) {
    finalData.push(['PENDING ACCOUNTS (Awaiting Verification)']);
    finalData.push(['Name', 'Room No.', 'Email', 'Updated At']);
    pending.forEach(r => {
      finalData.push([r.fullName, r.roomNumber, r.email, formatDateTime(r.updateAt)]);
    });
    finalData.push([]);
  }

  if (topRes && topRes.length > 0) {
    finalData.push(['RESIDENT RANKING (Top Leaders by Volume)']);
    finalData.push(['Rank', 'Name', 'Room No.', 'Parcel Count']);
    topRes.forEach((r, i) => {
      finalData.push([i + 1, r.fullName || r.name, r.roomNumber || r.room, r.parcelCount || r.count]);
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
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, y, { align: 'center' });
  y += 6;
  doc.setDrawColor(29, 53, 94);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 15;

  // --- 1. PARCEL MANAGEMENT OVERVIEW ---
  drawMainCategoryHeader("1. PARCEL MANAGEMENT OVERVIEW");
  
  // 1.1 Parcel Statistics
  drawSubHeader("Statistics Overview (Parcels)");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const parcelStats = [
    { item: 'Total Units (System)', val: stats.totalParcels },
    { item: 'Picked Up', val: stats.pickedUpParcels },
    { item: 'Received / Awaiting', val: stats.awaitingParcels },
    { item: 'Overdue Parcels', val: stats.overdueParcels }
  ];

  doc.setFillColor(245, 247, 250);
  doc.rect(15, y - 5, 180, 8, 'F');
  doc.setFont("helvetica", "bold");
  doc.text("PARCEL STATUS ITEM", 18, y); 
  doc.text("COUNT / VALUE", 160, y);
  
  doc.setDrawColor(180, 180, 180);
  doc.rect(15, y - 5, 180, (parcelStats.length * 8) + 8);
  doc.line(15, y + 3, 195, y + 3);
  doc.line(155, y - 5, 155, y - 5 + (parcelStats.length * 8) + 8);

  y += 8;
  doc.setFont("helvetica", "normal");
  parcelStats.forEach((row, idx) => {
    doc.text(row.item, 18, y);
    doc.text((row.val ?? 0).toString(), 190, y, { align: 'right' });
    if (idx < parcelStats.length - 1) {
      doc.setDrawColor(230, 230, 230);
      doc.line(15, y + 2, 195, y + 2);
    }
    y += 8;
  });
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
    doc.rect(15, y - 5, 180, (recentParcels.length * 8) + 8);
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
      if (idx < recentParcels.length - 1) {
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y + 2, 195, y + 2);
      }
      y += 8;
    });
    y += 10;
  }

  // 1.3 Overdue Parcels
  if (overdueList.length > 0) {
    drawSubHeader("Overdue Parcels (> 3 Days)");
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("RECEIVED AT", 17, y); 
    doc.text("RESIDENT", 47, y); 
    doc.text("TRACKING NO.", 97, y); 
    doc.text("STATUS", 163, y);
    
    doc.setDrawColor(180, 180, 180);
    doc.rect(15, y - 5, 180, (overdueList.length * 8) + 8);
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
      if (idx < overdueList.length - 1) {
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y + 2, 195, y + 2);
      }
      y += 8;
    });
  }
  y += 15;

  // --- 2. RESIDENT MANAGEMENT OVERVIEW ---
  drawMainCategoryHeader("2. RESIDENT MANAGEMENT OVERVIEW");
  
  // 2.1 Resident Statistics
  drawSubHeader("Statistics Overview (Residents & Comms)");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const residentStats = [
    { item: 'Total Registered Residents', val: stats.totalResidents },
    { item: 'Active / Verified', val: stats.activeResidents },
    { item: 'Pending Approvals', val: stats.pendingResidents },
    { item: 'Inactive Residents', val: stats.inactiveResidents },
    { item: 'Total System Announcements', val: stats.totalAnnouncements }
  ];

  doc.setFillColor(245, 247, 250);
  doc.rect(15, y - 5, 180, 8, 'F');
  doc.setFont("helvetica", "bold");
  doc.text("RESIDENT STATUS ITEM", 18, y); 
  doc.text("COUNT / VALUE", 160, y);
  
  doc.setDrawColor(180, 180, 180);
  doc.rect(15, y - 5, 180, (residentStats.length * 8) + 8);
  doc.line(15, y + 3, 195, y + 3);
  doc.line(155, y - 5, 155, y - 5 + (residentStats.length * 8) + 8);

  y += 8;
  doc.setFont("helvetica", "normal");
  residentStats.forEach((row, idx) => {
    doc.text(row.item, 18, y);
    doc.text((row.val ?? 0).toString(), 190, y, { align: 'right' });
    if (idx < residentStats.length - 1) {
      doc.setDrawColor(230, 230, 230);
      doc.line(15, y + 2, 195, y + 2);
    }
    y += 8;
  });
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
    doc.rect(15, y - 5, 180, (pending.length * 8) + 8);
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
      if (idx < pending.length - 1) {
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y + 2, 195, y + 2);
      }
      y += 8;
    });
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
    doc.rect(15, y - 5, 180, (topRes.length * 8) + 8);
    doc.line(15, y + 3, 195, y + 3);
    doc.line(33, y - 5, 33, y - 5 + (topRes.length * 8) + 8);
    doc.line(100, y - 5, 100, y - 5 + (topRes.length * 8) + 8);
    doc.line(160, y - 5, 160, y - 5 + (topRes.length * 8) + 8);

    y += 8;
    doc.setFont("helvetica", "normal");
    topRes.forEach((res, i) => {
      doc.text((i + 1).toString(), 22, y, { align: 'center' });
      doc.text((res.fullName || res.name || '').substring(0, 25), 37, y);
      doc.text((res.roomNumber || res.room || '-'), 130, y, { align: 'right' });
      doc.text((res.parcelCount || res.count || 0).toString(), 190, y, { align: 'right' });
      if (i < topRes.length - 1) {
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y + 2, 195, y + 2);
      }
      y += 8;
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
    <div class="print-header">
      <h1>Dormitory Management System - Summary Report</h1>
      <p class="text-gray-600">Generated on: {{ new Date().toLocaleString() }}</p>
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
            <td>Total Units (System)</td>
            <td>{{ stats.totalParcels }}</td>
          </tr>
          <tr>
            <td>Picked Up</td>
            <td>{{ stats.pickedUpParcels }}</td>
          </tr>
          <tr>
            <td>Received / Awaiting</td>
            <td>{{ stats.awaitingParcels }}</td>
          </tr>
          <tr>
            <td>Overdue Parcels</td>
            <td>{{ stats.overdueParcels }}</td>
          </tr>
        </tbody>
      </table>
    </div>

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
            <td>{{ parcel.trackingNumber }}</td>
            <td>{{ parcel.status.toUpperCase() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="print-section" v-if="overdueParcels.length > 0">
      <h3 class="print-section-title">Overdue Parcels (> 3 Days)</h3>
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
            <td>{{ parcel.status.toUpperCase() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- --- SECTION 2: RESIDENT MANAGEMENT OVERVIEW --- -->
    <div class="print-section">
      <h2 class="print-main-header">2. Resident Management Overview</h2>
      
      <h3 class="print-section-title">Statistics Overview (Residents & Comms)</h3>
      <table class="print-table">
        <thead>
          <tr>
            <th>Status Item</th>
            <th>Count / Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Registered Residents</td>
            <td>{{ stats.totalResidents }}</td>
          </tr>
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
          <tr>
            <td>Total System Announcements</td>
            <td>{{ stats.totalAnnouncements }}</td>
          </tr>
        </tbody>
      </table>
    </div>

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
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
@media print {
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
    padding: 2.5rem !important;
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
    text-transform: uppercase !important;
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
    text-transform: uppercase !important;
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
</style>
