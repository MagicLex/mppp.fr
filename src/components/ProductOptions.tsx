import React, { useState } from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { OrderOption } from '../types';
import { orderOptions } from '../data/options';

interface ProductOptionsProps {
  onAddOption: (option: OrderOption) => void;
  onRemoveOption: (optionId: string) => void;
  selectedOptions: OrderOption[];
}

export default function ProductOptions({ 
  onAddOption, 
  onRemoveOption, 
  selectedOptions 
}: ProductOptionsProps) {
  const [activeTab, setActiveTab] = useState<string>('drinks');
  
  const isOptionSelected = (optionId: string) => {
    return selectedOptions.some(option => option.id === optionId);
  };
  
  const handleOptionToggle = (option: OrderOption) => {
    if (isOptionSelected(option.id)) {
      onRemoveOption(option.id);
    } else {
      onAddOption(option);
    }
  };

  return (
    <div className="mt-4">
      <h4 className="font-cartoon text-lg text-amber-900 mb-2">Ajouter des options</h4>
      
      {/* Tabs */}
      <div className="flex border-b-4 border-black mb-4">
        {Object.keys(orderOptions).map((category) => (
          <button
            key={category}
            className={`px-4 py-2 font-cartoon text-sm ${
              activeTab === category 
                ? 'bg-amber-400 text-white border-4 border-b-0 border-black rounded-t-xl' 
                : 'bg-white text-gray-700'
            }`}
            onClick={() => setActiveTab(category)}
          >
            {category === 'drinks' ? 'Boissons' : 
             category === 'sauces' ? 'Sauces' : 
             category === 'sides' ? 'Accompagnements' : 
             category}
          </button>
        ))}
      </div>
      
      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {orderOptions[activeTab]?.map((option) => (
          <div 
            key={option.id}
            className={`flex items-center justify-between p-3 rounded-xl border-2 ${
              isOptionSelected(option.id) 
                ? 'border-amber-500 bg-amber-50' 
                : 'border-gray-200'
            }`}
          >
            <div className="flex-1">
              <p className="font-medium">{option.name}</p>
              <p className="text-sm text-gray-600">{option.price.toFixed(2)}€</p>
            </div>
            <button
              onClick={() => handleOptionToggle(option)}
              className={`p-2 rounded-full ${
                isOptionSelected(option.id)
                  ? 'bg-amber-400 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isOptionSelected(option.id) ? (
                <Check size={18} />
              ) : (
                <Plus size={18} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}