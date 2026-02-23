/**
 * Gestione lista di default.
 * La lista di default è un array di articoli che viene proposto
 * quando si crea una nuova lista della spesa.
 * 
 * Struttura item:
 * { name: string, categoryId: number|string, quantity: string }
 */

const STORAGE_KEY = 'shoplist_default_list'
const BASE_URL = import.meta.env.BASE_URL

let _seeded = false

/**
 * Carica la lista di default: prima da localStorage, poi da default-list.json.
 */
export const getDefaultItems = async () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}

  // Seed dal file JSON la prima volta
  if (!_seeded) {
    try {
      const res = await fetch(`${BASE_URL}default-list.json`)
      const data = await res.json()
      _seeded = true
      saveDefaultItems(data.items)
      return data.items
    } catch {}
  }

  return []
}

/**
 * Versione sincrona — restituisce solo se già salvata in localStorage.
 */
export const getDefaultItemsSync = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export const saveDefaultItems = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
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

export const removeDefaultItem = (index) => {
  const items = getDefaultItemsSync()
  items.splice(index, 1)
  saveDefaultItems(items)
  return items
}
