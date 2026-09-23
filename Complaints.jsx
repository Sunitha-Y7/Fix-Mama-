import { useApp } from '../context/AppContext.jsx'
import PriorityBadge from '../components/PriorityBadge.jsx'
import { analysisLabels } from '../i18n/labels.js'

export default function Complaints() {
  const { complaints, setSelectedId, setScreen, t } = useApp()

  return (
    <div className="screen stack">
      <div>
        <h1>{t('myComplaints')}</h1>
        <p className="tagline">{t('savedOnDevice')}</p>
      </div>
      {complaints.length === 0 && (
        <div className="card">
          <p className="hint">{t('noComplaints')}</p>
        </div>
      )}
      {complaints.map((item) => {
        const labels = analysisLabels(t, item.analysis)
        return (
          <button
            key={item.referenceId}
            className="card list-item"
            type="button"
            style={{ textAlign: 'left', border: '1px solid var(--line)', width: '100%' }}
            onClick={() => {
              setSelectedId(item.referenceId)
              setScreen('complaintDetail')
            }}
          >
            <div className="stack" style={{ gap: 6 }}>
              <span className="ref">{t('referenceId')}: {item.referenceId}</span>
              <strong>{labels.problem || item.complaint?.subject}</strong>
              <p className="hint">{item.location}</p>
              <p className="hint">{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : ''}</p>
            </div>
            <div className="stack" style={{ gap: 6, alignItems: 'flex-end' }}>
              <PriorityBadge level={item.complaint?.priority || item.analysis?.priority} />
              <span className="badge Received">{item.status || t('receivedStatus')}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
