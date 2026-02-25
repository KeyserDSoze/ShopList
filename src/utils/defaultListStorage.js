/**
 * Gestione liste di default (multiple).
 * Ogni lista ha un nome, una lista di articoli, e un flag isDefault.
 * Una sola lista puo essere marcata come default alla volta.
 *
 * Struttura lista:
 * { id: 'dl-XXXXX', name: string, items: Item[], isDefault: boolean, createdAt: ISO }
 *
 * Struttura item:
 * { name: string, categoryId: number|string, quantity: string }
 */

const STORAGE_KEY = 'shoplist_default_lists'
const LEGACY_KEY  = 'shoplist_default_list'
const BASE_URL    = import.meta.env.BASE_URL

const genId = () => 'dl-' + Math.random().toString(36).substring(2, 9)

// --- Migration from old single-list format -----------------------------------
const migrate = () => {
  try {
    const old = localStorage.getItem(LEGACY_KEY)
    if (!old) return null
    const items = JSON.parse(old)
    if (!Array.isArray(items)) return null
    const list = { id: genId(), name: 'Lista default', items, isDefault: true, createdAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([list]))
    localStorage.removeItem(LEGACY_KEY)
    return [list]
  } catch { return null }
}

// --- Core CRUD ----------------------------------------------------------------
export const getAllDefaultLists = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return migrate() || []
}

const _saveAll = (lists) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  return lists
}

export const createDefaultList = ({ name, items = [] }) => {
  const all = getAllDefaultLists()
  const list = { id: genId(), name: name.trim(), items, isDefault: all.length === 0, createdAt: new Date().toISOString() }
  _saveAll([...all, list])
  return list
}

export const updateDefaultList = (id, updates) => {
  const all = getAllDefaultLists().map(l => l.id === id ? { ...l, ...updates } : l)
  _saveAll(all)
  return all.find(l => l.id === id)
}

export const deleteDefaultList = (id) => {
  let all = getAllDefaultLists().filter(l => l.id !== id)
  if (all.length > 0 && !all.some(l => l.isDefault)) {
    all[0] = { ...all[0], isDefault: true }
  }
  _saveAll(all)
}

export const setDefaultList = (id) => {
  const all = getAllDefaultLists().map(l => ({ ...l, isDefault: l.id === id }))
  _saveAll(all)
}

// --- Backward-compatible API (used by ShoppingListPage) ----------------------
export const getDefaultList = () => {
  const all = getAllDefaultLists()
  return all.find(l => l.isDefault) || all[0] || null
}

export const getDefaultItemsSync = () => getDefaultList()?.items || []

export const getDefaultItems = async () => {
  const all = getAllDefaultLists()
  if (all.length > 0) return getDefaultList()?.items || []
  try {
    const res = await fetch(`${BASE_URL}default-list.json`)
    const data = await res.json()
    const list = createDefaultList({ name: 'Lista default', items: data.items })
    return list.items
  } catch {}
  return []
}

export const saveDefaultItems = (items) => {
  const all = getAllDefaultLists()
  const defIdx = all.findIndex(l => l.isDefault)
  if (defIdx >= 0) {
    all[defIdx] = { ...all[defIdx], items }
    _saveAll(all)
  } else {
    createDefaultList({ name: 'Lista default', items })
  }
}

export const saveListItems = (id, items) => {
  const all = getAllDefaultLists().map(l => l.id === id ? { ...l, items } : l)
  _saveAll(all)
}

export const addDefaultItem = (item) => {
  const items = getDefaultItemsSync()
  const newItem = { name: item.name.trim(), categoryId: item.categoryId, quantity: item.quantity || '' }
  const updated = [...items, newItem]
  saveDefaultItems(updated)
  return updated
}

export const updateDefaultItem = (index, updates) => {
  const items = getDefaultItemsSync()
  items[index] = { ...items[index], ...updates }
  saveDefaultItems(items)
  return items
}

export const removeDefaultItem = (index, listId) => {
  if (listId) {
    const all = getAllDefaultLists()
    const lst = all.find(l => l.id === listId)
    if (lst) { const items = [...lst.items]; items.splice(index, 1); saveListItems(listId, items); return items }
  }
  const items = getDefaultItemsSync()
  items.splice(index, 1)
  saveDefaultItems(items)
  return items
}

// --- Serialize / Deserialize (URL sharing) -----------------------------------
const toBase64Url = (str) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromBase64Url = (str) => {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  return atob(b64)
}

export const serializeDefaultList = (items, name = '') => {
  const payload = name
    ? { nm: name, it: items.map(i => ({ n: i.name, c: i.categoryId, q: i.quantity || '' })) }
    : items.map(i => ({ n: i.name, c: i.categoryId, q: i.quantity || '' }))
  return toBase64Url(unescape(encodeURIComponent(JSON.stringify(payload))))
}

export const deserializeDefaultList = (encoded) => {
  try {
    const raw = JSON.parse(decodeURIComponent(escape(fromBase64Url(encoded))))
    if (Array.isArray(raw)) {
      return { name: null, items: raw.map(r => ({ name: r.n, categoryId: r.c, quantity: r.q || '' })) }
    }
    return {
      name: raw.nm || null,
      items: (raw.it || []).map(r => ({ name: r.n, categoryId: r.c, quantity: r.q || '' })),
    }
  } catch { return null }
}
