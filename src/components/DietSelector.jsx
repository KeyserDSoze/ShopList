import { Card, CardContent, Typography, List, ListItem, Checkbox, FormControlLabel, Box, Chip } from '@mui/material'
import { getCategoryName } from '../constants/categories'

export default function PurchasableItems({ items, onToggleItem, isReadyToPurchase, customCategories = [] }) {
  // Raggruppo gli articoli per categoryId usando una Map per preservare l'ordine di inserimento
  const groupedItems = items.reduce((acc, item) => {
    const key = item.categoryId ?? item.department ?? 'other'
    if (!acc.has(key)) acc.set(key, [])
    acc.get(key).push(item)
    return acc
  }, new Map())

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        {isReadyToPurchase ? '🛒 Lista della spesa' : '📋 Articoli acquistabili'}
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[...groupedItems.entries()].map(([catKey, catItems]) => {
          const catId = !isNaN(+catKey) ? +catKey : catKey
          return (
            <Card key={catKey}>
              <CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {getCategoryName(catId, customCategories)}
                </Typography>
                <List sx={{ p: 0 }}>
                  {catItems.map((item) => (
                    <ListItem
                      key={item.id}
                      sx={{
                        px: 1,
                        py: 0.5,
                        backgroundColor: item.checked 
                          ? (isReadyToPurchase ? 'rgba(76, 175, 80, 0.15)' : 'rgba(33, 150, 243, 0.08)')
                          : 'transparent',
                        borderRadius: 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={item.checked}
                            onChange={() => onToggleItem(item.id)}
                            color={isReadyToPurchase ? 'success' : 'primary'}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ 
                              textDecoration: (isReadyToPurchase && item.checked) ? 'line-through' : 'none',
                              color: (isReadyToPurchase && item.checked) ? 'text.secondary' : 'text.primary',
                            }}>
                              {item.name}
                            </Typography>
                            {item.quantity && (
                              <Chip label={item.quantity} size="small" variant="outlined" />
                            )}
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )
        })}
      </Box>
    </Box>
  )
}

