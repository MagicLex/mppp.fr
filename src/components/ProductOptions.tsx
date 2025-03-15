import React, { useState, useEffect } from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { OrderOption } from '../types';
// Choose which service to use:
// import { getOptionsByType, getOptionTypes } from '../services/menuService'; // JSON version
import { getOptionsByType, getOptionTypes } from '../services/csvMenuService'; // CSV version

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
  const [options, setOptions] = useState<Record<string, OrderOption[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load option categories and options
    const loadOptions = async () => {
      try {
        // Get all option types/categories
        const optionTypes = await getOptionTypes();
        setCategories(optionTypes);
        
        // If we have categories, set the first one as active
        if (optionTypes.length > 0) {
          setActiveTab(optionTypes[0]);
        }
        
        // Load options for each category
        const optionsData: Record<string, OrderOption[]> = {};
        for (const category of optionTypes) {
          optionsData[category] = await getOptionsByType(category);
        }
        
        setOptions(optionsData);
      } catch (error) {
        console.error('Error loading options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadOptions();
  }, []);
  
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
      {loading ? (
        <div className="py-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mx-auto"></div>
        </div>
      ) : (
        <div className="flex border-b-4 border-black mb-4 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 font-cartoon text-sm whitespace-nowrap ${
                activeTab === category 
                  ? 'bg-amber-400 text-white border-4 border-b-0 border-black rounded-t-xl' 
                  : 'bg-white text-gray-700'
              }`}
              onClick={() => setActiveTab(category)}
            >
              {category === 'drinks' ? 'Boissons' : 
               category === 'sauces' ? 'Sauces' : 
               category === 'sides' ? 'Accompagnements' : 
               category === 'desserts' ? 'Desserts' :
               category}
            </button>
          ))}
        </div>
      )}
      
      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-3 rounded-xl border-2 border-gray-200 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))
        ) : options[activeTab]?.map((option) => (
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
              {option.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{option.description}</p>
              )}
              <p className="text-sm text-gray-600 mt-1">{option.price.toFixed(2)}€</p>
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