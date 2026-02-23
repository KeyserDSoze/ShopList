import { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Snackbar } from '@mui/material'
import HomePage from './pages/HomePage'
import ShoppingListPage from './pages/ShoppingListPage'
import SettingsPage from './pages/SettingsPage'
import { deserializeList } from './utils/listStorage'
import { deserializeSupermarket } from './utils/supermarketStorage'
import { importCustomCategories } from './utils/categoryStorage'

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
  const [currentPage, setCurrentPage] = useState('home') // 'home' | 'list' | 'settings'
  const [currentListId, setCurrentListId] = useState(null)
  const [openImportDialog, setOpenImportDialog] = useState(false)
  const [sharedListData, setSharedListData] = useState(null)
  const [importName, setImportName] = useState('')
  const [openSmImportDialog, setOpenSmImportDialog] = useState(false)
  const [smImportData, setSmImportData] = useState(null)
  const [snack, setSnack] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    
    // Lista condivisa
    const shareData = params.get('share')
    if (shareData) {
      const list = deserializeList(shareData)
      if (list) {
        setSharedListData(list)
        setImportName(`${list.name} (importato)`)
        setOpenImportDialog(true)
      }
    }

    // Supermercato condiviso
    const smData = params.get('sm')
    if (smData) {
      const result = deserializeSupermarket(smData)
      if (result) {
        setSmImportData(result)
        setOpenSmImportDialog(true)
      }
    }
  }, [])

  const navigateToList = (listId) => {
    setCurrentListId(listId)
    setCurrentPage('list')
  }

  const handleImportList = () => {
    if (!importName.trim() || !sharedListData) return
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
    const lists = JSON.parse(localStorage.getItem('shoplist_lists') || '[]')
    lists.push(importedList)
    localStorage.setItem('shoplist_lists', JSON.stringify(lists))
    setOpenImportDialog(false)
    setSharedListData(null)
    setImportName('')
    navigateToList(importedList.id)
  }

  const handleImportSupermarket = () => {
    if (!smImportData) return
    // Importa categorie custom embedded
    if (smImportData.customCategories?.length) {
      importCustomCategories(smImportData.customCategories)
    }
    // Salva supermercato
    const supermarkets = JSON.parse(localStorage.getItem('shoplist_supermarkets') || '[]')
    const sm = {
      ...smImportData.supermarket,
      id: 'sm-' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    }
    supermarkets.push(sm)
    localStorage.setItem('shoplist_supermarkets', JSON.stringify(supermarkets))
    setOpenSmImportDialog(false)
    setSmImportData(null)
    setSnack(`Supermercato "${sm.name}" importato!`)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {currentPage === 'list' ? (
        <ShoppingListPage listId={currentListId} onBack={() => setCurrentPage('home')} />
      ) : currentPage === 'settings' ? (
        <SettingsPage onBack={() => setCurrentPage('home')} />
      ) : (
        <HomePage
          onSelectList={(id) => navigateToList(id)}
          onOpenSettings={() => setCurrentPage('settings')}
        />
      )}

      {/* Dialog import lista */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📥 Importa lista condivisa</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth label="Nome per la lista" value={importName}
            onChange={(e) => setImportName(e.target.value)} variant="outlined" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportDialog(false)}>Annulla</Button>
          <Button onClick={handleImportList} variant="contained" color="primary">Importa</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog import supermercato */}
      <Dialog open={openSmImportDialog} onClose={() => setOpenSmImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>🏪 Importa supermercato</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {smImportData && (
            <>
              <p><strong>{smImportData.supermarket?.name}</strong></p>
              <p>{smImportData.supermarket?.categoryOrder?.length} reparti</p>
              {smImportData.customCategories?.length > 0 && (
                <p>Include {smImportData.customCategories.length} categorie custom</p>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSmImportDialog(false)}>Annulla</Button>
          <Button onClick={handleImportSupermarket} variant="contained">Importa</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </ThemeProvider>
  )
}

export default App
