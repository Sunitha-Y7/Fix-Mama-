import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { applyGuidedSelection } from '../services/analysis.js'
import { generateComplaint } from '../services/complaintDraft.js'
import { formatCoords } from '../services/location.js'
import VoiceCapture from '../components/VoiceCapture.jsx'
import TopBar from '../components/TopBar.jsx'

export default function Voice() {
  const { draft, updateDraft, setScreen, t, language } = useApp()
  const [text, setText] = useState(draft.transcript || '')

  const finish = (extra = text) => {
    const coordsLabel = formatCoords(draft.coords?.latitude, draft.coords?.longitude)
    const locationLabel = draft.locationGeocoded && draft.locationLabel
      ? draft.locationLabel
      : draft.locationStatus === 'detected' && coordsLabel
        ? `${t('locationDetected')} (${coordsLabel})`
        : t('locationUnavailable')
    const analysis = applyGuidedSelection(
      { ...draft.analysis, location: locationLabel },
      {
        categoryId: draft.confirmedCategoryId || draft.analysis?.categoryId,
        contexts: draft.userContexts || [],
        extraText: extra,
      },
    )
    const complaint = generateComplaint(analysis, language)
    updateDraft({ transcript: extra, analysis, complaint })
    setScreen('complaint')
  }

  return (
    <div className="screen no-nav">
      <TopBar title={t('anythingElse')} onBack={() => setScreen('context')} />
      <div className="stack">
        <h2>{t('anythingElse')}</h2>
        <p className="hint">{t('speakOrType')}</p>
        <VoiceCapture language={language} value={text} onChange={setText} t={t} />
        <button className="btn primary block huge" type="button" onClick={() => finish(text)}>
          {t('continue')}
        </button>
        <button className="btn ghost block huge" type="button" onClick={() => finish('')}>
          {t('skipDetails')}
        </button>
      </div>
    </div>
  )
}
