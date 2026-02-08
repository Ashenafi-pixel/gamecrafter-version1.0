import React, { useState } from 'react';
import { ChevronRight, ChevronDown, X, Eye, EyeOff, Lock, Unlock } from 'lucide-react';

export interface PropertyGroup {
  id: string;
  title: string;
  properties: PropertyItem[];
}

export type PropertyItem = 
  | { type: 'number'; id: string; label: string; value: number; min?: number; max?: number; step?: number; onChange: (value: number) => void }
  | { type: 'text'; id: string; label: string; value: string; onChange: (value: string) => void }
  | { type: 'color'; id: string; label: string; value: string; onChange: (value: string) => void }
  | { type: 'select'; id: string; label: string; value: string; options: {value: string; label: string}[]; onChange: (value: string) => void }
  | { type: 'boolean'; id: string; label: string; value: boolean; onChange: (value: boolean) => void }
  | { type: 'button'; id: string; label: string; onClick: () => void }
  | { type: 'spacer'; id: string };

export interface PropertyPanelProps {
  title: string;
  groups: PropertyGroup[];
  onClose?: () => void;
  className?: string;
}

/**
 * Property Panel Component
 * 
 * Displays and allows editing of properties for the selected element in the game canvas.
 * Properties are organized into collapsible groups for better organization.
 */
const PropertyPanel: React.FC<PropertyPanelProps> = ({ 
  title, 
  groups,
  onClose,
  className = '' 
}) => {
  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map(group => [group.id, true]))
  );
  
  // Toggle a group's expanded state
  const toggleGroup = (groupId: string) => {
    setExpandedGroups({
      ...expandedGroups,
      [groupId]: !expandedGroups[groupId]
    });
  };
  
  // Render a specific property input based on its type
  const renderPropertyInput = (property: PropertyItem) => {
    switch (property.type) {
      case 'number':
        return (
          <div className="flex flex-col gap-1" key={property.id}>
            <div className="flex justify-between">
              <label className="text-xs text-gray-400">{property.label}</label>
              <input
                type="number"
                value={property.value}
                min={property.min}
                max={property.max}
                step={property.step || 1}
                onChange={(e) => property.onChange(parseFloat(e.target.value))}
                className="w-20 text-xs px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <input
              type="range"
              value={property.value}
              min={property.min}
              max={property.max}
              step={property.step || 1}
              onChange={(e) => property.onChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        );
        
      case 'text':
        return (
          <div className="flex flex-col gap-1" key={property.id}>
            <label className="text-xs text-gray-400">{property.label}</label>
            <input
              type="text"
              value={property.value}
              onChange={(e) => property.onChange(e.target.value)}
              className="w-full text-xs px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        );
        
      case 'color':
        return (
          <div className="flex justify-between items-center" key={property.id}>
            <label className="text-xs text-gray-400">{property.label}</label>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border border-gray-700" 
                style={{ backgroundColor: property.value }}
              ></div>
              <input
                type="color"
                value={property.value}
                onChange={(e) => property.onChange(e.target.value)}
                className="w-14 h-6 bg-gray-800 border border-gray-700 rounded cursor-pointer"
              />
            </div>
          </div>
        );
        
      case 'select':
        return (
          <div className="flex flex-col gap-1" key={property.id}>
            <label className="text-xs text-gray-400">{property.label}</label>
            <select
              value={property.value}
              onChange={(e) => property.onChange(e.target.value)}
              className="w-full text-xs px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              {property.options.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        );
        
      case 'boolean':
        return (
          <div className="flex justify-between items-center" key={property.id}>
            <label className="text-xs text-gray-400">{property.label}</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={property.value}
                onChange={(e) => property.onChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-red-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        );
        
      case 'button':
        return (
          <button
            key={property.id}
            onClick={property.onClick}
            className="w-full text-xs text-center px-2 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white transition-colors"
          >
            {property.label}
          </button>
        );
        
      case 'spacer':
        return <div key={property.id} className="h-2"></div>;
        
      default:
        return null;
    }
  };
  
  return (
    <div className={`flex flex-col bg-gray-900 border border-gray-800 rounded-md overflow-hidden ${className}`}>
      {/* Panel header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-3 py-2 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Property groups */}
      <div className="flex-1 overflow-y-auto">
        {groups.map(group => (
          <div key={group.id} className="border-b border-gray-800 last:border-b-0">
            {/* Group header */}
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-left hover:bg-gray-800 transition-colors"
              onClick={() => toggleGroup(group.id)}
            >
              <span className="text-xs font-medium text-gray-300">{group.title}</span>
              {expandedGroups[group.id] ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            {/* Group properties */}
            {expandedGroups[group.id] && (
              <div className="px-3 py-2 space-y-3 bg-gray-900">
                {group.properties.map(property => renderPropertyInput(property))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyPanel;