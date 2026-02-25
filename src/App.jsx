import { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Snackbar, Typography, Alert, Box, Chip } from '@mui/material'
import HomePage from './pages/HomePage'
import ShoppingListPage from './pages/ShoppingListPage'
import SettingsPage from './pages/SettingsPage'
import { deserializeList } from './utils/listStorage'
import { deserializeSupermarket, getAllSupermarkets, createSupermarket, updateSupermarket } from './utils/supermarketStorage'
import { importCustomCategories, deserializeCustomCategories, importCategoriesList } from './utils/categoryStorage'
import { deserializeDefaultList, getDefaultItemsSync, saveDefaultItems, getAllDefaultLists, createDefaultList, updateDefaultList } from './utils/defaultListStorage'

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
  // Supermarket import
  const [openSmImportDialog, setOpenSmImportDialog] = useState(false)
  const [smImportData, setSmImportData] = useState(null)
  const [smNewName, setSmNewName] = useState('')
  // Default list import
  const [openDlImportDialog, setOpenDlImportDialog] = useState(false)
  const [dlImportData, setDlImportData] = useState(null)  // { name, items }
  const [dlImportName, setDlImportName] = useState('')
  // Categories import
  const [openCatsImportDialog, setOpenCatsImportDialog] = useState(false)
  const [catsImportData, setCatsImportData] = useState(null)

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
        setSmNewName(result.supermarket?.name || '')
        setOpenSmImportDialog(true)
      }
    }

    // Lista di default condivisa
    const dlData = params.get('dl')
    if (dlData) {
      const result = deserializeDefaultList(dlData)
      if (result?.items?.length) {
        setDlImportData(result)
        setDlImportName(result.name || 'Lista importata')
        setOpenDlImportDialog(true)
      }
    }

    // Categorie custom condivise
    const catsData = params.get('cats')
    if (catsData) {
      const cats = deserializeCustomCategories(catsData)
      if (cats?.length) {
        setCatsImportData(cats)
        setOpenCatsImportDialog(true)
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

  const handleImportSupermarket = (mode) => {
    if (!smImportData) return
    // Importa categorie custom embedded
    if (smImportData.customCategories?.length) {
      importCustomCategories(smImportData.customCategories)
    }
    const name = smNewName.trim() || smImportData.supermarket.name
    const supermarkets = getAllSupermarkets()
    const conflict = supermarkets.find(s => s.name.toLowerCase() === name.toLowerCase())

    if (mode === 'overwrite' && conflict) {
      updateSupermarket(conflict.id, { ...smImportData.supermarket, name })
    } else {
      const sm = { ...smImportData.supermarket, name, id: 'sm-' + Date.now().toString(36), createdAt: new Date().toISOString() }
      const all = JSON.parse(localStorage.getItem('shoplist_supermarkets') || '[]')
      all.push(sm)
      localStorage.setItem('shoplist_supermarkets', JSON.stringify(all))
    }
    setOpenSmImportDialog(false)
    setSmImportData(null)
    setSnack(`Supermercato "${name}" importato!`)
  }

  const handleImportDl = (mode) => {
    if (!dlImportData) return
    const { items: incoming } = dlImportData
    const trimmedName = dlImportName.trim() || 'Lista importata'
    const existing = getAllDefaultLists().find(l => l.name.toLowerCase() === trimmedName.toLowerCase())

    if (mode === 'overwrite' && existing) {
      updateDefaultList(existing.id, { items: incoming })
      setSnack(`"${trimmedName}" aggiornata con ${incoming.length} articoli`)
    } else if (mode === 'merge' && existing) {
      const merged = [...existing.items]
      let added = 0, updated = 0
      for (const inc of incoming) {
        const idx = merged.findIndex(e => e.name.toLowerCase() === inc.name.toLowerCase())
        if (idx >= 0) { merged[idx] = { ...merged[idx], quantity: mergeQuantity(merged[idx].quantity, inc.quantity) }; updated++ }
        else { merged.push(inc); added++ }
      }
      updateDefaultList(existing.id, { items: merged })
      const parts = []
      if (added) parts.push(`${added} aggiunti`)
      if (updated) parts.push(`${updated} aggiornati`)
      setSnack(`Unione in "${trimmedName}": ${parts.join(', ')}`)
    } else {
      // Add as new list
      createDefaultList({ name: trimmedName, items: incoming })
      setSnack(`Lista "${trimmedName}" aggiunta (${incoming.length} articoli)`)
    }
    setOpenDlImportDialog(false)
    setDlImportData(null)
    setDlImportName('')
  }

  const handleImportCats = (mode) => {
    if (!catsImportData) return
    const result = importCategoriesList(catsImportData, mode)
    if (mode === 'overwrite') setSnack(`${result.added} categorie importate (lista sovrascritta)`)
    else setSnack(`${result.added} categorie aggiunte${result.skipped ? `, ${result.skipped} già presenti` : ''}`)
    setOpenCatsImportDialog(false)
    setCatsImportData(null)
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

      {/* Dialog import lista condivisa */}
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
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {smImportData && (() => {
            const conflict = getAllSupermarkets().find(s => s.name.toLowerCase() === smNewName.toLowerCase())
            return (
              <>
                <TextField
                  fullWidth
                  label="Nome supermercato"
                  value={smNewName}
                  onChange={e => setSmNewName(e.target.value)}
                />
                <Typography variant="body2" color="text.secondary">
                  {smImportData.supermarket?.categoryOrder?.length} reparti
                  {smImportData.customCategories?.length > 0 && ` · include ${smImportData.customCategories.length} categorie custom`}
                </Typography>
                {conflict && (
                  <Alert severity="warning">
                    Esiste già un supermercato chiamato <strong>"{smNewName}"</strong>.
                    Puoi sovrascriverlo, oppure cambia il nome sopra per aggiungerlo come nuovo.
                  </Alert>
                )}
              </>
            )
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSmImportDialog(false)}>Annulla</Button>
          {smImportData && getAllSupermarkets().some(s => s.name.toLowerCase() === smNewName.toLowerCase()) ? (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleImportSupermarket('overwrite')}
                disabled={!smNewName.trim()}
              >
                Sovrascrivi
              </Button>
              <Button
                variant="contained"
                onClick={() => handleImportSupermarket('add')}
                disabled={!smNewName.trim()}
              >
                Aggiungi comunque
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => handleImportSupermarket('add')}
              disabled={!smNewName.trim()}
            >
              Aggiungi
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog import lista di default */}
      <Dialog open={openDlImportDialog} onClose={() => setOpenDlImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📋 Importa lista di default</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {dlImportData && (() => {
            const items = dlImportData.items
            const trimmedName = dlImportName.trim() || 'Lista importata'
            const conflict = getAllDefaultLists().find(l => l.name.toLowerCase() === trimmedName.toLowerCase())
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  label="Nome lista"
                  fullWidth
                  size="small"
                  value={dlImportName}
                  onChange={e => setDlImportName(e.target.value)}
                />
                {conflict && (
                  <Alert severity="warning" sx={{ py: 0 }}>
                    Esiste già una lista chiamata <strong>{conflict.name}</strong>.
                  </Alert>
                )}
                <Typography variant="body2">
                  <strong>{items.length} articoli</strong> da importare.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 120, overflow: 'auto' }}>
                  {items.slice(0, 20).map((item, i) => (
                    <Chip key={i} label={item.name} size="small" />
                  ))}
                  {items.length > 20 && <Chip label={`+${items.length - 20} altri`} size="small" variant="outlined" />}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {conflict
                    ? <><strong>Aggiungi come nuova</strong>: crea una seconda lista con lo stesso nome. &nbsp;<strong>Unisci</strong>: aggiorna la lista esistente sommando. &nbsp;<strong>Sovrascrivi</strong>: sostituisce la lista esistente.</>
                    : <><strong>Aggiungi lista</strong>: crea una nuova lista nelle liste di default.</>}
                </Typography>
              </Box>
            )
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenDlImportDialog(false); setDlImportData(null); setDlImportName('') }}>Annulla</Button>
          {dlImportData && getAllDefaultLists().find(l => l.name.toLowerCase() === (dlImportName.trim() || 'Lista importata').toLowerCase()) && (
            <>
              <Button variant="outlined" color="error" onClick={() => handleImportDl('overwrite')}>Sovrascrivi</Button>
              <Button variant="outlined" onClick={() => handleImportDl('merge')}>Unisci</Button>
            </>
          )}
          <Button variant="contained" onClick={() => handleImportDl('new')}>Aggiungi lista</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog import categorie custom */}
      <Dialog open={openCatsImportDialog} onClose={() => setOpenCatsImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>🏷️ Importa categorie custom</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {catsImportData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body1">
                <strong>{catsImportData.length} categorie</strong> da importare.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {catsImportData.map((c, i) => (
                  <Chip key={i} label={`${c.emoji} ${c.name}`} size="small" />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                <strong>Aggiungi nuove</strong>: aggiunge solo quelle non già presenti (per nome). &nbsp;
                <strong>Sovrascrivi tutto</strong>: sostituisce tutte le tue categorie custom.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCatsImportDialog(false)}>Annulla</Button>
          <Button variant="outlined" color="error" onClick={() => handleImportCats('overwrite')}>Sovrascrivi tutto</Button>
          <Button variant="contained" onClick={() => handleImportCats('add')}>Aggiungi nuove</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </ThemeProvider>
  )
}

export default App
