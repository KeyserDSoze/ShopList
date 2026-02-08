import {
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Checkbox,
  Box,
  List,
  ListItem,
  Chip
} from '@mui/material'

export default function ShoppingCategory({ category, checkedItems, onCheck }) {
  const checkedInCategory = category.items.filter(item => checkedItems[item.id]).length
  const total = category.items.length
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            {category.name}
          </Typography>
          <Chip 
            label={`${checkedInCategory}/${total}`}
            color={checkedInCategory === total ? 'success' : 'default'}
            variant={checkedInCategory === total ? 'filled' : 'outlined'}
          />
        </Box>
        
        <List sx={{ p: 0 }}>
          {category.items.map(item => (
            <ListItem
              key={item.id}
              sx={{
                p: 1,
                mb: 1,
                backgroundColor: checkedItems[item.id] ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                borderRadius: 1,
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: checkedItems[item.id] ? 'rgba(76, 175, 80, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                }
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checkedItems[item.id] || false}
                    onChange={() => onCheck(item.id)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      sx={{
                        textDecoration: checkedItems[item.id] ? 'line-through' : 'none',
                        color: checkedItems[item.id] ? 'textSecondary' : 'textPrimary',
                        transition: 'all 0.2s'
                      }}
                    >
                      {item.name}
                    </Typography>
                    {item.quantity && (
                      <Chip
                        label={item.quantity}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                sx={{ width: '100%' }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}
