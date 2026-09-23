export const STORAGE_KEYS = {
  user: 'fixmama_user',
  complaints: 'fixmama_complaints',
  draft: 'fixmama_draft',
  language: 'fixmama_language',
}

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeKey(key) {
  localStorage.removeItem(key)
}
