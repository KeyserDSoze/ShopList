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
              ShopList <strong>non raccoglie, non trasmette e non archivia dati personali su server esterni</strong>.
              Tutta la tua attività — liste della spesa, articoli, supermercati, categorie personalizzate e liste di
              default — viene salvata esclusivamente nel <strong>localStorage del tuo browser</strong>, sul tuo dispositivo.
            </P>
            <P>
              Non esistono account utente, non viene richiesta registrazione e nessuna informazione viene inviata a
              server di terze parti durante l'utilizzo normale dell'app.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="3. localStorage e dati locali">
            <P>
              I dati salvati nel localStorage rimangono sul tuo dispositivo finché non li elimini manualmente
              (svuotando i dati del browser o disinstallando l'app). Non vengono sincronizzati automaticamente
              con altri dispositivi.
            </P>
            <P>
              Puoi cancellare tutti i dati dell'app in qualsiasi momento svuotando la cache del browser o accedendo
              alle impostazioni del sito nel tuo browser.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="4. Funzione di condivisione">
            <P>
              La funzione "Condividi" genera un link contenente i dati della lista codificati in Base64 direttamente
              nell'URL. Questi dati vengono trasmessi solo quando decidi attivamente di condividere il link con
              qualcuno. Non vengono memorizzati su alcun server.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="5. Hosting e terze parti">
            <P>
              L'app è ospitata su <strong>GitHub Pages</strong> (GitHub, Inc.). Il solo accesso alla pagina
              potrebbe essere registrato nei log standard di GitHub secondo la loro
              <strong> Privacy Policy</strong> (github.com/privacy). ShopList non ha controllo su tali log.
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
