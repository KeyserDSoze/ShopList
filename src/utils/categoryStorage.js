/**
 * Gestione categorie custom.
 * Le categorie custom hanno ID tipo "cat-XXXXX" (stringa).
 * Vengono salvate in localStorage separatamente dalle built-in.
 */

const STORAGE_KEY = 'shoplist_custom_categories'

const genId = () => 'cat-' + Math.random().toString(36).substring(2, 9)

export const getCustomCategories = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const saveCustomCategories = (cats) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
  return cats
}

export const createCustomCategory = ({ name, emoji = '📦' }) => {
  const cats = getCustomCategories()
  const newCat = { id: genId(), name: name.trim(), emoji, isCustom: true }
  return saveCustomCategories([...cats, newCat]), newCat
}

export const updateCustomCategory = (id, updates) => {
  const cats = getCustomCategories().map(c =>
    c.id === id ? { ...c, ...updates } : c
  )
  saveCustomCategories(cats)
  return cats.find(c => c.id === id)
}

export const deleteCustomCategory = (id) => {
  const cats = getCustomCategories().filter(c => c.id !== id)
  saveCustomCategories(cats)
  return true
}

/**
 * Serializza le categorie custom in base64 URL-safe (per export nei supermercati).
 */
const toBase64Url = (str) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromBase64Url = (str) => {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  return atob(b64)
}

export const serializeCustomCategories = (cats) => {
  const minimal = cats.map(c => ({ i: c.id, n: c.name, e: c.emoji }))
  return toBase64Url(unescape(encodeURIComponent(JSON.stringify(minimal))))
}

export const deserializeCustomCategories = (encoded) => {
  try {
    const raw = JSON.parse(decodeURIComponent(escape(fromBase64Url(encoded))))
    return raw.map(c => ({ id: c.i, name: c.n, emoji: c.e, isCustom: true }))
  } catch {
    return []
  }
}

/**
 * Importa categorie custom da una stringa serializzata, senza duplicare.
 */
export const importCustomCategories = (encoded) => {
  const incoming = deserializeCustomCategories(encoded)
  const existing = getCustomCategories()
  const existingIds = new Set(existing.map(c => c.id))
  const toAdd = incoming.filter(c => !existingIds.has(c.id))
  saveCustomCategories([...existing, ...toAdd])
  return toAdd
}
