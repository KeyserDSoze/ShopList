/**
 * Gestione supermercati.
 * Ogni supermercato ha un ordine di categorie (reparti presenti e la loro sequenza).
 * Formato:
 * {
 *   id: "sm-XXXXX",
 *   name: "Esselunga",
 *   categoryOrder: [1, 3, 5, 2, "cat-abc"],  // ID numerici (built-in) o stringa (custom)
 *   createdAt: "ISO"
 * }
 */

const STORAGE_KEY = 'shoplist_supermarkets'

const genId = () => 'sm-' + Math.random().toString(36).substring(2, 9)

const toBase64Url = (str) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromBase64Url = (str) => {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  return atob(b64)
}

export const getAllSupermarkets = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const getSupermarketById = (id) =>
  getAllSupermarkets().find(s => s.id === id) || null

const saveSupermarkets = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return list
}

export const createSupermarket = ({ name, categoryOrder = [] }) => {
  const all = getAllSupermarkets()
  const sm = { id: genId(), name: name.trim(), categoryOrder, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  saveSupermarkets([...all, sm])
  return sm
}

export const updateSupermarket = (id, updates) => {
  const all = getAllSupermarkets().map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)
  saveSupermarkets(all)
  return all.find(s => s.id === id)
}

export const deleteSupermarket = (id) => {
  saveSupermarkets(getAllSupermarkets().filter(s => s.id !== id))
  return true
}

/**
 * Serializza supermercato (+ categorie custom opzionali) per la condivisione.
 * Formato compresso: { n: name, o: categoryOrder, c?: customCats[] }
 */
export const serializeSupermarket = (supermarket, customCategories = []) => {
  // Includi solo le categorie custom che compaiono in questo supermercato
  const usedCustomIds = new Set(
    supermarket.categoryOrder.filter(id => String(id).startsWith('cat-'))
  )
  const relevantCustomCats = customCategories.filter(c => usedCustomIds.has(c.id))

  const payload = {
    n: supermarket.name,
    o: supermarket.categoryOrder,
  }
  if (relevantCustomCats.length > 0) {
    payload.c = relevantCustomCats.map(c => ({ i: c.id, n: c.name, e: c.emoji }))
  }

  return toBase64Url(unescape(encodeURIComponent(JSON.stringify(payload))))
}

export const deserializeSupermarket = (encoded) => {
  try {
    const payload = JSON.parse(decodeURIComponent(escape(fromBase64Url(encoded))))
    return {
      supermarket: {
        name: payload.n,
        categoryOrder: payload.o,
      },
      customCategories: (payload.c || []).map(c => ({
        id: c.i, name: c.n, emoji: c.e, isCustom: true,
      })),
    }
  } catch {
    return null
  }
}
