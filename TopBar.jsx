import { useApp } from '../context/AppContext.jsx'

export default function TopBar({ title, onBack }) {
  const { t } = useApp()
  return (
    <div className="topbar">
      {onBack ? (
        <button className="back" onClick={onBack} type="button">
          ← {t('back')}
        </button>
      ) : (
        <span />
      )}
      <strong>{title}</strong>
      <span style={{ width: 64 }} />
    </div>
  )
}
