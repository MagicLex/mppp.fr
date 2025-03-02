import { OrderOption } from '../types';

export const orderOptions: Record<string, OrderOption[]> = {
  drinks: [
    {
      id: 'coca-cola',
      name: 'Coca-Cola',
      price: 2.50,
      type: 'drink'
    },
    {
      id: 'sprite',
      name: 'Sprite',
      price: 2.50,
      type: 'drink'
    },
    {
      id: 'fanta',
      name: 'Fanta Orange',
      price: 2.50,
      type: 'drink'
    },
    {
      id: 'water',
      name: 'Eau Minérale',
      price: 1.50,
      type: 'drink'
    },
    {
      id: 'sumol',
      name: 'Sumol (Ananas)',
      price: 2.90,
      type: 'drink'
    }
  ],
  sauces: [
    {
      id: 'piri-piri-extra',
      name: 'Sauce Piri Piri (Extra Piquante)',
      price: 1.00,
      type: 'sauce'
    },
    {
      id: 'piri-piri-mild',
      name: 'Sauce Piri Piri (Douce)',
      price: 1.00,
      type: 'sauce'
    },
    {
      id: 'aioli',
      name: 'Aïoli',
      price: 1.00,
      type: 'sauce'
    }
  ],
  sides: [
    {
      id: 'salade',
      name: 'Salade Verte',
      price: 3.50,
      type: 'side'
    },
    {
      id: 'riz',
      name: 'Riz Portugais',
      price: 3.50,
      type: 'side'
    }
  ]
};