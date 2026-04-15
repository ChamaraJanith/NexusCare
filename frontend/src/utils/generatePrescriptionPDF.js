/**
 * generatePrescriptionPDF
 * Produces a clean, professional, print-ready A4 prescription PDF
 * that looks like a real-world medical document.
 */
export async function generatePrescriptionPDF(rx, patientProfile, calcAge, fmtDate) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const PW = 210          // page width
  const PH = 297          // page height
  const ML = 20           // margin left
  const MR = 20           // margin right
  const CW = PW - ML - MR // content width = 170
  let y = 0

  // ─── tiny helpers ────────────────────────────────────────────────────────
  const rgb = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ]
  const font = (size, style = 'normal', color = '#111827') => {
    doc.setFontSize(size)
    doc.setFont('helvetica', style)
    doc.setTextColor(...rgb(color))
  }
  const hline = (fy, color = '#d1d5db', lw = 0.3) => {
    doc.setDrawColor(...rgb(color))
    doc.setLineWidth(lw)
    doc.line(ML, fy, ML + CW, fy)
  }
  const box = (x, fy, w, h, fill, stroke) => {
    if (fill) { doc.setFillColor(...rgb(fill)); doc.rect(x, fy, w, h, 'F') }
    if (stroke) { doc.setDrawColor(...rgb(stroke)); doc.setLineWidth(0.25); doc.rect(x, fy, w, h, 'S') }
  }
  const txt = (text, x, fy, opts = {}) => doc.text(String(text ?? ''), x, fy, opts)

  // ─── 1. CLINIC HEADER ────────────────────────────────────────────────────
  // Top blue accent bar (3 mm)
  box(0, 0, PW, 3, '#2563eb', null)

  y = 12
  font(22, 'bold', '#1e3a8a')
  txt('NexusCare', ML, y)

  font(8.5, 'normal', '#6b7280')
  txt('Electronic Medical Record System  |  nexuscare.health', ML, y + 6)

  // Right side: PRESCRIPTION label + ref
  font(11, 'bold', '#1e3a8a')
  txt('PRESCRIPTION', PW - MR, y, { align: 'right' })

  const rxId = String(rx._id || rx.prescriptionId || '').slice(-10).toUpperCase() || 'N/A'
  font(7.5, 'normal', '#6b7280')
  txt(`Ref No: ${rxId}`, PW - MR, y + 6, { align: 'right' })
  txt(`Date: ${fmtDate(rx.createdAt)}`, PW - MR, y + 11, { align: 'right' })

  y += 18
  hline(y, '#1e3a8a', 0.6)
  y += 8

  // ─── 2. PATIENT & DOCTOR INFO (two columns) ───────────────────────────────
  const colW = (CW - 8) / 2
  const col2 = ML + colW + 8

  // Patient column
  font(7, 'bold', '#6b7280')
  txt('PATIENT INFORMATION', ML, y)
  y += 4
  hline(y, '#e5e7eb', 0.2)
  y += 5

  const patName = patientProfile?.name || '—'
  const patId   = patientProfile?.patientId || '—'
  const age     = calcAge(patientProfile?.dateOfBirth)
  const gender  = patientProfile?.gender
    ? patientProfile.gender.charAt(0).toUpperCase() + patientProfile.gender.slice(1)
    : '—'
  const blood   = patientProfile?.bloodGroup || '—'

  font(11, 'bold', '#111827')
  txt(patName, ML, y)
  y += 5.5
  font(8.5, 'normal', '#374151')
  txt(`Patient ID: ${patId}`, ML, y); y += 5
  txt(`Age / Gender: ${age ? age + ' yrs' : '—'} / ${gender}`, ML, y); y += 5
  txt(`Blood Group: ${blood}`, ML, y)

  // Doctor column (same y start)
  const docStartY = y - 15.5
  font(7, 'bold', '#6b7280')
  txt('PRESCRIBING PHYSICIAN', col2, docStartY)
  doc.setDrawColor(...rgb('#e5e7eb')); doc.setLineWidth(0.2)
  doc.line(col2, docStartY + 4, col2 + colW, docStartY + 4)

  font(11, 'bold', '#111827')
  txt(rx.doctorName || 'Dr. Unknown', col2, docStartY + 9)
  font(8.5, 'normal', '#374151')
  txt('NexusCare Registered Physician', col2, docStartY + 14.5)
  if (rx.followUpDate) {
    txt(`Follow-up: ${fmtDate(rx.followUpDate)}`, col2, docStartY + 19.5)
  }

  y += 10
  hline(y, '#d1d5db', 0.3)
  y += 8

  // ─── 3. DIAGNOSIS ────────────────────────────────────────────────────────
  font(7, 'bold', '#6b7280')
  txt('DIAGNOSIS', ML, y)
  y += 5

  font(12, 'bold', '#111827')
  const diagLines = doc.splitTextToSize(rx.diagnosis || '—', CW)
  doc.text(diagLines, ML, y)
  y += diagLines.length * 6 + 4
  hline(y, '#d1d5db', 0.3)
  y += 8

  // ─── 4. SYMPTOMS (if present) ────────────────────────────────────────────
  const hasSym = rx.symptoms && (Array.isArray(rx.symptoms) ? rx.symptoms.length : rx.symptoms)
  if (hasSym) {
    const syms = Array.isArray(rx.symptoms)
      ? rx.symptoms
      : rx.symptoms.split(',').map(s => s.trim()).filter(Boolean)

    font(7, 'bold', '#6b7280')
    txt('PRESENTING SYMPTOMS', ML, y)
    y += 5
    font(9, 'normal', '#374151')
    txt(syms.join('   •   '), ML, y)
    y += 8
    hline(y, '#d1d5db', 0.3)
    y += 8
  }

  // ─── 5. MEDICINES TABLE ───────────────────────────────────────────────────
  font(7, 'bold', '#6b7280')
  txt('PRESCRIBED MEDICATIONS', ML, y)
  y += 5

  const meds = rx._meds || []

  // Column widths (total = CW = 170)
  const cNum  = 8
  const cName = 50
  const cDose = 22
  const cFreq = 32
  const cDur  = 22
  const cInst = CW - cNum - cName - cDose - cFreq - cDur  // remaining

  const xNum  = ML
  const xName = xNum  + cNum
  const xDose = xName + cName
  const xFreq = xDose + cDose
  const xDur  = xFreq + cFreq
  const xInst = xDur  + cDur

  // Table header row
  box(ML, y, CW, 7, '#1e3a8a', null)
  font(6.5, 'bold', '#ffffff')
  txt('#',            xNum  + 1.5, y + 5)
  txt('MEDICINE',     xName + 2,   y + 5)
  txt('DOSAGE',       xDose + 2,   y + 5)
  txt('FREQUENCY',    xFreq + 2,   y + 5)
  txt('DURATION',     xDur  + 2,   y + 5)
  txt('INSTRUCTIONS', xInst + 2,   y + 5)
  y += 7

  meds.forEach((med, i) => {
    const name  = typeof med === 'string' ? med : (med.name  || '—')
    const dose  = typeof med === 'string' ? '—' : (med.dosage || '—')
    const freq  = typeof med === 'string' ? '—' : (med.frequency || '—')
    const dur   = typeof med === 'string' ? '—' : (med.duration || '—')
    const inst  = typeof med === 'string' ? '—' : (med.instructions || med.notes || '—')

    doc.setFontSize(8)
    const nameLines = doc.splitTextToSize(name, cName - 3)
    const instLines = doc.splitTextToSize(inst, cInst - 3)
    const rowH = Math.max(10, Math.max(nameLines.length, instLines.length) * 4.5 + 4)

    const rowBg = i % 2 === 0 ? '#f9fafb' : '#ffffff'
    box(ML, y, CW, rowH, rowBg, '#e5e7eb')

    // vertical column dividers
    ;[xName, xDose, xFreq, xDur, xInst].forEach(cx => {
      doc.setDrawColor(...rgb('#e5e7eb'))
      doc.setLineWidth(0.2)
      doc.line(cx, y, cx, y + rowH)
    })

    const mid = y + rowH / 2 + 1.5

    font(8, 'bold', '#6b7280')
    txt(String(i + 1), xNum + 2.5, mid)

    font(8.5, 'bold', '#111827')
    doc.text(nameLines, xName + 2, y + 5)

    font(8, 'normal', '#374151')
    txt(dose, xDose + 2, mid)
    txt(freq, xFreq + 2, mid)

    font(8, 'bold', '#065f46')
    txt(dur, xDur + 2, mid)

    font(7.5, 'normal', '#6b7280')
    doc.text(instLines, xInst + 2, y + 5)

    y += rowH
  })

  y += 10

  // ─── 6. ADVICE & NOTES ───────────────────────────────────────────────────
  const hasAdvice = !!rx.advice
  const hasNotes  = !!rx.notes

  if (hasAdvice || hasNotes) {
    hline(y - 2, '#d1d5db', 0.3)

    const bW    = hasAdvice && hasNotes ? (CW - 6) / 2 : CW
    const bX2   = ML + bW + 6
    const textW = bW - 10  // account for accent bar + padding

    if (hasAdvice && hasNotes) {
      // Set font size BEFORE splitTextToSize so line-count is accurate
      doc.setFontSize(8.5)
      const aLines = doc.splitTextToSize(rx.advice, textW)
      const nLines = doc.splitTextToSize(rx.notes,  textW)
      // Minimum 2 lines height so short content doesn't look tiny
      const lineCount = Math.max(aLines.length, nLines.length, 2)
      const sharedH = lineCount * 5.5 + 12

      // Labels
      font(7, 'bold', '#6b7280')
      txt("DOCTOR'S ADVICE",  ML,  y + 4)
      txt('ADDITIONAL NOTES', bX2, y + 4)

      // Advice box — draw fill first, then border, then accent, then text
      doc.setFillColor(...rgb('#f0fdf4'))
      doc.rect(ML, y + 6, bW, sharedH, 'F')
      doc.setDrawColor(...rgb('#bbf7d0'))
      doc.setLineWidth(0.25)
      doc.rect(ML, y + 6, bW, sharedH, 'S')
      doc.setFillColor(...rgb('#16a34a'))
      doc.rect(ML, y + 6, 2.5, sharedH, 'F')
      font(8.5, 'normal', '#166534')
      doc.text(aLines, ML + 6.5, y + 13)

      // Notes box — exact same sharedH
      doc.setFillColor(...rgb('#eff6ff'))
      doc.rect(bX2, y + 6, bW, sharedH, 'F')
      doc.setDrawColor(...rgb('#bfdbfe'))
      doc.setLineWidth(0.25)
      doc.rect(bX2, y + 6, bW, sharedH, 'S')
      doc.setFillColor(...rgb('#2563eb'))
      doc.rect(bX2, y + 6, 2.5, sharedH, 'F')
      font(8.5, 'normal', '#1e40af')
      doc.text(nLines, bX2 + 6.5, y + 13)

      y += sharedH + 10

    } else if (hasAdvice) {
      font(7, 'bold', '#6b7280')
      txt("DOCTOR'S ADVICE", ML, y + 4)
      const aLines = doc.splitTextToSize(rx.advice, textW)
      const aH = aLines.length * 5.5 + 10
      box(ML, y + 6, bW, aH, '#f0fdf4', '#bbf7d0')
      doc.setFillColor(...rgb('#16a34a'))
      doc.rect(ML, y + 6, 2.5, aH, 'F')
      font(8.5, 'normal', '#166534')
      doc.text(aLines, ML + 6.5, y + 13)
      y += aH + 10

    } else {
      font(7, 'bold', '#6b7280')
      txt('ADDITIONAL NOTES', ML, y + 4)
      const nLines = doc.splitTextToSize(rx.notes, CW - 10)
      const nH = nLines.length * 5.5 + 10
      box(ML, y + 6, CW, nH, '#eff6ff', '#bfdbfe')
      doc.setFillColor(...rgb('#2563eb'))
      doc.rect(ML, y + 6, 2.5, nH, 'F')
      font(8.5, 'normal', '#1e40af')
      doc.text(nLines, ML + 6.5, y + 13)
      y += nH + 10
    }
  }

  // ─── 7. SIGNATURE AREA ───────────────────────────────────────────────────
  // Sit 16mm below last content — no forced bottom gap
  const sigY = y + 16

  hline(sigY, '#d1d5db', 0.3)

  // Doctor signature box (right side)
  const sigW = 65
  const sigX = PW - MR - sigW
  doc.setDrawColor(...rgb('#9ca3af'))
  doc.setLineWidth(0.3)
  doc.line(sigX, sigY + 16, sigX + sigW, sigY + 16)
  font(7.5, 'normal', '#6b7280')
  txt('Physician Signature & Stamp', sigX + sigW / 2, sigY + 20, { align: 'center' })
  font(8.5, 'bold', '#374151')
  txt(rx.doctorName || 'Dr. Unknown', sigX + sigW / 2, sigY + 26, { align: 'center' })

  // ─── 8. FOOTER ───────────────────────────────────────────────────────────
  hline(PH - 16, '#d1d5db', 0.3)
  font(6.5, 'normal', '#9ca3af')
  txt(
    'This prescription is digitally generated by NexusCare EMR. Present this document to your pharmacist.',
    ML, PH - 11
  )
  font(6.5, 'bold', '#2563eb')
  txt('NexusCare Health Platform', PW - MR, PH - 11, { align: 'right' })

  // ─── SAVE ─────────────────────────────────────────────────────────────────
  const safeName = (rx.diagnosis || 'Prescription')
    .replace(/[^a-z0-9]/gi, '_')
    .slice(0, 40)
  doc.save(`NexusCare_Rx_${safeName}.pdf`)
}
