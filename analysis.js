/**
 * Civic issue analysis.
 * Photo inspection happens first (vision API if configured, else on-device pixels).
 * Location/user text are merged separately so we do not invent a school from the photo.
 */

import { compressPhoto, inspectPhotoPixels } from './imageFeatures.js'

export const CATEGORIES = {
  pothole: {
    id: 'pothole',
    keywords: ['pothole', 'pot hole', 'gutta', 'గుంత', 'गड्ढा', 'गड्ढे', 'crater', 'hole in road', 'road damage', 'damaged road', 'broken road'],
    department: 'Roads & Buildings / Municipal Engineering',
    problemEn: 'Pothole / road damage',
  },
  garbage: {
    id: 'garbage',
    keywords: ['garbage', 'waste', 'trash', 'dump', 'చెత్త', 'कचरा', 'कूड़ा'],
    department: 'Municipal Sanitation / Public Health',
    problemEn: 'Garbage accumulation',
  },
  streetlight: {
    id: 'streetlight',
    keywords: ['streetlight', 'street light', 'broken streetlight', 'damaged streetlight', 'lamp', 'dark', 'లైట్', 'వీధి లైట్', 'విరిగిన', 'बत्ती', 'स्ट्रीटलाइट', 'light not working'],
    department: 'Electrical / Street Lighting Wing',
    problemEn: 'Damaged / non-working streetlight',
  },
  water: {
    id: 'water',
    keywords: ['water', 'leak', 'leakage', 'pipeline', 'నీరు', 'కారుతుంది', 'पानी', 'रिसाव', 'sewage', 'drain'],
    department: 'Water Board / Public Health Engineering',
    problemEn: 'Water leakage / drainage issue',
  },
  divider: {
    id: 'divider',
    keywords: ['divider', 'median', 'railing', 'డివైడర్', 'डिवाइडर'],
    department: 'Roads & Buildings / Traffic Engineering',
    problemEn: 'Damaged road divider',
  },
  blockage: {
    id: 'blockage',
    keywords: ['block', 'blocked', 'obstruction', 'jam', 'closed', 'బ్లాక్', 'जाम', 'रुकावट'],
    department: 'Traffic Police / Municipal Engineering',
    problemEn: 'Road blockage / obstruction',
  },
  drainage: {
    id: 'drainage',
    keywords: ['drain', 'drainage', 'sewage', 'sewer', 'మురుగు', 'नाली', 'सीवर'],
    department: 'Public Health Engineering / Drainage',
    problemEn: 'Drainage / sewage issue',
  },
  tree: {
    id: 'tree',
    keywords: ['tree', 'branch', 'fallen', 'చెట్టు', 'కొమ్మ', 'पेड़', 'शाखा'],
    department: 'Parks / Roads & Buildings',
    problemEn: 'Fallen tree / branch',
  },
  trafficSignal: {
    id: 'trafficSignal',
    keywords: ['signal', 'traffic light', 'sign board', 'సిగ్నల్', 'सिग्नल', 'साइन'],
    department: 'Traffic Police / Roads',
    problemEn: 'Traffic signal / road sign issue',
  },
  infrastructure: {
    id: 'infrastructure',
    keywords: ['infrastructure', 'damaged public', 'footpath', 'bench', 'ప్రజా', 'सार्वजनिक'],
    department: 'Municipal Engineering',
    problemEn: 'Damaged public infrastructure',
  },
  other: {
    id: 'other',
    keywords: ['other', 'something else', 'ఇతర', 'अन्य'],
    department: 'To be assigned by Fix Mama admin',
    problemEn: 'Other civic problem',
  },
}

function includesAny(text, words) {
  const lower = (text || '').toLowerCase()
  return words.some((w) => lower.includes(w.toLowerCase()))
}

function detectCategoryFromText(text) {
  const lower = (text || '').toLowerCase().trim()
  if (!lower) return { id: null, score: 0 }
  let best = null
  let score = 0
  for (const cat of Object.values(CATEGORIES)) {
    const hits = cat.keywords.filter((k) => lower.includes(k.toLowerCase())).length
    if (hits > score) {
      score = hits
      best = cat.id
    }
  }
  return { id: best, score }
}

function guessPlaceName(locationLabel) {
  if (!locationLabel) return 'Not detected'
  const parts = locationLabel.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) return parts[parts.length - 3] || parts[0]
  return parts[0] || 'Not detected'
}

