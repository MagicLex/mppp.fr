import { Product, OrderOption } from '../types';
import menuData from '../data/json/menu.json';

// Type for the menu data structure
interface MenuData {
  products: (Product & { category: string; displayOnHome: boolean; featured?: boolean })[];
  options: Record<string, OrderOption[]>;
}

// Type guard to check if data is of type MenuData
function isMenuData(data: any): data is MenuData {
  return data && 
    Array.isArray(data.products) && 
    typeof data.options === 'object';
}

// Get all products
export function getAllProducts(): Product[] {
  if (isMenuData(menuData)) {
    return menuData.products;
  }
  console.error('Menu data is invalid');
  return [];
}

// Get products by category
export function getProductsByCategory(category: string): Product[] {
  if (isMenuData(menuData)) {
    return menuData.products.filter(product => product.category === category);
  }
  console.error('Menu data is invalid');
  return [];
}

// Get products to display on home page
export function getHomePageProducts(): Product[] {
  if (isMenuData(menuData)) {
    return menuData.products.filter(product => product.displayOnHome);
  }
  console.error('Menu data is invalid');
  return [];
}

// Get featured products
export function getFeaturedProducts(): Product[] {
  if (isMenuData(menuData)) {
    return menuData.products.filter(product => product.featured);
  }
  console.error('Menu data is invalid');
  return [];
}

// Get product by ID
export function getProductById(id: string): Product | undefined {
  if (isMenuData(menuData)) {
    return menuData.products.find(product => product.id === id);
  }
  console.error('Menu data is invalid');
  return undefined;
}

// Get all options by type
export function getOptionsByType(type: string): OrderOption[] {
  if (isMenuData(menuData) && menuData.options[type]) {
    return menuData.options[type];
  }
  console.error(`Options for type ${type} not found or menu data is invalid`);
  return [];
}

// Get option by ID
export function getOptionById(id: string): OrderOption | undefined {
  if (isMenuData(menuData)) {
    // Flatten all option arrays and find the option with the matching ID
    return Object.values(menuData.options)
      .flat()
      .find(option => option.id === id);
  }
  console.error('Menu data is invalid');
  return undefined;
}

// Get all available option types
export function getOptionTypes(): string[] {
  if (isMenuData(menuData)) {
    return Object.keys(menuData.options);
  }
  console.error('Menu data is invalid');
  return [];
}
