import { useEffect, useRef, useState } from 'react'

export const speechLanguageMap = {
  te: 'te-IN',
  en: 'en-IN',
  hi: 'hi-IN',
}

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

function joinText(...parts) {
  return parts
    .map((part) => String(part || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ')
}

function pickKeptText(current, next) {
  const left = String(current || '').trim()
  const right = String(next || '').trim()
  if (!right) return left
  if (!left) return right
  if (right.length >= left.length) return right
  return left
}

/**
 * Single active SpeechRecognition instance.
 * Final/interim/base text live in refs so Stop and onend cannot wipe the textarea.
 */
export function useSpeechToText({ language, initialValue, onChange }) {
  const [listening, setListening] = useState(false)
  const [errorKey, setErrorKey] = useState('')
  const [text, setText] = useState(initialValue || '')
  const [supported] = useState(() => Boolean(getSpeechRecognition()))

  const textRef = useRef(initialValue || '')
  const onChangeRef = useRef(onChange)
  const recRef = useRef(null)
  const userStoppedRef = useRef(true)
  const baseRef = useRef('')
  const sessionFinalRef = useRef('')
  const interimRef = useRef('')
  const restartTimerRef = useRef(null)
  const aliveRef = useRef(true)
  const langRef = useRef(language)
  const genRef = useRef(0)

  textRef.current = text
  onChangeRef.current = onChange
  langRef.current = language

  const publish = (next, { allowEmpty = false } = {}) => {
    const value = String(next ?? '')
    if (!allowEmpty && !value.trim() && textRef.current.trim()) return
    textRef.current = value
    setText(value)
    onChangeRef.current?.(value)
  }

  const liveTranscript = (includeInterim) =>
    joinText(baseRef.current, sessionFinalRef.current, includeInterim ? interimRef.current : '')

  const commitHeardText = () => {
    const kept = pickKeptText(textRef.current, liveTranscript(true))
    baseRef.current = kept
    sessionFinalRef.current = ''
    interimRef.current = ''
    if (kept) publish(kept)
    return kept
  }

  const attachHandlers = (rec, myGen) => {
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onresult = (event) => {
      if (myGen !== genRef.current) return
      let finals = ''
      let interim = ''
      for (let i = 0; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript || ''
        if (event.results[i].isFinal) finals += `${piece} `
        else interim += piece
      }
      const nextFinals = finals.trim()
      const nextInterim = interim.trim()
      if (!nextFinals && !nextInterim) {
        if (userStoppedRef.current) commitHeardText()
        return
      }
      sessionFinalRef.current = nextFinals
      interimRef.current = nextInterim

      if (userStoppedRef.current) {
        commitHeardText()
        return
      }

      const live = liveTranscript(true)
      if (live) publish(live)
    }

    rec.onerror = (event) => {
      if (myGen !== genRef.current) return
      const code = event.error
      if (code === 'no-speech' || code === 'aborted' || code === 'network') return
      if (code === 'not-allowed') {
        userStoppedRef.current = true
        commitHeardText()
        setListening(false)
        setErrorKey('micDenied')
        return
      }
      if (code === 'audio-capture') {
        userStoppedRef.current = true
        commitHeardText()
        setListening(false)
        setErrorKey('micCapture')
        return
      }
      if (code === 'service-not-allowed') {
        userStoppedRef.current = true
        commitHeardText()
        setListening(false)
        setErrorKey('speechService')
      }
    }

    rec.onend = () => {
      if (!aliveRef.current || myGen !== genRef.current) return
      commitHeardText()
      if (userStoppedRef.current) {
        setListening(false)
        return
      }
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
      restartTimerRef.current = setTimeout(() => {
        if (!aliveRef.current || userStoppedRef.current || myGen !== genRef.current) return
        try {
          rec.lang = speechLanguageMap[langRef.current] || 'en-IN'
          rec.start()
        } catch {
          /* already running */
        }
      }, 250)
    }
  }

  const killRec = () => {
    genRef.current += 1
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    const rec = recRef.current
    recRef.current = null
    if (!rec) return
    rec.onresult = null
    rec.onerror = null
    rec.onend = null
    try {
      rec.abort()
    } catch {
      try {
        rec.stop()
      } catch {
        /* already stopped */
      }
    }
  }

  const start = () => {
    setErrorKey('')
    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      setErrorKey('speechUnavailable')
      return
    }
    killRec()
    userStoppedRef.current = false
    baseRef.current = textRef.current.trim()
    sessionFinalRef.current = ''
    interimRef.current = ''
    setListening(true)

    const myGen = genRef.current
    const rec = new Ctor()
    recRef.current = rec
    rec.lang = speechLanguageMap[langRef.current] || 'en-IN'
    attachHandlers(rec, myGen)
    try {
      rec.start()
    } catch {
      /* start() while started */
    }
  }

  const stop = () => {
    userStoppedRef.current = true
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    commitHeardText()
    setListening(false)
    try {
      recRef.current?.stop()
    } catch {
      /* already stopped */
    }
  }

  const typeText = (next) => {
    publish(next, { allowEmpty: true })
    if (!listening) {
      baseRef.current = String(next || '').trim()
      sessionFinalRef.current = ''
      interimRef.current = ''
    }
  }

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      userStoppedRef.current = true
      killRec()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    text,
    listening,
    errorKey,
    supported,
    start,
    stop,
    typeText,
  }
}
