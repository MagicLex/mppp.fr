import { Product } from '../types';

export const products: Product[] = [
  {
    id: 'poulet-entier',
    name: 'Poulet Entier',
    description: 'Poulet portugais grillé au charbon de bois avec sauce Piri Piri',
    price: 22.90,
    image: '/images/menu/poulet-entier.jpg' // Updated path
  },
  {
    id: 'demi-poulet',
    name: '1/2 Poulet',
    description: 'Demi poulet portugais grillé avec sauce Piri Piri',
    price: 12.90,
    image: '/images/menu/demi-poulet.jpg' // Updated path
  },
  {
    id: 'quart-poulet',
    name: '1/4 Poulet',
    description: 'Quart de poulet portugais grillé avec sauce Piri Piri',
    price: 7.90,
    image: '/images/menu/quart-poulet.jpg' // Updated path
  },
  {
    id: 'pommes-terre',
    name: 'Pommes de Terre',
    description: 'Pommes de terre rôties aux herbes',
    price: 4.90,
    image: '/images/menu/pommes-terre.jpg' // Updated path
  }
];