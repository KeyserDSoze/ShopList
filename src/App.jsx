import { useState, useEffect } from 'react'
import { Container, Box, Typography, LinearProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ShoppingCategory from './components/ShoppingCategory'
import './App.css'

function App() {
  const [categories, setCategories] = useState([])
  const [checkedItems, setCheckedItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)

  useEffect(() => {
    // Carica il file JSON
    fetch('/shopping-list.json')
      .then(response => response.json())
      .then(data => {
        setCategories(data.categories)
        setLoading(false)
        // Carica i dati precedenti dal localStorage
        const saved = localStorage.getItem('shoplist_checked')
        if (saved) {
          setCheckedItems(JSON.parse(saved))
        }
      })
      .catch(error => {
        console.error('Errore nel caricamento della lista:', error)
        setLoading(false)
      })
  }, [])

  const handleCheck = (itemId) => {
    const newChecked = { ...checkedItems }
    newChecked[itemId] = !newChecked[itemId]
    setCheckedItems(newChecked)
    // Salva su localStorage
    localStorage.setItem('shoplist_checked', JSON.stringify(newChecked))
  }

  const handleReset = () => {
    setOpenDialog(true)
  }

  const confirmReset = () => {
    setCheckedItems({})
    localStorage.removeItem('shoplist_checked')
    setOpenDialog(false)
  }

  const cancelReset = () => {
    setOpenDialog(false)
  }

  if (loading) {
    return (
      <Container>
        <Box sx={{ py: 4 }}>
          <Typography variant="h5">Caricamento...</Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </Box>
      </Container>
    )
  }

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0)
  const checkedCount = Object.values(checkedItems).filter(v => v).length
  const progress = (checkedCount / totalItems) * 100

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
          🛒 ShopList
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          {checkedCount} / {totalItems} articoli presi
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ mb: 2, height: 10, borderRadius: 5 }}
        />
        <Button
          variant="contained"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={handleReset}
        >
          Ripristina tutto
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {categories.map(category => (
          <ShoppingCategory
            key={category.id}
            category={category}
            checkedItems={checkedItems}
            onCheck={handleCheck}
          />
        ))}
      </Box>

      <Dialog open={openDialog} onClose={cancelReset}>
        <DialogTitle>Ripristina lista della spesa</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler discheckare tutti gli articoli? Non potrai annullare questa azione.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelReset} color="primary">
            Annulla
          </Button>
          <Button onClick={confirmReset} color="error" variant="contained">
            Sì, ripristina tutto
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default App
