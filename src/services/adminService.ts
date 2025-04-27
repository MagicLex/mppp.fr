// Service for admin API interactions
import axios from 'axios';
import { AdminSettings, loadAdminSettings, saveAdminSettings } from '../data/adminConfig';

// Base URL for API calls
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://mppp.fr/api'
  : 'http://localhost:3000/api';

// Fetch admin configuration from API
export async function fetchAdminConfig(): Promise<AdminSettings> {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin-config`);
    if (response.data.success) {
      // Save to local storage as a cache
      saveAdminSettings(response.data.data);
      return response.data.data;
    }
    throw new Error('Failed to fetch admin configuration');
  } catch (error) {
    console.error('Error fetching admin config:', error);
    // Return cached config if API fails
    const cachedSettings = loadAdminSettings();
    
    // Mark as potentially stale
    return {
      ...cachedSettings,
      cachedData: true
    };
  }
}

// Update admin configuration via API
export async function updateAdminConfig(
  email: string,
  password: string,
  config: AdminSettings
): Promise<AdminSettings> {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin-config`, {
      email,
      password,
      config
    });
    
    if (response.data.success) {
      // Save to local storage
      saveAdminSettings(response.data.data);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to update admin configuration');
  } catch (error) {
    console.error('Error updating admin config:', error);
    if (error.response?.status === 401) {
      throw new Error('Identifiants invalides');
    }
    throw new Error('Erreur lors de la mise à jour de la configuration');
  }
}

// Authentication function
export async function authenticateAdmin(email: string, password: string): Promise<boolean> {
  // For local development, use hardcoded credentials
  const isLocalDev = process.env.NODE_ENV !== 'production';
  
  if (isLocalDev) {
    // Direct credential check for local development using environment variables
    const validEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const validPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    
    // If environment variables aren't set, log an error
    if (!validEmail || !validPassword) {
      console.error('Admin credentials not found in environment variables');
      return false;
    }
    
    return email === validEmail && password === validPassword;
  }
  
  try {
    // In production, verify via API
    const minimalConfig = loadAdminSettings();
    await updateAdminConfig(email, password, minimalConfig);
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}