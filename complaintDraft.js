function nearPhrase(analysis, opts, lang) {
  const ctx = analysis.userContexts || []
  const school = (analysis.sensitive?.school || ctx.includes('school')) && !opts.removeSchool
  const hospital = (analysis.sensitive?.hospital || ctx.includes('hospital') || opts.addHospital) && !opts.removeHospital
  const crowded = ctx.includes('crowded')
  const transit = ctx.includes('transit')
  const government = ctx.includes('government')
  const parts = []
  if (lang === 'te') {
    if (school) parts.push('పాఠశాల దగ్గర ఉన్నట్లు నివేదించారు')
    if (hospital) parts.push('ఆసుపత్రి దగ్గర ఉన్నట్లు నివేదించారు')
    if (crowded) parts.push('రద్దీ ఎక్కువగా ఉన్న ప్రాంతం')
    if (transit) parts.push('రైలు/బస్ స్టేషన్ దగ్గర')
    if (government) parts.push('ప్రభుత్వ/పబ్లిక్ సౌకర్యం దగ్గర')
    return parts.join(', ')
  }
  if (lang === 'hi') {
    if (school) parts.push('स्कूल के पास बताया गया')
    if (hospital) parts.push('अस्पताल के पास बताया गया')
    if (crowded) parts.push('भीड़भाड़ वाले इलाके में')
    if (transit) parts.push('रेलवे/बस स्टैंड के पास')
    if (government) parts.push('सरकारी/सार्वजनिक सुविधा के पास')
    return parts.join(', ')
  }
  if (school) parts.push('reported near a school')
  if (hospital) parts.push('reported near a hospital')
  if (crowded) parts.push('in a crowded / high-footfall area')
  if (transit) parts.push('near a railway station / bus stand')
  if (government) parts.push('near a government / public facility')
  return parts.join(', ')
}

function englishBody(analysis, opts = {}) {
  const near = nearPhrase(analysis, opts, 'en')
  const road = analysis.roadType === 'main' ? 'main road' : analysis.roadType === 'interior' ? 'colony road' : 'road'
  const problem = (analysis.problemDetected || 'civic issue').toLowerCase()
  if (opts.short) {
    return `A ${problem} has been reported on a ${road}${near ? ` (${near})` : ''}. Kindly inspect and take action.`
  }
  const formalExtra = opts.formal
    ? ' This representation is submitted for official inspection and necessary remedial measures in public interest.'
    : ''
  return `A ${String(analysis.severity || 'medium').toLowerCase()}-severity ${problem} has been reported on the ${road}${near ? `. Context: ${near}` : ''}. The damaged or affected area may impact road users and requires inspection. Kindly take appropriate action at the earliest.${formalExtra}`
}

function teluguBody(analysis, opts = {}) {
  const place = nearPhrase(analysis, opts, 'te')
  if (opts.short) {
    return `${place ? `${place}. ` : ''}రోడ్డు / పబ్లిక్ సమస్య నమోదు అయింది. దయచేసి తనిఖీ చేసి చర్య తీసుకోండి.`
  }
  return `గుర్తించిన ప్రాంతంలో సమస్య నమోదు అయింది${place ? ` (${place})` : ''}. ఇది రోడ్డు వినియోగదారులపై ప్రభావం చూపవచ్చు. దయచేసి త్వరగా తనిఖీ చేసి అవసరమైన చర్య తీసుకోవాలని కోరుతున్నాము.`
}

function hindiBody(analysis, opts = {}) {
  const place = nearPhrase(analysis, opts, 'hi')
  if (opts.short) {
    return `${place ? `${place}. ` : ''}सार्वजनिक समस्या दर्ज है। कृपया जाँच कर कार्रवाई करें।`
  }
  return `रिपोर्ट किए गए स्थान पर एक सार्वजनिक समस्या दर्ज की गई है${place ? ` (${place})` : ''}। इससे राहगीरों को असुविधा हो सकती है। कृपया शीघ्र निरीक्षण कर उचित कार्रवाई करें।`
}

function subjectFor(analysis, opts, language) {
  const ctx = analysis.userContexts || []
  const school = (analysis.sensitive?.school || ctx.includes('school')) && !opts.removeSchool
  const hospital = (analysis.sensitive?.hospital || ctx.includes('hospital') || opts.addHospital) && !opts.removeHospital
  if (language === 'te') {
    if (analysis.priority === 'High' && school) return 'పాఠశాల దగ్గర రోడ్డు నష్టం'
    if (analysis.priority === 'High' && hospital) return 'ఆసుపత్రి దగ్గర రోడ్డు సమస్య'
    if (analysis.priority === 'High') return 'అధిక ప్రాధాన్య ప్రజా ఫిర్యాదు'
    return 'ప్రజా సమస్య ఫిర్యాదు'
  }
  if (language === 'hi') {
    if (analysis.priority === 'High' && school) return 'स्कूल के पास सड़क क्षति'
    if (analysis.priority === 'High' && hospital) return 'अस्पताल के पास सड़क समस्या'
    if (analysis.priority === 'High') return 'उच्च प्राथमिकता नागरिक शिकायत'
    return 'नागरिक शिकायत'
  }
  if (analysis.priority === 'High' && school) return 'Road Damage Reported Near School'
  if (analysis.priority === 'High' && hospital) return 'Road Issue Reported Near Hospital'
  if (opts.removeSchool) return 'Road Damage Requiring Inspection'
  if (analysis.priority === 'High') return 'High-Priority Civic Complaint'
  return 'Civic Issue Reported for Inspection'
}

export function generateComplaint(analysis, language = 'en', options = {}) {
  const description =
    language === 'te'
      ? teluguBody(analysis, options)
      : language === 'hi'
        ? hindiBody(analysis, options)
        : englishBody(analysis, options)

  return {
    subject: subjectFor(analysis, options, language),
    description,
    location: analysis.location,
    category: analysis.category,
    categoryId: analysis.categoryId,
    priority: analysis.priority,
    language,
    options,
    userContexts: analysis.userContexts || [],
  }
}

export function applyVoiceEdit(current, analysis, command) {
  const text = (command || '').toLowerCase()
  const options = { ...(current.options || {}) }
  let language = current.language || 'en'
  const nextAnalysis = {
    ...analysis,
    sensitive: { ...(analysis.sensitive || {}) },
    userContexts: [...(analysis.userContexts || [])],
  }

  if (/short|shorter|brief|సంక్షిప్త|छोटा|संक्षिप्त/.test(text)) options.short = true
  if (/formal|official|అధికార|औपचारिक|write formally/.test(text)) options.formal = true
  if (/remove school|without school|school mention|స్కూల్ తీసివేయి|स्कूल हटा/.test(text)) {
    options.removeSchool = true
    nextAnalysis.sensitive.school = false
    nextAnalysis.userContexts = nextAnalysis.userContexts.filter((id) => id !== 'school')
  }
  if (/add hospital|hospital|ఆసుపత్రి|अस्पताल/.test(text) && !/remove/.test(text)) {
    options.addHospital = true
    nextAnalysis.sensitive.hospital = true
    if (!nextAnalysis.userContexts.includes('hospital')) nextAnalysis.userContexts.push('hospital')
  }
  if (/telugu|తెలుగు/.test(text)) language = 'te'
  if (/hindi|हिन्दी|हिंदी/.test(text)) language = 'hi'
  if (/english|ఇంగ్లీష్|अंग्रेज़ी/.test(text)) language = 'en'

  return generateComplaint(nextAnalysis, language, options)
}
