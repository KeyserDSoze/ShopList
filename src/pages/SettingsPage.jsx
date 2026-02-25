import { useState, useEffect } from 'react'
import {
  Box, Typography, IconButton, Button, Tabs, Tab,
  Card, CardContent, List, ListItem, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Alert, Snackbar, Divider,
  FormControl, InputLabel, Select, MenuItem, Step, Stepper, StepLabel, Collapse,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ShareIcon from '@mui/icons-material/Share'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import { BUILTIN_CATEGORIES, getCategoryName } from '../constants/categories'
import { getCustomCategories, createCustomCategory, updateCustomCategory, deleteCustomCategory, serializeCustomCategories } from '../utils/categoryStorage'
import { getAllSupermarkets, createSupermarket, updateSupermarket, deleteSupermarket, serializeSupermarket } from '../utils/supermarketStorage'
import {
  getAllDefaultLists, createDefaultList, updateDefaultList, deleteDefaultList, setDefaultList,
  getDefaultItemsSync, saveDefaultItems, saveListItems, addDefaultItem, removeDefaultItem, serializeDefaultList,
} from '../utils/defaultListStorage'

// ─── Prompt generator helpers ─────────────────────────────────────────────────
const CATEGORIES_LIST = BUILTIN_CATEGORIES
  .map(c => `  ${c.id} = ${c.translations.it}`)
  .join('\n')

const PROMPT_DEFAULT_LIST = `Sei un assistente per la spesa. Crea una lista della spesa di default per un nucleo familiare italiano.

Puoi rispondere in JSON oppure in CSV, come preferisci. Rispondi SOLO con i dati, senza markdown, senza testo aggiuntivo.

Formato JSON:
[
  { "name": "Banane", "categoryId": 1, "quantity": "1 kg" },
  { "name": "Latte", "categoryId": 2, "quantity": "2 L" }
]

Formato CSV alternativo:
name,categoryId,quantity
Banane,1,1 kg
Latte,2,2 L

ID categorie disponibili:
${CATEGORIES_LIST}

Regole:
- "name": nome dell'articolo in italiano
- "categoryId": numero ID dalla lista sopra
- "quantity": quantità opzionale (stringa, es. "500 g", "1 L", "2 pz") — lasciala vuota se non necessaria
- Includi 30-50 articoli tipici della spesa settimanale`

const PROMPT_CATEGORIES = `Sei un assistente per la gestione della spesa. Suggerisci categorie personalizzate utili per organizzare la spesa, che non siano già coperte dalle categorie standard.

Categorie standard già presenti (NON duplicare):
${BUILTIN_CATEGORIES.map(c => `- ${c.translations.it}`).join('\n')}

Puoi rispondere in JSON oppure in CSV, come preferisci. Rispondi SOLO con i dati, senza markdown, senza testo aggiuntivo.

Formato JSON:
[
  { "name": "Integratori", "emoji": "💊" },
  { "name": "Pet food", "emoji": "🐾" }
]

Formato CSV alternativo:
name,emoji
Integratori,💊
Pet food,🐾

Regole:
- "name": nome categoria in italiano, breve
- "emoji": una singola emoji rappresentativa
- Suggerisci 5-10 categorie utili e non ridondanti`

const promptSupermarket = (name) => `Sei un assistente per la spesa. Crea la configurazione per il supermercato "${name || 'questo supermercato'}" indicando l'ordine tipico dei reparti come si trovano fisicamente nello store.

Puoi rispondere in JSON oppure in CSV, come preferisci. Rispondi SOLO con i dati, senza markdown, senza testo aggiuntivo.

Formato JSON:
{
  "name": "${name || 'Nome Supermercato'}",
  "categoryOrder": [1, 5, 3, 2, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
}

Formato CSV alternativo (categoryOrder separato da punto e virgola):
name,categoryOrder
${name || 'Nome Supermercato'},"1;5;3;2;6;7;8;9;10;11;12;13;14;15;16;17"

ID categorie disponibili (puoi includerne solo alcune se il supermercato non le ha tutte):
${CATEGORIES_LIST}

Regole:
- "name": nome del supermercato
- "categoryOrder": ID numerici in ordine fisico nel negozio (dal primo reparto all'ultimo)
- Includi solo i reparti presenti in un supermercato medio italiano`

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCSVLine(line) {
  const values = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ } // escaped quote
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  values.push(current.trim())
  return values
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return null
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').replace(/^"|"$/g, '') })
    return obj
  }).filter(row => Object.values(row).some(v => v !== ''))
}

