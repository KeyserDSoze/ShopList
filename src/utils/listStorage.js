const STORAGE_KEY = 'shoplist_lists';

/**
 * Struttura di una shopping list:
 * {
 *   id: string (timestamp)
 *   name: string
 *   createdAt: timestamp
 *   status: 'inPreparation' | 'readyToPurchase'
 *   items: [{
 *     id: string (uuid)
 *     name: string
 *     department: string (enum id)
 *     quantity: string
 *     checked: boolean
 *     fromDiet: boolean
 *   }]
 * }
 */

export const generateId = () => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

export const getAllLists = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Errore nel caricamento delle liste:', error);
    return [];
  }
};

export const saveList = (list) => {
  try {
    const lists = getAllLists();
    const index = lists.findIndex(l => l.id === list.id);
    if (index > -1) {
      lists[index] = list;
    } else {
      lists.push(list);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    return list;
  } catch (error) {
    console.error('Errore nel salvataggio della lista:', error);
    return null;
  }
};

export const deleteList = (listId) => {
  try {
    const lists = getAllLists();
    const filtered = lists.filter(l => l.id !== listId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Errore nella cancellazione della lista:', error);
    return false;
  }
};

export const getListById = (listId) => {
  const lists = getAllLists();
  return lists.find(l => l.id === listId);
};

export const createNewList = (name) => {
  const newList = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    status: 'inPreparation',
    items: [],
  };
  return saveList(newList);
};

export const addItemToList = (listId, item) => {
  const list = getListById(listId);
  if (!list) return null;
  
  const newItem = {
    id: generateId(),
    ...item,
    checked: false,
    fromDiet: item.fromDiet || false,
  };
  
  list.items.push(newItem);
  return saveList(list);
};

export const removeItemFromList = (listId, itemId) => {
  const list = getListById(listId);
  if (!list) return null;
  
  list.items = list.items.filter(item => item.id !== itemId);
  return saveList(list);
};

export const toggleItemCheck = (listId, itemId) => {
  const list = getListById(listId);
  if (!list) return null;
  
  const item = list.items.find(i => i.id === itemId);
  if (item) {
    item.checked = !item.checked;
  }
  
  return saveList(list);
};

export const updateItemInList = (listId, itemId, updates) => {
  const list = getListById(listId);
  if (!list) return null;
  
  const item = list.items.find(i => i.id === itemId);
  if (item) {
    Object.assign(item, updates);
  }
  
  return saveList(list);
};

export const getListProgress = (list) => {
  if (!list || list.items.length === 0) return 0;
  const checked = list.items.filter(item => item.checked).length;
  return Math.round((checked / list.items.length) * 100);
};

export const updateListStatus = (listId, status) => {
  const list = getListById(listId);
  if (!list) return null;
  
  list.status = status;
  return saveList(list);
};

// Sharing functions
export const serializeList = (list) => {
  const data = JSON.stringify(list);
  return btoa(unescape(encodeURIComponent(data)));
};

export const deserializeList = (encodedData) => {
  try {
    const data = decodeURIComponent(escape(atob(encodedData)));
    return JSON.parse(data);
  } catch (error) {
    console.error('Errore nel deserializzare la lista:', error);
    return null;
  }
};

export const importSharedList = (encodedList, newName) => {
  const list = deserializeList(encodedList);
  if (!list) return null;
  
  // Crea una nuova lista con il nome fornito
  const importedList = {
    id: generateId(),
    name: newName,
    createdAt: new Date().toISOString(),
    status: 'inPreparation',
    items: list.items.map(item => ({
      ...item,
      id: generateId(),
      checked: false,
    })),
  };
  
  return saveList(importedList);
};
