import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AdminSettings, loadAdminSettings, saveAdminSettings, SpecialClosing } from '../data/adminConfig';
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
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [specialClosingReason, setSpecialClosingReason] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Get today's date for min date in datepicker
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  // Format a date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Initialize and load settings
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      try {
        const config = await fetchAdminConfig();
        setSettings(config);
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
    
    console.log('Login attempt with:', auth.email);
    setAuth(prev => ({ ...prev, isAuthenticating: true, error: null }));
    
    try {
      // For local development, allow direct login with credentials from environment variables
      const isDevMode = process.env.NODE_ENV !== 'production';
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
      let success = false;
      
      // Check if environment variables are available
      if (isDevMode && adminEmail && adminPassword && 
          auth.email === adminEmail && auth.password === adminPassword) {
        console.log('Dev mode login successful');
        success = true;
      } else {
        // Standard authentication flow
        success = await authenticateAdmin(auth.email, auth.password);
        console.log('Authentication result:', success);
      }
      
      if (success) {
        setAuth(prev => ({ ...prev, isAuthenticated: true, isAuthenticating: false }));
        toast.success('Connexion réussie');
      } else {
        throw new Error('Identifiants invalides');
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuth(prev => ({ 
        ...prev, 
        isAuthenticating: false, 
        error: error instanceof Error ? error.message : 'Erreur de connexion' 
      }));
    }
  };
  
  // Save all settings
  const saveSettings = async () => {
    if (!auth.isAuthenticated) return;
    
    setIsSaving(true);
    try {
      await updateAdminConfig(auth.email, auth.password, settings);
      toast.success('Configuration enregistrée');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Toggle force close
  const handleToggleForceClose = () => {
    setSettings(prev => {
      const updated = { ...prev, forceClose: !prev.forceClose };
      saveAdminSettings(updated);
      return updated;
    });
    
    toast.success(settings.forceClose ? 
      'Restaurant réouvert' : 
      'Restaurant temporairement fermé'
    );
  };
  
  // Add special closing date
  const handleAddSpecialClosing = () => {
    if (!selectedDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }
    
    setSettings(prev => {
      const newClosing: SpecialClosing = { 
        date: selectedDate,
        reason: specialClosingReason || undefined
      };
      
      // Check if date already exists
      if (prev.specialClosings.some(sc => sc.date === selectedDate)) {
        toast.error('Cette date est déjà dans la liste des fermetures exceptionnelles');
        return prev;
      }
      
      const updated = {
        ...prev,
        specialClosings: [...prev.specialClosings, newClosing].sort((a, b) => a.date.localeCompare(b.date))
      };
      
      saveAdminSettings(updated);
      return updated;
    });
    
    toast.success(`Fermeture exceptionnelle ajoutée pour le ${formatDate(selectedDate)}`);
    setSelectedDate('');
    setSpecialClosingReason('');
  };
  
  // Remove special closing date
  const handleRemoveSpecialClosing = (date: string) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        specialClosings: prev.specialClosings.filter(sc => sc.date !== date)
      };
      
      saveAdminSettings(updated);
      return updated;
    });
    
    toast.success(`Fermeture exceptionnelle supprimée pour le ${formatDate(date)}`);
  };
  
  // Update business hours
  const handleUpdateHours = (
    period: 'weekdays' | 'sunday',
    mealTime: 'lunch' | 'dinner' | null,
    field: 'opening' | 'closing',
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 24) return;
    
    setSettings(prev => {
      const updated = { ...prev };
      
      if (period === 'weekdays' && mealTime) {
        updated.businessHours.weekdays[mealTime][field] = numValue;
      } else if (period === 'sunday') {
        updated.businessHours.sunday[field] = numValue;
      }
      
      saveAdminSettings(updated);
      return updated;
    });
  };
  
  // Toggle closed day
  const handleToggleClosedDay = (day: number) => {
    setSettings(prev => {
      const closedDays = [...prev.businessHours.closedDays];
      
      if (closedDays.includes(day)) {
        // Remove day from closed days
        const updated = {
          ...prev,
          businessHours: {
            ...prev.businessHours,
            closedDays: closedDays.filter(d => d !== day)
          }
        };
        saveAdminSettings(updated);
        return updated;
      } else {
        // Add day to closed days
        const updated = {
          ...prev,
          businessHours: {
            ...prev.businessHours,
            closedDays: [...closedDays, day].sort()
          }
        };
        saveAdminSettings(updated);
        return updated;
      }
    });
  };
  
  // Update order timing settings
  const handleUpdateOrderTiming = (field: 'preorderMinutes' | 'lastOrderMinutes', value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 120) return;
    
    setSettings(prev => {
      const updated = { ...prev, [field]: numValue };
      saveAdminSettings(updated);
      return updated;
    });
  };
  
  // Get day name
  const getDayName = (day: number): string => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[day];
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
  
  // Admin dashboard
  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-amber-900">Panneau d'Administration</h2>
        <div className="flex space-x-2">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="text-sm bg-green-600 text-white px-4 py-1 rounded-md hover:bg-green-700"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            onClick={() => setAuth({ ...auth, isAuthenticated: false })}
            className="text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300"
          >
            Déconnexion
          </button>
        </div>
      </div>
      
      {/* Status and Quick Controls */}
      <section className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="text-xl font-semibold text-amber-900 mb-4">État du Restaurant</h3>
        
        <div className="flex items-center justify-between mb-6 p-3 border-b border-amber-200">
          <div>
            <h4 className="font-medium">Fermeture temporaire</h4>
            <p className="text-sm text-gray-600">Fermer complètement le restaurant jusqu'à réouverture manuelle</p>
          </div>
          <div className="flex items-center">
            <button 
              onClick={handleToggleForceClose}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${settings.forceClose ? 'bg-red-600' : 'bg-green-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.forceClose ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="ml-2 font-medium">
              {settings.forceClose ? 'Fermé' : 'Ouvert'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3">
          <div>
            <h4 className="font-medium">Statut actuel</h4>
            <p className="text-sm text-gray-600">
              {settings.forceClose ? 
                'Le restaurant est temporairement fermé' : 
                'Le restaurant suit les horaires définis ci-dessous'}
            </p>
          </div>
          <div>
            <span className={`px-3 py-1 rounded-full text-white ${settings.forceClose ? 'bg-red-600' : 'bg-green-600'}`}>
              {settings.forceClose ? 'Fermé' : 'Ouvert'}
            </span>
          </div>
        </div>
      </section>
      
      {/* Special Closings */}
      <section className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="text-xl font-semibold text-amber-900 mb-4">Fermetures Exceptionnelles</h3>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de fermeture
            </label>
            <input
              type="date"
              min={todayString}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raison (optionnel)
            </label>
            <input
              type="text"
              value={specialClosingReason}
              onChange={(e) => setSpecialClosingReason(e.target.value)}
              placeholder="Ex: Jour férié, Vacances annuelles..."
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="flex justify-end mb-6">
          <button
            onClick={handleAddSpecialClosing}
            className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600"
          >
            Ajouter une fermeture
          </button>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Dates de fermeture programmées</h4>
          
          {settings.specialClosings.length === 0 ? (
            <p className="text-sm italic text-gray-500">Aucune fermeture exceptionnelle programmée</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto p-2">
              {settings.specialClosings.map(closing => (
                <div 
                  key={closing.date}
                  className="flex justify-between items-center bg-white p-3 rounded-md border border-gray-200"
                >
                  <div>
                    <span className="font-medium">{formatDate(closing.date)}</span>
                    {closing.reason && (
                      <p className="text-sm text-gray-600">{closing.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveSpecialClosing(closing.date)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Business Hours */}
      <section className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="text-xl font-semibold text-amber-900 mb-4">Horaires d'Ouverture</h3>
        
        {/* Weekday hours */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Horaires du Mardi au Samedi</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Déjeuner - Ouverture (ex: 12)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                step="1"
                value={settings.businessHours.weekdays.lunch.opening}
                onChange={(e) => handleUpdateHours('weekdays', 'lunch', 'opening', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Déjeuner - Fermeture (ex: 14)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                step="1"
                value={settings.businessHours.weekdays.lunch.closing}
                onChange={(e) => handleUpdateHours('weekdays', 'lunch', 'closing', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dîner - Ouverture (ex: 19)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                step="1"
                value={settings.businessHours.weekdays.dinner.opening}
                onChange={(e) => handleUpdateHours('weekdays', 'dinner', 'opening', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dîner - Fermeture (ex: 21)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                step="1"
                value={settings.businessHours.weekdays.dinner.closing}
                onChange={(e) => handleUpdateHours('weekdays', 'dinner', 'closing', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Sunday hours */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Horaires du Dimanche</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ouverture (ex: 12)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                step="1"
                value={settings.businessHours.sunday.opening}
                onChange={(e) => handleUpdateHours('sunday', null, 'opening', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fermeture (ex: 21)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                step="1"
                value={settings.businessHours.sunday.closing}
                onChange={(e) => handleUpdateHours('sunday', null, 'closing', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Closed days */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Jours de Fermeture</h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <div 
                key={day}
                onClick={() => handleToggleClosedDay(day)}
                className={`p-2 border rounded-md cursor-pointer text-center transition-colors ${
                  settings.businessHours.closedDays.includes(day) 
                    ? 'bg-red-100 border-red-300 text-red-800' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getDayName(day)}
                <div className="text-xs mt-1">
                  {settings.businessHours.closedDays.includes(day) 
                    ? 'Fermé' 
                    : 'Ouvert'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Order timing settings */}
        <div>
          <h4 className="font-medium mb-3">Paramètres de Commande</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commande possible avant ouverture (minutes)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                step="5"
                value={settings.preorderMinutes}
                onChange={(e) => handleUpdateOrderTiming('preorderMinutes', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Les clients peuvent commander {settings.preorderMinutes} min avant l'ouverture
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arrêt des commandes avant fermeture (minutes)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                step="5"
                value={settings.lastOrderMinutes}
                onChange={(e) => handleUpdateOrderTiming('lastOrderMinutes', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Les commandes s'arrêtent {settings.lastOrderMinutes} min avant la fermeture
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Info Section */}
      <section className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-xl font-semibold text-blue-900 mb-3">Informations</h3>
        
        <div className="space-y-2 text-sm">
          {(settings as any).cachedData && (
            <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800">
              <p>⚠️ Vous visualisez des données mises en cache. Le serveur ne répond pas.</p>
            </div>
          )}
          
          <p>
            <strong>Dernière mise à jour:</strong> {' '}
            {new Date(settings.lastUpdated).toLocaleString('fr-FR', {
              timeZone: 'Europe/Paris',
              dateStyle: 'long',
              timeStyle: 'medium'
            })}
          </p>
          <p>
            <strong>Par:</strong> {settings.updatedBy}
          </p>
        </div>
      </section>
      
      {/* Bottom bar with save button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end">
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
      
      {/* Footer spacing to account for fixed bottom bar */}
      <div className="h-16" />
    </div>
  );
}