function detectSensitive(text, locationLabel) {
  const blob = `${text || ''} ${locationLabel || ''}`.toLowerCase()
  const school = includesAny(blob, ['school', 'స్కూల్', 'పాఠశాల', 'स्कूल', 'विद्यालय', 'kids', 'పిల్లలు', 'बच्चे', 'children', 'vidya'])
  const hospital = includesAny(blob, ['hospital', 'ఆసుపత్రి', 'హాస్పిటల్', 'अस्पताल', 'clinic', 'emergency', 'phc', 'medical'])
  return { school, hospital }
}

function detectRoadType(text, locationLabel) {
  const blob = `${text || ''} ${locationLabel || ''}`.toLowerCase()
  if (includesAny(blob, ['main road', 'మెయిన్ రోడ్', 'highway', 'national highway', 'मुख्य सड़क', 'main street', ' nh ', 'nh-', 'bypass'])) {
    return 'main'
  }
  if (includesAny(blob, ['interior', 'colony', 'lane', 'galli', 'గల్లీ', 'गली'])) {
    return 'interior'
  }
  return 'local'
}

function detectSeverity(text, categoryId) {
  const lower = (text || '').toLowerCase()
  const large = includesAny(lower, ['large', 'big', 'huge', 'deep', 'పెద్ద', 'बड़ा', 'गहरा', 'very', 'dangerous', 'చాలా'])
  const minor = includesAny(lower, ['small', 'minor', 'little', 'చిన్న', 'छोटा'])
  if (categoryId === 'blockage' && large) return 'High'
  if (large) return 'High'
  if (minor) return 'Low'
  if (categoryId === 'pothole' || categoryId === 'water' || categoryId === 'blockage') return 'Medium'
  if (categoryId === 'garbage') return 'Low'
  return 'Medium'
}

function detectLandmarkId(text, locationLabel, sensitive) {
  if (sensitive.school) return 'school'
  if (sensitive.hospital) return 'hospital'
  const blob = `${text || ''} ${locationLabel || ''}`.toLowerCase()
  if (includesAny(blob, ['market', 'బజార్', 'बाजार'])) return 'market'
  if (includesAny(blob, ['bus', 'stand', 'బస్'])) return 'bus'
  return 'none'
}

function computePriority({ severity, roadType, categoryId, sensitive, text, contexts = [] }) {
  const lower = (text || '').toLowerCase()
  const obstruction = categoryId === 'blockage' || includesAny(lower, ['cannot pass', 'no way', 'traffic', 'ట్రాఫిక్', 'ट्रैफिक'])
  const publicImpact = roadType === 'main' || obstruction
  const school = Boolean(sensitive?.school || contexts.includes('school'))
  const hospital = Boolean(sensitive?.hospital || contexts.includes('hospital'))
  const crowded = contexts.includes('crowded')
  const transit = contexts.includes('transit')
  const government = contexts.includes('government')
  const nearSensitive = school || hospital
  const highFootfall = crowded || transit || government
  const place = hospital ? 'hospital' : school ? 'school' : crowded ? 'crowded' : transit ? 'transit' : 'school'

  if (categoryId === 'blockage' && hospital) {
    return { level: 'High', reasonKey: 'reason.blockageNearHospital', place: 'hospital' }
  }
  if ((categoryId === 'pothole' || categoryId === 'divider' || categoryId === 'infrastructure') && school && (severity === 'High' || roadType === 'main')) {
    return { level: 'High', reasonKey: 'reason.roadNearSchool', place: 'school' }
  }
  if (categoryId === 'pothole' && school) {
    return { level: 'High', reasonKey: 'reason.roadNearSchool', place: 'school' }
  }
  if (categoryId === 'streetlight' && (highFootfall || nearSensitive)) {
    return { level: 'High', reasonKey: 'reason.lightCrowded', place }
  }
  if (categoryId === 'garbage' && severity !== 'High' && !nearSensitive && !highFootfall) {
    return { level: 'Normal', reasonKey: 'reason.normal', place }
  }
  if (nearSensitive && severity === 'Low') {
    return { level: 'Normal', reasonKey: 'reason.minorNearSensitive', place }
  }
  if (severity === 'High' && nearSensitive && roadType === 'main') {
    return { level: 'High', reasonKey: 'reason.urgentMainRoadSensitive', place }
  }
  if ((severity === 'High' || severity === 'Medium') && nearSensitive) {
    return { level: 'High', reasonKey: 'reason.reportedNearPlace', place }
  }
  if (highFootfall && severity !== 'Low') {
    return { level: 'High', reasonKey: 'reason.highCrowded', place }
  }
  if (severity === 'High' && publicImpact) {
    return { level: 'High', reasonKey: 'reason.highImpact', place }
  }
  return { level: 'Normal', reasonKey: 'reason.normal', place }
}

