import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

interface PopupProps {
  message: string;
  type: 'success' | 'warning';
  onClose: () => void;
  duration?: number;
}

const Popup: React.FC<PopupProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }`}>
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className={`ml-2 p-1 rounded-full hover:bg-opacity-20 ${
          type === 'success' ? 'hover:bg-green-600' : 'hover:bg-yellow-600'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Popup;