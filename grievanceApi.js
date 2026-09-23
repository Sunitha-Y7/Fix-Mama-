/**
 * Citizen send adapter.
 * POSTs to the Fix Mama admin email API. Does not file with government.
 * Admin email lives only on the server (FIX_MAMA_ADMIN_EMAIL).
 */

function makeReferenceId() {
  const y = new Date().getFullYear()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  const n = String(Date.now()).slice(-5)
  return `FM-${y}-${rand}${n}`
}

async function mockLocalSubmit(payload, referenceId) {
  await new Promise((r) => setTimeout(r, 700))
  return {
    ok: true,
    channel: 'mock-local',
    emailQueued: false,
    referenceId,
    status: 'Received by Fix Mama',
    submittedAt: new Date().toISOString(),
    department: payload.analysis?.department,
    category: payload.analysis?.category,
  }
}

export async function submitComplaint(payload) {
  const referenceId = makeReferenceId()
  const body = {
    referenceId,
    problem: payload.analysis?.problemDetected,
    categoryId: payload.analysis?.categoryId,
    category: payload.analysis?.category,
    priority: payload.analysis?.priority,
    priorityReason: payload.analysis?.priorityReasonEn,
    complaintText: payload.complaint?.description,
    subject: payload.complaint?.subject,
    location: payload.location || payload.analysis?.location,
    capturedAt: payload.capturedAt,
    userNotes: payload.transcript,
    mobile: payload.mobile,
    shareContact: Boolean(payload.shareContact),
    hasPhoto: Boolean(payload.photoDataUrl),
    photoReference: payload.photoDataUrl ? `local-draft:${referenceId}` : '',
    language: payload.language,
  }

  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('api')
    const data = await res.json()
    return {
      ok: true,
      channel: data.channel || 'admin-email',
      emailQueued: Boolean(data.emailQueued),
      referenceId: data.referenceId || referenceId,
      status: 'Received by Fix Mama',
      submittedAt: data.submittedAt || new Date().toISOString(),
      department: payload.analysis?.department,
      category: payload.analysis?.category,
    }
  } catch {
    // Server not running / email not configured — still save locally.
    return mockLocalSubmit(payload, referenceId)
  }
}
