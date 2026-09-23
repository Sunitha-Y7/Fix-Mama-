import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { applyVoiceEdit, generateComplaint } from '../services/complaintDraft.js'
import { speak, langCode } from '../services/speech.js'
import { analysisLabels } from '../i18n/labels.js'
import PriorityBadge from '../components/PriorityBadge.jsx'
import VoiceCapture from '../components/VoiceCapture.jsx'
import TopBar from '../components/TopBar.jsx'

export default function Complaint() {
  const { draft, updateDraft, setScreen, t, language } = useApp()
  const [editMode, setEditMode] = useState('')
  const [editText, setEditText] = useState('')
  const c = draft.complaint

  if (!c) {
    return (
      <div className="screen no-nav">
        <TopBar title={t('complaintTitle')} onBack={() => setScreen('voice')} />
        <p className="hint">{t('notFound')}</p>
      </div>
    )
  }

  const labels = analysisLabels(t, draft.analysis)
  const listen = () => speak(`${c.subject}. ${c.description}`, langCode(language))

  const apply = (command) => {
    if (!command.trim()) return
    updateDraft({ complaint: applyVoiceEdit(c, draft.analysis, command) })
    setEditMode('')
    setEditText('')
  }

  return (
    <div className="screen no-nav">
      <TopBar title={t('aiComplaint')} onBack={() => setScreen('voice')} />
      <div className="stack">
        <h2>{t('aiComplaint')}</h2>
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>{c.subject}</h2>
            <PriorityBadge level={c.priority} />
          </div>
          <div className="kv">
            <span>{t('problem')}</span>
            <span>{labels.problem}</span>
            <span>{t('category')}</span>
            <span>{labels.category}</span>
            <span>{t('location')}</span>
            <span>{c.location}</span>
            <span>{t('nearbyContext')}</span>
            <span>{labels.contexts}</span>
            <span>{t('priority')}</span>
            <span>{labels.priority}</span>
            <span>{t('complaint')}</span>
            <span>{c.description}</span>
          </div>
          {labels.reason && <div className="reason">{labels.reason}</div>}
        </div>
        <button className="btn soft block huge" type="button" onClick={listen}>🔊 {t('listen')}</button>
        <div className="row">
          <button className="btn ghost grow" type="button" onClick={() => setEditMode('type')}>✏️ {t('editText')}</button>
          <button className="btn ghost grow" type="button" onClick={() => setEditMode('speak')}>🎤 {t('editByVoice')}</button>
        </div>
        {editMode === 'speak' && (
          <VoiceCapture language={language} value={editText} onChange={setEditText} t={t} />
        )}
        {editMode === 'type' && (
          <input type="text" placeholder={t('editPlaceholder')} value={editText} onChange={(e) => setEditText(e.target.value)} />
        )}
        {editMode && (
          <button className="btn ghost block" type="button" onClick={() => apply(editText)}>
            {t('applyEdit')}
          </button>
        )}
        <button
          className="btn ghost block"
          type="button"
          onClick={() => updateDraft({ complaint: generateComplaint(draft.analysis, language) })}
        >
          🔄 {t('regenerate')}
        </button>
        <h3>{t('looksGood')}</h3>
        <button className="btn primary block huge" type="button" onClick={() => setScreen('send')}>
          {t('sendComplaint')}
        </button>
      </div>
    </div>
  )
}
