import React from 'react';

interface ClosedModalProps {
  message?: string;
}

export default function ClosedModal({ message }: ClosedModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-50 bg-opacity-95 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center border-4 border-amber-400">
        {/* Closed sign - like a hanging shop sign */}
        <div className="mb-6 relative">
          <div className="bg-amber-400 text-amber-900 px-6 py-3 rounded-lg inline-block transform -rotate-2 shadow-md">
            <span className="text-2xl font-bold">FERMÉ</span>
          </div>
        </div>
        
        {/* Main message */}
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          Nous sommes temporairement fermés
        </h2>
        
        {/* Custom message if provided */}
        {message && (
          <p className="text-lg text-gray-600 mb-6">
            {message}
          </p>
        )}
        
        {/* Business hours */}
        <div className="mt-4 p-4 bg-amber-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Horaires habituels:</span><br />
            Mar-Sam: 11h-14h30 / 18h-22h • Dim: 11h-21h
          </p>
        </div>
        
        {/* Contact - smaller, less prominent */}
        <div className="mt-4 text-sm text-gray-500">
          📞 06 68 85 18 03
        </div>
      </div>
    </div>
  );
}