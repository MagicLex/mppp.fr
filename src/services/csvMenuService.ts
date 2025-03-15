import { Product, OrderOption } from '../types';

// This function would typically fetch the CSV from a file or URL
// For now, we'll use the static path to the CSV file in the public directory
const CSV_PATH = '/data/menu.csv';

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
async function parseCSV(csvText: string): Promise<MenuItem[]> {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',');
    const item: any = {};
    
    headers.forEach((header, index) => {
      // Handle quoted values for description
      if (header === 'description' && values[index].startsWith('"')) {
        // Find the closing quote
        let fullValue = values[index];
        let currentIndex = index + 1;
        
        while (!fullValue.endsWith('"') && currentIndex < values.length) {
          fullValue += ',' + values[currentIndex];
          currentIndex++;
        }
        
        // Remove the quotes
        item[header] = fullValue.substring(1, fullValue.length - 1);
      } else {
        let value = values[index];
        
        // Convert to appropriate type
        if (header === 'price') {
          item[header] = parseFloat(value);
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
  });
}

// Fetch and parse CSV data
async function fetchMenuData(): Promise<{ products: Product[], options: Record<string, OrderOption[]> }> {
  try {
    const response = await fetch(CSV_PATH);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }
    
    const csvText = await response.text();
    const menuItems = await parseCSV(csvText);
    
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
          type: item.optionType as 'drink' | 'sauce' | 'side' | 'extra'
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
    console.error('Error fetching or parsing CSV:', error);
    return { products: [], options: {} };
  }
}

// Cache for menu data
let menuDataCache: { products: Product[], options: Record<string, OrderOption[]> } | null = null;

// Get all products
export async function getAllProducts(): Promise<Product[]> {
  if (!menuDataCache) {
    menuDataCache = await fetchMenuData();
  }
  return menuDataCache.products;
}

// Get products by category
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(product => (product as any).category === category);
}

// Get products to display on home page
export async function getHomePageProducts(): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(product => (product as any).displayOnHome);
}

// Get featured products
export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(product => (product as any).featured);
}

// Get product by ID
export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getAllProducts();
  return products.find(product => product.id === id);
}

// Get all options by type
export async function getOptionsByType(type: string): Promise<OrderOption[]> {
  if (!menuDataCache) {
    menuDataCache = await fetchMenuData();
  }
  
  return menuDataCache.options[type] || [];
}

// Get option by ID
export async function getOptionById(id: string): Promise<OrderOption | undefined> {
  if (!menuDataCache) {
    menuDataCache = await fetchMenuData();
  }
  
  // Search through all option types
  for (const optionType in menuDataCache.options) {
    const option = menuDataCache.options[optionType].find(option => option.id === id);
    if (option) {
      return option;
    }
  }
  
  return undefined;
}

// Get all available option types
export async function getOptionTypes(): Promise<string[]> {
  if (!menuDataCache) {
    menuDataCache = await fetchMenuData();
  }
  
  return Object.keys(menuDataCache.options);
}

// Invalidate cache (useful when the CSV is updated)
export function invalidateCache(): void {
  menuDataCache = null;
}