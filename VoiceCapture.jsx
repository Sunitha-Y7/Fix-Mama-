import { useRef } from 'react'
import { useSpeechToText } from '../hooks/useSpeechToText.js'

export default function VoiceCapture({ language, value, onChange, t }) {
  const areaRef = useRef(null)
  const { text, listening, errorKey, supported, start, stop, typeText } = useSpeechToText({
    language,
    initialValue: value || '',
    onChange,
  })

  return (
    <div className="stack voice-panel">
      <p className="hint speak-helper">{t('speakHelper')}</p>

      {!listening ? (
        <button className="mic-fab" type="button" onClick={start} aria-label={t('speak')} aria-pressed="false">
          🎤
          <span>{t('speak')}</span>
        </button>
      ) : (
        <div className="listen-panel" aria-live="polite">
          <div className="mic-fab listening" aria-hidden="true">🔴</div>
          <strong>🔴 {t('listening')}</strong>
          <button className="btn accent block huge" type="button" onClick={stop} aria-label={t('stopListening')}>
            🛑 {t('stopListening')}
          </button>
        </div>
      )}

      <label className="field">
        {t('yourMessage')}
          <textarea
          ref={areaRef}
          className="transcript"
          value={text}
          onChange={(e) => typeText(e.target.value)}
          placeholder={t('yourWordsPlaceholder')}
          aria-label={t('yourMessage')}
          aria-live="polite"
        />
      </label>

      {!supported && <p className="error">{t('speechUnavailable')}</p>}
      {errorKey && <p className="error">{t(errorKey)}</p>}

      {!listening && (
        <button className="btn soft block" type="button" onClick={() => areaRef.current?.focus()}>
          ⌨️ {t('typeInstead')}
        </button>
      )}
    </div>
  )
}
