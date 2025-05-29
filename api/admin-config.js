// Serverless endpoint for admin configuration management
import { createHash } from 'crypto';
import { readSettings, writeSettings } from './utils/fileStorage.js';

// Admin auth - from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Check if credentials are available
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ERROR: Admin credentials not found in environment variables');
  throw new Error('Admin credentials must be set in environment variables');
}

const ADMIN_PASSWORD_HASH = createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

// Default config - should match the client-side defaults
const DEFAULT_CONFIG = {
  isClosed: false,
  closedMessage: '',
  businessHours: {
    weekdays: {
      lunch: {
        opening: 12,
        closing: 14,
      },
      dinner: {
        opening: 19,
        closing: 21,
      }
    },
    sunday: {
      opening: 12,
      closing: 21,
    },
    closedDays: [1] // Monday is closed by default
  },
  preorderMinutes: 30,
  lastOrderMinutes: 30,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system'
};

// Helper to hash passwords
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

// Authenticate admin request
function authenticate(email, password) {
  if (!email || !password) return false;
  return email === ADMIN_EMAIL && hashPassword(password) === ADMIN_PASSWORD_HASH;
}

export default async function handler(req, res) {
  // CORS headers - allow requests from both www and non-www domains
  const allowedOrigins = ['https://mppp.fr', 'https://www.mppp.fr', 'http://localhost:3000'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET - Retrieve settings
  if (req.method === 'GET') {
    try {
      // Read settings from file
      let settings = await readSettings();
      
      // If no settings are saved yet, use default
      if (!settings) {
        settings = { ...DEFAULT_CONFIG };
      }
      
      // Migrate old format if needed
      if ('forceClose' in settings && !('isClosed' in settings)) {
        settings.isClosed = settings.forceClose;
        settings.closedMessage = '';
        delete settings.forceClose;
        delete settings.specialClosings;
        // Save migrated settings
        await writeSettings(settings);
      }
      
      return res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error reading settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Error reading configuration',
        error: error.message
      });
    }
  }
  
  // POST - Update settings
  if (req.method === 'POST') {
    try {
      const { email, password, config } = req.body;
      
      // Authenticate request
      if (!authenticate(email, password)) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      // Validate config data
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'No configuration data provided'
        });
      }
      
      // Migrate old config format if needed
      const migratedConfig = { ...config };
      if ('forceClose' in migratedConfig && !('isClosed' in migratedConfig)) {
        migratedConfig.isClosed = migratedConfig.forceClose;
        migratedConfig.closedMessage = '';
        delete migratedConfig.forceClose;
        delete migratedConfig.specialClosings;
      }
      
      // Update config with metadata
      const updatedConfig = {
        ...migratedConfig,
        lastUpdated: new Date().toISOString(),
        updatedBy: email
      };
      
      // Save to file
      const saveResult = await writeSettings(updatedConfig);
      
      if (!saveResult) {
        throw new Error('Failed to save settings to storage');
      }
      
      return res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
        data: updatedConfig
      });
    } catch (error) {
      console.error('Error updating admin config:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating configuration',
        error: error.message
      });
    }
  }
  
  // If method is not supported
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}