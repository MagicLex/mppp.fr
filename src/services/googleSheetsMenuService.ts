import { Product, OrderOption } from '../types';

// Google Sheet ID from the URL
const SHEET_ID = '16lVNCu4xZaI6zrKT4WBrL6Q3tNjWnrlEmDtRZ2-oV9I';

// The sheet number or name (gid parameter)
const SHEET_GID = '290161789';

// The URL to export the sheet as CSV
const SHEETS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

interface MenuItem {
  type: 'product' | 'option';
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  displayOnHome: boolean;
  featured: boolean;
  optionType?: string;
}

// Parse CSV data
function parseCSV(csvText: string): MenuItem[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',');
    const item: any = {};
    
    headers.forEach((header, index) => {
      // Handle quoted values for description
      if (header === 'description' && values[index]?.startsWith('"')) {
        // Find the closing quote
        let fullValue = values[index] || '';
        let currentIndex = index + 1;
        
        while (!fullValue.endsWith('"') && currentIndex < values.length) {
          fullValue += ',' + values[currentIndex];
          currentIndex++;
        }
        
        // Remove the quotes
        item[header] = fullValue.substring(1, fullValue.length - 1);
      } else {
        let value = values[index] || '';
        
        // Convert to appropriate type
        if (header === 'price') {
          // Handle price format with comma as decimal separator
          value = value.replace(',', '.');
          item[header] = parseFloat(value) || 0;
        } else if (header === 'displayOnHome' || header === 'featured') {
          item[header] = value.toLowerCase() === 'true';
        } else {
          item[header] = value;
        }
      }
    });
    
    // Set optionType from category for options
    if (item.type === 'option') {
      item.optionType = item.category;
    }
    
    return item as MenuItem;
  }).filter(item => item.id && item.name); // Filter out incomplete rows
}

// Fetch and parse Google Sheets data
async function fetchMenuData(): Promise<{ products: Product[], options: Record<string, OrderOption[]> }> {
  try {
    const response = await fetch(SHEETS_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${response.status}`);
    }
    
    const csvText = await response.text();
    const menuItems = parseCSV(csvText);
    
    // Split into products and options
    const products = menuItems
      .filter(item => item.type === 'product')
      .map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        category: item.category,
        displayOnHome: item.displayOnHome,
        featured: item.featured
      })) as Product[];
    
    // Group options by their type
    const options: Record<string, OrderOption[]> = {};
    
    menuItems
      .filter(item => item.type === 'option')
      .forEach(item => {
        const option: OrderOption = {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          type: item.optionType as 'drink' | 'sauce' | 'side' | 'dessert' | 'extra'
        };
        
        // Normalize the category names for better grouping
        let category = item.optionType!;
        
        // Group all drinks under "drinks"
        if (category === 'drink') {
          category = 'drinks';
        } else if (category === 'sauce') {
          category = 'sauces';
        } else if (category === 'side') {
          category = 'sides';
        } else if (category === 'dessert') {
          category = 'desserts';
        }
        
        if (!options[category]) {
          options[category] = [];
        }
        
        options[category].push(option);
      });
    
    return { products, options };
  } catch (error) {
    console.error('Error fetching or parsing Google Sheet:', error);
    // Fall back to CSV file if Google Sheets access fails
    return fallbackToCSV();
  }
}

// Fallback to local CSV file
async function fallbackToCSV() {
  try {
    const csvService = await import('./csvMenuService');
    const products = await csvService.getAllProducts();
    
    const options: Record<string, OrderOption[]> = {};
    const optionTypes = await csvService.getOptionTypes();
    
    for (const type of optionTypes) {
      options[type] = await csvService.getOptionsByType(type);
    }
    
    console.log('Fallback to CSV successful');
    return { products, options };
  } catch (error) {
    console.error('Error in CSV fallback:', error);
    return { products: [], options: {} };
  }
}

// Cache for menu data with expiration
let menuDataCache: { 
  data: { products: Product[], options: Record<string, OrderOption[]> }, 
  timestamp: number 
} | null = null;

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000; 

// Get all products
export async function getAllProducts(): Promise<Product[]> {
  const menuData = await getMenuData();
  return menuData.products;
}

// Helper to get menu data with caching
async function getMenuData() {
  const now = Date.now();
  
  // If cache is valid and not expired
  if (menuDataCache && (now - menuDataCache.timestamp < CACHE_EXPIRATION)) {
    return menuDataCache.data;
  }
  
  // Fetch fresh data
  const freshData = await fetchMenuData();
  menuDataCache = {
    data: freshData,
    timestamp: now
  };
  
  return freshData;
}

// Get products by category
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(product => product.category === category);
}

// Get products to display on home page
export async function getHomePageProducts(): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(product => product.displayOnHome);
}

// Get featured products
export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(product => product.featured);
}

// Get product by ID
export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getAllProducts();
  return products.find(product => product.id === id);
}

// Get all options by type
export async function getOptionsByType(type: string): Promise<OrderOption[]> {
  const menuData = await getMenuData();
  return menuData.options[type] || [];
}

// Get option by ID
export async function getOptionById(id: string): Promise<OrderOption | undefined> {
  const menuData = await getMenuData();
  
  // Search through all option types
  for (const optionType in menuData.options) {
    const option = menuData.options[optionType].find(option => option.id === id);
    if (option) {
      return option;
    }
  }
  
  return undefined;
}

// Get all available option types
export async function getOptionTypes(): Promise<string[]> {
  const menuData = await getMenuData();
  return Object.keys(menuData.options);
}

// Force refresh cache
export function refreshCache(): void {
  menuDataCache = null;
}
