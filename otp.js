/**
 * OTP service.
 * FUTURE: replace mockVerify with SMS OTP (Twilio / MSG91 / government SMS gateway).
 */

const OTP_TTL_MS = 5 * 60 * 1000

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function createOtpSession(mobile) {
  const code = generateOtp()
  const session = {
    mobile,
    code,
    createdAt: Date.now(),
  }
  sessionStorage.setItem('fixmama_otp', JSON.stringify(session))
  return session
}

export function mockVerifyOtp(mobile, inputCode) {
  const raw = sessionStorage.getItem('fixmama_otp')
  if (!raw) return { ok: false, error: 'No OTP requested. Please resend.' }
  const session = JSON.parse(raw)
  if (session.mobile !== mobile) {
    return { ok: false, error: 'Mobile number does not match this OTP.' }
  }
  if (Date.now() - session.createdAt > OTP_TTL_MS) {
    return { ok: false, error: 'OTP expired. Please resend.' }
  }
  if (String(inputCode).trim() !== String(session.code)) {
    return { ok: false, error: 'Incorrect OTP. Try again.' }
  }
  sessionStorage.removeItem('fixmama_otp')
  return { ok: true }
}
