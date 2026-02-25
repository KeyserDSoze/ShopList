import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SettingsIcon from '@mui/icons-material/Settings'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { getAllLists, createNewList, deleteList, getListProgress } from '../utils/listStorage'
import { getAllDefaultLists } from '../utils/defaultListStorage'

// Somma quantità compatibili (es. "30 g" + "30 g" → "60 g")
function mergeQuantity(a, b) {
  if (!a && !b) return ''
  if (!a) return b
  if (!b) return a
  const parseQ = s => {
    const m = s.trim().match(/^([\d.,]+)\s*([a-zA-Z]*)$/)
    if (!m) return null
    return { num: parseFloat(m[1].replace(',', '.')), unit: m[2].toLowerCase() }
  }
  const qa = parseQ(a), qb = parseQ(b)
  if (qa && qb && qa.unit === qb.unit) {
    const rounded = Math.round((qa.num + qb.num) * 1000) / 1000
    return qa.unit ? `${rounded} ${qa.unit}` : String(rounded)
  }
  return `${a} + ${b}`
}
import { formatDistanceToNow, format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function HomePage({ onSelectList, onOpenSettings, onOpenPrivacy, onOpenTerms, onOpenHowTo }) {
  const [lists, setLists] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deleteListId, setDeleteListId] = useState(null)
  const [defaultLists, setDefaultLists] = useState([])
  const [selectedDefaultIds, setSelectedDefaultIds] = useState([])

  useEffect(() => {
    loadLists()
  }, [])

  useEffect(() => {
    if (openDialog) {
      if (!newListName) setNewListName(`Spesa-${format(new Date(), 'yyyy-MM-dd')}`)
      const dl = getAllDefaultLists()
      setDefaultLists(dl)
      // Pre-select the default list (or the first one if only one)
      const def = dl.find(l => l.isDefault) || dl[0]
      setSelectedDefaultIds(def ? [def.id] : [])
    }
  }, [openDialog])

  const loadLists = () => {
    const allLists = getAllLists()
    setLists(allLists)
  }

  const toggleDefaultList = (id) => {
    setSelectedDefaultIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const getMergedItems = () => {
    const selected = defaultLists.filter(l => selectedDefaultIds.includes(l.id))
    const merged = []
    for (const list of selected) {
      for (const item of list.items) {
        const idx = merged.findIndex(e => e.name.toLowerCase() === item.name.toLowerCase())
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], quantity: mergeQuantity(merged[idx].quantity, item.quantity) }
        } else {
          merged.push({ ...item })
        }
      }
    }
    return merged
  }

  const handleCreateList = () => {
    if (!newListName.trim()) return
    const defaultItems = getMergedItems()
    const newList = createNewList(newListName, defaultItems)
    if (newList) {
      setLists(prev => [...prev, newList])
      setNewListName('')
      setOpenDialog(false)
    }
  }

  const handleDeleteClick = (listId, e) => {
    e.stopPropagation()
    setDeleteListId(listId)
    setOpenDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (deleteList(deleteListId)) {
      setLists(prev => prev.filter(l => l.id !== deleteListId))
    }
    setOpenDeleteDialog(false)
    setDeleteListId(null)
  }

  const getTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { locale: it, addSuffix: true })
    } catch {
      return 'Data sconosciuta'
    }
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{ 
        width: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2.5, sm: 3 },
      }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            🛒 ShopList
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Gestisci le tue liste della spesa
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ 
        width: '100%',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3 },
      }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          {/* Pulsanti principali */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
              <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={onOpenSettings}
              size="large"
              sx={{ width: '100%', py: 1.5, fontSize: '1rem' }}
            >
              Impostazioni
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              size="large"
              sx={{ width: '100%', py: 1.5, fontSize: '1rem' }}
            >
              Nuova lista
            </Button>
            <Button
              variant="text"
              startIcon={<HelpOutlineIcon />}
              onClick={onOpenHowTo}
              size="medium"
              sx={{ width: '100%', color: 'text.secondary' }}
            >
              Come funziona
            </Button>
          </Box>

          {lists.length === 0 ? (
            <Alert severity="info">
              Nessuna lista della spesa. Crea la tua prima lista!
            </Alert>
          ) : (
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {lists.map(list => {
                const progress = getListProgress(list)
                const completedItems = list.items.filter(item => item.checked).length

                return (
                  <Grid item xs={12} sm={6} md={4} key={list.id}>
                    <Card
                      onClick={() => onSelectList(list.id)}
                      sx={{
                        cursor: 'pointer',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      <CardContent sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                            {list.name}
                          </Typography>
                          <Chip
                            label={list.status === 'readyToPurchase' ? '✅ Pronto' : '🔄 Prep'}
                            size="small"
                            color={list.status === 'readyToPurchase' ? 'success' : 'warning'}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                          Creata {getTimeAgo(list.createdAt)}
                        </Typography>
                        <Box sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Progresso</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {completedItems} / {list.items.length}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ borderRadius: 1, height: 6 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {list.items.length} articoli
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={(e) => handleDeleteClick(list.id, e)}
                        >
                          Elimina
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          )}
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setNewListName('') }} maxWidth="sm" fullWidth>
        <DialogTitle>Crea una nuova lista della spesa</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Nome lista"
            placeholder="Es: Spesa settimanale"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
          />
          {defaultLists.length > 0 && (
            <Box>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {defaultLists.length === 1
                  ? 'Lista di default da usare come base:'
                  : 'Scegli le liste di default da usare come base (le selezioni vengono unite):'}
              </Typography>
              <FormGroup>
                {defaultLists.map(dl => (
                  <FormControlLabel
                    key={dl.id}
                    control={
                      <Checkbox
                        checked={selectedDefaultIds.includes(dl.id)}
                        onChange={() => toggleDefaultList(dl.id)}
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">{dl.name}</Typography>
                        <Typography variant="caption" color="text.secondary">({dl.items.length} art.)</Typography>
                        {dl.isDefault && <Chip label="default" size="small" sx={{ height: 16, fontSize: 10, bgcolor: '#667eea', color: 'white' }} />}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
              {selectedDefaultIds.length > 1 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {getMergedItems().length} articoli totali dopo l'unione
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenDialog(false); setNewListName('') }}>Annulla</Button>
          <Button onClick={handleCreateList} variant="contained" color="primary">
            Crea
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Elimina lista della spesa</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare questa lista? Non potrai annullare questa azione.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annulla</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      <Box sx={{ width: '100%', py: 3, px: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider', mt: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          ShopList — tutti i dati sono salvati solo sul tuo dispositivo
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button size="small" sx={{ color: 'text.secondary', fontSize: '0.7rem', minWidth: 0 }} onClick={onOpenHowTo}>Come funziona & FAQ</Button>
          <Button size="small" sx={{ color: 'text.secondary', fontSize: '0.7rem', minWidth: 0 }} onClick={onOpenPrivacy}>Privacy Policy</Button>
          <Button size="small" sx={{ color: 'text.secondary', fontSize: '0.7rem', minWidth: 0 }} onClick={onOpenTerms}>Termini di servizio</Button>
        </Box>
      </Box>
    </Box>
  )
}
