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

export default function TermsPage({ onBack }) {
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
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>📄 Termini di Servizio</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Ultimo aggiornamento: febbraio 2026</Typography>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
        <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
          <Section title="1. Accettazione dei termini">
            <P>
              Utilizzando ShopList accetti i presenti Termini di Servizio. Se non sei d'accordo con
              questi termini, ti invitiamo a non utilizzare l'applicazione.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="2. Descrizione del servizio">
            <P>
              ShopList è un'applicazione web gratuita che consente agli utenti di creare e gestire liste
              della spesa, organizzare articoli per categoria, definire liste di default e configurare
              supermercati personalizzati.
            </P>
            <P>
              Il servizio è fornito "così com'è" (as-is), senza garanzie di disponibilità continua,
              aggiornamenti futuri o assistenza tecnica.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="3. Uso consentito">
            <P>
              L'app può essere usata liberamente per scopi personali e non commerciali. Non è consentito:
            </P>
            <P>• Utilizzare l'app per attività illegali o dannose</P>
            <P>• Tentare di compromettere la sicurezza o l'integrità dell'applicazione</P>
            <P>• Distribuire versioni modificate spacciandole per l'originale</P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="4. Dati e responsabilità">
            <P>
              I dati inseriti nell'app vengono salvati localmente sul dispositivo dell'utente.
              L'utente è l'unico responsabile del backup e della conservazione dei propri dati.
              Lo sviluppatore non è responsabile per perdita di dati dovuta a svuotamento del browser,
              cambio di dispositivo o altri eventi.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="5. Funzione di condivisione">
            <P>
              I link di condivisione contengono i dati della lista codificati nell'URL. L'utente è
              responsabile di chi riceve tali link. Lo sviluppatore non ha accesso ai dati condivisi
              tramite URL e non è responsabile per l'uso che terzi ne fanno.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="6. Proprietà intellettuale">
            <P>
              Il codice sorgente di ShopList è disponibile su GitHub. Puoi consultare la licenza applicata
              nel repository per i dettagli su copia, modifica e ridistribuzione.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="7. Limitazione di responsabilità">
            <P>
              Lo sviluppatore non è responsabile per danni diretti, indiretti, incidentali o consequenziali
              derivanti dall'uso o dall'impossibilità di usare l'applicazione. L'app è fornita gratuitamente
              e senza garanzie di alcun tipo.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="8. Modifiche ai termini">
            <P>
              I presenti termini possono essere aggiornati in qualsiasi momento. L'uso continuato
              dell'app dopo la pubblicazione delle modifiche costituisce accettazione dei nuovi termini.
            </P>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="9. Legge applicabile">
            <P>
              I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia è
              competente il foro del domicilio dello sviluppatore.
            </P>
          </Section>
        </Paper>
      </Box>
    </Box>
  )
}
