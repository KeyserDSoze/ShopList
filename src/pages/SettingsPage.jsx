import { useState, useEffect } from 'react'
import {
  Box, Typography, IconButton, Button, Tabs, Tab,
  Card, CardContent, List, ListItem, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Alert, Snackbar, Divider,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ShareIcon from '@mui/icons-material/Share'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { BUILTIN_CATEGORIES, getCategoryName } from '../constants/categories'
import { getCustomCategories, createCustomCategory, updateCustomCategory, deleteCustomCategory } from '../utils/categoryStorage'
import { getAllSupermarkets, createSupermarket, updateSupermarket, deleteSupermarket, serializeSupermarket } from '../utils/supermarketStorage'
import { getDefaultItemsSync, saveDefaultItems, addDefaultItem, removeDefaultItem } from '../utils/defaultListStorage'

// ─── Emoji picker semplice ────────────────────────────────────────────────────
const COMMON_EMOJIS = [
  '🥦','🥩','🐟','🥓','🍞','🍝','🥜','🫒','🍪','☕','🥫','❄️','🧼','🧴','👕','📱','📦',
  '🛒','🏪','🏬','🍎','🥕','🧅','🧄','🍋','🍇','🥑','🫐','🫚','🧃','🥛','🧈','🥚',
  '🧀','🍗','🥩','🍖','🥬','🫑','🥒','🍅','🧂','🫙','🥃','🍺','🍾','💊','🪥','🧻',
]

function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)} sx={{ minWidth: 56, fontSize: '1.5rem' }}>
        {value}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Scegli emoji</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxWidth: 320 }}>
            {COMMON_EMOJIS.map(e => (
              <Button key={e} onClick={() => { onChange(e); setOpen(false) }}
                sx={{ minWidth: 40, fontSize: '1.5rem', p: 0.5 }}>
                {e}
              </Button>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Tab Lista Default ────────────────────────────────────────────────────────
function DefaultListTab({ customCategories }) {
  const [items, setItems] = useState([])
  const [openAdd, setOpenAdd] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', categoryId: 1, quantity: '' })
  const [snack, setSnack] = useState('')

  useEffect(() => { setItems(getDefaultItemsSync()) }, [])

  const handleAdd = () => {
    if (!newItem.name.trim()) return
    const updated = addDefaultItem(newItem)
    setItems(updated)
    setNewItem({ name: '', categoryId: 1, quantity: '' })
    setOpenAdd(false)
    setSnack('Articolo aggiunto')
  }

  const handleDelete = (idx) => {
    const updated = removeDefaultItem(idx)
    setItems(updated)
    setSnack('Articolo rimosso')
  }

  const allCategories = [
    ...BUILTIN_CATEGORIES.map(c => ({ id: c.id, label: getCategoryName(c.id, [], 'it') })),
    ...customCategories.map(c => ({ id: c.id, label: `${c.emoji} ${c.name}` })),
  ]

  // Raggruppa per categoria
  const grouped = items.reduce((acc, item, idx) => {
    const catId = item.categoryId
    if (!acc[catId]) acc[catId] = []
    acc[catId].push({ ...item, _idx: idx })
    return acc
  }, {})

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Questi articoli vengono aggiunti automaticamente ad ogni nuova lista.
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpenAdd(true)}
        fullWidth
        sx={{ mb: 2 }}
      >
        Aggiungi articolo
      </Button>

      {Object.keys(grouped).length === 0 && (
        <Alert severity="info">Nessun articolo di default. Aggiungine uno!</Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Object.entries(grouped).map(([catId, catItems]) => (
          <Card key={catId}>
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {getCategoryName(Number.isNaN(+catId) ? catId : +catId, customCategories)}
              </Typography>
              <List dense disablePadding>
                {catItems.map(item => (
                  <ListItem key={item._idx} disablePadding sx={{ py: 0.25 }}
                    secondaryAction={
                      <IconButton edge="end" size="small" color="error" onClick={() => handleDelete(item._idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={item.name}
                      secondary={item.quantity || null}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle>Aggiungi articolo di default</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField autoFocus label="Nome *" fullWidth value={newItem.name}
            onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <FormControl fullWidth>
            <InputLabel>Categoria *</InputLabel>
            <Select label="Categoria *" value={newItem.categoryId}
              onChange={e => setNewItem(p => ({ ...p, categoryId: e.target.value }))}>
              {allCategories.map(c => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Quantità" fullWidth value={newItem.quantity}
            onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))}
            placeholder="Es: 200 g" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleAdd}>Aggiungi</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')} message={snack} />
    </Box>
  )
}

// ─── Tab Categorie ─────────────────────────────────────────────────────────
function CategoriesTab({ customCategories, onCustomCategoriesChange }) {
  const [openAdd, setOpenAdd] = useState(false)
  const [editCat, setEditCat] = useState(null)
  const [form, setForm] = useState({ name: '', emoji: '📦' })
  const [snack, setSnack] = useState('')

  const handleAdd = () => {
    if (!form.name.trim()) return
    createCustomCategory(form)
    onCustomCategoriesChange(getCustomCategories())
    setForm({ name: '', emoji: '📦' })
    setOpenAdd(false)
    setSnack('Categoria creata')
  }

  const handleEdit = () => {
    if (!form.name.trim() || !editCat) return
    updateCustomCategory(editCat.id, form)
    onCustomCategoriesChange(getCustomCategories())
    setEditCat(null)
    setSnack('Categoria aggiornata')
  }

  const handleDelete = (id) => {
    deleteCustomCategory(id)
    onCustomCategoriesChange(getCustomCategories())
    setSnack('Categoria eliminata')
  }

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        Categorie predefinite (non modificabili)
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        {BUILTIN_CATEGORIES.map(c => (
          <Chip key={c.id} label={`${c.emoji} ${c.translations.it}`} size="small" />
        ))}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Categorie custom</Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpenAdd(true)}
        fullWidth
        sx={{ mb: 2 }}
      >
        Nuova categoria
      </Button>

      {customCategories.length === 0 && (
        <Alert severity="info">Nessuna categoria custom creata.</Alert>
      )}
      <List>
        {customCategories.map(cat => (
          <ListItem key={cat.id} divider
            secondaryAction={
              <Box>
                <IconButton size="small" onClick={() => { setEditCat(cat); setForm({ name: cat.name, emoji: cat.emoji }) }}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(cat.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            <ListItemText primary={`${cat.emoji} ${cat.name}`} />
          </ListItem>
        ))}
      </List>

      {/* Dialog add */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nuova categoria</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <EmojiPicker value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e })) } />
            <TextField label="Nome *" fullWidth value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleAdd}>Crea</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog edit */}
      <Dialog open={!!editCat} onClose={() => setEditCat(null)} fullWidth maxWidth="xs">
        <DialogTitle>Modifica categoria</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <EmojiPicker value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e }))} />
            <TextField label="Nome *" fullWidth value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCat(null)}>Annulla</Button>
          <Button variant="contained" onClick={handleEdit}>Salva</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')} message={snack} />
    </Box>
  )
}

