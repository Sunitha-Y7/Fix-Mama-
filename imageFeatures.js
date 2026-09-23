/**
 * On-device visual inspection of the actual photo pixels.
 * This is NOT a cloud vision model. It scores color/texture so different
 * photos produce different results instead of a hash or a fixed pothole.
 */

function loadImage(photoDataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read photo'))
    img.src = photoDataUrl
  })
}

function sample(img) {
  const size = 96
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, size, size)
  return { data: ctx.getImageData(0, 0, size, size).data, size }
}

export async function inspectPhotoPixels(photoDataUrl) {
  const img = await loadImage(photoDataUrl)
  const { data, size } = sample(img)
  const n = size * size
  let lumSum = 0
  let lumSq = 0
  let asphalt = 0
  let dark = 0
  let yellow = 0
  let blue = 0
  let green = 0
  let brown = 0
  let orange = 0
  let edge = 0

  const lumAt = (i) => {
    const o = i * 4
    return 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]
  }

  for (let i = 0; i < n; i += 1) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const sat = max === 0 ? 0 : (max - min) / max
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    lumSum += lum
    lumSq += lum * lum
    if (lum < 42) dark += 1
    if (sat < 0.2 && lum > 40 && lum < 185 && Math.abs(r - g) < 22 && Math.abs(g - b) < 28) asphalt += 1
    if (r > 155 && g > 115 && b < 95 && r > b + 35) yellow += 1
    if (b > r + 22 && b > g + 8 && b > 85) blue += 1
    if (g > r + 12 && g > b + 12 && g > 65) green += 1
    if (r > g + 8 && g > b && sat > 0.18 && sat < 0.65 && lum > 35 && lum < 150) brown += 1
    if (r > 145 && g > 70 && g < 175 && b < 85) orange += 1
    const x = i % size
    if (x < size - 1) edge += Math.abs(lum - lumAt(i + 1))
  }

  const mean = lumSum / n
  const variance = lumSq / n - mean * mean
  const scores = {
    pothole: (asphalt / n) * 0.45 + (dark / n) * 0.55 + Math.min(variance / 8000, 0.2),
    garbage: (brown + orange + green) / n + Math.min(variance / 9000, 0.15),
    streetlight: (yellow / n) * 1.8 + (mean < 90 ? 0.2 : 0) + (dark / n) * 0.15,
    water: (blue / n) * 2.1,
    divider: (asphalt / n) * 0.35 + Math.min(edge / (n * 40), 0.45),
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const [bestId, bestScore] = ranked[0]
  const second = ranked[1][1]
  const weak = bestScore < 0.12
  const categoryId = weak ? 'unknown' : bestId
  const gap = Math.max(0, bestScore - second)
  const confidence = weak ? 0.28 : Math.min(0.9, 0.4 + gap * 1.6)

  let severity = 'Medium'
  if (categoryId === 'pothole') severity = dark / n > 0.12 ? 'High' : 'Medium'
  if (categoryId === 'water') severity = blue / n > 0.1 ? 'High' : 'Medium'
  if (categoryId === 'garbage') severity = (brown + orange) / n > 0.18 ? 'High' : 'Medium'
  if (categoryId === 'streetlight') severity = mean < 70 ? 'High' : 'Medium'
  if (categoryId === 'divider') severity = edge / n > 18 ? 'High' : 'Medium'

  const why = {
    pothole: 'The photo has gray/asphalt tones and darker patches typical of road damage or a pothole.',
    garbage: 'The photo has mixed brown/green/orange tones more typical of waste than a plain road surface.',
    streetlight: 'The photo has amber/yellow highlights and darker surroundings typical of a streetlight scene.',
    water: 'The photo has strong blue tones more typical of water leakage or standing water.',
    divider: 'The photo has gray structure and strong edges more typical of a barrier or road divider.',
    unknown: 'The photo did not strongly match a single civic-issue pattern. Please confirm or correct.',
  }

  return {
    categoryId,
    severity,
    confidence: Number(confidence.toFixed(2)),
    description: why[categoryId],
    source: 'on-device-visual',
  }
}

export function compressPhoto(photoDataUrl, maxWidth = 512, quality = 0.62) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(photoDataUrl)
    img.src = photoDataUrl
  })
}