// ─── Componente riutilizzabile AI Import Dialog ───────────────────────────────
function AIImportDialog({ open, onClose, title, prompt, onImport, parseHint, supportsMerge = false }) {
  const [step, setStep] = useState(0)
  const [pastedText, setPastedText] = useState('')
  const [parseError, setParseError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const handleClose = () => {
    setStep(0)
    setPastedText('')
    setParseError('')
    setCopied(false)
    setShowGuide(false)
    onClose()
  }

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {
      const t = document.createElement('textarea')
      t.value = prompt
      document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t)
    }
    setCopied(true)
  }

  const handleImport = (mode) => {
    setParseError('')
    const trimmed = pastedText.trim()
    if (!trimmed) return

    // Try JSON first
    let parsed = null
    let isCSV = false
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      // Try CSV
      const csvResult = parseCSV(trimmed)
      if (csvResult && csvResult.length > 0) {
        parsed = csvResult
        isCSV = true
      } else {
        setParseError('Formato non riconosciuto. Incolla il JSON o il CSV restituito dall\'AI, senza testo aggiuntivo.')
        return
      }
    }

    const err = onImport(parsed, isCSV, mode)
    if (err) { setParseError(err); return }
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeIcon sx={{ color: '#667eea' }} />
        {title}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          <Step><StepLabel>Copia il prompt</StepLabel></Step>
          <Step><StepLabel>Incolla la risposta</StepLabel></Step>
        </Stepper>

        {step === 0 && (
          <Box>
            <Button
              size="small"
              onClick={() => setShowGuide(p => !p)}
              sx={{ mb: 1, textTransform: 'none', color: 'primary.main' }}
            >
              {showGuide ? '▲ Nascondi guida' : '▼ Come funziona?'}
            </Button>
            <Collapse in={showGuide}>
              <Box sx={{ bgcolor: '#f0f4ff', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  📋 Cos'è questa funzione?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Usa un chatbot AI per generare automaticamente i dati da importare. L'app prepara un prompt pronto all'uso — tu lo copi, lo incolli nel chatbot e poi importi la risposta.
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  📌 Come si usa:
                </Typography>
                <Box component="ol" sx={{ m: 0, pl: 2.5, mb: 1.5 }}>
                  {[
                    'Copia il prompt qui sotto.',
                    'Vai su un chatbot AI e incolla il prompt.',
                    "Invia il messaggio e aspetta la risposta.",
                    'Copia la risposta (JSON o CSV).',
                    'Torna qui, clicca "Avanti" e incolla la risposta.',
                  ].map((s, i) => (
                    <Typography key={i} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                      {s}
                    </Typography>
                  ))}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  🌐 Chatbot consigliati:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {[
                    { name: 'ChatGPT', url: 'https://chatgpt.com' },
                    { name: 'Gemini', url: 'https://gemini.google.com' },
                    { name: 'Claude', url: 'https://claude.ai' },
                    { name: 'Copilot', url: 'https://copilot.microsoft.com' },
                  ].map((b, i, arr) => (
                    <span key={b.name}>
                      <a href={b.url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{b.name}</a>
                      {i < arr.length - 1 ? ' · ' : ''}
                    </span>
                  ))}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  📊 JSON o CSV?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Entrambi vanno bene. Il CSV è più leggibile e facile da correggere a mano; il JSON è più strutturato. L'app riconosce il formato in automatico.
                </Typography>
              </Box>
            </Collapse>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={prompt}
              InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.78rem' } }}
              onClick={e => e.target.select()}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyPrompt}
              fullWidth
              color={copied ? 'success' : 'primary'}
            >
              {copied ? '✓ Prompt copiato!' : 'Copia prompt'}
            </Button>
          </Box>
        )}

        {step === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Incolla qui la risposta del chatbot (JSON o CSV):
            </Typography>
            {parseHint && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontFamily: 'monospace', whiteSpace: 'pre', bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                {parseHint}
              </Typography>
            )}
            <TextField
              fullWidth
              multiline
              rows={10}
              placeholder='Incolla il JSON o CSV qui...'
              value={pastedText}
              onChange={e => { setPastedText(e.target.value); setParseError('') }}
              error={!!parseError}
              helperText={parseError}
              InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
            />
            {supportsMerge && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                <strong>Unisci</strong>: aggiunge i nuovi articoli e somma le quantità di quelli già presenti. &nbsp;
                <strong>Sovrascrivi tutto</strong>: sostituisce l'intera lista con quella importata.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Annulla</Button>
        {step === 0 && (
          <Button variant="contained" onClick={() => setStep(1)}>
            Avanti →
          </Button>
        )}
        {step === 1 && (
          <>
            <Button onClick={() => setStep(0)}>← Indietro</Button>
            {supportsMerge ? (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleImport('overwrite')}
                  disabled={!pastedText.trim()}
                >
                  Sovrascrivi tutto
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleImport('merge')}
                  disabled={!pastedText.trim()}
                >
                  Unisci
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={() => handleImport('overwrite')}
                disabled={!pastedText.trim()}
              >
                Importa
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
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

// ─── Reusable share-link dialog ───────────────────────────────────────────────
function ShareLinkDialog({ open, onClose, url, title = 'Condividi', description }) {
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(url) } catch {
      const t = document.createElement('textarea')
      t.value = url
      document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t)
    }
    onClose(true)
  }
  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>🔗 {title}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description || 'Invia questo link per condividere i dati. Chi lo apre potrà importarli nella sua app.'}
        </Typography>
        <TextField fullWidth multiline rows={3} value={url}
          InputProps={{ readOnly: true }} onClick={e => e.target.select()} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Chiudi</Button>
        <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={handleCopy}>Copia link</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Quantity merge helper ───────────────────────────────────────────────────
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
    const sum = qa.num + qb.num
    const rounded = Math.round(sum * 1000) / 1000
    return qa.unit ? `${rounded} ${qa.unit}` : String(rounded)
  }
  return `${a} + ${b}`
}

