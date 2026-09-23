import { useState } from 'react'
import { createOtpSession } from '../services/otp.js'
import { useApp } from '../context/AppContext.jsx'

export default function Welcome() {
  const { setScreen, setOtpHint, setPendingMobile } = useApp()
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')

  const sendOtp = () => {
    const cleaned = mobile.replace(/\D/g, '')
    if (cleaned.length !== 10) {
      setError('Enter a valid 10-digit mobile number.')
      return
    }
    const session = createOtpSession(cleaned)
    setOtpHint(session.code)
    setPendingMobile(cleaned)
    setScreen('otp')
  }

  return (
    <div className="screen no-nav stack" style={{ paddingTop: 28 }}>
      <div className="civic-art" aria-hidden="true">🛣️</div>
      <div className="brand-hero">
        <div className="brand-mark">F</div>
        <h1>Fix Mama 😎</h1>
        <p className="tagline">Your voice. Your complaint. Your community.</p>
        <p className="hint">Report civic problems using your photo, voice, and location.</p>
      </div>
      <div className="card stack">
        <label className="field">
          Mobile number
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit number"
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))
              setError('')
            }}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary block huge" type="button" onClick={sendOtp}>
          Send OTP
        </button>
        <p className="disclaimer">
          Prototype login. OTP is verified on this device. SMS gateway can be connected later.
        </p>
      </div>
    </div>
  )
}
