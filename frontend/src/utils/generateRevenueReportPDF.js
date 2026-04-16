/**
 * generateRevenueReportPDF
 * Professional A4 revenue report — real-world financial report format.
 */
export async function generateRevenueReportPDF({ summary, byDoctor, byHospital, monthlyTrend, byStatus, dateFrom, dateTo }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const PW = 210, PH = 297, ML = 20, MR = 20, CW = PW - ML - MR
  let y = 0, pageNum = 1

  // ── helpers ──────────────────────────────────────────────────────────────
  const rgb = (hex) => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
  const font = (size, style = 'normal', color = '#1f2937') => {
    doc.setFontSize(size); doc.setFont('helvetica', style); doc.setTextColor(...rgb(color))
  }
  const hline = (fy, color = '#e2e8f0', lw = 0.3) => {
    doc.setDrawColor(...rgb(color)); doc.setLineWidth(lw); doc.line(ML, fy, ML + CW, fy)
  }
  const box = (x, fy, w, h, fill, stroke, sw = 0.25) => {
    if (fill)   { doc.setFillColor(...rgb(fill));   doc.rect(x, fy, w, h, 'F') }
    if (stroke) { doc.setDrawColor(...rgb(stroke)); doc.setLineWidth(sw); doc.rect(x, fy, w, h, 'S') }
  }
  const txt = (t, x, fy, opts = {}) => doc.text(String(t ?? ''), x, fy, opts)
  const fmtN = (n) => (n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtS = (n) => {
    if (!n) return '0'
    if (n >= 1_000_000) return (n/1_000_000).toFixed(2) + 'M'
    if (n >= 1_000)     return (n/1_000).toFixed(2) + 'K'
    return n.toFixed(2)
  }
  const today = new Date().toLocaleDateString('en-LK', { year:'numeric', month:'long', day:'numeric' })
  const reportId = 'RPT-' + Date.now().toString(36).toUpperCase()
  const periodLabel = (dateFrom && dateTo)
    ? `${dateFrom}  to  ${dateTo}`
    : (dateFrom ? `From: ${dateFrom}` : (dateTo ? `To: ${dateTo}` : 'All Time'))

  // Professional business palette
  const C = {
    navy:    '#1e3a5f',
    blue:    '#1e40af',
    green:   '#047857',
    red:     '#b91c1c',
    amber:   '#b45309',
    sky:     '#0369a1',
    slate:   '#475569',
    light:   '#f8fafc',
    border:  '#e2e8f0',
    white:   '#ffffff',
    dark:    '#0f172a',
    text:    '#1f2937',
    muted:   '#64748b',
  }

  const addFooter = () => {
    hline(PH - 14, C.border, 0.3)
    font(6.5, 'normal', C.muted)
    txt('NexusCare Health Platform  |  Confidential Financial Report', ML, PH - 8)
    txt(`Page ${pageNum}  |  ${reportId}`, PW - MR, PH - 8, { align: 'right' })
  }

  const drawPageHeader = () => {
    box(0, 0, PW, 11, C.navy, null)
    font(9, 'bold', C.white)
    txt('NexusCare Health Platform', ML, 7.5)
    font(7, 'normal', '#93c5fd')
    txt('REVENUE & FINANCIAL REPORT', PW - MR, 7.5, { align: 'right' })
    y = 11
  }

  const newPage = () => {
    addFooter(); doc.addPage(); pageNum++; y = 0; drawPageHeader()
  }

  const checkY = (need = 20) => { if (y + need > PH - 22) newPage() }

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 1
  // ════════════════════════════════════════════════════════════════════════
  drawPageHeader()

  // ── Title block ──────────────────────────────────────────────────────────
  y += 9
  font(18, 'bold', C.dark)
  txt('Revenue Report', ML, y)
  y += 7
  font(8.5, 'normal', C.muted)
  txt(`Reporting Period: ${periodLabel}`, ML, y)
  font(8, 'normal', C.muted)
  txt(`Generated: ${today}`, PW - MR, y - 7, { align: 'right' })
  txt(`Report ID: ${reportId}`, PW - MR, y, { align: 'right' })
  y += 4
  hline(y, C.border, 0.5)
  y += 9

  // ── SECTION: Executive Summary ───────────────────────────────────────────
  font(7, 'bold', C.muted)
  txt('EXECUTIVE SUMMARY', ML, y)
  y += 5

  // 4 revenue KPI boxes
  const bW = (CW - 9) / 4
  const totalRev = summary.totalRevenue || 1
  const kpis = [
    { label: 'TOTAL PLATFORM REVENUE', value: summary.totalRevenue || 0, sub: `${summary.totalTransactions || 0} transactions`, accent: C.green },
    { label: 'DOCTOR CONSULTATION',    value: summary.doctorFeeRevenue || 0,   sub: ((summary.doctorFeeRevenue || 0) / totalRev * 100).toFixed(1) + '% of total', accent: C.blue },
    { label: 'HOSPITAL REVENUE',       value: summary.hospitalFeeRevenue || 0, sub: ((summary.hospitalFeeRevenue || 0) / totalRev * 100).toFixed(1) + '% of total', accent: C.red },
    { label: 'PLATFORM SERVICE FEE',   value: summary.serviceFeeRevenue || 0,  sub: 'Avg LKR ' + fmtS(summary.avgAmount) + ' / txn', accent: C.sky },
  ]

  kpis.forEach((k, i) => {
    const bx = ML + i * (bW + 3)
    box(bx, y, bW, 26, C.light, C.border, 0.3)
    // Colored top accent bar
    box(bx, y, bW, 2.5, k.accent, null)
    font(6, 'bold', C.muted)
    const lLines = doc.splitTextToSize(k.label, bW - 6)
    doc.text(lLines, bx + 4, y + 7)
    font(11, 'bold', C.dark)
    txt('LKR ' + fmtN(k.value), bx + 4, y + 17)
    font(6.5, 'normal', C.muted)
    txt(k.sub, bx + 4, y + 23)
  })
  y += 26

  // 3 secondary metrics
  y += 6
  const mW = (CW - 6) / 3
  const mets = [
    { label: 'TOTAL TRANSACTIONS',  value: String(summary.totalTransactions || 0) },
    { label: 'AVERAGE TRANSACTION', value: 'LKR ' + fmtN(summary.avgAmount) },
    { label: 'SUCCESSFUL PAYMENTS', value: 'LKR ' + fmtN(byStatus?.success?.total || 0) },
  ]
  mets.forEach((m, i) => {
    const mx = ML + i * (mW + 3)
    box(mx, y, mW, 13, C.white, C.border, 0.3)
    font(6, 'bold', C.muted)
    txt(m.label, mx + 4, y + 5)
    font(9, 'bold', C.dark)
    txt(m.value, mx + 4, y + 11)
  })
  y += 13

  // ── SECTION: Revenue Breakdown Table ─────────────────────────────────────
  y += 9
  font(7, 'bold', C.muted)
  txt('REVENUE BREAKDOWN BY CATEGORY', ML, y)
  y += 5

  // Header
  box(ML, y, CW, 8, C.navy, null)
  font(7, 'bold', C.white)
  txt('REVENUE CATEGORY', ML + 4, y + 5.5)
  txt('AMOUNT (LKR)', ML + 95, y + 5.5)
  txt('% OF TOTAL', ML + 133, y + 5.5)
  txt('SHARE', ML + CW - 4, y + 5.5, { align: 'right' })
  y += 8

  const cats = [
    { name: 'Doctor Consultation Fees', amount: summary.doctorFeeRevenue || 0,   color: C.blue },
    { name: 'Hospital Fees',            amount: summary.hospitalFeeRevenue || 0, color: C.red },
    { name: 'Platform Service Fees',    amount: summary.serviceFeeRevenue || 0,  color: C.sky },
  ]
  cats.forEach((cat, i) => {
    box(ML, y, CW, 9, i % 2 === 0 ? C.light : C.white, C.border, 0.2)
    const pct = ((cat.amount / totalRev) * 100).toFixed(1)
    font(8, 'normal', C.text)
    txt(cat.name, ML + 4, y + 6)
    font(8, 'bold', C.text)
    txt(fmtN(cat.amount), ML + 95, y + 6)
    font(8, 'normal', C.muted)
    txt(pct + '%', ML + 133, y + 6)
    // Bar
    const barW = Math.max((parseFloat(pct) / 100) * 28, 0.5)
    box(ML + CW - 32, y + 2.5, 28, 4, '#e5e7eb', null)
    doc.setFillColor(...rgb(cat.color)); doc.rect(ML + CW - 32, y + 2.5, barW, 4, 'F')
    y += 9
  })

  // Total row
  box(ML, y, CW, 9, C.navy, null)
  font(8, 'bold', C.white)
  txt('TOTAL REVENUE', ML + 4, y + 6)
  txt(fmtN(summary.totalRevenue || 0), ML + 95, y + 6)
  txt('100.0%', ML + 133, y + 6)
  y += 9

  // ── SECTION: Payment Status ───────────────────────────────────────────────
  y += 9
  checkY(55)
  font(7, 'bold', C.muted)
  txt('PAYMENT STATUS BREAKDOWN', ML, y)
  y += 5

  const sColors = { success: C.green, pending: C.amber, failed: C.red, cancelled: C.slate, chargedback: '#7c3aed' }
  const sEntries = Object.entries(byStatus || {})
  const sTotalAmt = sEntries.reduce((s, [, v]) => s + (v.total || 0), 0)

  box(ML, y, CW, 8, C.slate, null)
  font(7, 'bold', C.white)
  txt('STATUS', ML + 4, y + 5.5)
  txt('TRANSACTIONS', ML + 52, y + 5.5)
  txt('TOTAL AMOUNT (LKR)', ML + 95, y + 5.5)
  txt('% OF REVENUE', ML + 143, y + 5.5)
  y += 8

  sEntries.forEach(([status, val], i) => {
    box(ML, y, CW, 8, i % 2 === 0 ? C.light : C.white, C.border, 0.2)
    const pct = sTotalAmt > 0 ? ((val.total || 0) / sTotalAmt * 100) : 0
    const sc = sColors[status] || C.slate
    doc.setFillColor(...rgb(sc)); doc.circle(ML + 5.5, y + 4, 1.3, 'F')
    font(8, 'normal', C.text)
    txt(status.charAt(0).toUpperCase() + status.slice(1), ML + 10, y + 5.5)
    txt(String(val.count || 0), ML + 52, y + 5.5)
    txt(fmtN(val.total), ML + 95, y + 5.5)
    txt(pct.toFixed(1) + '%', ML + 143, y + 5.5)
    y += 8
  })

  // ── SECTION: Monthly Trend ────────────────────────────────────────────────
  y += 9
  checkY(70)
  font(7, 'bold', C.muted)
  txt('MONTHLY REVENUE TREND  (Last 12 Months)', ML, y)
  y += 5

  if (monthlyTrend && monthlyTrend.length > 0) {
    const maxR = Math.max(...monthlyTrend.map(m => m.revenue), 1)
    const chartH = 44
    const axisW = 18
    const plotW = CW - axisW
    const bW2 = Math.min(Math.floor(plotW / monthlyTrend.length) - 2, 13)
    const gap2 = (plotW - bW2 * monthlyTrend.length) / (monthlyTrend.length + 1)

    // Gridlines + Y-axis labels
    for (let g = 0; g <= 4; g++) {
      const gy = y + chartH - (g / 4) * chartH
      doc.setDrawColor(...rgb('#f1f5f9')); doc.setLineWidth(0.2)
      doc.line(ML + axisW, gy, ML + CW, gy)
      font(5.5, 'normal', C.muted)
      txt('LKR ' + fmtS((maxR * g) / 4), ML + axisW - 1, gy + 1, { align: 'right' })
    }

    monthlyTrend.forEach((m, i) => {
      const bx = ML + axisW + gap2 + i * (bW2 + gap2)
      const bh = Math.max((m.revenue / maxR) * chartH, 1)
      const by = y + chartH - bh
      box(bx, by, bW2, bh, C.green, null)
      // Lighter top highlight
      box(bx, by, bW2, Math.min(bh * 0.28, bh), '#059669', null)
      font(5.5, 'bold', C.dark)
      txt('LKR ' + fmtS(m.revenue), bx + bW2 / 2, by - 1.5, { align: 'center' })
      font(6, 'normal', C.muted)
      txt(m.label || '', bx + bW2 / 2, y + chartH + 5, { align: 'center' })
    })
    y += chartH + 10
  } else {
    font(8, 'normal', C.muted); txt('No monthly trend data available.', ML, y + 5); y += 12
  }

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 2 — DETAILED INCOME TABLES
  // ════════════════════════════════════════════════════════════════════════
  newPage()
  y += 8

  // ── Doctor Income ─────────────────────────────────────────────────────────
  font(7, 'bold', C.muted)
  txt('DOCTOR INCOME BREAKDOWN', ML, y)
  y += 5

  box(ML, y, CW, 8, C.blue, null)
  font(7, 'bold', C.white)
  txt('#', ML + 3, y + 5.5)
  txt('DOCTOR NAME', ML + 13, y + 5.5)
  txt('DOCTOR ID', ML + 80, y + 5.5)
  txt('TXN', ML + 122, y + 5.5)
  txt('TOTAL INCOME (LKR)', ML + 140, y + 5.5)
  y += 8

  const totalDocInc = byDoctor.reduce((s, d) => s + (d.totalIncome || 0), 0)
  byDoctor.forEach((d, i) => {
    checkY(10)
    box(ML, y, CW, 9, i % 2 === 0 ? C.light : C.white, C.border, 0.2)
    font(7, 'bold', C.muted); txt(String(i + 1), ML + 3, y + 6)
    font(8, 'normal', C.text); txt('Dr. ' + (d.doctorName || '—'), ML + 13, y + 6)
    font(7, 'normal', C.muted); txt(d.doctorId || '—', ML + 80, y + 6)
    font(8, 'normal', C.text); txt(String(d.transactions || 0), ML + 122, y + 6)
    font(8, 'bold', C.green); txt(fmtN(d.totalIncome), ML + 140, y + 6)
    y += 9
  })

  checkY(10)
  box(ML, y, CW, 9, C.blue, null)
  font(8, 'bold', C.white)
  txt('TOTAL DOCTOR INCOME', ML + 13, y + 6)
  txt(String(byDoctor.reduce((s, d) => s + (d.transactions || 0), 0)), ML + 122, y + 6)
  txt(fmtN(totalDocInc), ML + 140, y + 6)
  y += 9

  // ── Hospital Revenue ──────────────────────────────────────────────────────
  y += 10
  checkY(20)
  font(7, 'bold', C.muted)
  txt('HOSPITAL REVENUE BREAKDOWN', ML, y)
  y += 5

  box(ML, y, CW, 8, C.red, null)
  font(7, 'bold', C.white)
  txt('#', ML + 3, y + 5.5)
  txt('HOSPITAL NAME', ML + 13, y + 5.5)
  txt('LOCATION', ML + 85, y + 5.5)
  txt('APPTS', ML + 127, y + 5.5)
  txt('REVENUE (LKR)', ML + 147, y + 5.5)
  y += 8

  const totalHospRev = byHospital.reduce((s, h) => s + (h.revenue || 0), 0)
  byHospital.forEach((h, i) => {
    checkY(10)
    box(ML, y, CW, 9, i % 2 === 0 ? C.light : C.white, C.border, 0.2)
    font(7, 'bold', C.muted); txt(String(i + 1), ML + 3, y + 6)
    font(8, 'normal', C.text); txt(h.hospitalName || '—', ML + 13, y + 6)
    font(7, 'normal', C.muted); txt(h.location || '—', ML + 85, y + 6)
    font(8, 'normal', C.text); txt(String(h.appointments || 0), ML + 127, y + 6)
    font(8, 'bold', C.red); txt(fmtN(h.revenue), ML + 147, y + 6)
    y += 9
  })

  checkY(10)
  box(ML, y, CW, 9, C.red, null)
  font(8, 'bold', C.white)
  txt('TOTAL HOSPITAL REVENUE', ML + 13, y + 6)
  txt(String(byHospital.reduce((s, h) => s + (h.appointments || 0), 0)), ML + 127, y + 6)
  txt(fmtN(totalHospRev), ML + 147, y + 6)
  y += 9

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 3 — RECONCILIATION & CERTIFICATION
  // ════════════════════════════════════════════════════════════════════════
  newPage()
  y += 8

  font(7, 'bold', C.muted)
  txt('FINANCIAL RECONCILIATION SUMMARY', ML, y)
  y += 5

  const reconRows = [
    { label: 'Gross Platform Revenue',       value: summary.totalRevenue || 0,       bold: true,  indent: 0 },
    { label: 'Doctor Consultation Fees',     value: summary.doctorFeeRevenue || 0,   bold: false, indent: 1 },
    { label: 'Hospital Fees',                value: summary.hospitalFeeRevenue || 0, bold: false, indent: 1 },
    { label: 'Platform Service Fees',        value: summary.serviceFeeRevenue || 0,  bold: false, indent: 1 },
    { sep: true },
    { label: 'Total Successful Collections', value: byStatus?.success?.total || 0,   bold: false, indent: 0 },
    { label: 'Pending Collections',          value: byStatus?.pending?.total || 0,   bold: false, indent: 0 },
    { label: 'Failed / Cancelled',           value: (byStatus?.failed?.total || 0) + (byStatus?.cancelled?.total || 0), bold: false, indent: 0 },
    { sep: true },
    { label: 'NET REVENUE (Confirmed)',       value: byStatus?.success?.total || 0,  bold: true,  indent: 0, highlight: true },
  ]

  reconRows.forEach((row) => {
    if (row.sep) { y += 2; hline(y, C.border, 0.3); y += 4; return }
    if (row.highlight) {
      box(ML, y - 1, CW, 10, C.green, null)
      font(9, 'bold', C.white)
      txt(row.label, ML + 5 + row.indent * 5, y + 6)
      txt('LKR ' + fmtN(row.value), ML + CW - 5, y + 6, { align: 'right' })
      y += 10
    } else {
      font(8, row.bold ? 'bold' : 'normal', C.text)
      txt(row.label, ML + 5 + row.indent * 5, y + 5)
      txt('LKR ' + fmtN(row.value), ML + CW - 5, y + 5, { align: 'right' })
      hline(y + 7, '#f1f5f9', 0.2)
      y += 8
    }
  })

  // ── Certification ─────────────────────────────────────────────────────────
  y += 12
  checkY(50)
  box(ML, y, CW, 44, C.light, C.border, 0.3)
  box(ML, y, 3, 44, C.blue, null)
  font(8, 'bold', C.blue)
  txt('REPORT CERTIFICATION', ML + 8, y + 8)
  hline(y + 10, C.border, 0.2)
  font(7.5, 'normal', C.text)
  const certLines = [
    'This revenue report has been automatically generated by the NexusCare Health Platform',
    'financial reporting system. All figures are derived from confirmed payment records and',
    'are accurate as of the report generation date. This document is intended for authorized',
    'administrative personnel only and contains confidential financial information.',
  ]
  certLines.forEach((line, i) => txt(line, ML + 8, y + 16 + i * 5))
  font(7, 'normal', C.muted)
  txt(`Report ID: ${reportId}`, ML + 8, y + 37)
  txt(`Generated: ${today}`, ML + 8, y + 42)

  // Signature lines
  const sigY = y + 58
  checkY(30)
  hline(sigY, C.border, 0.3)
  ;[
    { label: 'Finance Officer', x: ML },
    { label: 'Platform Administrator', x: ML + (CW - 50) / 2 },
    { label: 'Authorized Signatory', x: ML + CW - 50 },
  ].forEach(sig => {
    doc.setDrawColor(...rgb(C.muted)); doc.setLineWidth(0.3)
    doc.line(sig.x, sigY + 14, sig.x + 50, sigY + 14)
    font(7, 'normal', C.muted)
    txt(sig.label, sig.x + 25, sigY + 19, { align: 'center' })
    font(6, 'normal', C.muted)
    txt('Signature & Date', sig.x + 25, sigY + 24, { align: 'center' })
  })

  addFooter()

  const dateSuffix = new Date().toISOString().slice(0, 10)
  doc.save(`NexusCare_Revenue_Report_${dateSuffix}.pdf`)
}