// ─── Tab Lista Default ────────────────────────────────────────────────────────
// ─── Default List Editor (single list) ───────────────────────────────────────
function DefaultListEditor({ list, customCategories, onBack, onListUpdated }) {
  const [items, setItems] = useState(list.items)
  const [openAdd, setOpenAdd] = useState(false)
  const [openAI, setOpenAI] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [newItem, setNewItem] = useState({ name: '', categoryId: 1, quantity: '' })
  const [snack, setSnack] = useState('')
  const [editName, setEditName] = useState(false)
  const [nameVal, setNameVal] = useState(list.name)

  useEffect(() => { setItems(list.items) }, [list.id])

  const save = (updated) => {
    saveListItems(list.id, updated)
    setItems(updated)
    onListUpdated()
  }

  const handleShare = () => {
    const encoded = serializeDefaultList(items, list.name)
    const url = `${window.location.origin}${import.meta.env.BASE_URL}?dl=${encoded}`
    setShareUrl(url)
    setShareOpen(true)
  }

  const handleAIImport = (parsed, mode = 'merge') => {
    const rows = Array.isArray(parsed) ? parsed : [parsed]
    const valid = rows.filter(i => i && typeof i.name === 'string' && i.name.trim())
    if (valid.length === 0) return 'Nessun articolo valido trovato'
    const incoming = valid.map(i => ({
      name: i.name.trim(),
      categoryId: i.categoryId !== undefined ? +i.categoryId || 1 : 1,
      quantity: i.quantity ?? '',
    }))
    if (mode === 'overwrite') {
      save(incoming)
      setSnack(`Lista sostituita con ${incoming.length} articoli`)
      return
    }
    const merged = [...items]
    let added = 0, updated = 0
    for (const inc of incoming) {
      const idx = merged.findIndex(e => e.name.toLowerCase() === inc.name.toLowerCase())
      if (idx >= 0) { merged[idx] = { ...merged[idx], quantity: mergeQuantity(merged[idx].quantity, inc.quantity) }; updated++ }
      else { merged.push(inc); added++ }
    }
    save(merged)
    const parts = []
    if (added) parts.push(`${added} aggiunti`)
    if (updated) parts.push(`${updated} aggiornati`)
    setSnack(`Unione completata: ${parts.join(', ')}`)
  }

  const handleAdd = () => {
    if (!newItem.name.trim()) return
    const newI = { name: newItem.name.trim(), categoryId: newItem.categoryId, quantity: newItem.quantity || '' }
    save([...items, newI])
    setNewItem({ name: '', categoryId: 1, quantity: '' })
    setOpenAdd(false)
    setSnack('Articolo aggiunto')
  }

  const handleDelete = (idx) => {
    const updated = [...items]
    updated.splice(idx, 1)
    save(updated)
    setSnack('Articolo rimosso')
  }

  const handleSaveName = () => {
    if (!nameVal.trim()) return
    updateDefaultList(list.id, { name: nameVal.trim() })
    onListUpdated()
    setEditName(false)
    setSnack('Nome aggiornato')
  }

  const allCategories = [
    ...BUILTIN_CATEGORIES.map(c => ({ id: c.id, label: getCategoryName(c.id, [], 'it') })),
    ...customCategories.map(c => ({ id: c.id, label: `${c.emoji} ${c.name}` })),
  ]

  const grouped = items.reduce((acc, item, idx) => {
    const catId = item.categoryId
    if (!acc[catId]) acc[catId] = []
    acc[catId].push({ ...item, _idx: idx })
    return acc
  }, {})

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={onBack} size="small"><ArrowBackIosNewIcon fontSize="small" /></IconButton>
        {editName ? (
          <>
            <TextField size="small" value={nameVal} onChange={e => setNameVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()} sx={{ flex: 1 }} autoFocus />
            <Button size="small" variant="contained" onClick={handleSaveName}>Salva</Button>
            <Button size="small" onClick={() => setEditName(false)}>Annulla</Button>
          </>
        ) : (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>{nameVal}</Typography>
            <IconButton size="small" onClick={() => setEditName(true)}><EditIcon fontSize="small" /></IconButton>
          </>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Questi articoli vengono aggiunti automaticamente ad ogni nuova lista (se questa è la lista default).
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)} fullWidth sx={{ mb: 1 }}>
        Aggiungi articolo
      </Button>
      <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={() => setOpenAI(true)} fullWidth
        sx={{ mb: 1, borderColor: '#667eea', color: '#667eea' }}>
        Genera con AI
      </Button>
      <Button variant="outlined" startIcon={<ShareIcon />} onClick={handleShare} fullWidth
        disabled={items.length === 0} sx={{ mb: 2 }}>
        Condividi lista ({items.length} articoli)
      </Button>

      {Object.keys(grouped).length === 0 && (
        <Alert severity="info">Nessun articolo. Aggiungine uno!</Alert>
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
                    <ListItemText primary={item.name} secondary={item.quantity || null} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle>Aggiungi articolo</DialogTitle>
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
            onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))} placeholder="Es: 200 g" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleAdd}>Aggiungi</Button>
        </DialogActions>
      </Dialog>

      <AIImportDialog
        open={openAI}
        onClose={() => setOpenAI(false)}
        title="Genera lista default con AI"
        prompt={PROMPT_DEFAULT_LIST}
        parseHint={'JSON: [{"name":"...","categoryId":1,"quantity":"..."}]\nCSV: name,categoryId,quantity\n     Banane,1,1 kg'}
        supportsMerge
        onImport={(parsed, isCSV, mode) => handleAIImport(parsed, mode)}
      />

      <ShareLinkDialog
        open={shareOpen}
        onClose={(copied) => { setShareOpen(false); if (copied) setSnack('Link copiato!') }}
        url={shareUrl}
        title="Condividi lista di default"
        description="Chiunque apra questo link potrà importare questa lista."
      />
      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')} message={snack} />
    </Box>
  )
}

