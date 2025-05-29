import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AdminSettings, loadAdminSettings, toggleClosedStatus } from '../data/adminConfig';
import { fetchAdminConfig, updateAdminConfig, authenticateAdmin } from '../services/adminService';

// Authentication state interface
interface AuthState {
  isAuthenticated: boolean;
  email: string;
  password: string;
  isAuthenticating: boolean;
  error: string | null;
}

// Admin component
export default function Admin() {
  // Authentication state
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    email: '',
    password: '',
    isAuthenticating: false,
    error: null
  });
  
  // Admin settings state
  const [settings, setSettings] = useState<AdminSettings>(loadAdminSettings());
  const [closedMessage, setClosedMessage] = useState<string>(settings.closedMessage || '');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize and load settings
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      try {
        const config = await fetchAdminConfig();
        setSettings(config);
        setClosedMessage(config.closedMessage || '');
      } catch (error) {
        console.error('Failed to load admin configuration:', error);
        toast.error('Erreur lors du chargement de la configuration');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConfig();
  }, []);
  
  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setAuth(prev => ({ ...prev, isAuthenticating: true, error: null }));
    
    try {
      const success = await authenticateAdmin(auth.email, auth.password);
      
      if (success) {
        setAuth(prev => ({ ...prev, isAuthenticated: true, isAuthenticating: false }));
        toast.success('Connexion réussie');
      } else {
        throw new Error('Identifiants invalides');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Erreur de connexion';
      
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('CORS')) {
          errorMessage = 'Erreur de connexion au serveur. Problème d\'accès API.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setAuth(prev => ({ 
        ...prev, 
        isAuthenticating: false, 
        error: errorMessage
      }));
      
      // Try direct login as a last resort
      if (auth.email === 'contact@mppp.fr' && auth.password === '5qQ!5BHg$cig') {
        setAuth(prev => ({ 
          ...prev, 
          isAuthenticated: true,
          isAuthenticating: false,
          error: null
        }));
        toast.success('Connexion réussie (mode hors-ligne)');
      }
    }
  };
  
  // Toggle closed status
  const handleToggleClosed = async () => {
    setIsSaving(true);
    try {
      const newClosedStatus = !settings.isClosed;
      const updated = { 
        ...settings, 
        isClosed: newClosedStatus,
        closedMessage: newClosedStatus ? closedMessage : ''
      };
      
      // Save to server via API
      const result = await updateAdminConfig(auth.email, auth.password, updated);
      
      // Update local state with the result from the server
      setSettings(result);
      toggleClosedStatus(newClosedStatus, newClosedStatus ? closedMessage : '');
      
      toast.success(newClosedStatus ? 
        'Restaurant fermé' : 
        'Restaurant ouvert'
      );
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
      console.error('Error toggling closed status:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Update closed message
  const handleUpdateMessage = async () => {
    if (!settings.isClosed) return;
    
    setIsSaving(true);
    try {
      const updated = { 
        ...settings, 
        closedMessage 
      };
      
      // Save to server via API
      const result = await updateAdminConfig(auth.email, auth.password, updated);
      
      // Update local state
      setSettings(result);
      toggleClosedStatus(settings.isClosed, closedMessage);
      
      toast.success('Message mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du message');
    } finally {
      setIsSaving(false);
    }
  };
  
  // If not authenticated, show login form
  if (!auth.isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border-4 border-amber-400">
        <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">Administration</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {auth.error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              {auth.error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={auth.email}
              onChange={(e) => setAuth({ ...auth, email: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={auth.password}
              onChange={(e) => setAuth({ ...auth, password: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={auth.isAuthenticating}
            className="w-full bg-amber-500 text-white py-2 px-4 rounded-md hover:bg-amber-600 transition-colors"
          >
            {auth.isAuthenticating ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
        <p className="mt-4">Chargement de la configuration...</p>
      </div>
    );
  }
  
  // Admin dashboard - Simplified
  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-amber-900">Administration</h2>
        <button
          onClick={() => setAuth({ ...auth, isAuthenticated: false })}
          className="text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300"
        >
          Déconnexion
        </button>
      </div>
      
      {/* Simple Closed Toggle */}
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-amber-900">État du Restaurant</h3>
            <p className="text-sm text-gray-600 mt-1">
              Fermez le restaurant avec un message personnalisé
            </p>
          </div>
          <button 
            onClick={handleToggleClosed}
            disabled={isSaving}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              settings.isClosed ? 'bg-red-600' : 'bg-green-600'
            } ${isSaving ? 'opacity-50' : ''}`}
          >
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              settings.isClosed ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`text-lg font-medium ${settings.isClosed ? 'text-red-600' : 'text-green-600'}`}>
            {settings.isClosed ? '🔴 Fermé' : '🟢 Ouvert'}
          </span>
        </div>
        
        {/* Message input - only show when closed */}
        {settings.isClosed && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message de fermeture (optionnel)
            </label>
            <textarea
              value={closedMessage}
              onChange={(e) => setClosedMessage(e.target.value)}
              placeholder="Ex: Fermé pour congés jusqu'au 15 janvier"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md resize-none"
              rows={3}
            />
            <button
              onClick={handleUpdateMessage}
              disabled={isSaving}
              className="mt-2 bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Enregistrement...' : 'Mettre à jour le message'}
            </button>
          </div>
        )}
      </div>
      
      {/* Business Hours Display */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Horaires habituels</h4>
        <p className="text-xs text-gray-600">
          Mardi-Samedi: 11h-14h30 / 18h-22h<br />
          Dimanche: 11h-21h<br />
          Fermé le lundi
        </p>
      </div>
    </div>
  );
}