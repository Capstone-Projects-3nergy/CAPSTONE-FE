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

const handleExportExcel = () => {
  const stats = props.stats;
  const pending = props.pendingResidents;
  const topRes = props.topResidents;
  const announcements = props.announcements.slice(0, 5);
  const parcels = props.parcels.slice(0, 10);

  // 1. MAIN HEADER
  const finalData = [
    ['Dormitory Management System - Full Summary Report'],
    ['Generated Date', new Date().toLocaleString()],
    []
  ];

  let sectionNum = 1;

  // 1. STATISTIC OVERVIEW (Always show)
  finalData.push([`${sectionNum++}. STATISTIC OVERVIEW`]);
  finalData.push(['Category', 'Status Item', 'Count / Value']);
  finalData.push(['Parcels', 'Total Received', stats.totalParcels]);
  finalData.push(['', 'Picked Up', stats.pickedUpParcels]);
  finalData.push(['', 'Awaiting Pickup', stats.awaitingParcels]);
  finalData.push(['', 'Overdue', stats.overdueParcels]);
  finalData.push(['Residents', 'Total Registered', stats.totalResidents]);
  finalData.push(['', 'Active Residents', stats.activeResidents]);
  finalData.push(['', 'Pending Approval', stats.pendingResidents]);
  finalData.push(['', 'Inactive', stats.inactiveResidents]);
  finalData.push(['Communications', 'Total Announcements', stats.totalAnnouncements]);
  finalData.push([]);

  // 2. PENDING APPROVALS
  if (pending && pending.length > 0) {
    finalData.push([`${sectionNum++}. PENDING APPROVALS`]);
    finalData.push(['Name', 'Room No.', 'Email', 'Updated At']);
    pending.forEach(r => {
      finalData.push([r.fullName, r.roomNumber, r.email, formatDateTime(r.updateAt)]);
    });
    finalData.push([]);
  }

  // 3. TOP RESIDENTS
  if (topRes && topRes.length > 0) {
    finalData.push([`${sectionNum++}. TOP RESIDENTS (Active Activity)`]);
    finalData.push(['Rank', 'Name', 'Room No.', 'Parcel Count']);
    topRes.forEach((r, i) => {
      finalData.push([i + 1, r.fullName || r.name, r.roomNumber || r.room, r.parcelCount || r.count]);
    });
    finalData.push([]);
  }

  // 4. RECENT ANNOUNCEMENTS
  if (announcements && announcements.length > 0) {
    finalData.push([`${sectionNum++}. RECENT ANNOUNCEMENTS`]);
    finalData.push(['Title', 'Type', 'Date']);
    announcements.forEach(a => {
      finalData.push([a.title, a.type, formatDate(a.createdAt || a.date)]);
    });
    finalData.push([]);
  }

  // 5. RECENT PARCELS 
  if (parcels && parcels.length > 0) {
    finalData.push([`${sectionNum++}. RECENT PARCELS (Latest Activity)`]);
    finalData.push(['Date', 'Resident', 'Tracking No.', 'Status']);
    parcels.forEach(p => {
      finalData.push([formatDate(p.updatedAt), p.residentName, p.trackingNumber, p.status?.toUpperCase()]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(finalData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Full Summary Report");

  ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 20 }];
  XLSX.writeFile(wb, `Dormitory_Full_Data_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const handleExportPDF = () => {
  const doc = new jsPDF();
  const stats = props.stats;
  const pending = props.pendingResidents;
  const topRes = props.topResidents;
  const announcements = props.announcements.slice(0, 5);
  const parcels = props.parcels.slice(0, 10);
  const brandColor = [29, 53, 94]; // Navy Blue style

  let y = 20;
  let sectionNum = 1;

  const checkPage = (heightNeeded) => {
    if (y + heightNeeded > 275) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  const drawVerticalBarHeader = (text) => {
    checkPage(15);
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.rect(15, y - 5, 3, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(29, 53, 94);
    doc.text(text, 22, y);
    y += 10;
  };

  // Main Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(29, 53, 94);
  doc.text("Dormitory Management System - Summary Report", 105, y, { align: 'center' });
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

  // 1. STATISTIC OVERVIEW Table
  drawVerticalBarHeader(`${sectionNum++}. Statistic Overview`);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const statsItems = [
    { cat: 'Parcels', item: 'Total Received', val: stats.totalParcels },
    { cat: '', item: 'Picked Up', val: stats.pickedUpParcels },
    { cat: '', item: 'Awaiting Pickup', val: stats.awaitingParcels },
    { cat: 'Residents', item: 'Total Registered', val: stats.totalResidents },
    { cat: '', item: 'Active Residents', val: stats.activeResidents },
    { cat: '', item: 'Pending Approval', val: stats.pendingResidents },
    { cat: 'Communications', item: 'Total Announcements', val: stats.totalAnnouncements }
  ];

  // Header Background
  doc.setFillColor(245, 247, 250);
  doc.rect(15, y - 5, 180, 8, 'F');
  
  // Header Text
  doc.setFont("helvetica", "bold");
  doc.text("CATEGORY", 18, y); 
  doc.text("STATUS ITEM", 75, y); 
  doc.text("COUNT / VALUE", 160, y);
  
  // Table Borders
  doc.setDrawColor(180, 180, 180);
  doc.rect(15, y - 5, 180, (statsItems.length * 8) + 8);
  doc.line(15, y + 3, 195, y + 3);

  // Vertical Divider Lines
  const vLine1 = 70;
  const vLine2 = 155;
  const tableTop = y - 5;
  const tableBottom = y - 5 + (statsItems.length * 8) + 8;
  doc.line(vLine1, tableTop, vLine1, tableBottom);
  doc.line(vLine2, tableTop, vLine2, tableBottom);

  y += 8;
  doc.setFont("helvetica", "normal");
  statsItems.forEach((row, idx) => {
    doc.text(row.cat || '', 18, y);
    doc.text(row.item, 75, y);
    doc.text((row.val ?? 0).toString(), 190, y, { align: 'right' });
    if (idx < statsItems.length - 1) {
      doc.setDrawColor(230, 230, 230);
      doc.line(15, y + 2, 195, y + 2);
    }
    y += 8;
  });
  y += 15;

  // 2. Pending Approvals
  if (pending && pending.length > 0) {
    drawVerticalBarHeader(`${sectionNum++}. Pending Approvals`);
    
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

    const penTableTop = y - 5;
    const penTableBottom = penTableTop + (pending.length * 8) + 8;
    doc.line(70, penTableTop, 70, penTableBottom);
    doc.line(95, penTableTop, 95, penTableBottom);
    doc.line(155, penTableTop, 155, penTableBottom);

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
    y += 15;
  }

  // 3. TOP RESIDENTS Table
  if (topRes && topRes.length > 0) {
    drawVerticalBarHeader(`${sectionNum++}. Top Residents (Active Activity)`);
    
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("RANK", 17, y); 
    doc.text("NAME", 37, y); 
    doc.text("ROOM NO.", 102, y); 
    doc.text("PARCELS", 162, y);
    
    doc.setDrawColor(180, 180, 180);
    doc.rect(15, y - 5, 180, (topRes.length * 8) + 8);
    doc.line(15, y + 3, 195, y + 3);

    const topTableTop = y - 5;
    const topTableBottom = topTableTop + (topRes.length * 8) + 8;
    doc.line(33, topTableTop, 33, topTableBottom);
    doc.line(100, topTableTop, 100, topTableBottom);
    doc.line(160, topTableTop, 160, topTableBottom);

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
    y += 15;
  }

  // 4. Recent Announcements
  if (announcements && announcements.length > 0) {
    drawVerticalBarHeader(`${sectionNum++}. Recent Announcements`);
    
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("TITLE", 17, y); 
    doc.text("TYPE", 112, y); 
    doc.text("DATE", 162, y);
    
    doc.setDrawColor(180, 180, 180);
    doc.rect(15, y - 5, 180, (announcements.length * 8) + 8);
    doc.line(15, y + 3, 195, y + 3);

    const annTableTop = y - 5;
    const annTableBottom = annTableTop + (announcements.length * 8) + 8;
    doc.line(110, annTableTop, 110, annTableBottom);
    doc.line(160, annTableTop, 160, annTableBottom);

    y += 8;
    doc.setFont("helvetica", "normal");
    announcements.forEach((ann, idx) => {
      doc.text((ann.title || '').substring(0, 50), 17, y);
      doc.text((ann.type || ''), 112, y);
      doc.text(formatDate(ann.createdAt || ann.date), 162, y);
      if (idx < announcements.length - 1) {
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y + 2, 195, y + 2);
      }
      y += 8;
    });
    y += 15;
  }

  // 5. RECENT PARCELS Table
  if (parcels && parcels.length > 0) {
    drawVerticalBarHeader(`${sectionNum++}. Recent Parcels (Latest activity)`);
    
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("DATE", 17, y); 
    doc.text("RESIDENT", 47, y); 
    doc.text("TRACKING NO.", 97, y); 
    doc.text("STATUS", 163, y);
    
    doc.setDrawColor(180, 180, 180);
    doc.rect(15, y - 5, 180, (parcels.length * 8) + 8);
    doc.line(15, y + 3, 195, y + 3);

    const pTableTop = y - 5;
    const pTableBottom = pTableTop + (parcels.length * 8) + 8;
    doc.line(45, pTableTop, 45, pTableBottom);
    doc.line(95, pTableTop, 95, pTableBottom);
    doc.line(160, pTableTop, 160, pTableBottom);

    y += 8;
    doc.setFont("helvetica", "normal");
    parcels.forEach((p, idx) => {
      doc.text(formatDate(p.updatedAt), 17, y);
      doc.text((p.residentName || '').substring(0, 18), 47, y);
      doc.text((p.trackingNumber || '').substring(0, 20), 97, y);
      doc.text((p.status || '').toUpperCase(), 163, y);
      if (idx < parcels.length - 1) {
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y + 2, 195, y + 2);
      }
      y += 8;
    });
  }

  doc.save(`Dormitory_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
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

    <!-- Quick Stats Table -->
    <div class="print-section">
      <h2 class="print-section-title">Statistic Overview</h2>
      <table class="print-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Status Item</th>
            <th>Count / Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan="4" class="font-bold">Parcels</td>
            <td>Total Received</td>
            <td>{{ stats.totalParcels }}</td>
          </tr>
          <tr>
            <td>Picked Up</td>
            <td>{{ stats.pickedUpParcels }}</td>
          </tr>
          <tr>
            <td>Awaiting Pickup</td>
            <td>{{ stats.awaitingParcels }}</td>
          </tr>
          <tr>
            <td>Overdue</td>
            <td>{{ stats.overdueParcels }}</td>
          </tr>
          <tr>
            <td rowspan="4" class="font-bold">Residents</td>
            <td>Total Registered</td>
            <td>{{ stats.totalResidents }}</td>
          </tr>
          <tr>
            <td>Active Residents</td>
            <td>{{ stats.activeResidents }}</td>
          </tr>
          <tr>
            <td>Pending Approval</td>
            <td>{{ stats.pendingResidents }}</td>
          </tr>
          <tr>
            <td>Inactive</td>
            <td>{{ stats.inactiveResidents }}</td>
          </tr>
          <tr>
            <td class="font-bold">Communications</td>
            <td>Total Announcements</td>
            <td>{{ stats.totalAnnouncements }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pending Approvals Table -->
    <div class="print-section" v-if="pendingResidents.length > 0">
      <h2 class="print-section-title">Pending Approvals</h2>
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

    <!-- Top Residents (Parcel counts) -->
    <div class="print-section" v-if="topResidents.length > 0">
      <h2 class="print-section-title">Top Residents (Active Activity)</h2>
      <table class="print-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Room No.</th>
            <th>Parcel Count</th>
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

    <!-- Recent Announcements -->
    <div class="print-section" v-if="announcements.length > 0">
      <h2 class="print-section-title">Recent Announcements</h2>
      <table class="print-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ann in announcements.slice(0, 5)" :key="ann.id">
            <td>{{ ann.title }}</td>
            <td>{{ ann.type }}</td>
            <td>{{ formatDate(ann.createdAt || ann.date) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Recent Parcels -->
    <div class="print-section" v-if="parcels.length > 0">
      <h2 class="print-section-title">Recent Parcels (Latest activity)</h2>
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
    margin-bottom: 3.5rem;
    page-break-inside: avoid;
    width: 100% !important;
  }

  .print-section-title {
    display: block !important;
    font-size: 20px !important;
    font-weight: 700 !important;
    color: #1D355E !important;
    margin-bottom: 1.25rem !important;
    border-left: 5px solid #1D355E !important;
    padding-left: 1rem !important;
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
