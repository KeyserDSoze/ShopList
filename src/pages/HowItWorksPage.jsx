import { useState } from 'react'
import {
  Box, Typography, IconButton, Paper, Accordion, AccordionSummary,
  AccordionDetails, Divider, Chip, Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const Section = ({ emoji, title, children }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <span>{emoji}</span> {title}
    </Typography>
    {children}
  </Box>
)

const Step = ({ n, text }) => (
  <Box sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'flex-start' }}>
    <Chip label={n} size="small" sx={{ bgcolor: '#667eea', color: 'white', minWidth: 28, height: 24, fontWeight: 'bold', mt: 0.25 }} />
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, flex: 1 }}>{text}</Typography>
  </Box>
)

const P = ({ children }) => (
  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>{children}</Typography>
)

const FaqItem = ({ q, children }) => {
  const [open, setOpen] = useState(false)
  return (
    <Accordion expanded={open} onChange={() => setOpen(o => !o)} disableGutters elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', mb: 1, borderRadius: '8px !important', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{q}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{children}</Typography>
      </AccordionDetails>
    </Accordion>
  )
}

export default function HowItWorksPage({ onBack }) {
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
        <Box sx={{ maxWidth: 800, mx: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onBack} sx={{ color: 'white' }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>📖 Come funziona ShopList</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Guida completa e FAQ</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
        <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, mb: 3 }}>

          {/* Panoramica */}
          <Alert severity="info" sx={{ mb: 3 }}>
            ShopList è un'app per gestire le liste della spesa. Tutto viene salvato <strong>solo sul tuo dispositivo</strong> — nessun account richiesto, nessun dato inviato a server. Facoltativamente puoi collegare il tuo <strong>account Google</strong> per sincronizzare e condividere i dati tra dispositivi.
          </Alert>

          <Section emoji="🛒" title="Creare una lista della spesa">
            <Step n="1" text="Nella schermata principale premi «Nuova lista»." />
            <Step n="2" text="Scegli un nome (es. «Spesa settimanale») e seleziona le liste di default da usare come base. Se hai più liste di default, puoi selezionarne più d'una: gli articoli vengono uniti automaticamente." />
            <Step n="3" text="La lista viene creata in modalità «🔄 Preparazione»: puoi aggiungere o rimuovere articoli liberamente." />
            <Step n="4" text="Quando sei soddisfatto premi «Conferma lista» → la lista passa in modalità «✅ Pronto» e puoi usarla durante la spesa spuntando gli articoli." />
          </Section>

          <Divider sx={{ my: 3 }} />

          <Section emoji="📋" title="Due modalità della lista">
            <P>
              <strong>🔄 Preparazione</strong> — Stai costruendo la lista. Vedi tutti gli articoli di default e
              puoi spuntare quelli che vuoi comprare, aggiungerli definitivamente, o aggiungere articoli extra non
              presenti nella lista di default. Gli articoli spuntati vengono aggiunti alla lista, quelli non
              spuntati vengono ignorati al momento della conferma.
            </P>
            <P>
              <strong>✅ Pronto per l'acquisto</strong> — Sei al supermercato. Spunta gli articoli man mano che
              li metti nel carrello. La barra di avanzamento in alto ti mostra il progresso. Gli articoli
              spuntati appaiono barrati con sfondo verde.
            </P>
          </Section>

          <Divider sx={{ my: 3 }} />

          <Section emoji="📦" title="Liste di default">
            <P>
              Le liste di default sono modelli riutilizzabili: contengono gli articoli che compri abitualmente.
              Ogni volta che crei una nuova lista della spesa, puoi partire da una (o più) liste di default
              invece di ricominciare da zero.
            </P>
            <P>
              Puoi avere <strong>più liste di default</strong> (es. una per la spesa normale, una per la spesa
              di un'altra persona, una per le feste). Una è marcata come ⭐ default e viene pre-selezionata
              alla creazione di una nuova lista.
            </P>
            <P>
              Gestisci le liste di default in <strong>Impostazioni → Liste di default</strong>.
            </P>
          </Section>

          <Divider sx={{ my: 3 }} />

          <Section emoji="🏷️" title="Categorie">
            <P>
              Ogni articolo appartiene a una categoria (es. 🥦 Ortofrutta, 🥩 Macelleria, ❄️ Congelati).
              Le categorie ti aiutano a trovare gli articoli raggruppati per reparto.
            </P>
            <P>
              Oltre alle <strong>28 categorie built-in</strong>, puoi creare <strong>categorie personalizzate</strong>
              con nome ed emoji a tua scelta in <strong>Impostazioni → Categorie</strong>.
            </P>
          </Section>

          <Divider sx={{ my: 3 }} />

          <Section emoji="🏪" title="Supermercati">
            <P>
              Puoi configurare i tuoi supermercati abituali definendo l'<strong>ordine dei reparti</strong> come
              sono disposti fisicamente nel negozio. Quando selezioni un supermercato nella lista della spesa,
              gli articoli vengono riordinati automaticamente seguendo il percorso del supermercato.
            </P>
            <P>
              I reparti non presenti nel supermercato selezionato vengono nascosti per non distrarti.
              Gestisci i supermercati in <strong>Impostazioni → Supermercati</strong>.
            </P>
          </Section>

          <Divider sx={{ my: 3 }} />

          <Section emoji="🔗" title="Condivisione">
            <P>
              Puoi condividere liste, supermercati, liste di default e categorie custom generando un link.
              Il link contiene tutti i dati codificati nell'URL — non passa per nessun server.
            </P>
            <P>
              Chi riceve il link può importare il contenuto sull'app sul proprio dispositivo, scegliendo
              se unire o sovrascrivere i dati esistenti.
            </P>
          </Section>

          <Divider sx={{ my: 3 }} />

          <Section emoji="☁️" title="Sincronizzazione con Google Drive">
            <P>
              Se colleghi il tuo account Google, ShopList salva tutti i tuoi dati (liste di default,
              supermercati, categorie personalizzate e liste della spesa) in una cartella privata di
              Google Drive visibile solo all'app — non appare nel tuo Drive normale.
            </P>
            <Step n="1" text="Premi l'icona avatar nell'header oppure vai in Impostazioni → ☁️ Sync e premi «Accedi con Google»." />
            <Step n="2" text="Al primo accesso ShopList scarica automaticamente i dati presenti su Drive e li unisce con quelli locali (vince chi è stato modificato più di recente)." />
            <Step n="3" text="Abilita «Auto-sync» per sincronizzare automaticamente ogni volta che modifichi qualcosa. Puoi scegliere il ritardo (da 5 secondi a 5 minuti) per evitare upload troppo frequenti." />
            <Step n="4" text="Ogni singolo elemento (lista, supermercato, lista di default) mostra un badge colorato: verde = sincronizzato, arancione = modifiche non ancora caricate, grigio = mai sincronizzato." />
            <P>
              <strong>Condivisione via email</strong> — Tramite il pannello Drive o il badge di ogni elemento
              puoi condividere un file con un'altra persona inserendo la sua email Google. Chi riceve
              la condivisione la trova nella scheda «Ricevuti» del pannello Drive e può importarla con
              un clic.
            </P>
            <P>
              <strong>Cosa viene sincronizzato:</strong> liste di default · supermercati · categorie
              personalizzate · liste della spesa attive. Non vengono sincronizzate le impostazioni
              locali (tema, lingua).
            </P>
          </Section>

          <Divider sx={{ my: 3 }} />

          <Section emoji="🤖" title="Genera con AI">
            <P>
              In Impostazioni puoi usare la funzione «Genera con AI» per creare o arricchire le liste di
              default e i supermercati. L'app ti fornisce un prompt da copiare nel tuo assistente AI preferito
              (ChatGPT, Gemini, Copilot…). Incolli la risposta nell'app e gli articoli vengono importati
              automaticamente.
            </P>
          </Section>
        </Paper>

        {/* FAQ */}
        <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>❓ Domande frequenti</Typography>

          <FaqItem q="Devo avere un account Google per usare ShopList?">
            No, Google è completamente opzionale. L'app funziona integralmente offline senza nessun
            account. Il collegamento a Google serve solo se vuoi sincronizzare i dati tra più dispositivi
            o condividerli con altre persone.
          </FaqItem>

          <FaqItem q="Dove vengono salvati i dati su Google Drive?">
            In una cartella speciale chiamata <strong>appDataFolder</strong>, accessibile solo
            dall'app ShopList. Non compare nel tuo Google Drive normale e non è visibile ad altre
            app o persone. I file condivisi esplicitamente (tramite email) sono invece file normali
            di Drive, accessibili solo alle persone invitate.
          </FaqItem>

          <FaqItem q="Se cambio telefono, i dati si sincronizzano automaticamente?">
            Sì. Installa ShopList sul nuovo dispositivo, fai il login con lo stesso account Google
            e l'app scarica automaticamente tutti i tuoi dati da Drive al primo accesso.
          </FaqItem>

          <FaqItem q="L'auto-sync carica i dati ogni volta che spunto un articolo?">
            Non immediatamente: c'è un <strong>ritardo configurabile</strong> (default 30 secondi)
            prima di inviare le modifiche. Se spunti più articoli in rapida successione, viene fatto
            un solo upload al termine del ritardo, non uno per ogni spunta.
          </FaqItem>

          <FaqItem q="Posso condividere una lista con qualcuno via Google Drive?">
            Sì. Dal badge ☁️ accanto a ogni elemento (o dal pannello Drive nell'header) puoi inserire
            l'email Google di un'altra persona. Lei riceverà la condivisione nella scheda «Ricevuti»
            del pannello Drive e potrà importare il contenuto sul suo dispositivo. Puoi anche
            revocare l'accesso in qualsiasi momento.
          </FaqItem>

          <FaqItem q="Cosa succede se modifico gli stessi dati su due dispositivi contemporaneamente?">
            Al successivo sync vince il dato con la data di modifica più recente
            (<strong>last-write-wins</strong>). Non c'è un merge granulare articolo per articolo:
            l'intero bundle viene confrontato per data, quindi conviene sincronizzare spesso per
            ridurre il rischio di sovrascritture indesiderate.
          </FaqItem>

          <FaqItem q="I miei dati su Google Drive sono al sicuro?">
            Sì. La cartella appDataFolder è privata e cifrata da Google. ShopList richiede solo i
            permessi strettamente necessari: lettura/scrittura della propria cartella appData e
            creazione di file condivisi. Non viene richiesto accesso agli altri file del tuo Drive.
          </FaqItem>

          <FaqItem q="Posso usare l'app offline?">
            Sì. Dopo il primo caricamento, l'app funziona completamente offline grazie al Service Worker
            (PWA). Puoi anche installarla sul telefono come app nativa dalla finestra del browser.
          </FaqItem>

          <FaqItem q="Come aggiungo un articolo che non è nella lista di default?">
            In modalità Preparazione, premi il pulsante «Aggiungi articolo» e inserisci nome, categoria e
            quantità. L'articolo comparirà nella lista come già selezionato. Se lo deselezioni, rimane
            visibile durante la sessione corrente ma non viene salvato nella lista definitiva.
          </FaqItem>

          <FaqItem q="Posso avere più liste di default?">
            Sì. In Impostazioni → Liste di default puoi creare tutte le liste che vuoi. Una è marcata
            come ⭐ default e viene pre-selezionata quando crei una nuova lista, ma puoi selezionarne
            anche più d'una contemporaneamente: gli articoli verranno uniti automaticamente.
          </FaqItem>

          <FaqItem q="Se condivido un supermercato con qualcuno, lui vede i miei articoli?">
            No. Condividere un supermercato condivide solo la configurazione dell'ordine dei reparti,
            non le liste della spesa. Le liste sono separate e gestite individualmente.
          </FaqItem>

          <FaqItem q="Come funziona il merge quando importo una lista di default?">
            Se scegli «Unisci», per ogni articolo della lista importata: se esiste già nella tua lista
            con lo stesso nome (case-insensitive), le quantità vengono sommate se compatibili
            (es. 200 g + 100 g = 300 g); altrimenti vengono concatenate (es. «2 pz» + «1 kg»).
            Se l'articolo non esiste, viene aggiunto. Se scegli «Sovrascrivi», la tua lista viene
            sostituita interamente.
          </FaqItem>

          <FaqItem q="Perché il link di condivisione è così lungo?">
            Il link contiene tutti i dati codificati in Base64 direttamente nell'URL. Non passiamo
            per nessun server di shortening per mantenere la privacy. Puoi usare un servizio esterno
            come bit.ly per accorciarlo se necessario.
          </FaqItem>

          <FaqItem q="Il formato CSV è supportato per l'import AI?">
            Sì. Quando usi «Genera con AI», puoi incollare sia la risposta in formato JSON che in CSV
            (colonne: name, categoryId, quantity). L'app riconosce automaticamente il formato.
          </FaqItem>

          <FaqItem q="Come installo ShopList come app sul telefono?">
            Su Android con Chrome: apri il menu del browser → «Aggiungi alla schermata home».
            Su iOS con Safari: premi il pulsante di condivisione → «Aggiungi alla schermata Home».
            L'app si aprirà a schermo intero come una normale app nativa.
          </FaqItem>
        </Paper>
      </Box>
    </Box>
  )
}
