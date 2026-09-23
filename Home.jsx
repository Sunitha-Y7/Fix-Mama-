import { useApp } from '../context/AppContext.jsx'

export default function Home() {
  const { user, setScreen, resetDraft, complaints, t } = useApp()
  const latest = complaints[0]

  return (
    <div className="screen stack">
      <div className="brand-hero">
        <p className="hint">{t('namaste')}{user?.name ? `, ${user.name}` : ''}</p>
        <h1>Fix Mama 😎</h1>
        <p className="tagline">{t('tagline')}</p>
        <p className="hint">{t('welcomeSupport')}</p>
      </div>
      <div className="hero-cta">
        <div className="civic-art" style={{ height: 88, marginBottom: 12, fontSize: '2.2rem' }} aria-hidden="true">🏘️</div>
        <h2>{t('heroTitle')}</h2>
        <p>{t('heroBody')}</p>
        <button
          className="btn huge block"
          style={{ background: '#fff', color: '#0f766e' }}
          type="button"
          onClick={() => {
            resetDraft()
            setScreen('camera')
          }}
        >
          {t('reportProblem')}
        </button>
      </div>
      <div className="card stack">
        <h3>{t('howItWorks')}</h3>
        <p className="hint">{t('flowSteps')}</p>
      </div>
      {latest && (
        <button className="card list-item" type="button" onClick={() => setScreen('complaints')} style={{ textAlign: 'left', border: '1px solid var(--line)' }}>
          <div>
            <p className="hint">{t('latestComplaint')}</p>
            <strong>{latest.complaint?.subject}</strong>
            <p className="hint">{latest.referenceId}</p>
          </div>
        </button>
      )}
    </div>
  )
}
