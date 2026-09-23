import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { submitComplaint } from '../services/grievanceApi.js'
import PriorityBadge from '../components/PriorityBadge.jsx'
import TopBar from '../components/TopBar.jsx'

export default function Send() {
  const { draft, addComplaint, resetDraft, setScreen, setSelectedId, t, user, language } = useApp()
  const [phase, setPhase] = useState('ready')
  const [ack, setAck] = useState(null)
  const [error, setError] = useState('')
  const [shareContact, setShareContact] = useState(true)

  const send = async () => {
    setPhase('sending')
    setError('')
    try {
      const result = await submitComplaint({
        analysis: draft.analysis,
        complaint: draft.complaint,
        photoDataUrl: draft.photoDataUrl,
        transcript: draft.transcript,
        coords: draft.coords,
        location: draft.locationLabel,
        capturedAt: draft.capturedAt,
        mobile: user?.mobile,
        shareContact,
        language,
      })
      const record = {
        ...result,
        photoDataUrl: draft.photoDataUrl,
        transcript: draft.transcript,
        analysis: draft.analysis,
        complaint: draft.complaint,
        location: draft.locationLabel,
        capturedAt: draft.capturedAt,
        language,
        status: result.status || t('receivedStatus'),
      }
      addComplaint(record)
      setAck(record)
      resetDraft()
      setPhase('done')
    } catch {
      setPhase('ready')
      setError(t('sendFailed'))
    }
  }

  if (phase === 'sending') {
    return (
      <div className="screen no-nav">
        <TopBar title={t('sendTitle')} />
        <div className="sending">
          <div className="spinner" />
          <h2>{t('sending')}</h2>
          <p className="hint">{t('sendingHint')}</p>
        </div>
      </div>
    )
  }

  if (phase === 'done' && ack) {
    return (
      <div className="screen no-nav">
        <TopBar title={t('submittedTitle')} />
        <div className="stack">
          <div className="card stack">
          <div className="success-mark" aria-hidden="true">✅</div>
            <h2>{t('receivedSuccess')}</h2>
            <p className="hint">{t('successBody')}</p>
            <p className="ref">{t('referenceId')}: {ack.referenceId}</p>
            <div className="row">
              <span className="badge Received">{ack.status || t('receivedStatus')}</span>
              <PriorityBadge level={ack.complaint?.priority} />
            </div>
            <p className="disclaimer">{t('sendDisclaimer')}</p>
          </div>
          <button
            className="btn primary block"
            type="button"
            onClick={() => {
              setSelectedId(ack.referenceId)
              setScreen('complaintDetail')
            }}
          >
            {t('viewDetails')}
          </button>
          <button className="btn ghost block" type="button" onClick={() => setScreen('complaints')}>
            {t('myComplaints')}
          </button>
          <button className="btn primary block" type="button" onClick={() => setScreen('home')}>
            {t('reportAnother')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen no-nav">
      <TopBar title={t('sendTitle')} onBack={() => setScreen('complaint')} />
      <div className="stack">
        <div className="card stack">
          <h2>{draft.complaint?.subject}</h2>
          <p className="disclaimer">{t('sendDisclaimer')}</p>
          <label className="row" style={{ alignItems: 'flex-start' }}>
            <input type="checkbox" checked={shareContact} onChange={(e) => setShareContact(e.target.checked)} />
            <span className="hint">{t('shareContact')}</span>
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn accent block huge" type="button" onClick={send}>
          {t('sendComplaint')}
        </button>
      </div>
    </div>
  )
}
