import { useState } from 'react'
import { mockVerifyOtp } from '../services/otp.js'
import { useApp } from '../context/AppContext.jsx'
import TopBar from '../components/TopBar.jsx'

export default function Otp() {
  const { pendingMobile, persistUser, setScreen, otpHint, setLangReturnTo } = useApp()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const verify = () => {
    const result = mockVerifyOtp(pendingMobile, code)
    if (!result.ok) {
      setError(result.error)
      return
    }
    persistUser({
      mobile: pendingMobile,
      name: 'Citizen',
      photoDataUrl: '',
      language: '',
    })
    setLangReturnTo('camera')
    setScreen('language')
  }

  return (
    <div className="screen no-nav">
      <TopBar title="Verify OTP" onBack={() => setScreen('welcome')} />
      <div className="stack">
        <p className="hint">Enter OTP</p>
        <p className="hint">Sent to +91 {pendingMobile}</p>
        {otpHint && (
          <div className="otp-banner">
            Demo OTP: <span className="ref">{otpHint}</span>
          </div>
        )}
        <input
          className="otp-single"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            setError('')
          }}
          onPaste={(e) => {
            const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6)
            if (pasted) {
              e.preventDefault()
              setCode(pasted)
            }
          }}
        />
        {error && <p className="error">{error}</p>}
        <button className="btn primary block" type="button" onClick={verify} disabled={code.length !== 6}>
          Verify & continue
        </button>
      </div>
    </div>
  )
}