function buildResult({
  categoryId,
  locationLabel,
  capturedAt,
  text,
  source,
  forcedSensitive,
  forcedRoad,
  forcedSeverity,
  confidence,
  description,
  nearbySource,
  userContexts,
}) {
  const cat = CATEGORIES[categoryId] || null
  const contexts = Array.isArray(userContexts) ? userContexts.filter((id) => id && id !== 'none') : []
  const sensitive = forcedSensitive || detectSensitive(text, '')
  const roadType = forcedRoad || detectRoadType(text, locationLabel)
  const severity = forcedSeverity || detectSeverity(text, categoryId)
  const landmarkId = contexts.includes('hospital')
    ? 'hospital'
    : contexts.includes('school')
      ? 'school'
      : contexts.includes('transit')
        ? 'bus'
        : contexts.includes('crowded')
          ? 'crowded'
          : contexts.includes('government')
            ? 'government'
            : detectLandmarkId(text, '', sensitive)
  const priority = computePriority({
    severity,
    roadType,
    categoryId,
    sensitive: {
      school: Boolean(sensitive.school || contexts.includes('school')),
      hospital: Boolean(sensitive.hospital || contexts.includes('hospital')),
    },
    text,
    contexts,
  })

  return {
    categoryId: categoryId || 'unknown',
    problemDetected: cat?.problemEn || 'Not yet confirmed',
    category: cat ? `category.${categoryId}` : 'category.unknown',
    department: cat?.department || 'To be assigned by Fix Mama admin',
    location: locationLabel || 'Location not available',
    placeName: guessPlaceName(locationLabel),
    roadType,
    nearbyLandmark: landmarkId,
    severity,
    priority: priority.level,
    priorityReasonKey: priority.reasonKey,
    priorityPlace: priority.place,
    priorityReasonEn: englishReason(priority),
    sensitive: {
      school: Boolean(sensitive.school || contexts.includes('school')),
      hospital: Boolean(sensitive.hospital || contexts.includes('hospital')),
    },
    analyzedAt: capturedAt || new Date().toISOString(),
    source,
    confidence: confidence ?? null,
    description: description || '',
    nearbySource: nearbySource || (contexts.length ? 'user' : 'none'),
    userText: text || '',
    userContexts: contexts,
    contextSource: contexts.length ? 'user' : 'none',
  }
}

function englishReason(priority) {
  const place = priority.place
  const map = {
    'reason.urgentMainRoadSensitive': `High priority recommended because this road problem was reported on a main road near a ${place}.`,
    'reason.highNearSensitive': `Priority increased because this problem was reported near a ${place}.`,
    'reason.urgentBlockage': `High priority recommended because the reported blockage is near a ${place}.`,
    'reason.highImpact': 'High priority due to severity and likely traffic or public impact on a busy road.',
    'reason.minorNearSensitive': `A ${place} was reported nearby, but the issue appears minor and is not automatically treated as urgent.`,
    'reason.mediumNearSensitive': `Priority is higher than usual because the problem may affect people travelling to a nearby ${place}.`,
    'reason.roadNearSchool': 'Priority increased because this road problem was reported near a school.',
    'reason.blockageNearHospital': 'High priority recommended because the reported blockage is near a hospital.',
    'reason.lightCrowded': 'Priority increased because a streetlight problem was reported in a high-footfall or sensitive area.',
    'reason.reportedNearPlace': `Priority increased because this problem was reported near a ${place}.`,
    'reason.highCrowded': 'Priority increased because this problem was reported in a crowded / high-footfall area.',
    'reason.normal': 'The issue appears localized with limited immediate public-safety impact.',
  }
  return map[priority.reasonKey] || map['reason.normal']
}

async function tryCloudVision(photoDataUrl) {
  try {
    const compact = await compressPhoto(photoDataUrl)
    const res = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl: compact }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.used) return null
    return data
  } catch {
    return null
  }
}

