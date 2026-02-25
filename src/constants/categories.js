/**
 * Categorie built-in. L'ID numerico è stabile e usato come chiave
 * nei dati salvati e nelle traduzioni.
 * Le categorie custom (create dall'utente) hanno ID stringa "cat-XXXXX".
 */
export const BUILTIN_CATEGORIES = [
  { id: 1,  emoji: '🥦', translations: { it: 'Ortofrutta',                  en: 'Produce' } },
  { id: 2,  emoji: '🧊', translations: { it: 'Banco Frigo',                 en: 'Dairy Counter' } },
  { id: 3,  emoji: '🥩', translations: { it: 'Macelleria',                  en: 'Butcher' } },
  { id: 4,  emoji: '🐟', translations: { it: 'Pescheria',                   en: 'Fish' } },
  { id: 5,  emoji: '🍞', translations: { it: 'Pane, Cereali & Sostituti',   en: 'Bakery & Cereals' } },
  { id: 6,  emoji: '🍝', translations: { it: 'Pasta',                       en: 'Pasta' } },
  { id: 7,  emoji: '🥜', translations: { it: 'Frutta Secca',              en: 'Nuts & Dried Fruit' } },
  { id: 25, emoji: '🌻', translations: { it: 'Semi',                        en: 'Seeds' } },
  { id: 26, emoji: '🫙', translations: { it: 'Creme & Burri Vegetali',      en: 'Nut Butters & Creams' } },
  { id: 27, emoji: '🥛', translations: { it: 'Latte Vegetale',              en: 'Plant-based Milk' } },
  { id: 29, emoji: '🍼', translations: { it: 'Latte e Derivati',            en: 'Dairy' } },
  { id: 8,  emoji: '🫒', translations: { it: 'Condimenti & Conserve',       en: 'Condiments & Preserves' } },
  { id: 9,  emoji: '🥣', translations: { it: 'Colazione',                   en: 'Breakfast' } },
  { id: 10, emoji: '☕', translations: { it: 'Bevande',                     en: 'Beverages' } },
  { id: 11, emoji: '🥫', translations: { it: 'Cibi in Scatola & Conservati', en: 'Canned & Preserved' } },
  { id: 12, emoji: '❄️', translations: { it: 'Congelati',                   en: 'Frozen' } },
  { id: 13, emoji: '🧼', translations: { it: 'Casa & Pulizia',              en: 'Household & Cleaning' } },
  { id: 14, emoji: '🧴', translations: { it: 'Igiene Personale',            en: 'Personal Care' } },
  { id: 15, emoji: '👕', translations: { it: 'Abbigliamento',               en: 'Clothing' } },
  { id: 16, emoji: '📱', translations: { it: 'Elettronica',                 en: 'Electronics' } },
  { id: 17, emoji: '📦', translations: { it: 'Altro',                       en: 'Other' } },
  { id: 18, emoji: '🌾', translations: { it: 'Riso',                        en: 'Rice' } },
  { id: 19, emoji: '🫘', translations: { it: 'Legumi Secchi',               en: 'Dried Legumes' } },
  { id: 20, emoji: '🍗', translations: { it: 'Gastronomia / Rosticceria',   en: 'Deli / Rotisserie' } },
  { id: 21, emoji: '🥓', translations: { it: 'Salumi',                      en: 'Cured Meats' } },
  { id: 22, emoji: '🧀', translations: { it: 'Formaggi',                    en: 'Cheese' } },
  { id: 23, emoji: '🍬', translations: { it: 'Dolci & Snack',               en: 'Sweets & Snacks' } },
  { id: 24, emoji: '🌿', translations: { it: 'Bio',                         en: 'Organic' } },
  { id: 28, emoji: '🌾', translations: { it: 'Senza Glutine',               en: 'Gluten Free' } },
]

/** Mappa da vecchi string-ID (departments.js) a nuovo ID numerico */
export const LEGACY_ID_MAP = {
  produce:       1,
  dairy:         2,
  meat:          3,
  fish:          4,
  bakery:        5,
  pasta:         6,
  nuts:          7,
  seeds:        25,
  nut_butters:  26,
  condiments:    8,
  snacks:        9,
  beverages:    10,
  canned:       11,
  frozen:       12,
  household:    13,
  personal_care:14,
  clothing:     15,
  electronics:  16,
  other:        17,
}

/** Lingua di default per la UI */
export const DEFAULT_LANG = 'it'

/**
 * Restituisce il nome di una categoria (built-in o custom).
 * @param {number|string} categoryId
 * @param {Array} customCategories  - array da categoryStorage
 * @param {string} lang
 */
export const getCategoryName = (categoryId, customCategories = [], lang = DEFAULT_LANG) => {
  // Legacy string ID → converti a numerico
  const resolvedId = typeof categoryId === 'string' && LEGACY_ID_MAP[categoryId]
    ? LEGACY_ID_MAP[categoryId]
    : categoryId

  // Built-in
  const builtin = BUILTIN_CATEGORIES.find(c => c.id === resolvedId)
  if (builtin) {
    return `${builtin.emoji} ${builtin.translations[lang] || builtin.translations['it']}`
  }

  // Custom
  const custom = customCategories.find(c => c.id === resolvedId)
  if (custom) return `${custom.emoji} ${custom.name}`

  return '📦 Altro'
}

export const getCategoryEmoji = (categoryId, customCategories = []) => {
  const resolvedId = typeof categoryId === 'string' && LEGACY_ID_MAP[categoryId]
    ? LEGACY_ID_MAP[categoryId]
    : categoryId

  const builtin = BUILTIN_CATEGORIES.find(c => c.id === resolvedId)
  if (builtin) return builtin.emoji

  const custom = customCategories.find(c => c.id === resolvedId)
  if (custom) return custom.emoji

  return '📦'
}

/** Normalizza un categoryId: stringa legacy → numero, lascia invariato il resto */
export const resolveCategoryId = (categoryId) => {
  if (typeof categoryId === 'string' && LEGACY_ID_MAP[categoryId]) {
    return LEGACY_ID_MAP[categoryId]
  }
  return categoryId
}
