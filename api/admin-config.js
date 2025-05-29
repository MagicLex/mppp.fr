// Simple in-memory storage for admin settings
import { createHash } from 'crypto';

// Admin auth
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact@mppp.fr';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '5qQ!5BHg$cig';
const ADMIN_PASSWORD_HASH = createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

// In-memory storage - resets on deploy
let settings = {
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
    return res.status(200).json({ success: true, data: settings });
  }
  
  if (req.method === 'POST') {
    const { email, password, config } = req.body;
    
    if (!authenticate(email, password)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    settings = {
      ...config,
      lastUpdated: new Date().toISOString(),
      updatedBy: email
    };
    
    return res.status(200).json({ 
      success: true, 
      message: 'Configuration updated successfully',
      data: settings 
    });
  }
  
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}