// ─── Editor ordine reparti supermercato ──────────────────────────────────────
function SupermarketEditor({ supermarket, customCategories, onSave, onCancel }) {
  const [name, setName] = useState(supermarket?.name || '')
  const [ordered, setOrdered]  = useState(supermarket?.categoryOrder || [])

  const allCategories = [
    ...BUILTIN_CATEGORIES.map(c => ({ id: c.id, label: getCategoryName(c.id, [], 'it') })),
    ...customCategories.map(c => ({ id: c.id, label: `${c.emoji} ${c.name}` })),
  ]

  const isSelected = (id) => ordered.includes(id)

  const toggle = (id) => {
    setOrdered(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const move = (id, dir) => {
    setOrdered(prev => {
      const idx = prev.indexOf(id)
      if (idx < 0) return prev
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name, categoryOrder: ordered })
  }

  return (
    <Box>
      <TextField fullWidth label="Nome supermercato *" value={name}
        onChange={e => setName(e.target.value)} sx={{ mb: 3 }} />

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        Seleziona e ordina i reparti disponibili
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Spunta i reparti presenti. Usa ↑↓ per ordinare come sono disposti in negozio.
      </Typography>

      {/* Elenco non selezionati */}
      <Typography variant="caption" color="text.secondary">Non presenti:</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2, mt: 0.5 }}>
        {allCategories.filter(c => !isSelected(c.id)).map(c => (
          <Chip key={c.id} label={c.label} onClick={() => toggle(c.id)} size="small"
            variant="outlined" clickable />
        ))}
      </Box>

      {/* Elenco ordinato */}
      <Typography variant="caption" color="text.secondary">Ordine in negozio:</Typography>
      <List dense sx={{ mt: 0.5 }}>
        {ordered.map((id, idx) => {
          const cat = allCategories.find(c => c.id === id)
          if (!cat) return null
          return (
            <ListItem key={id} disablePadding
              secondaryAction={
                <Box>
                  <IconButton size="small" onClick={() => move(id, -1)} disabled={idx === 0}>
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => move(id, 1)} disabled={idx === ordered.length - 1}>
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => toggle(id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
              sx={{ py: 0.5, px: 1, bgcolor: 'rgba(102,126,234,0.06)', borderRadius: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary', minWidth: 20 }}>
                {idx + 1}.
              </Typography>
              <ListItemText primary={cat.label} />
            </ListItem>
          )
        })}
      </List>

      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button onClick={onCancel} sx={{ flex: 1 }}>Annulla</Button>
        <Button variant="contained" onClick={handleSave} sx={{ flex: 1 }}>Salva</Button>
      </Box>
    </Box>
  )
}

// ─── Tab Supermercati ─────────────────────────────────────────────────────────
function SupermarketsTab({ customCategories }) {
  const [supermarkets, setSupermarkets] = useState([])
  const [editing, setEditing] = useState(null) // null | 'new' | supermarket object
  const [shareDialog, setShareDialog] = useState({ open: false, url: '' })
  const [snack, setSnack] = useState('')

  useEffect(() => { setSupermarkets(getAllSupermarkets()) }, [])

  const reload = () => setSupermarkets(getAllSupermarkets())

  const handleSave = (data) => {
    if (editing === 'new') {
      createSupermarket(data)
    } else {
      updateSupermarket(editing.id, data)
    }
    reload()
    setEditing(null)
    setSnack(editing === 'new' ? 'Supermercato creato' : 'Supermercato aggiornato')
  }

  const handleDelete = (id) => {
    deleteSupermarket(id)
    reload()
    setSnack('Supermercato eliminato')
  }

  const handleShare = (sm) => {
    const encoded = serializeSupermarket(sm, customCategories)
    const url = `${window.location.origin}${import.meta.env.BASE_URL}?sm=${encoded}`
    setShareDialog({ open: true, url })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareDialog.url)
    } catch {
      const t = document.createElement('textarea')
      t.value = shareDialog.url
      document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t)
    }
    setSnack('Link copiato!')
    setShareDialog(p => ({ ...p, open: false }))
  }

  if (editing !== null) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          {editing === 'new' ? 'Nuovo supermercato' : `Modifica: ${editing.name}`}
        </Typography>
        <SupermarketEditor
          supermarket={editing === 'new' ? null : editing}
          customCategories={customCategories}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Crea i tuoi supermercati con l'ordine dei reparti.
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setEditing('new')}
        fullWidth
        sx={{ mb: 2 }}
      >
        Nuovo supermercato
      </Button>

      {supermarkets.length === 0 && (
        <Alert severity="info">Nessun supermercato salvato. Creane uno!</Alert>
      )}

      <List>
        {supermarkets.map(sm => (
          <ListItem key={sm.id} divider
            secondaryAction={
              <Box>
                <IconButton size="small" onClick={() => handleShare(sm)}><ShareIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => setEditing(sm)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(sm.id)}><DeleteIcon fontSize="small" /></IconButton>
              </Box>
            }
          >
            <ListItemText
              primary={sm.name}
              secondary={`${sm.categoryOrder.length} reparti`}
            />
          </ListItem>
        ))}
      </List>

      {/* Dialog share */}
      <Dialog open={shareDialog.open} onClose={() => setShareDialog(p => ({ ...p, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>Condividi supermercato</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Invia questo link per importare il supermercato (include le categorie custom usate).
          </Typography>
          <TextField fullWidth multiline rows={3} value={shareDialog.url}
            InputProps={{ readOnly: true }} onClick={e => e.target.select()} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog(p => ({ ...p, open: false }))}>Chiudi</Button>
          <Button variant="contained" onClick={handleCopy}>Copia link</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')} message={snack} />
    </Box>
  )
}

// ─── SettingsPage principale ──────────────────────────────────────────────────
export default function SettingsPage({ onBack }) {
  const [tab, setTab] = useState(0)
  const [customCategories, setCustomCategories] = useState(getCustomCategories())

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{
        width: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 2.5 },
      }}>
        <Box sx={{ maxWidth: 900, mx: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onBack} sx={{ color: 'white' }}><ArrowBackIcon /></IconButton>
          <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
            ⚙️ Impostazioni
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ width: '100%', bgcolor: 'white', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
            <Tab label="Lista default" />
            <Tab label="Categorie" />
            <Tab label="Supermercati" />
          </Tabs>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
        {tab === 0 && <DefaultListTab customCategories={customCategories} />}
        {tab === 1 && <CategoriesTab customCategories={customCategories} onCustomCategoriesChange={setCustomCategories} />}
        {tab === 2 && <SupermarketsTab customCategories={customCategories} />}
      </Box>
    </Box>
  )
}
