# 🛒 ShopList - Gestione Liste della Spesa

Un'applicazione React moderna con Material-UI per creare e gestire facilmente multiple liste della spesa basate sulla tua dieta personale.

## ✨ Caratteristiche

✅ **Multiple liste della spesa** - Crea, gestisci e completa multiple liste contemporaneamente
✅ **Basate sulla dieta** - Importa articoli dal tuo file dieta JSON personale
✅ **Articoli personalizzati** - Aggiungi articoli custom con nome, reparto e quantità
✅ **Checklist interattiva** - Segna gli articoli che hai già preso
✅ **Organizzazione per reparti** - Automaticamente organizzati per reparto (17 categorie diverse)
✅ **Indicatore di progresso** - Visualizza il tuo progresso in tempo reale
✅ **Persistenza locale** - Tutto salvato nel localStorage del browser
✅ **Gestione liste** - Crea, elimina e gestisci le tue liste (con conferma)
✅ **Design moderno** - Interfaccia pulita con Material-UI v5

## 📦 Tech Stack

- **React 18** - Libreria UI
- **Vite** - Build tool veloce
- **Material-UI (MUI) v5** - Componenti UI
- **Emotion** - CSS-in-JS styling
- **date-fns** - Formattazione date
- **LocalStorage** - Persistenza dati

## 🚀 Installazione

```bash
npm install
```

## 🎯 Avvio dello sviluppo

```bash
npm run dev
```

L'applicazione si aprirà su `http://localhost:5174/ShopList/`

## 📦 Build per la produzione

```bash
npm run build
```

## 📁 Struttura del progetto

```
shoplist/
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/
│       └── deploy.yml              # GitHub Actions deploy
├── public/
│   ├── diet.json                   # Tua dieta personale
│   └── shopping-list.json          # Legacy (non usato)
├── src/
│   ├── constants/
│   │   └── departments.js          # Enum reparti supermercato
│   ├── pages/
│   │   ├── HomePage.jsx            # Home con lista liste
│   │   └── ShoppingListPage.jsx    # Pagina della lista
│   ├── utils/
│   │   └── listStorage.js          # Gestione localStorage
│   ├── components/
│   │   └── ShoppingCategory.jsx    # Legacy
│   ├── App.jsx                     # App principale
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── package.json
├── vite.config.js
└── index.html
```

## 💡 Come usare

### Home Page
1. Clicca su **"Nuova lista"** per creare una nuova lista della spesa
2. Assegna un nome alla lista
3. Seleziona la lista per iniziare a fare shopping

### Pagina Lista
1. **Aggiungi articoli** cliccando su "Aggiungi articolo"
   - Scegli il nome (obbligatorio)
   - Seleziona il reparto (obbligatorio) dalla lista di 17 reparti
   - Aggiungi la quantità (opzionale)
2. **Segna come preso** cliccando sulla checkbox
3. **Rimuovi articoli** cliccando l'icona del cestino
4. Visualizza il **progresso in tempo reale**
5. Torna alla **home** cliccando il pulsante indietro

### Gestione Liste
- **Elimina una lista** dalla home cliccando "Elimina" (con conferma)
- Tutte le liste sono **salvate automaticamente** nel localStorage

## 🗂️ Reparti disponibili

- 🥦 Ortofrutta
- 🥓 Banco Frigo / Salumi & Formaggi
- 🥩 Macelleria / Gastronomia Carne
- 🐟 Pescheria
- 🍞 Pane, Cereali & Sostituti
- 🍝 Pasta, Riso & Legumi Secchi
- 🥜 Frutta Secca, Semi & Creme
- 🫒 Condimenti & Conserve
- 🍪 Colazione & Dolci
- ☕ Bevande
- 🥫 Cibi in Scatola & Conservati
- ❄️ Congelati
- 🧼 Casa & Pulizia
- 🧴 Igiene Personale
- 👕 Abbigliamento
- 📱 Elettronica
- 📦 Altro

## 📝 Personalizzazione

### Modifica la tua dieta
Edita il file `public/diet.json` per aggiungere/rimuovere articoli:

```json
{
  "items": [
    { "name": "Mele", "quantity": "150 g", "department": "produce" },
    { "name": "Latte", "quantity": "1 L", "department": "dairy" }
  ]
}
```

**Reparti disponibili (department):**
- `produce` - Ortofrutta
- `dairy` - Banco Frigo
- `meat` - Macelleria
- `fish` - Pescheria
- `bakery` - Pane e Cereali
- `pasta` - Pasta, Riso & Legumi
- `nuts` - Frutta Secca
- `condiments` - Condimenti
- `snacks` - Snacks & Dolci
- `beverages` - Bevande
- `canned` - Cibi in Scatola
- `frozen` - Congelati
- `household` - Casa & Pulizia
- `personal_care` - Igiene Personale
- `clothing` - Abbigliamento
- `electronics` - Elettronica
- `other` - Altro

## 🌐 Deploy su GitHub Pages

Il progetto è configurato con GitHub Actions per il deploy automatico:

1. Crea il repo su GitHub (es: `KeyserDSoze/ShopList`)
2. Fai un push: `git push origin main`
3. Il workflow si attiva automaticamente
4. L'app sarà disponibile su: `https://keyserdsoze.github.io/ShopList/`

Ogni push su `main` triggera automaticamente un nuovo deploy! 🚀

## 💾 Salvataggio Dati

Tutti i dati sono salvati nel **localStorage** del browser:
- Nomi liste
- Articoli
- Stato dei checkbox
- Data di creazione

I dati rimangono anche dopo chiusura e riapertura del browser!

## 📄 Licenza

MIT

---

Sviluppato con ❤️ per semplificare il tuo shopping!
