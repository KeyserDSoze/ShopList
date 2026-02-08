import { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material'
import HomePage from './pages/HomePage'
import ShoppingListPage from './pages/ShoppingListPage'
import { deserializeList, importSharedList } from './utils/listStorage'

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
})

function App() {
  const [currentListId, setCurrentListId] = useState(null)
  const [openImportDialog, setOpenImportDialog] = useState(false)
  const [sharedListData, setSharedListData] = useState(null)
  const [importName, setImportName] = useState('')

  useEffect(() => {
    // Controlla se c'è un parametro share nella query string
    const params = new URLSearchParams(window.location.search)
    const shareData = params.get('share')
    
    if (shareData) {
      const list = deserializeList(shareData)
      if (list) {
        setSharedListData(list)
        setImportName(`${list.name} (importato)`)
        setOpenImportDialog(true)
      }
    }
  }, [])

  const handleImportList = () => {
    if (!importName.trim() || !sharedListData) return
    
    // sharedListData è già un oggetto deserializzato, creiamo direttamente la lista
    const importedList = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 11),
      name: importName,
      createdAt: new Date().toISOString(),
      status: 'inPreparation',
      items: sharedListData.items.map(item => ({
        ...item,
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 11),
        checked: false,
      })),
    }

    // Salva direttamente nel localStorage
    const lists = JSON.parse(localStorage.getItem('shoplist_lists') || '[]')
    lists.push(importedList)
    localStorage.setItem('shoplist_lists', JSON.stringify(lists))

    setOpenImportDialog(false)
    setSharedListData(null)
    setImportName('')
    setCurrentListId(importedList.id)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {currentListId ? (
        <ShoppingListPage
          listId={currentListId}
          onBack={() => setCurrentListId(null)}
        />
      ) : (
        <HomePage onSelectList={setCurrentListId} />
      )}
      
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📥 Importa lista condivisa</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nome per la lista"
            value={importName}
            onChange={(e) => setImportName(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportDialog(false)}>Annulla</Button>
          <Button onClick={handleImportList} variant="contained" color="primary">
            Importa
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  )
}

export default App
