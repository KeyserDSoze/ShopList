/**
 * Higher-level Drive sync logic.
 *
 * - buildDataBundle()  – snapshot all localStorage data into one object
 * - applyDataBundle()  – restore a snapshot into localStorage
 * - pushAll(token)     – build + write to appDataFolder
 * - pullAll(token)     – read from appDataFolder and apply if newer
 * - scheduleSync(token)– debounced push (default 3 s delay)
 */

import { readAppData, writeAppData } from './driveApi'

export const SYNC_META_KEY      = 'shoplist_sync_meta'
export const SYNC_SETTINGS_KEY  = 'shoplist_sync_settings'
export const SYNC_REGISTRY_KEY  = 'shoplist_sync_registry'

const DEFAULT_SETTINGS = { autoSync: true, delayMs: 3000 }

export function getSyncSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SYNC_SETTINGS_KEY)) } }
  catch { return { ...DEFAULT_SETTINGS } }
}

export function saveSyncSettings(updates) {
  const current = getSyncSettings()
  const next = { ...current, ...updates }
  localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(next))
  return next
}

let syncTimer = null
let currentToken = null

// ─── Debounced sync ───────────────────────────────────────────────────────────

export function scheduleSync(token, delay = 3000) {
  currentToken = token
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    if (!currentToken) return
    try {
      window.dispatchEvent(new CustomEvent('shoplist-sync-status', { detail: 'syncing' }))
      await pushAll(currentToken)
      window.dispatchEvent(new CustomEvent('shoplist-sync-status', { detail: 'ok' }))
    } catch (e) {
      window.dispatchEvent(new CustomEvent('shoplist-sync-status', { detail: 'error', error: e.message }))
    }
  }, delay)
}

// ─── Bundle build / apply ─────────────────────────────────────────────────────

export function buildDataBundle() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    lists:            JSON.parse(localStorage.getItem('shoplist_lists')            || '[]'),
    defaultLists:     JSON.parse(localStorage.getItem('shoplist_default_lists')    || '[]'),
    supermarkets:     JSON.parse(localStorage.getItem('shoplist_supermarkets')     || '[]'),
    customCategories: JSON.parse(localStorage.getItem('shoplist_custom_categories')|| '[]'),
  }
}

export function applyDataBundle(bundle) {
  if (!bundle) return
  const map = {
    lists:            'shoplist_lists',
    defaultLists:     'shoplist_default_lists',
    supermarkets:     'shoplist_supermarkets',
    customCategories: 'shoplist_custom_categories',
  }
  for (const [key, storageKey] of Object.entries(map)) {
    if (bundle[key] !== undefined) {
      localStorage.setItem(storageKey, JSON.stringify(bundle[key]))
    }
  }
  const now = new Date().toISOString()
  // Mark everything as synced (we just got fresh data from Drive)
  const registry = {}
  ;(bundle.lists        || []).forEach(l  => { registry[`list:${l.id}`] = now })
  ;(bundle.defaultLists || []).forEach(dl => { registry[`dl:${dl.id}`]  = now })
  ;(bundle.supermarkets || []).forEach(sm => { registry[`sm:${sm.id}`]  = now })
  registry['custom'] = now
  localStorage.setItem(SYNC_META_KEY,     JSON.stringify({ lastSync: now, updatedAt: bundle.updatedAt }))
  localStorage.setItem(SYNC_REGISTRY_KEY, JSON.stringify(registry))
}

// ─── Push / Pull ──────────────────────────────────────────────────────────────

export async function pushAll(token) {
  const bundle = buildDataBundle()
  await writeAppData(token, bundle)
  const now = new Date().toISOString()
  // Update sync registry – mark every current item as synced
  const registry = {}
  ;(bundle.lists            || []).forEach(l  => { registry[`list:${l.id}`]  = now })
  ;(bundle.defaultLists     || []).forEach(dl => { registry[`dl:${dl.id}`]   = now })
  ;(bundle.supermarkets     || []).forEach(sm => { registry[`sm:${sm.id}`]   = now })
  registry['custom'] = now
  localStorage.setItem(SYNC_META_KEY,     JSON.stringify({ lastSync: now, updatedAt: bundle.updatedAt }))
  localStorage.setItem(SYNC_REGISTRY_KEY, JSON.stringify(registry))
  return bundle.updatedAt
}

// ─── Per-item sync status ─────────────────────────────────────────────────────
/**
 * @param {'list'|'dl'|'sm'|'custom'} type
 * @param {string} id  (use 'all' for custom categories)
 * @param {string|undefined} updatedAt  ISO of last local modification
 * @returns {'synced'|'dirty'|'never'}
 */
export function getItemSyncStatus(type, id, updatedAt) {
  try {
    const registry  = JSON.parse(localStorage.getItem(SYNC_REGISTRY_KEY) || '{}')
    const key       = type === 'custom' ? 'custom' : `${type}:${id}`
    const syncedAt  = registry[key]
    if (!syncedAt) return 'never'
    if (!updatedAt) return 'synced'   // item has no updatedAt → assume clean
    return new Date(updatedAt) > new Date(syncedAt) ? 'dirty' : 'synced'
  } catch { return 'never' }
}

/**
 * Pull remote data and apply it if newer than local.
 * Returns: 'pulled' | 'local-newer' | null (no remote data yet)
 */
export async function pullAll(token) {
  const remote = await readAppData(token)
  if (!remote) return null

  const meta       = JSON.parse(localStorage.getItem(SYNC_META_KEY) || '{}')
  const localDate  = meta.updatedAt ? new Date(meta.updatedAt)  : new Date(0)
  const remoteDate = remote.updatedAt ? new Date(remote.updatedAt) : new Date(0)

  if (remoteDate > localDate) {
    applyDataBundle(remote)
    return 'pulled'
  }
  return 'local-newer'
}

export function getSyncMeta() {
  try { return JSON.parse(localStorage.getItem(SYNC_META_KEY) || '{}') } catch { return {} }
}
