import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { OrderOption } from '../types';
import { orderOptions } from '../data/options';

interface ProductOptionsModalProps {
  productId: string;
  selectedOptions: OrderOption[];
  onAddOption: (option: OrderOption) => void;
  onRemoveOption: (optionId: string) => void;
}

export default function ProductOptionsModal({
  productId,
  selectedOptions,
  onAddOption,
  onRemoveOption
}: ProductOptionsModalProps) {
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
    <div>
      {/* Tabs */}
      <div className="flex border-b-2 border-gray-200 mb-4 overflow-x-auto pb-1">
        {Object.keys(orderOptions).map((category) => (
          <button
            key={category}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
              activeTab === category 
                ? 'text-amber-600 border-b-2 border-amber-600' 
                : 'text-gray-500 hover:text-gray-700'
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
            onClick={() => handleOptionToggle(option)}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
              isOptionSelected(option.id) 
                ? 'bg-amber-50 border border-amber-300' 
                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex-1">
              <p className="font-medium">{option.name}</p>
              <p className="text-sm text-gray-600">{option.price.toFixed(2)}€</p>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isOptionSelected(option.id) 
                ? 'bg-amber-500 text-white' 
                : 'bg-white border border-gray-300'
            }`}>
              {isOptionSelected(option.id) && <Check size={14} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}