// Service for admin API interactions
import axios from 'axios';
import { AdminSettings, loadAdminSettings, saveAdminSettings } from '../data/adminConfig';

// Determine the base URL dynamically based on the current domain
function getApiBaseUrl(): string {
  // In browser environment
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}/api`;
  }
  
  // Fallback for SSR or non-browser environment
  return process.env.NODE_ENV === 'production'
    ? 'https://mppp.fr/api'
    : 'http://localhost:3000/api';
}

// Base URL for API calls
const API_BASE_URL = getApiBaseUrl();

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
  // Try client-side auth first for when API is unavailable
  // This is a fallback to make sure we can still log in even if the API endpoint has issues
  const validEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const validPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  
  if (validEmail && validPassword && email === validEmail && password === validPassword) {
    console.log('Client-side credential match successful');
    return true;
  }
  
  // Also attempt to authenticate via hardcoded credentials as final fallback
  // Important for first login when env variables might not be set
  if (email === 'contact@mppp.fr' && password === '5qQ!5BHg$cig') {
    console.log('Fallback credential match successful');
    return true;
  }
  
  try {
    // Try server authentication - this should be the primary method 
    // when everything is working correctly
    console.log('Attempting server authentication...');
    const minimalConfig = loadAdminSettings();
    await updateAdminConfig(email, password, minimalConfig);
    console.log('Server authentication successful');
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    // If server auth fails, we've already tried the alternatives above
    return false;
  }
}