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
import { DEPARTMENTS, getDepartmentName } from '../constants/departments'
import PurchasableItems from '../components/DietSelector'

export default function ShoppingListPage({ listId, onBack }) {
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', department: 'produce', quantity: '' })
  const [dietItems, setDietItems] = useState([])
  const [purchasableItems, setPurchasableItems] = useState([])
  const [shareUrl, setShareUrl] = useState('')
  const [openShareDialog, setOpenShareDialog] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '' })

  useEffect(() => {
    loadList()
    loadDiet()
  }, [listId])

  useEffect(() => {
    if (list && dietItems.length > 0) {
      buildPurchasableItems()
    }
  }, [list, dietItems])

  const loadList = () => {
    const list = getListById(listId)
    setList(list)
    setLoading(false)
  }

  const loadDiet = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}diet.json`)
      const data = await response.json()
      setDietItems(data.items)
    } catch (error) {
      console.error('Errore nel caricamento della dieta:', error)
    }
  }

  const buildPurchasableItems = () => {
    if (!list) return

    const isReady = list.status === 'readyToPurchase'

    // Mappa gli articoli della lista per lookup veloce
    const listItemsMap = new Map(
      list.items.map(item => [`${item.name}-${item.department}`, item])
    )

    // In preparazione: mostra tutti (dieta + custom), checkbox = in lista o no
    // In acquisto: mostra solo quelli in lista, checkbox = preso o no
    if (isReady) {
      // Modalità acquisto: mostra solo articoli in lista
      const items = list.items.map(item => ({
        ...item,
        id: item.id,
        checked: item.checked, // "preso" al supermercato
      }))
      setPurchasableItems(items)
    } else {
      // Modalità preparazione: mostra dieta + custom
      const merged = [
        ...dietItems.map(item => {
          const listItem = listItemsMap.get(`${item.name}-${item.department}`)
          return {
            ...item,
            id: `diet-${item.name}-${item.department}`,
            checked: !!listItem, // selezionato = è in lista
          }
        }),
        // Custom items (non nella dieta) che sono già nella lista
        ...list.items
          .filter(item => !dietItems.some(d => d.name === item.name && d.department === item.department))
          .map(item => ({
            ...item,
            checked: true,
          })),
      ]
      setPurchasableItems(merged)
    }
  }

  const handleTogglePurchasable = (itemId, department, name) => {
    // Cerca l'articolo nei purchasableItems
    const purchasable = purchasableItems.find(
      item => item.id === itemId || (item.name === name && item.department === department)
    )

    if (!purchasable) return

    // Controlla se è già nella lista
    const inList = list.items.some(item => item.name === name && item.department === department)

    if (inList) {
      // Rimuovi dalla lista
      const itemToRemove = list.items.find(item => item.name === name && item.department === department)
      if (itemToRemove) {
        const updated = removeItemFromList(listId, itemToRemove.id)
        if (updated) {
          setList(updated)
        }
      }
    } else {
      // Aggiungi alla lista
      const updated = addItemToList(listId, {
        name,
        department,
        quantity: purchasable.quantity || '',
      })
      if (updated) {
        setList(updated)
      }
    }
  }

  const handleTogglePrepared = (itemId) => {
    const updated = toggleItemCheck(listId, itemId)
    if (updated) {
      setList(updated)
    }
  }

  const handleAddCustomItem = () => {
    if (!newItem.name.trim() || !newItem.department) {
      alert('Nome e reparto sono obbligatori')
      return
    }
    const updated = addItemToList(listId, newItem)
    if (updated) {
      setList(updated)
      setNewItem({ name: '', department: 'produce', quantity: '' })
      setOpenAddDialog(false)
    }
  }

  const handleConfirmList = () => {
    const updated = updateListStatus(listId, 'readyToPurchase')
    if (updated) {
      setList(updated)
      setSnackbar({ open: true, message: 'Lista confermata! Ora è pronta per l\'acquisto' })
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
      setSnackbar({ open: true, message: 'Link copiato negli appunti!' })
    } catch {
      // Fallback per contesti non sicuri (HTTP)
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setSnackbar({ open: true, message: 'Link copiato negli appunti!' })
    }
  }

  if (loading || !list) {
    return (
      <Box sx={{ width: '100%', p: 4 }}>
        <LinearProgress />
      </Box>
    )
  }

  const progress = getListProgress(list)
  const isReadyToPurchase = list.status === 'readyToPurchase'
  const isInPreparation = list.status === 'inPreparation'

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
          <Box sx={{ mb: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {isInPreparation && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddDialog(true)}
                  size="medium"
                >
                  Aggiungi articolo
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleConfirmList}
                  size="medium"
                >
                  Conferma lista
                </Button>
              </>
            )}
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              size="medium"
            >
              Condividi
            </Button>
          </Box>

          {/* Unica vista: Articoli acquistabili */}
          {purchasableItems.length > 0 && (
            <PurchasableItems
              items={purchasableItems}
              onToggleItem={(itemId) => {
                const item = purchasableItems.find(p => p.id === itemId)
                if (item) {
                  if (isReadyToPurchase) {
                    // In modalità acquisto, toggle "preso"
                    const listItem = list.items.find(i => i.name === item.name && i.department === item.department)
                    if (listItem) {
                      handleTogglePrepared(listItem.id)
                    }
                  } else {
                    // In preparazione, toggle aggiunta/rimozione dalla lista
                    handleTogglePurchasable(itemId, item.department, item.name)
                  }
                }
              }}
              isReadyToPurchase={isReadyToPurchase}
            />
          )}

        </Box>
      </Box>

      {/* Dialog aggiungi articolo custom */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aggiungi articolo custom</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Nome articolo *"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Reparto *</InputLabel>
            <Select
              value={newItem.department}
              label="Reparto *"
              onChange={(e) => setNewItem({ ...newItem, department: e.target.value })}
            >
              {Object.values(DEPARTMENTS).map(dept => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Quantità (opzionale)"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            placeholder="Es: 500 g"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Annulla</Button>
          <Button onClick={handleAddCustomItem} variant="contained" color="primary">
            Aggiungi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog condivisione */}
      <Dialog open={openShareDialog} onClose={() => setOpenShareDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Condividi lista</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Condividi questo link per far importare la lista a qualcun altro:
          </Typography>
          <TextField
            fullWidth
            value={shareUrl}
            InputProps={{ readOnly: true }}
            multiline
            rows={3}
            variant="outlined"
            onClick={(e) => e.target.select()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShareDialog(false)}>Chiudi</Button>
          <Button onClick={handleCopyShare} variant="contained" color="primary">
            Copia link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  )
}
