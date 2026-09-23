/**
 * Browser speech helpers.
 * Speech-to-text lives in src/hooks/useSpeechToText.js
 * This file is text-to-speech + language codes only.
 */

export const LANG = {
  te: { code: 'te-IN', name: 'తెలుగు', speakName: 'తెలుగు' },
  en: { code: 'en-IN', name: 'English', speakName: 'English' },
  hi: { code: 'hi-IN', name: 'हिन्दी', speakName: 'हिन्दी' },
}

export const LANG_SPEAK = {
  te: 'తెలుగు. మీ భాష తెలుగు. ఈ భాషలోనే యాప్ నడుస్తుంది.',
  en: 'English. The app will continue in English.',
  hi: 'हिन्दी. ऐप अब हिन्दी में चलेगा.',
}

export const ttsLanguageMap = {
  te: 'te-IN',
  en: 'en-IN',
  hi: 'hi-IN',
}

export function langCode(lang) {
  return ttsLanguageMap[lang] || 'en-IN'
}

export function speak(text, langOrCode = 'en-IN') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  const code = langOrCode.includes('-') ? langOrCode : langCode(langOrCode)
  utter.lang = code
  utter.rate = 0.95
  const voices = window.speechSynthesis.getVoices()
  const match = voices.find((v) => v.lang === code) || voices.find((v) => v.lang?.startsWith(code.slice(0, 2)))
  if (match) utter.voice = match
  window.speechSynthesis.speak(utter)
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel()
}

export function isSpeechRecognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
}
