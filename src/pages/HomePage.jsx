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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SettingsIcon from '@mui/icons-material/Settings'
import { getAllLists, createNewList, deleteList, getListProgress } from '../utils/listStorage'
import { formatDistanceToNow, format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function HomePage({ onSelectList, onOpenSettings }) {
  const [lists, setLists] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deleteListId, setDeleteListId] = useState(null)

  useEffect(() => {
    loadLists()
  }, [])

  useEffect(() => {
    if (openDialog && !newListName) {
      setNewListName(`Spesa-${format(new Date(), 'yyyy-MM-dd')}`)
    }
  }, [openDialog])

  const loadLists = () => {
    const allLists = getAllLists()
    setLists(allLists)
  }

  const handleCreateList = () => {
    if (!newListName.trim()) return
    const newList = createNewList(newListName)
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

      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false)
        setNewListName('')
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Crea una nuova lista della spesa</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Nome lista"
            placeholder="Es: Spesa settimanale"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false)
            setNewListName('')
          }}>Annulla</Button>
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
    </Box>
  )
}
