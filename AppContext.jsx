import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { readJson, writeJson, STORAGE_KEYS, removeKey } from '../services/storage.js'
import { translate } from '../i18n/translations.js'

const AppContext = createContext(null)

const emptyDraft = {
  photoDataUrl: '',
  capturedAt: '',
  coords: null,
  locationLabel: '',
  transcript: '',
  correction: '',
  analysis: null,
  complaint: null,
  detailsMode: '',
  locationGeocoded: false,
  locationStatus: '',
  locationError: '',
  userContexts: [],
  confirmedCategoryId: '',
}

function initialLanguage() {
  const saved = readJson(STORAGE_KEYS.language, null)
  if (saved === 'te' || saved === 'en' || saved === 'hi') return saved
  const user = readJson(STORAGE_KEYS.user, null)
  if (user?.language === 'te' || user?.language === 'en' || user?.language === 'hi') return user.language
  return 'en'
}

function initialScreen() {
  const user = readJson(STORAGE_KEYS.user, null)
  if (!user) return 'welcome'
  if (!user.language) return 'language'
  return 'home'
}

export function AppProvider({ children }) {
  const [screen, setScreen] = useState(initialScreen)
  const [user, setUser] = useState(() => readJson(STORAGE_KEYS.user, null))
  const [language, setLanguageState] = useState(initialLanguage)
  const [complaints, setComplaints] = useState(() => readJson(STORAGE_KEYS.complaints, []))
  const [draft, setDraft] = useState(() => readJson(STORAGE_KEYS.draft, emptyDraft))
  const [selectedId, setSelectedId] = useState(null)
  const [otpHint, setOtpHint] = useState('')
  const [pendingMobile, setPendingMobile] = useState('')
  const [langReturnTo, setLangReturnTo] = useState('camera')

  const persistUser = (next) => {
    setUser(next)
    writeJson(STORAGE_KEYS.user, next)
  }

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang)
    writeJson(STORAGE_KEYS.language, lang)
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, language: lang }
      writeJson(STORAGE_KEYS.user, next)
      return next
    })
  }, [])

  const t = useCallback((key, vars) => translate(language, key, vars), [language])

  const persistComplaints = (next) => {
    setComplaints(next)
    writeJson(STORAGE_KEYS.complaints, next)
  }

  const updateDraft = (partial) => {
    setDraft((prev) => {
      const next = { ...prev, ...partial }
      writeJson(STORAGE_KEYS.draft, next)
      return next
    })
  }

  const resetDraft = () => {
    setDraft(emptyDraft)
    removeKey(STORAGE_KEYS.draft)
  }

  const addComplaint = (item) => {
    persistComplaints([item, ...complaints])
  }

  const logout = () => {
    setUser(null)
    removeKey(STORAGE_KEYS.user)
    resetDraft()
    setScreen('welcome')
  }

  const value = useMemo(
    () => ({
      screen,
      setScreen,
      user,
      persistUser,
      language,
      setLanguage,
      t,
      complaints,
      addComplaint,
      draft,
      updateDraft,
      resetDraft,
      selectedId,
      setSelectedId,
      otpHint,
      setOtpHint,
      pendingMobile,
      setPendingMobile,
      langReturnTo,
      setLangReturnTo,
      logout,
    }),
    [screen, user, language, setLanguage, t, complaints, draft, selectedId, otpHint, pendingMobile, langReturnTo],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
