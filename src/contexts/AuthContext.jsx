/**
 * AuthContext – Google Identity Services (GIS) integration.
 *
 * No npm dependencies for auth. Uses the GIS script tag loaded in index.html.
 *
 * Provides:
 *   user          { name, email, picture } | null
 *   isLoggedIn    boolean
 *   token         string | null  (in-memory only, never persisted)
 *   syncStatus    'idle' | 'syncing' | 'ok' | 'error'
 *   syncError     string | null
 *   login()       → Promise<string>  (opens Google chooser)
 *   logout()
 *   ensureToken() → Promise<string>  (refresh silently if needed)
 *   syncNow()     → Promise<void>
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getUserInfo } from '../utils/driveApi'
import { scheduleSync, pullAll, pushAll, getSyncSettings, saveSyncSettings } from '../utils/driveSync'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
].join(' ')

const USER_KEY = 'shoplist_google_user'

// Keys that should NOT trigger a Drive sync when written
const SYNC_SKIP_KEYS = new Set([
  'shoplist_sync_meta',
  'shoplist_sync_settings',
  'shoplist_sync_registry',
  'shoplist_google_user',
])

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [token,       setToken]       = useState(null)
  const [tokenExpiry, setTokenExpiry] = useState(0)
  const [syncStatus,  setSyncStatus]  = useState('idle')
  const [syncError,   setSyncError]   = useState(null)
  const [gisReady,    setGisReady]    = useState(false)
  const [autoSync,    setAutoSync]    = useState(() => getSyncSettings().autoSync)
  const [syncDelay,   setSyncDelay]   = useState(() => getSyncSettings().delayMs)

  const autoSyncRef  = useRef(autoSync)
  const syncDelayRef = useRef(syncDelay)
  const ensureTokenRef = useRef(null)   // set after ensureToken is defined
  useEffect(() => { autoSyncRef.current  = autoSync  }, [autoSync])
  useEffect(() => { syncDelayRef.current = syncDelay }, [syncDelay])

  const clientRef            = useRef(null)
  const silentTriedRef       = useRef(false)
  const latestTokenRef       = useRef(null)  // mirror of `token` for callbacks

  // Keep ref in sync with state for use inside closures/timers
  useEffect(() => { latestTokenRef.current = token }, [token])

  // ─── Auto-detect localStorage writes → schedule sync ─────────────────────
  useEffect(() => {
    const orig = localStorage.setItem.bind(localStorage)
    localStorage.setItem = (key, value) => {
      orig(key, value)
      if (
        !SYNC_SKIP_KEYS.has(key) &&
        key.startsWith('shoplist_') &&
        latestTokenRef.current &&
        ensureTokenRef.current &&
        autoSyncRef.current
      ) {
        scheduleSync(ensureTokenRef.current, syncDelayRef.current)
      }
    }
    return () => { localStorage.setItem = orig }
  }, []) // once

  // ─── Listen to sync status events from driveSync ─────────────────────────
  useEffect(() => {
    const handler = (e) => {
      setSyncStatus(e.detail)
      if (e.detail === 'error') setSyncError(e.error || 'Errore sincronizzazione')
      if (e.detail === 'ok')    setSyncError(null)
    }
    window.addEventListener('shoplist-sync-status', handler)
    return () => window.removeEventListener('shoplist-sync-status', handler)
  }, [])

  // ─── GIS init ────────────────────────────────────────────────────────────
  const initClient = useCallback(() => {
    if (!window.google?.accounts?.oauth2 || clientRef.current) return
    clientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // set per-request
    })
    setGisReady(true)
  }, [])

  useEffect(() => {
    if (window.google?.accounts?.oauth2) { initClient(); return }
    const t = setInterval(() => {
      if (window.google?.accounts?.oauth2) { initClient(); clearInterval(t) }
    }, 200)
    return () => clearInterval(t)
  }, [initClient])

  // ─── Core token request ────────────────────────────────────────────────────
  const _requestToken = useCallback((prompt) => new Promise((resolve, reject) => {
    if (!clientRef.current) { reject(new Error('GIS non ancora pronto')); return }
    clientRef.current.callback = async (resp) => {
      if (resp.error) {
        reject(new Error(resp.error_description || resp.error))
        return
      }
      const expiry = Date.now() + resp.expires_in * 1000 - 30_000 // 30 s buffer
      setToken(resp.access_token)
      setTokenExpiry(expiry)
      latestTokenRef.current = resp.access_token

      // Fetch user info (profile name / email / picture)
      try {
        const info = await getUserInfo(resp.access_token)
        if (info?.email) {
          const u = { name: info.name, email: info.email, picture: info.picture }
          setUser(u)
          localStorage.setItem(USER_KEY, JSON.stringify(u))
        }
      } catch { /* non-critical */ }

      resolve(resp.access_token)
    }
    clientRef.current.requestAccessToken({ prompt })
  }), [])

  // ─── Public login / logout ────────────────────────────────────────────────
  const login = useCallback(async () => {
    const t = await _requestToken('select_account')
    // After login: pull first (remote wins if newer), then push local changes
    setSyncStatus('syncing')
    try {
      await pullAll(t)
      window.dispatchEvent(new CustomEvent('shoplist-drive-pulled'))
      await pushAll(t)   // push anything changed while offline
      setSyncStatus('ok')
    } catch (e) {
      setSyncStatus('error')
      setSyncError(e.message)
    }
    return t
  }, [_requestToken])

  const logout = useCallback(() => {
    if (token) window.google?.accounts?.oauth2?.revoke(token, () => {})
    setToken(null)
    setTokenExpiry(0)
    latestTokenRef.current = null
    setUser(null)
    setSyncStatus('idle')
    setSyncError(null)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('shoplist_sync_meta')
  }, [token])

  // ─── Silent refresh on startup ────────────────────────────────────────────
  // Once GIS is ready, try silently refreshing if a user was previously logged in.
  useEffect(() => {
    if (!gisReady || !user || silentTriedRef.current) return
    silentTriedRef.current = true
    ;(async () => {
      try {
        const t = await _requestToken('') // silent – no popup
        const result = await pullAll(t)
        if (result === 'pulled') {
          window.dispatchEvent(new CustomEvent('shoplist-drive-pulled'))
        }
        if (autoSyncRef.current) {
          await pushAll(t) // push local changes made while offline
        }
        setSyncStatus('ok')
      } catch {
        // Silent auth failed (e.g. session expired) – just show login button
        setSyncStatus('idle')
      }
    })()
  }, [gisReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── ensureToken ─────────────────────────────────────────────────────────
  const ensureToken = useCallback(async () => {
    if (token && Date.now() < tokenExpiry) return token
    try   { return await _requestToken('') }         // silent
    catch { return await _requestToken('select_account') } // popup
  }, [token, tokenExpiry, _requestToken])

  // keep ref in sync so localStorage patch can call it without stale closure
  useEffect(() => { ensureTokenRef.current = ensureToken }, [ensureToken])

  // ─── syncNow ──────────────────────────────────────────────────────────────
  const syncNow = useCallback(async () => {
    const t = await ensureToken()
    if (!t) return
    setSyncStatus('syncing')
    try {
      await pushAll(t)
      setSyncStatus('ok')
      setSyncError(null)
    } catch (e) {
      setSyncStatus('error')
      setSyncError(e.message)
    }
  }, [ensureToken])

  // ─── updateSyncSettings ───────────────────────────────────────────────────
  const updateSyncSettings = useCallback((updates) => {
    const next = saveSyncSettings(updates)
    if ('autoSync' in updates) setAutoSync(next.autoSync)
    if ('delayMs'  in updates) setSyncDelay(next.delayMs)
    if (updates.autoSync === true) syncNow()
  }, [syncNow])

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      token,
      syncStatus,
      syncError,
      autoSync,
      syncDelay,
      updateSyncSettings,
      login,
      logout,
      ensureToken,
      syncNow,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
