import { Box, Typography, IconButton, Divider, Paper } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const Section = ({ title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#667eea' }}>{title}</Typography>
    {children}
  </Box>
)

const P = ({ children }) => (
  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.7 }}>{children}</Typography>
)

export default function PrivacyPage({ onBack }) {
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
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>🔒 Privacy Policy</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Ultimo aggiornamento: febbraio 2026</Typography>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
        <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
          <Section title="1. Introduzione">
            <P>
              ShopList è un'applicazione web gratuita per la gestione delle liste della spesa. Questa Privacy Policy
              descrive come trattiamo le informazioni degli utenti nell'utilizzo dell'app.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="2. Dati raccolti">
            <P>
              ShopList funziona in due modalità:
            </P>
            <P>
              <strong>Senza account Google</strong> — L'app non raccoglie, non trasmette e non archivia
              dati personali su server esterni. Tutta la tua attività — liste della spesa, articoli,
              supermercati, categorie personalizzate e liste di default — viene salvata esclusivamente
              nel <strong>localStorage del tuo browser</strong>, sul tuo dispositivo.
            </P>
            <P>
              <strong>Con account Google (opzionale)</strong> — Se scegli di collegare il tuo account
              Google, l'app richiede un token OAuth 2.0 con i seguenti permessi:
            </P>
            <P>• <strong>openid / profile / email</strong> — per mostrare il tuo nome e avatar nell'interfaccia</P>
            <P>• <strong>drive.appdata</strong> — per leggere e scrivere nella cartella privata appDataFolder di Google Drive (non visibile nel tuo Drive normale)</P>
            <P>• <strong>drive.file</strong> — per creare file condivisi con altre persone tramite email</P>
            <P>
              Non vengono richiesti permessi per leggere o modificare altri file del tuo Google Drive.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="3. localStorage e dati locali">
            <P>
              I dati salvati nel localStorage rimangono sul tuo dispositivo finché non li elimini manualmente
              (svuotando i dati del browser o disinstallando l'app).
            </P>
            <P>
              Puoi cancellare tutti i dati dell'app in qualsiasi momento svuotando la cache del browser o accedendo
              alle impostazioni del sito nel tuo browser.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="4. Google Drive e dati cloud">
            <P>
              Se attivi la sincronizzazione con Google, i tuoi dati (liste di default, supermercati, categorie
              personalizzate, liste della spesa) vengono caricati nella cartella <strong>appDataFolder</strong>
              del tuo Google Drive. Tale cartella è accessibile solo a ShopList e non è visibile nel tuo
              Google Drive normale né ad altre app.
            </P>
            <P>
              I file che condividi esplicitamente con altre persone tramite email vengono creati come file
              normali di Google Drive, accessibili solo alle persone invitate. Puoi revocare l'accesso in
              qualsiasi momento dal pannello Drive nell'app.
            </P>
            <P>
              Il token OAuth è temporaneo (durata ~1 ora) e non viene mai salvato su server ShopList.
              Viene conservato temporaneamente in memoria durante la sessione del browser.
              Il profilo utente (nome, email, foto) viene salvato nel localStorage per mostrarlo
              nell'interfaccia senza richiedere un nuovo login ad ogni visita.
            </P>
            <P>
              Il trattamento dei dati da parte di Google è regolato dalla
              <strong> Google Privacy Policy</strong> (policies.google.com/privacy).
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="5. Funzione di condivisione via link">
            <P>
              La funzione «Condividi link» genera un URL contenente i dati della lista codificati in Base64
              direttamente nell'URL. Questi dati vengono trasmessi solo quando decidi attivamente di condividere
              il link con qualcuno. Non vengono memorizzati su alcun server da parte di ShopList.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="6. Hosting e terze parti">
            <P>
              L'app è ospitata su <strong>GitHub Pages</strong> (GitHub, Inc.). Il solo accesso alla pagina
              potrebbe essere registrato nei log standard di GitHub secondo la loro
              <strong> Privacy Policy</strong> (github.com/privacy).
            </P>
            <P>
              L'app carica lo script <strong>Google Identity Services</strong> (accounts.google.com/gsi/client)
              necessario per il login con Google. Tale script è soggetto alla Google Privacy Policy.
              Viene caricato indipendentemente dall'utilizzo del login.
            </P>
            <P>
              Non sono integrati strumenti di analytics, tracking, pubblicità o cookie di terze parti.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="6. Minori">
            <P>
              L'app non è destinata a minori di 13 anni e non raccoglie consapevolmente dati da minori.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="7. Modifiche a questa policy">
            <P>
              Eventuali aggiornamenti a questa Privacy Policy verranno pubblicati su questa pagina con
              la data di revisione aggiornata.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="8. Contatti">
            <P>
              Per qualsiasi domanda riguardante questa Privacy Policy, puoi aprire una issue sul repository
              GitHub del progetto.
            </P>
          </Section>
        </Paper>
      </Box>
    </Box>
  )
}