// ─── Default Lists Tab (multi-list) ───────────────────────────────────────────
function DefaultListTab({ customCategories }) {
  const [lists, setLists] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [snack, setSnack] = useState('')

  const refresh = () => setLists(getAllDefaultLists())
  useEffect(() => { refresh() }, [])

  const selectedList = lists.find(l => l.id === selectedId)

  const handleCreate = () => {
    if (!newName.trim()) return
    const created = createDefaultList({ name: newName.trim() })
    setNewName('')
    setOpenAdd(false)
    refresh()
    setSelectedId(created.id)
    setSnack('Lista creata')
  }

  const handleDelete = (id) => {
    deleteDefaultList(id)
    if (selectedId === id) setSelectedId(null)
    refresh()
    setSnack('Lista eliminata')
  }

  const handleSetDefault = (id) => {
    setDefaultList(id)
    refresh()
    setSnack('Lista default aggiornata')
  }

  if (selectedList) {
    return (
      <DefaultListEditor
        key={selectedList.id}
        list={selectedList}
        customCategories={customCategories}
        onBack={() => { setSelectedId(null); refresh() }}
        onListUpdated={refresh}
      />
    )
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Gestisci più liste di default. La lista con ⭐ viene usata per le nuove liste della spesa.
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)} fullWidth sx={{ mb: 2 }}>
        Nuova lista
      </Button>

      {lists.length === 0 && (
        <Alert severity="info">Nessuna lista di default. Creane una!</Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {lists.map(lst => (
          <Card key={lst.id} sx={{ border: lst.isDefault ? '2px solid #667eea' : undefined }}>
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {lst.name}
                    {lst.isDefault && (
                      <Chip label="default" size="small" sx={{ ml: 1, bgcolor: '#667eea', color: 'white', height: 18, fontSize: 10 }} />
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lst.items.length} articoli
                  </Typography>
                </Box>
                <IconButton size="small" title={lst.isDefault ? 'Già default' : 'Imposta come default'}
                  onClick={() => !lst.isDefault && handleSetDefault(lst.id)}
                  sx={{ color: lst.isDefault ? '#f6c90e' : 'text.disabled' }}>
                  {lst.isDefault ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                </IconButton>
                <IconButton size="small" onClick={() => setSelectedId(lst.id)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(lst.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nuova lista di default</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField autoFocus label="Nome lista *" fullWidth value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newName.trim()}>Crea</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')} message={snack} />
    </Box>
  )
}

// ─── Tab Categorie ─────────────────────────────────────────────────────────
function CategoriesTab({ customCategories, onCustomCategoriesChange }) {
  const [openAdd, setOpenAdd] = useState(false)
  const [openAI, setOpenAI] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [editCat, setEditCat] = useState(null)
  const [form, setForm] = useState({ name: '', emoji: '📦' })
  const [snack, setSnack] = useState('')

  const handleShare = () => {
    const encoded = serializeCustomCategories(customCategories)
    const url = `${window.location.origin}${import.meta.env.BASE_URL}?cats=${encoded}`
    setShareUrl(url)
    setShareOpen(true)
  }

  const handleAIImport = (parsed) => {
    const rows = Array.isArray(parsed) ? parsed : [parsed]
    const valid = rows.filter(i => i && typeof i.name === 'string' && i.name.trim())
    if (valid.length === 0) return 'Nessuna categoria valida trovata'
    valid.forEach(i => createCustomCategory({ name: i.name.trim(), emoji: i.emoji?.trim() || '📦' }))
    onCustomCategoriesChange(getCustomCategories())
    setSnack(`${valid.length} categorie importate dall'AI`)
  }

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
        sx={{ mb: 1 }}
      >
        Nuova categoria
      </Button>
      <Button
        variant="outlined"
        startIcon={<AutoAwesomeIcon />}
        onClick={() => setOpenAI(true)}
        fullWidth
        sx={{ mb: 2, borderColor: '#667eea', color: '#667eea' }}
      >
        Suggerisci con AI
      </Button>
      <Button
        variant="outlined"
        startIcon={<ShareIcon />}
        onClick={handleShare}
        fullWidth
        disabled={customCategories.length === 0}
        sx={{ mb: 2 }}
      >
        Condividi categorie custom ({customCategories.length})
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

      <AIImportDialog
        open={openAI}
        onClose={() => setOpenAI(false)}
        title="Suggerisci categorie con AI"
        prompt={PROMPT_CATEGORIES}
        parseHint={'JSON: [{"name":"...","emoji":"🏷️"}]\nCSV: name,emoji\n     Integratori,💊'}
        onImport={(parsed) => { const err = handleAIImport(parsed); return err }}
      />

      <ShareLinkDialog
        open={shareOpen}
        onClose={(copied) => { setShareOpen(false); if (copied) setSnack('Link copiato!') }}
        url={shareUrl}
        title="Condividi categorie custom"
        description="Chiunque apra questo link potrà importare le tue categorie personalizzate."
      />

      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')} message={snack} />
    </Box>
  )
}

// ─── Editor ordine reparti supermercato ──────────────────────────────────────
function SupermarketEditor({ supermarket, customCategories, onSave, onCancel }) {
  const [name, setName] = useState(supermarket?.name || '')
  const [ordered, setOrdered]  = useState(supermarket?.categoryOrder || [])
  const [openAI, setOpenAI] = useState(false)

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

  const handleAIImport = (parsed) => {
    const obj = Array.isArray(parsed) ? parsed[0] : parsed
    if (!obj) return 'Risposta non valida'
    let order = obj.categoryOrder
    if (typeof order === 'string') {
      order = order.split(';').map(s => +s.trim()).filter(n => !isNaN(n) && n > 0)
    }
    if (!Array.isArray(order) || order.length === 0) return 'Manca il campo "categoryOrder" con l\'ordine dei reparti'
    if (!name.trim() && obj.name) setName(obj.name.trim())
    setOrdered(order.map(Number))
  }

  return (
    <Box>
      <TextField fullWidth label="Nome supermercato *" value={name}
        onChange={e => setName(e.target.value)} sx={{ mb: 1.5 }} />
      <Button
        variant="outlined"
        startIcon={<AutoAwesomeIcon />}
        onClick={() => setOpenAI(true)}
        fullWidth
        sx={{ mb: 3, borderColor: '#667eea', color: '#667eea' }}
      >
        Suggerisci ordine reparti con AI
      </Button>

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

      <AIImportDialog
        open={openAI}
        onClose={() => setOpenAI(false)}
        title="Configura supermercato con AI"
        prompt={promptSupermarket(name)}
        parseHint={'JSON: {"name":"...","categoryOrder":[1,3,5,...]}\nCSV: name,categoryOrder\n     Esselunga,"1;3;5;2;6"'}
        onImport={(parsed) => handleAIImport(parsed)}
      />
    </Box>
  )
}

// ─── Tab Supermercati ─────────────────────────────────────────────────────────
function SupermarketsTab({ customCategories }) {
  const [supermarkets, setSupermarkets] = useState([])
  const [editing, setEditing] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
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
    setShareUrl(url)
    setShareOpen(true)
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
      <ShareLinkDialog
        open={shareOpen}
        onClose={(copied) => { setShareOpen(false); if (copied) setSnack('Link copiato!') }}
        url={shareUrl}
        title="Condividi supermercato"
        description="Invia questo link per importare il supermercato (include le categorie custom usate)."
      />

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
