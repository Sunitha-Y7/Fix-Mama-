import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { detectLocation, formatCoords, geolocationUnsupported, locationErrorKind } from '../services/location.js'
import TopBar from '../components/TopBar.jsx'

export default function Camera() {
  const { draft, updateDraft, setScreen, t } = useApp()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)
  const askedRef = useRef(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [locBusy, setLocBusy] = useState(!draft.locationStatus)

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const applyLocation = (result) => {
    const coords = result.coords
    updateDraft({
      coords,
      locationGeocoded: result.geocoded,
      locationLabel: result.geocoded ? result.label : '',
      locationStatus: 'detected',
    })
  }

  const locate = async ({ force = false } = {}) => {
    if (locBusy) return
    if (!force && (draft.locationStatus === 'detected' || draft.locationStatus === 'skipped')) return
    if (geolocationUnsupported()) {
      updateDraft({ locationStatus: 'unavailable', locationLabel: '', coords: null, locationGeocoded: false })
      return
    }
    setLocBusy(true)
    try {
      const result = await detectLocation()
      applyLocation(result)
    } catch (err) {
      updateDraft({
        locationStatus: 'unavailable',
        locationLabel: '',
        locationGeocoded: false,
        locationError: locationErrorKind(err),
      })
    } finally {
      setLocBusy(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setReady(true)
        }
      } catch {
        setError(t('cameraNeed'))
      }
    }
    if (!draft.photoDataUrl) start()
    if (!askedRef.current && !draft.locationStatus) {
      askedRef.current = true
      locate()
    }
    return () => {
      cancelled = true
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const capture = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 960
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    updateDraft({
      photoDataUrl: canvas.toDataURL('image/jpeg', 0.82),
      capturedAt: new Date().toISOString(),
    })
    stopStream()
  }

  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateDraft({
        photoDataUrl: String(reader.result),
        capturedAt: new Date().toISOString(),
      })
      stopStream()
    }
    reader.readAsDataURL(file)
  }

  const retake = async () => {
    updateDraft({ photoDataUrl: '', analysis: null, complaint: null })
    setReady(false)
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setReady(true)
      }
    } catch {
      setError(t('cameraRestart'))
    }
  }

  const captured = draft.capturedAt ? new Date(draft.capturedAt) : new Date()
  const dateLabel = captured.toLocaleDateString()
  const timeLabel = captured.toLocaleTimeString()
  const coordsLabel = formatCoords(draft.coords?.latitude, draft.coords?.longitude)
  const detected = draft.locationStatus === 'detected' && draft.coords
  const locationLine = detected
    ? (draft.locationGeocoded && draft.locationLabel
      ? draft.locationLabel
      : `${t('locationDetected')}${coordsLabel ? ` (${coordsLabel})` : ''}`)
    : t('locationUnavailable')

  return (
    <div className="screen no-nav">
      <TopBar title={t('showProblem')} onBack={() => setScreen('home')} />
      <div className="stack">
        <h2>{t('showProblem')}</h2>
        <p className="hint">{t('captureHint')}</p>
        {!draft.photoDataUrl ? (
          <>
            <div className="video-wrap">
              <video ref={videoRef} playsInline muted />
            </div>
            <LocationPanel
              t={t}
              locBusy={locBusy}
              detected={detected}
              locationLine={locationLine}
              skipped={draft.locationStatus === 'skipped'}
              onRetry={() => locate({ force: true })}
              onSkip={() => updateDraft({ locationStatus: 'skipped', locationLabel: '', locationGeocoded: false })}
            />
            {error && <p className="error">{error}</p>}
            <button className="btn primary block huge" type="button" onClick={capture} disabled={!ready}>
              📷 {t('takePhoto')}
            </button>
            <button className="btn ghost block" type="button" onClick={() => fileRef.current?.click()}>
              🖼 {t('uploadPhoto')}
            </button>
            <input ref={fileRef} className="file-input" type="file" accept="image/*" capture="environment" onChange={onFile} />
          </>
        ) : (
          <>
            <div className="preview-wrap">
              <img src={draft.photoDataUrl} alt={t('showProblem')} />
            </div>
            <div className="card stack">
              <strong>📷 {t('photoCaptured')}</strong>
              <div className="meta-pills">
                <span>📍 {t('metaLocation')}: {detected ? t('locationDetected') : t('locationNotDetected')}</span>
                <span>📅 {t('metaDate')}: {dateLabel}</span>
                <span>🕐 {t('metaTime')}: {timeLabel}</span>
              </div>
              <p className="hint">{locationLine}</p>
            </div>
            {!detected && draft.locationStatus !== 'skipped' && (
              <LocationPanel
                t={t}
                locBusy={locBusy}
                detected={detected}
                locationLine={locationLine}
                skipped={false}
                onRetry={() => locate({ force: true })}
                onSkip={() => updateDraft({ locationStatus: 'skipped', locationLabel: '', locationGeocoded: false })}
              />
            )}
            <div className="row">
              <button className="btn ghost grow" type="button" onClick={retake}>
                {t('retake')}
              </button>
              <button className="btn primary grow" type="button" onClick={() => setScreen('analysis')}>
                {t('confirmPhoto')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function LocationPanel({ t, locBusy, detected, locationLine, skipped, onRetry, onSkip }) {
  if (detected) {
    return (
      <div className="card">
        <p>📍 {locationLine}</p>
      </div>
    )
  }
  if (skipped) {
    return (
      <div className="card">
        <p className="hint">📍 {t('locationUnavailable')}</p>
      </div>
    )
  }
  return (
    <div className="card stack">
      <p className="hint">📍 {locBusy ? t('locating') : t('locationCouldNot')}</p>
      <div className="row">
        <button className="btn ghost grow" type="button" onClick={onRetry} disabled={locBusy}>
          {t('tryAgain')}
        </button>
        <button className="btn soft grow" type="button" onClick={onSkip}>
          {t('continueWithoutLocation')}
        </button>
      </div>
    </div>
  )
}
