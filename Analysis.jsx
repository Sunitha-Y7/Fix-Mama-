import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { analyzePhoto, applyGuidedSelection } from '../services/analysis.js'
import { analysisLabels } from '../i18n/labels.js'
import { PROBLEM_BUTTONS } from '../data/guidedChoices.js'
import PriorityBadge from '../components/PriorityBadge.jsx'
import VoiceCapture from '../components/VoiceCapture.jsx'
import SpeakableCard from '../components/SpeakableCard.jsx'
import TopBar from '../components/TopBar.jsx'

export default function Analysis() {
  const { draft, updateDraft, setScreen, t, language } = useApp()
  const [step, setStep] = useState(draft.analysis ? 'review' : 'loading')
  const [correction, setCorrection] = useState(draft.correction || '')

  useEffect(() => {
    if (draft.analysis) {
      setStep('review')
      return
    }
    let cancelled = false
    async function run() {
      setStep('loading')
      const analysis = await analyzePhoto({
        photoDataUrl: draft.photoDataUrl,
        locationLabel: draft.locationGeocoded ? draft.locationLabel : '',
        capturedAt: draft.capturedAt,
      })
      if (cancelled) return
      updateDraft({ analysis })
      setStep('review')
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goContext = (analysis, categoryId) => {
    updateDraft({
      analysis,
      confirmedCategoryId: categoryId || analysis?.categoryId,
      correction,
    })
    setScreen('context')
  }

  const confirmDetected = () => {
    goContext(draft.analysis, draft.analysis.categoryId)
  }

  const pickCategory = (id) => {
    const analysis = applyGuidedSelection(draft.analysis, {
      categoryId: id,
      contexts: draft.userContexts || [],
      extraText: correction,
    })
    goContext(analysis, id)
  }

  const a = draft.analysis
  const labels = analysisLabels(t, a)

  if (step === 'loading' || !a) {
    return (
      <div className="screen no-nav">
        <TopBar title={t('analyzingImage')} onBack={() => setScreen('camera')} />
        <div className="sending">
          <div className="spinner" />
          <h2>🔍 {t('analyzingImage')}</h2>
          <p className="hint">{t('checkingImage')}</p>
        </div>
      </div>
    )
  }

  if (step === 'correct') {
    return (
      <div className="screen no-nav">
        <TopBar title={t('whatsTheProblem')} onBack={() => setStep('review')} />
        <div className="stack">
          <h2>{t('whatsTheProblem')}</h2>
          <p className="hint">{t('correctHint')}</p>
          <div className="guided-grid">
            {PROBLEM_BUTTONS.map((item) => (
              <SpeakableCard
                key={item.id}
                icon={item.icon}
                label={t(item.labelKey)}
                language={language}
                t={t}
                selected={draft.confirmedCategoryId === item.id}
                onSelect={() => pickCategory(item.id)}
              />
            ))}
          </div>
          <h3>{t('preferSpeaking')}</h3>
          <VoiceCapture language={language} value={correction} onChange={setCorrection} t={t} />
          <button
            className="btn primary block huge"
            type="button"
            onClick={() => pickCategory(draft.confirmedCategoryId || a.categoryId || 'other')}
          >
            {t('continue')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen no-nav">
      <TopBar title={t('problemDetected')} onBack={() => setScreen('camera')} />
      <div className="stack">
        {draft.photoDataUrl && (
          <div className="preview-wrap" style={{ aspectRatio: '4 / 3' }}>
            <img src={draft.photoDataUrl} alt={t('showProblem')} />
          </div>
        )}
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <h2>{t('whatWeDetected')}</h2>
            <PriorityBadge level={a.priority} />
          </div>
          <div className="detect-grid">
            <div className="detect-card">
              <span className="hint">{t('problem')}</span>
              <strong>🚧 {labels.problem}</strong>
            </div>
            <div className="detect-card">
              <span className="hint">{t('category')}</span>
              <strong>{labels.category}</strong>
            </div>
            <div className="detect-card">
              <span className="hint">{t('severity')}</span>
              <strong>{labels.severity}</strong>
            </div>
            <div className="detect-card">
              <span className="hint">{t('confidence')}</span>
              <strong>{a.confidence != null ? `${Math.round(Number(a.confidence) * 100)}%` : '—'}</strong>
            </div>
          </div>
          {a.description && (
            <div className="reason">
              <p className="hint">{t('whyLabel')}</p>
              {a.description}
            </div>
          )}
          <p className="disclaimer">
            {String(a.source || '').startsWith('vision-api') ? t('analysisModeVision') : t('mockVisionNote')}
          </p>
        </div>
        <h3>{t('isThisCorrect')}</h3>
        <button className="btn primary block huge" type="button" onClick={confirmDetected}>
          ✅ {t('yesConfirm')}
        </button>
        <button className="btn ghost block huge" type="button" onClick={() => setStep('correct')}>
          ✏️ {t('changeProblem')}
        </button>
      </div>
    </div>
  )
}
