import { useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { LANG } from '../services/speech.js'

export default function Profile() {
  const { user, persistUser, complaints, setScreen, logout, t, language, setLanguage, setLangReturnTo } = useApp()
  const fileRef = useRef(null)

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => persistUser({ ...user, photoDataUrl: String(reader.result) })
    reader.readAsDataURL(file)
  }

  return (
    <div className="screen stack">
      <h1>{t('profile')}</h1>
      <div className="card stack" style={{ alignItems: 'center' }}>
        {user?.photoDataUrl ? (
          <img className="avatar" src={user.photoDataUrl} alt={t('name')} />
        ) : (
          <div className="avatar-fallback">{(user?.name || 'C')[0]}</div>
        )}
        <button className="btn ghost" type="button" onClick={() => fileRef.current?.click()}>
          {t('changePhoto')}
        </button>
        <input ref={fileRef} className="file-input" type="file" accept="image/*" onChange={onPhoto} />
        <label className="field" style={{ width: '100%' }}>
          {t('name')}
          <input type="text" value={user?.name || ''} onChange={(e) => persistUser({ ...user, name: e.target.value })} />
        </label>
        <label className="field" style={{ width: '100%' }}>
          {t('mobile')}
          <input type="tel" value={user?.mobile || ''} readOnly />
        </label>
        <label className="field" style={{ width: '100%' }}>
          {t('preferredLanguage')}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ font: 'inherit', padding: '12px 14px', borderRadius: 16, border: '1.5px solid var(--line)' }}
          >
            {Object.entries(LANG).map(([key, meta]) => (
              <option key={key} value={key}>{meta.name}</option>
            ))}
          </select>
        </label>
        <button
          className="btn ghost block"
          type="button"
          onClick={() => {
            setLangReturnTo('profile')
            setScreen('language')
          }}
        >
          {t('changeLanguage')}
        </button>
        <button className="btn primary block" type="button" onClick={() => setScreen('complaints')}>
          {t('myComplaints')} ({complaints.length})
        </button>
        <button className="btn ghost block" type="button" onClick={logout}>
          {t('signOut')}
        </button>
      </div>
    </div>
  )
}
