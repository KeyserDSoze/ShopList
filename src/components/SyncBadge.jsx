/**
 * SyncBadge – per-item sync status + inline share by email.
 *
 * Props:
 *   syncType   'list' | 'dl' | 'sm' | 'custom'   (registry key prefix)
 *   driveType  'list' | 'defaultList' | 'supermarket' | 'categories' (for Drive file)
 *   id         string  item id (use 'all' for custom categories)
 *   updatedAt  string  ISO of last local modification
 *   name       string  display name
 *   getData()  fn      returns { data } payload for the shared Drive file
 */

import { useState, useCallback } from 'react'
import {
  Box, Chip, IconButton, Tooltip, Popover, TextField,
  Button, CircularProgress, Typography,
} from '@mui/material'
import CloudDoneIcon    from '@mui/icons-material/CloudDone'
import CloudOffIcon     from '@mui/icons-material/CloudOff'
import CloudQueueIcon   from '@mui/icons-material/CloudQueue'
import SyncIcon         from '@mui/icons-material/Sync'
import ShareIcon        from '@mui/icons-material/Share'
import SendIcon         from '@mui/icons-material/Send'

import { useAuth }             from '../contexts/AuthContext'
import { getItemSyncStatus }   from '../utils/driveSync'
import { createSharedFile, addPermission } from '../utils/driveApi'

export default function SyncBadge({ syncType, driveType, id, updatedAt, name, getData, sx = {} }) {
  const { isLoggedIn, ensureToken, syncNow } = useAuth()
  const [syncing,    setSyncing]    = useState(false)
  const [shareAnchor, setShareAnchor] = useState(null)
  const [email,      setEmail]      = useState('')
  const [sharing,    setSharing]    = useState(false)
  const [shareOk,    setShareOk]    = useState(false)
  const [shareErr,   setShareErr]   = useState('')

  // Re-read status on every render so it reacts to external changes
  const status = isLoggedIn ? getItemSyncStatus(syncType, id, updatedAt) : null

  const handleSyncNow = async (e) => {
    e.stopPropagation()
    setSyncing(true)
    await syncNow()
    setSyncing(false)
  }

  const handleOpenShare = (e) => {
    e.stopPropagation()
    setShareAnchor(e.currentTarget)
    setShareOk(false)
    setShareErr('')
    setEmail('')
  }

  const handleShare = useCallback(async (e) => {
    e?.stopPropagation()
    if (!email.trim()) return
    setSharing(true); setShareErr(''); setShareOk(false)
    try {
      const token  = await ensureToken()
      const { data } = getData()
      const fileId = await createSharedFile(token, { type: driveType, name, data })
      await addPermission(token, fileId, email.trim())
      setShareOk(true)
      setEmail('')
    } catch (err) {
      setShareErr(err.message)
    } finally {
      setSharing(false)
    }
  }, [email, ensureToken, getData, driveType, name])

  if (!isLoggedIn) return null

  // ── chip ────────────────────────────────────────────────────────────────────
  const chipProps =
    status === 'synced' ? { icon: <CloudDoneIcon sx={{ fontSize: '0.9rem !important' }} />, label: 'Sincronizzato', color: 'success' }
  : status === 'dirty'  ? { icon: <CloudOffIcon  sx={{ fontSize: '0.9rem !important' }} />, label: 'Non sincronizzato', color: 'warning' }
  :                       { icon: <CloudQueueIcon sx={{ fontSize: '0.9rem !important' }} />, label: 'Mai sincronizzato', color: 'default' }

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', ...sx }}
      onClick={e => e.stopPropagation()}
    >
      <Chip {...chipProps} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} />

      {/* Sync now button – shown when dirty or never */}
      {status !== 'synced' && (
        <Tooltip title="Sincronizza ora">
          <span>
            <IconButton size="small" sx={{ p: 0.3 }} onClick={handleSyncNow} disabled={syncing}>
              {syncing
                ? <CircularProgress size={12} />
                : <SyncIcon sx={{ fontSize: 14 }} />}
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Share by email */}
      <Tooltip title="Condividi via email">
        <IconButton size="small" sx={{ p: 0.3 }} onClick={handleOpenShare}>
          <ShareIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>

      {/* Share popover */}
      <Popover
        open={Boolean(shareAnchor)}
        anchorEl={shareAnchor}
        onClose={() => setShareAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClick={e => e.stopPropagation()}
      >
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 260 }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>Condividi «{name}» con</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <TextField
              size="small"
              placeholder="email@gmail.com"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setShareOk(false); setShareErr('') }}
              onKeyDown={e => e.key === 'Enter' && handleShare(e)}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleShare}
              disabled={sharing || !email.trim()}
              sx={{ minWidth: 36, px: 1 }}
            >
              {sharing ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <SendIcon fontSize="small" />}
            </Button>
          </Box>
          {shareOk && (
            <Typography variant="caption" color="success.main">✅ Condiviso!</Typography>
          )}
          {shareErr && (
            <Typography variant="caption" color="error.main">{shareErr}</Typography>
          )}
        </Box>
      </Popover>
    </Box>
  )
}
