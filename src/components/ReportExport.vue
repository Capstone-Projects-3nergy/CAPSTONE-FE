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

const handleExportExcel = () => {
  const stats = props.stats;
  const pending = props.pendingResidents;
  const topRes = props.topResidents;
  const announcements = props.announcements.slice(0, 5);
  const parcels = props.parcels.slice(0, 10);

  // 1. STATISTIC OVERVIEW
  const statsData = [
    ['Dormitory Management System - Full Summary Report'],
    ['Generated Date', new Date().toLocaleString()],
    [],
    ['1. STATISTIC OVERVIEW'],
    ['Category', 'Status Item', 'Count / Value'],
    ['Parcels', 'Total Received', stats.totalParcels],
    ['', 'Picked Up', stats.pickedUpParcels],
    ['', 'Awaiting Pickup', stats.awaitingParcels],
    ['', 'Overdue', stats.overdueParcels],
    ['Residents', 'Total Registered', stats.totalResidents],
    ['', 'Active Residents', stats.activeResidents],
    ['', 'Pending Approval', stats.pendingResidents],
    ['', 'Inactive', stats.inactiveResidents],
    ['Communications', 'Total Announcements', stats.totalAnnouncements],
    []
  ];

  // 2. PENDING APPROVALS
  const pendingData = [
    ['2. PENDING APPROVALS'],
    ['Name', 'Room No.', 'Email', 'Updated At'],
    ...pending.map(r => [r.fullName, r.roomNumber, r.email, r.updateAt ? new Date(r.updateAt).toLocaleString() : '-']),
    []
  ];

  // 3. TOP RESIDENTS
  const topResData = [
    ['3. TOP RESIDENTS (Active Activity)'],
    ['Rank', 'Name', 'Room No.', 'Parcel Count'],
    ...topRes.map((r, i) => [i + 1, r.fullName || r.name, r.roomNumber || r.room, r.count || r.parcelCount]),
    []
  ];

  // 4. RECENT ANNOUNCEMENTS
  const annData = [
    ['4. RECENT ANNOUNCEMENTS'],
    ['Title', 'Type', 'Date'],
    ...announcements.map(a => [a.title, a.type, new Date(a.createdAt || a.date).toLocaleDateString()]),
    []
  ];

  // 5. RECENT PARCELS 
  const parcelData = [
    ['5. RECENT PARCELS (Latest Activity)'],
    ['Date', 'Resident', 'Tracking No.', 'Status'],
    ...parcels.map(p => [new Date(p.updatedAt).toLocaleDateString(), p.residentName, p.trackingNumber, p.status.toUpperCase()])
  ];

  const finalData = [...statsData, ...pendingData, ...topResData, ...annData, ...parcelData];
  const ws = XLSX.utils.aoa_to_sheet(finalData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Full Summary Report");

  ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 20 }];
  XLSX.writeFile(wb, `Dormitory_Full_Data_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const handleExportPDF = () => {
  const doc = new jsPDF();
  const stats = props.stats;
  const topRes = props.topResidents;
  const parcels = props.parcels.slice(0, 10);
  const brandColor = [29, 53, 94]; // Navy Blue style

  let y = 20;

  const drawVerticalBarHeader = (text) => {
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
  drawVerticalBarHeader("1. Statistic Overview");
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
  
  // Table Borders (Outer and Header line)
  doc.setDrawColor(180, 180, 180);
  doc.rect(15, y - 5, 180, (statsItems.length * 8) + 8); // Table border box
  doc.line(15, y + 3, 195, y + 3); // Header bottom line

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
    doc.text(row.val.toString(), 190, y, { align: 'right' });
    if (idx < statsItems.length - 1) {
      doc.setDrawColor(230, 230, 230);
      doc.line(15, y + 2, 195, y + 2);
    }
    y += 8;
  });
  y += 15;

  // 3. TOP RESIDENTS Table
  if (y > 220) { doc.addPage(); y = 20; }
  drawVerticalBarHeader("3. Top Residents (Active Activity)");
  
  // Header Background
  doc.setFillColor(245, 247, 250);
  doc.rect(15, y - 5, 180, 8, 'F');

  doc.setFont("helvetica", "bold");
  doc.text("RANK", 17, y); 
  doc.text("NAME", 37, y); 
  doc.text("ROOM NO.", 102, y); 
  doc.text("PARCELS", 162, y);
  
  const topTableTop = y - 5;
  const topTableBottom = topTableTop + (topRes.length * 8) + 8;
  doc.setDrawColor(180, 180, 180);
  doc.rect(15, topTableTop, 180, (topRes.length * 8) + 8);
  doc.line(15, y + 3, 195, y + 3);

  // Top Table Vertical Lines
  const tv1 = 33;
  const tv2 = 100;
  const tv3 = 160;
  doc.line(tv1, topTableTop, tv1, topTableBottom);
  doc.line(tv2, topTableTop, tv2, topTableBottom);
  doc.line(tv3, topTableTop, tv3, topTableBottom);

  y += 8;
  doc.setFont("helvetica", "normal");
  topRes.forEach((res, i) => {
    doc.text((i + 1).toString(), 22, y, { align: 'center' });
    doc.text((res.fullName || res.name || '').substring(0, 25), 37, y);
    doc.text(res.roomNumber || res.room || '-', 130, y, { align: 'right' });
    doc.text((res.count || res.parcelCount || 0).toString(), 190, y, { align: 'right' });
    if (i < topRes.length - 1) {
      doc.setDrawColor(230, 230, 230);
      doc.line(15, y + 2, 195, y + 2);
    }
    y += 8;
  });
  y += 15;

  // 5. RECENT PARCELS Table
  if (y > 220) { doc.addPage(); y = 20; }
  drawVerticalBarHeader("5. Recent Parcels (Latest activity)");
  
  // Header Background
  doc.setFillColor(245, 247, 250);
  doc.rect(15, y - 5, 180, 8, 'F');

  doc.setFont("helvetica", "bold");
  doc.text("DATE", 17, y); 
  doc.text("RESIDENT", 47, y); 
  doc.text("TRACKING NO.", 97, y); 
  doc.text("STATUS", 163, y);
  
  const pTableTop = y - 5;
  const pTableBottom = pTableTop + (parcels.length * 8) + 8;
  doc.setDrawColor(180, 180, 180);
  doc.rect(15, pTableTop, 180, (parcels.length * 8) + 8);
  doc.line(15, y + 3, 195, y + 3);

  // Parcel Table Vertical Lines
  const pv1 = 45;
  const pv2 = 95;
  const pv3 = 160;
  doc.line(pv1, pTableTop, pv1, pTableBottom);
  doc.line(pv2, pTableTop, pv2, pTableBottom);
  doc.line(pv3, pTableTop, pv3, pTableBottom);

  y += 8;
  doc.setFont("helvetica", "normal");
  parcels.forEach((p, idx) => {
    doc.text(new Date(p.updatedAt).toLocaleDateString(), 17, y);
    doc.text((p.residentName || '').substring(0, 18), 47, y);
    doc.text((p.trackingNumber || '').substring(0, 20), 97, y);
    doc.text((p.status || '').toUpperCase(), 163, y);
    if (idx < parcels.length - 1) {
      doc.setDrawColor(230, 230, 230);
      doc.line(15, y + 2, 195, y + 2);
    }
    y += 8;
  });

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
      <h2 class="print-section-title">1. Statistic Overview</h2>
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
      <h2 class="print-section-title">2. Pending Approvals</h2>
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
            <td>{{ res.updateAt ? new Date(res.updateAt).toLocaleString() : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Top Residents (Parcel counts) -->
    <div class="print-section" v-if="topResidents.length > 0">
      <h2 class="print-section-title">3. Top Residents (Active Activity)</h2>
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
      <h2 class="print-section-title">4. Recent Announcements</h2>
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
            <td>{{ new Date(ann.createdAt || ann.date).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Recent Parcels -->
    <div class="print-section" v-if="parcels.length > 0">
      <h2 class="print-section-title">5. Recent Parcels (Latest activity)</h2>
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
            <td>{{ new Date(parcel.updatedAt).toLocaleDateString() }}</td>
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
