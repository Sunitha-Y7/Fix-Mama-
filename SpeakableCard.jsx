import { speak, langCode } from '../services/speech.js'

export default function SpeakableCard({
  icon,
  label,
  selected,
  onSelect,
  language,
  t,
  multi = false,
}) {
  const listen = (event) => {
    event.preventDefault()
    event.stopPropagation()
    speak(label, langCode(language))
  }

  return (
    <div className={`speakable-card ${selected ? 'selected' : ''}`}>
      <button
        type="button"
        className="speakable-pick"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={label}
      >
        <span className="speakable-icon" aria-hidden="true">{icon}</span>
        <span className="speakable-label">{label}</span>
        {multi && selected ? <span className="hint">✓</span> : null}
      </button>
      <button
        type="button"
        className="speaker"
        onClick={listen}
        aria-label={`${t('listen')}: ${label}`}
      >
        🔊
      </button>
    </div>
  )
}