export async function analyzePhoto({ photoDataUrl, locationLabel, capturedAt }) {
  const locationRoad = detectRoadType('', locationLabel)
  const cloud = photoDataUrl ? await tryCloudVision(photoDataUrl) : null
  let visual
  if (cloud) {
    visual = {
      categoryId: cloud.categoryId || 'unknown',
      severity: cloud.severity || 'Medium',
      confidence: cloud.confidence,
      description: cloud.description,
      source: 'vision-api',
      roadType: cloud.roadType && cloud.roadType !== 'unknown' ? cloud.roadType : locationRoad,
      nearbyLandmark: cloud.nearbyLandmark && cloud.nearbyLandmark !== 'none' ? cloud.nearbyLandmark : 'none',
    }
  } else {
    visual = photoDataUrl
      ? await inspectPhotoPixels(photoDataUrl)
      : { categoryId: 'unknown', severity: 'Medium', confidence: 0, description: 'No photo available.', source: 'on-device-visual' }
    visual.roadType = locationRoad
    visual.nearbyLandmark = 'none'
  }

  const imageSensitive = {
    school: visual.source === 'vision-api' && visual.nearbyLandmark === 'school',
    hospital: visual.source === 'vision-api' && visual.nearbyLandmark === 'hospital',
  }

  const result = buildResult({
    categoryId: visual.categoryId,
    locationLabel,
    capturedAt,
    text: '',
    source: visual.source,
    forcedSensitive: imageSensitive,
    forcedRoad: visual.roadType || locationRoad,
    forcedSeverity: visual.severity,
    confidence: visual.confidence,
    description: visual.description,
    nearbySource: imageSensitive.school || imageSensitive.hospital ? 'image' : 'none',
    userContexts: [],
  })
  if (!(imageSensitive.school || imageSensitive.hospital)) {
    result.nearbyLandmark = 'none'
  }
  return result
}

export async function refineAnalysis(current, userText) {
  await new Promise((r) => setTimeout(r, 400))
  const detected = detectCategoryFromText(userText)
  const categoryId = detected.score > 0 ? detected.id : (current?.categoryId || 'unknown')
  const sensitive = detectSensitive(userText, '')
  const mergedSensitive = {
    school: Boolean(current?.sensitive?.school || sensitive.school),
    hospital: Boolean(current?.sensitive?.hospital || sensitive.hospital),
  }
  const roadType = detectRoadType(userText, current?.location)
  return buildResult({
    categoryId,
    locationLabel: current?.location,
    capturedAt: current?.analyzedAt,
    text: userText,
    source: current?.source === 'vision-api' ? 'vision-api+user' : `${current?.source || 'on-device-visual'}+user`,
    forcedSensitive: mergedSensitive,
    forcedRoad: roadType === 'local' && current?.roadType === 'main' ? 'main' : roadType,
    userContexts: current?.userContexts || [],
  })
}

export async function analyzeIssue(args) {
  return refineAnalysis(
    {
      location: args.locationLabel,
      analyzedAt: args.capturedAt,
      categoryId: args.analysis?.categoryId,
      sensitive: args.analysis?.sensitive,
      roadType: args.analysis?.roadType,
      source: args.analysis?.source,
      userContexts: args.analysis?.userContexts,
    },
    args.transcript || '',
  )
}

export function applyGuidedSelection(current, { categoryId, contexts = [], extraText = '' } = {}) {
  const ctx = (contexts || []).filter((id) => id && id !== 'none')
  const fromSpeech = detectSensitive(extraText, '')
  const mergedSensitive = {
    school: Boolean(ctx.includes('school') || fromSpeech.school || current?.sensitive?.school),
    hospital: Boolean(ctx.includes('hospital') || fromSpeech.hospital || current?.sensitive?.hospital),
  }
  const detected = detectCategoryFromText(extraText)
  const nextCategory = categoryId || (detected.score > 0 ? detected.id : current?.categoryId) || 'unknown'
  const roadType = detectRoadType(extraText, current?.location || '')
  return buildResult({
    categoryId: nextCategory,
    locationLabel: current?.location,
    capturedAt: current?.analyzedAt,
    text: extraText || current?.userText || '',
    source: current?.source,
    forcedSensitive: mergedSensitive,
    forcedRoad: roadType === 'local' && current?.roadType === 'main' ? 'main' : roadType,
    forcedSeverity: current?.severity,
    confidence: current?.confidence,
    description: current?.description,
    nearbySource: ctx.length ? 'user' : 'none',
    userContexts: ctx,
  })
}
