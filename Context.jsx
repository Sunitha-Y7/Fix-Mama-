import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { CONTEXT_BUTTONS } from '../data/guidedChoices.js'
import SpeakableCard from '../components/SpeakableCard.jsx'
import TopBar from '../components/TopBar.jsx'

export default function Context() {
  const { draft, updateDraft, setScreen, t, language } = useApp()
  const [selected, setSelected] = useState(draft.userContexts?.length ? draft.userContexts : [])

  const toggle = (id) => {
    if (id === 'none') {
      setSelected(['none'])
      return
    }
    setSelected((prev) => {
      const withoutNone = prev.filter((item) => item !== 'none')
      return withoutNone.includes(id)
        ? withoutNone.filter((item) => item !== id)
        : [...withoutNone, id]
    })
  }

  const continueNext = () => {
    const contexts = selected.filter((id) => id !== 'none')
    updateDraft({ userContexts: selected.includes('none') ? [] : contexts })
    setScreen('voice')
  }

  return (
    <div className="screen no-nav">
      <TopBar title={t('nearImportantPlace')} onBack={() => setScreen('analysis')} />
      <div className="stack">
        <h2>{t('nearImportantPlace')}</h2>
        <p className="hint">{t('nearHint')}</p>
        <div className="guided-grid">
          {CONTEXT_BUTTONS.map((item) => (
            <SpeakableCard
              key={item.id}
              icon={item.icon}
              label={t(item.labelKey)}
              language={language}
              t={t}
              multi
              selected={selected.includes(item.id)}
              onSelect={() => toggle(item.id)}
            />
          ))}
        </div>
        <button className="btn primary block huge" type="button" onClick={continueNext}>
          {t('next')}
        </button>
      </div>
    </div>
  )
}
