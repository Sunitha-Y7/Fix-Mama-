/**
 * Browser Geolocation + optional server reverse geocode (Nominatim).
 * Coordinates are always the source of truth. Addresses are shown only
 * when reverse geocoding actually returns a name.
 */

export function geolocationUnsupported() {
  return typeof navigator === 'undefined' || !navigator.geolocation
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const err = new Error('unsupported')
      err.code = 0
      reject(err)
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })
  })
}

export function locationErrorKind(err) {
  const code = err?.code
  if (code === 1) return 'denied'
  if (code === 3) return 'timeout'
  if (code === 0 || /unsupported/i.test(String(err?.message || ''))) return 'unsupported'
  return 'unavailable'
}

export function formatCoords(lat, lng) {
  if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) return ''
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`/api/reverse-geocode?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`)
    if (!res.ok) return { geocoded: false, label: '' }
    const data = await res.json()
    const label = String(data.displayName || '').trim()
    return { geocoded: Boolean(data.geocoded && label), label }
  } catch {
    return { geocoded: false, label: '' }
  }
}

export async function detectLocation() {
  const pos = await getCurrentPosition()
  const latitude = pos.coords.latitude
  const longitude = pos.coords.longitude
  const timestamp = pos.timestamp || Date.now()
  const geo = await reverseGeocode(latitude, longitude)
  return {
    coords: { latitude, longitude, timestamp },
    geocoded: geo.geocoded,
    label: geo.label,
  }
}
