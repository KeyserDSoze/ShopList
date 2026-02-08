export const DEPARTMENTS = {
  PRODUCE: { id: 'produce', name: '🥦 Ortofrutta', emoji: '🥦' },
  DAIRY: { id: 'dairy', name: '🥓 Banco Frigo / Salumi & Formaggi', emoji: '🥓' },
  MEAT: { id: 'meat', name: '🥩 Macelleria / Gastronomia Carne', emoji: '🥩' },
  FISH: { id: 'fish', name: '🐟 Pescheria', emoji: '🐟' },
  BAKERY: { id: 'bakery', name: '🍞 Pane, Cereali & Sostituti', emoji: '🍞' },
  PASTA: { id: 'pasta', name: '🍝 Pasta, Riso & Legumi Secchi', emoji: '🍝' },
  NUTS: { id: 'nuts', name: '🥜 Frutta Secca, Semi & Creme', emoji: '🥜' },
  CONDIMENTS: { id: 'condiments', name: '🫒 Condimenti & Conserve', emoji: '🫒' },
  SNACKS: { id: 'snacks', name: '🍪 Colazione & Dolci', emoji: '🍪' },
  BEVERAGES: { id: 'beverages', name: '☕ Bevande', emoji: '☕' },
  CANNED: { id: 'canned', name: '🥫 Cibi in Scatola & Conservati', emoji: '🥫' },
  FROZEN: { id: 'frozen', name: '❄️ Congelati', emoji: '❄️' },
  HOUSEHOLD: { id: 'household', name: '🧼 Casa & Pulizia', emoji: '🧼' },
  PERSONAL_CARE: { id: 'personal_care', name: '🧴 Igiene Personale', emoji: '🧴' },
  CLOTHING: { id: 'clothing', name: '👕 Abbigliamento', emoji: '👕' },
  ELECTRONICS: { id: 'electronics', name: '📱 Elettronica', emoji: '📱' },
  OTHER: { id: 'other', name: '📦 Altro', emoji: '📦' },
};

export const getDepartmentName = (departmentId) => {
  const dept = Object.values(DEPARTMENTS).find(d => d.id === departmentId);
  return dept ? dept.name : DEPARTMENTS.OTHER.name;
};

export const getDepartmentEmoji = (departmentId) => {
  const dept = Object.values(DEPARTMENTS).find(d => d.id === departmentId);
  return dept ? dept.emoji : DEPARTMENTS.OTHER.emoji;
};
