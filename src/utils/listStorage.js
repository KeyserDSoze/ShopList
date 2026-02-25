import { LEGACY_ID_MAP, resolveCategoryId } from '../constants/categories'

const STORAGE_KEY = 'shoplist_lists'

/**
 * Struttura di una shopping list:
 * {
 *   id: string
 *   name: string
 *   createdAt: ISO string
 *   status: 'inPreparation' | 'readyToPurchase'
 *   supermarketId: string | null
 *   items: [{
 *     id: string
 *     name: string
 *     categoryId: number | string  (number = built-in, "cat-xxx" = custom)
 *     quantity: string
 *     checked: boolean
 *   }]
 * }
 *
 * Backward compat: vecchi item con campo `department` vengono migrati
 * automaticamente a `categoryId` tramite LEGACY_ID_MAP.
 */

export const generateId = () =>
  Math.random().toString(36).substring(2, 11) + Date.now().toString(36)

/** Migra un item legacy (con `department`) al nuovo formato `categoryId` */
const migrateItem = (item) => {
  if (item.categoryId !== undefined) return item
  const categoryId = LEGACY_ID_MAP[item.department] || 17
  const { department: _d, fromDiet: _f, ...rest } = item
  return { ...rest, categoryId }
}

export const getAllLists = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    const lists = data ? JSON.parse(data) : []
    // Migra eventuali liste con il vecchio formato
    return lists.map(list => ({
      ...list,
      supermarketId: list.supermarketId || null,
      items: (list.items || []).map(migrateItem),
    }))
  } catch {
    return []
  }
}

export const saveList = (list) => {
  try {
    const lists = getAllLists()
    const index = lists.findIndex(l => l.id === list.id)
    const updated = { ...list, updatedAt: new Date().toISOString() }
    if (index > -1) lists[index] = updated
    else lists.push(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
    return updated
  } catch {
    return null
  }
}

export const deleteList = (listId) => {
  try {
    const lists = getAllLists().filter(l => l.id !== listId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
    return true
  } catch {
    return false
  }
}

export const getListById = (listId) => getAllLists().find(l => l.id === listId) || null

/**
 * Crea una nuova lista.
 * @param {string} name
 * @param {Array} defaultItems - array di { name, categoryId, quantity } (dalla lista di default)
 */
export const createNewList = (name, defaultItems = []) => {
  const newList = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    status: 'inPreparation',
    supermarketId: null,
    items: defaultItems.map(item => ({
      id: generateId(),
      name: item.name,
      categoryId: resolveCategoryId(item.categoryId),
      quantity: item.quantity || '',
      checked: false,
    })),
  }
  return saveList(newList)
}

export const addItemToList = (listId, item) => {
  const list = getListById(listId)
  if (!list) return null
  const newItem = {
    id: generateId(),
    name: item.name,
    categoryId: resolveCategoryId(item.categoryId || item.department || 17),
    quantity: item.quantity || '',
    checked: false,
  }
  list.items.push(newItem)
  return saveList(list)
}

export const removeItemFromList = (listId, itemId) => {
  const list = getListById(listId)
  if (!list) return null
  list.items = list.items.filter(item => item.id !== itemId)
  return saveList(list)
}

export const toggleItemCheck = (listId, itemId) => {
  const list = getListById(listId)
  if (!list) return null
  const item = list.items.find(i => i.id === itemId)
  if (item) item.checked = !item.checked
  return saveList(list)
}

export const getListProgress = (list) => {
  if (!list || list.items.length === 0) return 0
  const checked = list.items.filter(item => item.checked).length
  return Math.round((checked / list.items.length) * 100)
}

export const updateListStatus = (listId, status) => {
  const list = getListById(listId)
  if (!list) return null
  list.status = status
  return saveList(list)
}

export const setListSupermarket = (listId, supermarketId) => {
  const list = getListById(listId)
  if (!list) return null
  list.supermarketId = supermarketId
  return saveList(list)
}

// ─── Sharing ────────────────────────────────────────────────────────────────

const toBase64Url = (str) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromBase64Url = (str) => {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  return atob(b64)
}

export const serializeList = (list) => {
  const minimal = {
    n: list.name,
    i: list.items.map(item => {
      const entry = { n: item.name, c: item.categoryId }
      if (item.quantity) entry.q = item.quantity
      return entry
    }),
  }
  return toBase64Url(unescape(encodeURIComponent(JSON.stringify(minimal))))
}

export const deserializeList = (encodedData) => {
  try {
    const json = decodeURIComponent(escape(fromBase64Url(encodedData)))
    const minimal = JSON.parse(json)
    return {
      name: minimal.n,
      items: minimal.i.map(item => ({
        name: item.n,
        categoryId: resolveCategoryId(item.c ?? item.d), // compat vecchio formato con 'd'
        quantity: item.q || '',
        checked: false,
      })),
    }
  } catch {
    return null
  }
}

