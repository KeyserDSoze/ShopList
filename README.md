# 🛒 ShopList - Gestione Lista della Spesa

Un'applicazione React moderna con Material-UI per gestire facilmente la tua lista della spesa.

## Caratteristiche

✅ **Checklist interattiva** - Marca gli articoli che hai già preso
✅ **Organizzazione per reparti** - Lista divisa in categorie (Ortofrutta, Macelleria, Pescheria, ecc.)
✅ **Persistenza locale** - I tuoi progressi vengono salvati automaticamente
✅ **Indicatore di progresso** - Visualizza quanti articoli hai già preso
✅ **Design moderno** - Interfaccia pulita e intuitiva con Material-UI
✅ **Ripristino** - Bottone per ricominciare da capo

## Tech Stack

- **React 18** - Libreria UI
- **Vite** - Build tool veloce
- **Material-UI (MUI)** - Componenti UI
- **LocalStorage** - Persistenza dei dati

## Installazione

```bash
npm install
```

## Avvio dello sviluppo

```bash
npm run dev
```

L'applicazione si aprirà su `http://localhost:5174`

## Build per la produzione

```bash
npm run build
```

## Struttura del progetto

```
shoplist/
├── public/
│   └── shopping-list.json       # Dati della lista della spesa
├── src/
│   ├── components/
│   │   └── ShoppingCategory.jsx # Componente categoria
│   ├── App.jsx                  # Componente principale
│   ├── App.css                  # Stili App
│   ├── index.css                # Stili globali
│   └── main.jsx                 # Entry point
├── package.json
├── vite.config.js
└── index.html
```

## Come usare

1. Apri l'app nel browser
2. Visualizzi la lista della spesa organizzata per reparti
3. Clicca sulla checkbox vicino a ogni articolo per segnare che l'hai preso
4. Il progresso viene salvato automaticamente
5. Premi "Ripristina tutto" per ricominciare

## Personalizzazione

Per modificare gli articoli della lista, edita il file `public/shopping-list.json`.

Aggiungi nuove categorie o articoli mantenendo la stessa struttura JSON.

## Sviluppato con ❤️
