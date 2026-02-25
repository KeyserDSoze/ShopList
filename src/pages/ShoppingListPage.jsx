import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Alert,
  Snackbar,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ShareIcon from '@mui/icons-material/Share'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { getListById, toggleItemCheck, removeItemFromList, addItemToList, getListProgress, updateListStatus, serializeList } from '../utils/listStorage'
import DrivePanel from '../components/DrivePanel'
import { BUILTIN_CATEGORIES, getCategoryName } from '../constants/categories'
import { getCustomCategories } from '../utils/categoryStorage'
import { getAllSupermarkets } from '../utils/supermarketStorage'
import { getDefaultItems } from '../utils/defaultListStorage'
import PurchasableItems from '../components/DietSelector'

export default function ShoppingListPage({ listId, onBack }) {
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', categoryId: 1, quantity: '' })
  const [dietItems, setDietItems] = useState([])
  const [purchasableItems, setPurchasableItems] = useState([])
  const [locallyRemovedItems, setLocallyRemovedItems] = useState([])
  const [shareUrl, setShareUrl] = useState('')
  const [openShareDialog, setOpenShareDialog] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '' })
  const [customCategories, setCustomCategories] = useState(getCustomCategories())
  const [supermarkets, setSupermarkets] = useState(getAllSupermarkets())
  const [selectedSupermarketId, setSelectedSupermarketId] = useState('')
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    loadList()
    loadDiet()
    setCustomCategories(getCustomCategories())
    setSupermarkets(getAllSupermarkets())
    setLocallyRemovedItems([])
  }, [listId])

  useEffect(() => {
    if (list) buildPurchasableItems()
  }, [list, dietItems])

  const loadList = () => {
    const l = getListById(listId)
    setList(l)
    setLoading(false)
  }

  const loadDiet = async () => {
    try {
      const items = await getDefaultItems()
      setDietItems(items)
    } catch (error) {
      console.error('Errore nel caricamento degli articoli di default:', error)
    }
  }

  const buildPurchasableItems = () => {
    if (!list) return
    const isReady = list.status === 'readyToPurchase'

    if (isReady) {
      setPurchasableItems(list.items)
    } else {
      const listItemsMap = new Map(list.items.map(item => [item.name.toLowerCase(), item]))
      const merged = [
        ...dietItems.map(item => ({
          ...item,
          id: `diet-${item.name}`,
          checked: listItemsMap.has(item.name.toLowerCase()),
        })),
        // Custom items in list but not from default diet
        ...list.items
          .filter(item => !dietItems.some(d => d.name.toLowerCase() === item.name.toLowerCase()))
          .map(item => ({ ...item, checked: true })),
      ]
      setPurchasableItems(merged)
    }
  }

  // Items kept visible after being unchecked this session (custom items not in default diet)
  const allPurchasableItems = [
    ...purchasableItems,
    ...locallyRemovedItems.filter(lr =>
      !purchasableItems.some(p => p.name.toLowerCase() === lr.name.toLowerCase())
    ).map(lr => ({ ...lr, checked: false })),
  ]

  // Filter and sort by selected supermarket
  const visibleItems = (() => {
    if (!selectedSupermarketId) return allPurchasableItems
    const sm = supermarkets.find(s => s.id === selectedSupermarketId)
    if (!sm || !sm.categoryOrder?.length) return allPurchasableItems
    const order = sm.categoryOrder
    const filtered = allPurchasableItems.filter(item => {
      const catId = item.categoryId
      return order.includes(catId) || order.includes(+catId)
    })
    filtered.sort((a, b) => {
      const catA = a.categoryId
      const catB = b.categoryId
      const idxA = order.findIndex(id => id === catA || +id === catA || id === +catA)
      const idxB = order.findIndex(id => id === catB || +id === catB || id === +catB)
      if (idxA === -1) return 1
      if (idxB === -1) return -1
      return idxA - idxB
    })
    return filtered
  })()

  const handleTogglePurchasable = (itemId) => {
    const purchasable = allPurchasableItems.find(item => item.id === itemId)
    if (!purchasable) return

    const inList = list.items.some(item => item.name.toLowerCase() === purchasable.name.toLowerCase())
    const isCustom = !dietItems.some(d => d.name.toLowerCase() === purchasable.name.toLowerCase())

    if (inList) {
      const itemToRemove = list.items.find(item => item.name.toLowerCase() === purchasable.name.toLowerCase())
      if (itemToRemove) {
        const updated = removeItemFromList(listId, itemToRemove.id)
        if (updated) setList(updated)
      }
      // Custom items stay visible as unchecked until page reload
      if (isCustom) {
        setLocallyRemovedItems(prev => [
          ...prev.filter(i => i.id !== purchasable.id),
          { ...purchasable, checked: false },
        ])
      }
    } else {
      // Re-checking: add back to list and remove from local tracking
      const updated = addItemToList(listId, {
        name: purchasable.name,
        categoryId: purchasable.categoryId,
        quantity: purchasable.quantity || '',
      })
      if (updated) setList(updated)
      setLocallyRemovedItems(prev => prev.filter(i => i.id !== purchasable.id))
    }
  }

  const handleTogglePrepared = (itemId) => {
    const updated = toggleItemCheck(listId, itemId)
    if (updated) setList(updated)
  }

  const handleAddCustomItem = () => {
    if (!newItem.name.trim()) {
      alert('Il nome è obbligatorio')
      return
    }
    const updated = addItemToList(listId, newItem)
    if (updated) {
      setList(updated)
      setLocallyRemovedItems(prev => prev.filter(i => i.name.toLowerCase() !== newItem.name.trim().toLowerCase()))
      setNewItem({ name: '', categoryId: 1, quantity: '' })
      setOpenAddDialog(false)
    }
  }

  const handleConfirmList = () => {
    const updated = updateListStatus(listId, 'readyToPurchase')
    if (updated) {
      setList(updated)
      setSnackbar({ open: true, message: "Lista confermata! Ora è pronta per l'acquisto" })
    }
  }

  const handleShare = () => {
    if (!list) return
    const encoded = serializeList(list)
    const params = new URLSearchParams()
    params.set('share', encoded)
    const url = `${window.location.origin}${import.meta.env.BASE_URL}?${params.toString()}`
    setShareUrl(url)
    setOpenShareDialog(true)
  }

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setSnackbar({ open: true, message: 'Link copiato negli appunti!' })
  }

  if (loading || !list) {
    return <Box sx={{ width: '100%', p: 4 }}><LinearProgress /></Box>
  }

  const progress = getListProgress(list)
  const isReadyToPurchase = list.status === 'readyToPurchase'
  const isInPreparation = list.status === 'inPreparation'

  // All categories for the select
  const allCategories = [
    ...BUILTIN_CATEGORIES.map(c => ({ id: c.id, label: getCategoryName(c.id, [], 'it') })),
    ...customCategories.map(c => ({ id: c.id, label: `${c.emoji} ${c.name}` })),
  ]

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
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <IconButton onClick={onBack} sx={{ color: 'white', mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                  {list.name}
                </Typography>
                <Chip
                  label={isReadyToPurchase ? '✅ Pronto' : '🔄 Preparazione'}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {list.items.filter(i => i.checked).length} / {list.items.length} articoli presi
              </Typography>
            </Box>
            <DrivePanel currentList={list} />
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }}
          />
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>

          {isReadyToPurchase && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Lista pronta per l'acquisto. Spunta gli articoli man mano che li prendi!
            </Alert>
          )}

          {/* Pulsanti azioni */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {isInPreparation && (
              <>
                <Button variant="contained" color="primary" startIcon={<AddIcon />}
                  onClick={() => setOpenAddDialog(true)} size="medium">
                  Aggiungi articolo
                </Button>
                <Button variant="contained" color="success" startIcon={<CheckCircleIcon />}
                  onClick={handleConfirmList} size="medium">
                  Conferma lista
                </Button>
              </>
            )}
            <Button variant="outlined" startIcon={<ShareIcon />} onClick={handleShare} size="medium">
              Condividi
            </Button>
          </Box>

          {/* Selettore supermercato */}
          {supermarkets.length > 0 && (
            <FormControl size="small" sx={{ mb: 2, minWidth: 220 }}>
              <InputLabel>🏪 Supermercato</InputLabel>
              <Select value={selectedSupermarketId} label="🏪 Supermercato"
                onChange={e => setSelectedSupermarketId(e.target.value)}>
                <MenuItem value=""><em>Tutti i reparti</em></MenuItem>
                {supermarkets.map(sm => (
                  <MenuItem key={sm.id} value={sm.id}>{sm.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Search filter */}
          {visibleItems.length > 0 && (
            <TextField
              size="small"
              fullWidth
              placeholder="🔍 Cerca articolo..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              sx={{ mb: 2 }}
              inputProps={{ 'aria-label': 'cerca articolo' }}
            />
          )}

          {/* Articoli */}
          {(() => {
            const q = searchText.trim().toLowerCase()
            const filteredItems = q ? visibleItems.filter(i => i.name.toLowerCase().includes(q)) : visibleItems
            return filteredItems.length > 0 ? (
              <PurchasableItems
                items={filteredItems}
              customCategories={customCategories}
              onToggleItem={(itemId) => {
                const item = visibleItems.find(p => p.id === itemId)
                if (!item) return
                if (isReadyToPurchase) {
                  // Match against list items by name
                  const listItem = list.items.find(i => i.name.toLowerCase() === item.name.toLowerCase())
                  if (listItem) handleTogglePrepared(listItem.id)
                } else {
                  handleTogglePurchasable(itemId)
                }
              }}
              isReadyToPurchase={isReadyToPurchase}
            />
            ) : q ? (
              <Alert severity="info">Nessun articolo trovato per "{searchText.trim()}".</Alert>
            ) : null
          })()}

        </Box>
      </Box>

      {/* Dialog aggiungi articolo custom */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aggiungi articolo custom</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField autoFocus fullWidth label="Nome articolo *" value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
          <FormControl fullWidth>
            <InputLabel>Categoria *</InputLabel>
            <Select value={newItem.categoryId} label="Categoria *"
              onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}>
              {allCategories.map(c => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Quantità (opzionale)" value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            placeholder="Es: 500 g" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Annulla</Button>
          <Button onClick={handleAddCustomItem} variant="contained" color="primary">Aggiungi</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog condivisione */}
      <Dialog open={openShareDialog} onClose={() => setOpenShareDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Condividi lista</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Condividi questo link per far importare la lista a qualcun altro:
          </Typography>
          <TextField fullWidth value={shareUrl} InputProps={{ readOnly: true }}
            multiline rows={3} variant="outlined" onClick={(e) => e.target.select()} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShareDialog(false)}>Chiudi</Button>
          <Button onClick={handleCopyShare} variant="contained" color="primary">Copia link</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
    </Box>
  )
}
