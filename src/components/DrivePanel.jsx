/**
 * DrivePanel – Drive login button + full management drawer.
 *
 * Usage:
 *   <DrivePanel />                     // in HomePage header
 *   <DrivePanel currentList={list} />  // in ShoppingListPage header (pre-fills share)
 */

import { useState, useCallback, useEffect } from 'react'
import {
  Box, IconButton, Avatar, Drawer, Typography, Button, Divider,
  Tabs, Tab, CircularProgress, Chip, Alert, TextField,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Tooltip, Badge, MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import CloudIcon           from '@mui/icons-material/Cloud'
import CloudDoneIcon       from '@mui/icons-material/CloudDone'
import CloudOffIcon        from '@mui/icons-material/CloudOff'
import SyncIcon            from '@mui/icons-material/Sync'
import LogoutIcon          from '@mui/icons-material/Logout'
import ShareIcon           from '@mui/icons-material/Share'
import DeleteIcon          from '@mui/icons-material/Delete'
import PersonRemoveIcon    from '@mui/icons-material/PersonRemove'
import PersonAddIcon       from '@mui/icons-material/PersonAdd'
import DownloadIcon        from '@mui/icons-material/Download'
import PeopleIcon          from '@mui/icons-material/People'

import { useAuth }            from '../contexts/AuthContext'
import {
  createSharedFile, listMySharedFiles, listReceivedFiles,
  readSharedFile, getFilePermissions, addPermission,
  removePermission, deleteSharedFile,
} from '../utils/driveApi'
import { getAllLists, createNewList } from '../utils/listStorage'
import { getAllDefaultLists, createDefaultList } from '../utils/defaultListStorage'
import { getAllSupermarkets, createSupermarket } from '../utils/supermarketStorage'
import { getCustomCategories, saveCustomCategories } from '../utils/categoryStorage'
import { getSyncMeta }        from '../utils/driveSync'
import { format }             from 'date-fns'
import { it }                 from 'date-fns/locale'

// ─── helpers ────────────────────────────────────────────────────────────────

const typeLabel = {
  list:         '🛒 Lista spesa',
  defaultList:  '📋 Lista default',
  supermarket:  '🏪 Supermercato',
  categories:   '🏷️ Categorie custom',
}

function fmtDate(iso) {
  try { return format(new Date(iso), 'd MMM yyyy, HH:mm', { locale: it }) }
  catch { return iso }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SyncStatusChip({ status, error }) {
  if (status === 'syncing')
    return <Chip icon={<CircularProgress size={12} />} label="Sincronizzazione…" size="small" />
  if (status === 'ok')
    return <Chip icon={<CloudDoneIcon fontSize="small" />} label="Sincronizzato" size="small" color="success" />
  if (status === 'error')
    return <Chip icon={<CloudOffIcon fontSize="small" />} label={error || 'Errore'} size="small" color="error" />
  return <Chip icon={<CloudIcon fontSize="small" />} label="Non sincronizzato" size="small" />
}

// ─── Permissions dialog ──────────────────────────────────────────────────────

function PermissionsDialog({ open, onClose, token, fileId, fileName }) {
  const [perms,    setPerms]    = useState([])
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [adding,   setAdding]   = useState(false)
  const [err,      setErr]      = useState('')

  useEffect(() => {
    if (!open || !fileId) return
    setLoading(true)
    getFilePermissions(token, fileId)
      .then(setPerms)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [open, fileId, token])

  const handleAdd = async () => {
    if (!email.trim()) return
    setAdding(true); setErr('')
    try {
      await addPermission(token, fileId, email.trim())
      setEmail('')
      const updated = await getFilePermissions(token, fileId)
      setPerms(updated)
    } catch (e) { setErr(e.message) }
    finally { setAdding(false) }
  }

  const handleRevoke = async (permId) => {
    try {
      await removePermission(token, fileId, permId)
      setPerms(p => p.filter(x => x.id !== permId))
    } catch (e) { setErr(e.message) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>👥 Gestisci accesso — {fileName}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {err && <Alert severity="error">{err}</Alert>}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small" fullWidth label="Email Gmail" type="email"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleAdd} disabled={adding || !email.trim()}>
            {adding ? <CircularProgress size={16} /> : 'Aggiungi'}
          </Button>
        </Box>
        {loading ? <CircularProgress size={24} sx={{ mx: 'auto' }} /> : (
          perms.length === 0
            ? <Typography variant="body2" color="text.secondary">Nessun accesso concesso</Typography>
            : (
              <List dense>
                {perms.map(p => (
                  <ListItem key={p.id}>
                    <ListItemText
                      primary={p.displayName || p.emailAddress}
                      secondary={p.emailAddress}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Revoca accesso">
                        <IconButton edge="end" size="small" color="error" onClick={() => handleRevoke(p.id)}>
                          <PersonRemoveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

// ─── Guard wrapper (hidden when Drive not configured) ─────────────────────────
export default function DrivePanel(props) {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null
  return <DrivePanelInner {...props} />
}

function DrivePanelInner({ currentList = null }) {
  const { user, isLoggedIn, token, syncStatus, syncError, login, logout, ensureToken, syncNow } = useAuth()

  const [open,         setOpen]         = useState(false)
  const [tab,          setTab]          = useState(0)
  const [syncing,      setSyncing]      = useState(false)
  const [myFiles,      setMyFiles]      = useState([])
  const [received,     setReceived]     = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [shareType,    setShareType]    = useState('list')
  const [shareItemId,  setShareItemId]  = useState('')
  const [shareEmail,   setShareEmail]   = useState('')
  const [shareStatus,  setShareStatus]  = useState('')  // '' | 'sharing' | 'ok' | 'error:<msg>'
  const [permDialog,   setPermDialog]   = useState(null) // { fileId, fileName }
  const [importStatus, setImportStatus] = useState({})   // fileId → 'ok' | 'error'

  // Available items for each share type
  const allLists        = getAllLists()
  const allDefaultLists = getAllDefaultLists()
  const allSupermarkets = getAllSupermarkets()

  // Reset shareItemId when type changes
  useEffect(() => {
    if (shareType === 'list')        setShareItemId(currentList?.id || allLists[0]?.id || '')
    if (shareType === 'defaultList') setShareItemId(allDefaultLists[0]?.id || '')
    if (shareType === 'supermarket') setShareItemId(allSupermarkets[0]?.id || '')
    if (shareType === 'categories')  setShareItemId('all')
  }, [shareType]) // eslint-disable-line react-hooks/exhaustive-deps

  // Init share item when panel opens or currentList changes
  useEffect(() => {
    if (open && currentList) { setShareType('list'); setShareItemId(currentList.id) }
  }, [open, currentList])

  const loadFiles = useCallback(async () => {
    if (!token) return
    setLoadingFiles(true)
    try {
      const [mine, recv] = await Promise.all([listMySharedFiles(token), listReceivedFiles(token)])
      setMyFiles(mine)
      setReceived(recv)
    } catch { /* ignore */ }
    finally { setLoadingFiles(false) }
  }, [token])

  const handleOpen = () => { setOpen(true); loadFiles() }

  // ─── Share action ──────────────────────────────────────────────────────────
  const handleShare = async () => {
    setShareStatus('sharing')
    try {
      const t = await ensureToken()
      let name = '', data = {}

      if (shareType === 'list') {
        const list = allLists.find(l => l.id === shareItemId)
        if (!list) throw new Error('Lista non trovata')
        name = list.name
        data = { items: list.items }
      } else if (shareType === 'defaultList') {
        const dl = allDefaultLists.find(l => l.id === shareItemId)
        if (!dl) throw new Error('Lista default non trovata')
        name = dl.name
        data = { items: dl.items }
      } else if (shareType === 'supermarket') {
        const sm = allSupermarkets.find(s => s.id === shareItemId)
        if (!sm) throw new Error('Supermercato non trovato')
        name = sm.name
        data = sm
      } else if (shareType === 'categories') {
        const cats = getCustomCategories()
        name = 'Categorie custom'
        data = { categories: cats }
      }

      const fileId = await createSharedFile(t, { type: shareType, name, data })

      if (shareEmail.trim()) {
        await addPermission(t, fileId, shareEmail.trim())
      }

      setShareStatus('ok')
      setShareEmail('')
      loadFiles()
    } catch (e) {
      setShareStatus(`error:${e.message}`)
    }
  }

  // ─── Delete my file ────────────────────────────────────────────────────────
  const handleDeleteFile = async (fileId) => {
    try {
      const t = await ensureToken()
      await deleteSharedFile(t, fileId)
      setMyFiles(f => f.filter(x => x.id !== fileId))
    } catch (e) { alert(`Errore: ${e.message}`) }
  }

  // ─── Import received file ─────────────────────────────────────────────────
  const handleImport = async (file) => {
    try {
      const t = await ensureToken()
      const content = await readSharedFile(t, file.id)
      if (!content) throw new Error('File vuoto o non leggibile')

      const { type, name, data } = content

      if (type === 'list') {
        createNewList(name + ' (importato)', data.items || [])
      } else if (type === 'defaultList') {
        createDefaultList({ name: name + ' (importato)', items: data.items || [] })
      } else if (type === 'supermarket') {
        createSupermarket({
          name: (data.name || name) + ' (importato)',
          categoryOrder: data.categoryOrder || [],
        })
      } else if (type === 'categories') {
        const existing = getCustomCategories()
        const incoming = data.categories || []
        const merged   = [...existing]
        for (const c of incoming) {
          if (!merged.find(x => x.name.toLowerCase() === c.name.toLowerCase())) merged.push(c)
        }
        saveCustomCategories(merged)
      } else {
        throw new Error(`Tipo sconosciuto: ${type}`)
      }
      setImportStatus(s => ({ ...s, [file.id]: 'ok' }))
      window.dispatchEvent(new CustomEvent('shoplist-drive-pulled'))
    } catch (e) {
      setImportStatus(s => ({ ...s, [file.id]: `error:${e.message}` }))
    }
  }

  // ─── Sync meta info ───────────────────────────────────────────────────────
  const meta = getSyncMeta()

  // ─── Render: icon button ──────────────────────────────────────────────────
  const SyncIcon_ = syncStatus === 'syncing' ? () => <CircularProgress size={18} sx={{ color: 'white' }} />
                  : syncStatus === 'error'   ? () => <CloudOffIcon />
                  : syncStatus === 'ok'      ? () => <CloudDoneIcon />
                  :                            () => <CloudIcon />

  const button = isLoggedIn ? (
    <Tooltip title={`Drive: ${user?.email}`}>
      <Badge
        color={syncStatus === 'error' ? 'error' : syncStatus === 'ok' ? 'success' : 'default'}
        variant="dot"
        overlap="circular"
        invisible={syncStatus === 'idle'}
      >
        <IconButton onClick={handleOpen} sx={{ p: 0.5 }}>
          {user?.picture
            ? <Avatar src={user.picture} sx={{ width: 32, height: 32 }} />
            : <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                {user?.name?.[0]}
              </Avatar>
          }
        </IconButton>
      </Badge>
    </Tooltip>
  ) : (
    <Tooltip title="Accedi con Google Drive">
      <IconButton onClick={() => login()} sx={{ color: 'white' }}>
        <CloudIcon />
      </IconButton>
    </Tooltip>
  )

  // ─── Render: share item picker ─────────────────────────────────────────────
  const itemPicker = () => {
    if (shareType === 'categories') return null
    let items = []
    if (shareType === 'list')        items = allLists.map(l => ({ id: l.id, label: l.name }))
    if (shareType === 'defaultList') items = allDefaultLists.map(l => ({ id: l.id, label: l.name }))
    if (shareType === 'supermarket') items = allSupermarkets.map(s => ({ id: s.id, label: s.name }))
    if (!items.length) return <Alert severity="info" sx={{ mt: 1 }}>Nessun elemento disponibile per questo tipo</Alert>
    return (
      <FormControl fullWidth size="small" sx={{ mt: 1 }}>
        <InputLabel>Quale {typeLabel[shareType]?.split(' ')[1]}</InputLabel>
        <Select value={shareItemId} label={`Quale ${typeLabel[shareType]?.split(' ')[1]}`}
                onChange={e => setShareItemId(e.target.value)}>
          {items.map(i => <MenuItem key={i.id} value={i.id}>{i.label}</MenuItem>)}
        </Select>
      </FormControl>
    )
  }

  // ─── Render: drawer content ────────────────────────────────────────────────
  return (
    <>
      {button}

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}
              PaperProps={{ sx: { width: { xs: '100vw', sm: 420 } } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

          {/* Head */}
          <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {user?.picture
                ? <Avatar src={user.picture} />
                : <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)' }}>{user?.name?.[0]}</Avatar>
              }
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{user?.name}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </Typography>
              </Box>
              <Tooltip title="Disconnetti">
                <IconButton onClick={() => { logout(); setOpen(false) }} sx={{ color: 'white' }} size="small">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Sync row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
              <SyncStatusChip status={syncStatus} error={syncError} />
              {meta.lastSync && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {fmtDate(meta.lastSync)}
                </Typography>
              )}
              <Button
                size="small"
                startIcon={syncing ? <CircularProgress size={12} sx={{ color: 'white' }} /> : <SyncIcon fontSize="small" />}
                sx={{ ml: 'auto', color: 'white', borderColor: 'rgba(255,255,255,0.5)', minWidth: 0 }}
                variant="outlined"
                disabled={syncing}
                onClick={async () => { setSyncing(true); await syncNow(); setSyncing(false) }}
              >
                Sincronizza
              </Button>
            </Box>
          </Box>

          {/* Tabs */}
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab icon={<ShareIcon fontSize="small" />}  label="Condividi"  iconPosition="start" sx={{ minHeight: 48, fontSize: '0.8rem' }} />
            <Tab icon={<DownloadIcon fontSize="small" />} label="Ricevuti" iconPosition="start" sx={{ minHeight: 48, fontSize: '0.8rem' }}
                 iconBadge={received.length > 0 ? received.length : undefined}
            />
          </Tabs>

          {/* Tab content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>

            {/* ── Tab 0: Condividi ── */}
            {tab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Crea un file condivisibile</Typography>

                {/* Type selector */}
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select value={shareType} label="Tipo" onChange={e => setShareType(e.target.value)}>
                    {Object.entries(typeLabel).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                  </Select>
                </FormControl>

                {itemPicker()}

                {/* Email */}
                <TextField
                  size="small" fullWidth
                  label="Email destinatario (opzionale)"
                  placeholder="esempio@gmail.com"
                  type="email"
                  value={shareEmail}
                  onChange={e => { setShareEmail(e.target.value); setShareStatus('') }}
                  helperText="Lascia vuoto per creare il file senza condividerlo subito"
                />

                {shareStatus === 'ok' && (
                  <Alert severity="success" onClose={() => setShareStatus('')}>
                    File creato{shareEmail ? ' e condiviso' : ''}! Ora appare sotto.
                  </Alert>
                )}
                {shareStatus.startsWith('error:') && (
                  <Alert severity="error" onClose={() => setShareStatus('')}>
                    {shareStatus.slice(6)}
                  </Alert>
                )}

                <Button
                  variant="contained" startIcon={shareStatus === 'sharing' ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <ShareIcon />}
                  disabled={shareStatus === 'sharing' || (shareType !== 'categories' && !shareItemId)}
                  onClick={handleShare}
                >
                  {shareEmail.trim() ? 'Condividi' : 'Crea file Drive'}
                </Button>

                <Divider />

                {/* My shared files */}
                <Typography variant="subtitle2" color="text.secondary">
                  I miei file condivisi {loadingFiles && <CircularProgress size={12} sx={{ ml: 1 }} />}
                </Typography>

                {myFiles.length === 0 && !loadingFiles && (
                  <Typography variant="body2" color="text.secondary">Nessun file condiviso ancora</Typography>
                )}

                {myFiles.map(f => (
                  <Box key={f.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.description?.split(' · ')[2] || f.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {typeLabel[f.appProperties?.shoplistType] || f.appProperties?.shoplistType}
                          {' · '}{fmtDate(f.createdTime)}
                        </Typography>
                      </Box>
                      <Tooltip title="Gestisci accesso">
                        <IconButton size="small" onClick={() => setPermDialog({ fileId: f.id, fileName: f.description?.split(' · ')[2] || f.name })}>
                          <PeopleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Elimina file (tutti perderanno l'accesso)">
                        <IconButton size="small" color="error" onClick={() => handleDeleteFile(f.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* ── Tab 1: Ricevuti ── */}
            {tab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  File condivisi con te {loadingFiles && <CircularProgress size={12} sx={{ ml: 1 }} />}
                </Typography>

                {received.length === 0 && !loadingFiles && (
                  <Alert severity="info">Nessun file ricevuto ancora. Quando qualcuno ti condivide dati ShopList appariranno qui.</Alert>
                )}

                {received.map(f => {
                  const status = importStatus[f.id]
                  return (
                    <Box key={f.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {f.description?.split(' · ')[2] || f.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {typeLabel[f.appProperties?.shoplistType] || f.appProperties?.shoplistType}
                        {f.sharingUser?.displayName && ` · da ${f.sharingUser.displayName}`}
                        {' · '}{fmtDate(f.createdTime)}
                      </Typography>
                      {status === 'ok' && <Alert severity="success" sx={{ mt: 0.5, py: 0 }}>Importato!</Alert>}
                      {status?.startsWith('error:') && <Alert severity="error" sx={{ mt: 0.5, py: 0 }}>{status.slice(6)}</Alert>}
                      {!status && (
                        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}
                                onClick={() => handleImport(f)} sx={{ mt: 1 }}>
                          Importa
                        </Button>
                      )}
                    </Box>
                  )
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Permissions management dialog */}
      {permDialog && (
        <PermissionsDialog
          open
          token={token}
          fileId={permDialog.fileId}
          fileName={permDialog.fileName}
          onClose={() => setPermDialog(null)}
        />
      )}
    </>
  )
}
