import { useApp } from '../context/AppContext.jsx'
import PriorityBadge from '../components/PriorityBadge.jsx'
import TopBar from '../components/TopBar.jsx'
import { speak, langCode } from '../services/speech.js'
import { analysisLabels } from '../i18n/labels.js'

export default function ComplaintDetail() {
  const { complaints, selectedId, setScreen, t, language } = useApp()
  const item = complaints.find((c) => c.referenceId === selectedId)
  const labels = analysisLabels(t, item?.analysis)

  if (!item) {
    return (
      <div className="screen">
        <TopBar title={t('complaint')} onBack={() => setScreen('complaints')} />
        <p className="hint">{t('notFound')}</p>
      </div>
    )
  }

  return (
    <div className="screen">
      <TopBar title={t('details')} onBack={() => setScreen('complaints')} />
      <div className="stack">
        {item.photoDataUrl && (
          <div className="preview-wrap">
            <img src={item.photoDataUrl} alt="" />
            <div className="loc-chip">📍 {item.location}</div>
          </div>
        )}
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="ref">{item.referenceId}</span>
            <span className="badge Received">{item.status || t('receivedStatus')}</span>
          </div>
          <h2>{item.complaint?.subject}</h2>
          <PriorityBadge level={item.complaint?.priority} />
          <p>{item.complaint?.description}</p>
          <div className="kv">
            <span>{t('problem')}</span>
            <span>{labels.problem}</span>
            <span>{t('location')}</span>
            <span>{item.location}</span>
            <span>{t('date')}</span>
            <span>{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : ''}</span>
            <span>{t('priority')}</span>
            <span>{labels.priority}</span>
          </div>
          {labels.reason && <div className="reason">{labels.reason}</div>}
          <p className="disclaimer">{t('sendDisclaimer')}</p>
          <button
            className="btn soft block"
            type="button"
            onClick={() => speak(`${item.complaint?.subject}. ${item.complaint?.description}`, langCode(item.language || language))}
          >
            🔊 {t('listen')}
          </button>
        </div>
      </div>
    </div>
  )
}
