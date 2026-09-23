import { useApp } from '../context/AppContext.jsx'
import { LANG, LANG_SPEAK, speak } from '../services/speech.js'
import TopBar from '../components/TopBar.jsx'

const FLAGS = { te: '🇮🇳', en: '🇮🇳', hi: '🇮🇳' }

export default function Language() {
  const { user, persistUser, setLanguage, setScreen, t, langReturnTo, resetDraft } = useApp()

  const pick = (key) => {
    setLanguage(key)
    persistUser({
      ...(user || {}),
      language: key,
    })
    if (langReturnTo === 'profile') {
      setScreen('profile')
      return
    }
    resetDraft()
    setScreen('camera')
  }

  return (
    <div className="screen no-nav">
      {langReturnTo === 'profile' && (
        <TopBar title={t('chooseLanguage')} onBack={() => setScreen('profile')} />
      )}
      <div className="stack">
        <h1>{t('chooseLanguage')}</h1>
        <p className="hint">{t('languageHint')}</p>
        {Object.entries(LANG).map(([key, meta]) => (
          <div className="card lang-card" key={key}>
            <button className="pick" type="button" onClick={() => pick(key)}>
              {FLAGS[key]} {meta.name}
            </button>
            <button
              className="speaker"
              type="button"
              aria-label={`${t('listen')}: ${meta.name}`}
              onClick={() => speak(LANG_SPEAK[key], meta.code)}
            >
              🔊
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
