import React from 'react';

interface ClosedModalProps {
  message?: string;
}

export default function ClosedModal({ message }: ClosedModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 text-center">
        {/* Closed sign icon */}
        <div className="mb-6">
          <svg className="w-24 h-24 mx-auto text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        
        {/* Main message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Désolé, nous sommes fermés
        </h1>
        
        {/* Custom message if provided */}
        {message && (
          <p className="text-lg text-gray-600 mb-6">
            {message}
          </p>
        )}
        
        {/* Contact information */}
        <div className="border-t pt-6 mt-6">
          <p className="text-sm text-gray-500 mb-2">Pour nous contacter:</p>
          <p className="text-base font-medium text-gray-700">
            📞 09 82 31 66 11<br />
            ✉️ contact@mppp.fr
          </p>
        </div>
        
        {/* Business hours */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Horaires habituels:</p>
          <p className="text-xs text-gray-600">
            Mardi-Samedi: 11h-14h30 / 18h-22h<br />
            Dimanche: 11h-21h<br />
            Fermé le lundi
          </p>
        </div>
      </div>
    </div>
  );
}