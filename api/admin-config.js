// Redis storage for admin settings
import { createHash } from 'crypto';
import Redis from 'ioredis';

// Admin auth
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact@mppp.fr';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '5qQ!5BHg$cig';
const ADMIN_PASSWORD_HASH = createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

// Default settings
const defaultSettings = {
  isClosed: false,
  closedMessage: '',
  businessHours: {
    weekdays: {
      lunch: { opening: 12, closing: 14 },
      dinner: { opening: 19, closing: 21 }
    },
    sunday: { opening: 12, closing: 21 },
    closedDays: [1]
  },
  preorderMinutes: 30,
  lastOrderMinutes: 30,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system'
};

// Initialize Redis client
let redis;
let fallbackSettings = { ...defaultSettings };

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false
    });
    
    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
    
    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    redis = null;
  }
} else {
  console.warn('REDIS_URL not found, falling back to in-memory storage');
}

// Redis key for settings
const SETTINGS_KEY = 'mpp:admin:settings';

// Get settings from Redis or return defaults
async function getSettings() {
  if (!redis) {
    return fallbackSettings;
  }
  
  try {
    const data = await redis.get(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      fallbackSettings = parsed; // Update fallback with latest from Redis
      return parsed;
    }
  } catch (error) {
    console.error('Redis get error:', error);
  }
  
  return fallbackSettings;
}

// Save settings to Redis
async function saveSettings(settings) {
  fallbackSettings = settings; // Always update fallback
  
  if (!redis) {
    return settings;
  }
  
  try {
    await redis.set(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Redis set error:', error);
  }
  
  return settings;
}

function authenticate(email, password) {
  if (!email || !password) return false;
  return email === ADMIN_EMAIL && hashPassword(password) === ADMIN_PASSWORD_HASH;
}

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    const settings = await getSettings();
    return res.status(200).json({ success: true, data: settings });
  }
  
  if (req.method === 'POST') {
    const { email, password, config } = req.body;
    
    if (!authenticate(email, password)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const updatedSettings = {
      ...config,
      lastUpdated: new Date().toISOString(),
      updatedBy: email
    };
    
    await saveSettings(updatedSettings);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Configuration updated successfully',
      data: updatedSettings 
    });
  }
  
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}