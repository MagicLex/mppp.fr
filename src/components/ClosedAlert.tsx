import React from 'react';
import { X } from 'lucide-react';

interface ClosedAlertProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function ClosedAlert({ isOpen, onClose, message }: ClosedAlertProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-bounce-once">
        {/* Alert header with warning color */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚫</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Restaurant fermé</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Alert message */}
        <div className="space-y-3">
          <p className="text-gray-700">
            {message || "Le restaurant vient de fermer. Les commandes ne sont plus acceptées pour le moment."}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Horaires habituels:</strong><br />
              Mar-Sam: 11h-14h30 / 18h-22h<br />
              Dimanche: 11h-21h
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 px-4 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-xl transition-colors"
        >
          J'ai compris
        </button>
      </div>
    </div>
  );
}