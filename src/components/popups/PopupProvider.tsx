import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PopupConfig {
  title: string;
  message: string;
  type: 'warning' | 'confirmation' | 'info' | 'error' | 'success';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface PopupContextType {
  showPopup: (config: PopupConfig) => void;
  hidePopup: () => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};

interface PopupProviderProps {
  children: ReactNode;
}

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
  const [popup, setPopup] = useState<PopupConfig | null>(null);

  const showPopup = (config: PopupConfig) => {
    setPopup(config);
  };

  const hidePopup = () => {
    setPopup(null);
  };

  React.useEffect(() => {
    if (!popup) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        hidePopup();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [popup]);

  const handleConfirm = () => {
    popup?.onConfirm?.();
    hidePopup();
  };

  const handleCancel = () => {
    popup?.onCancel?.();
    hidePopup();
  };

  const getIcon = () => {
    switch (popup?.type) {
      case 'warning':
        return (
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <PopupContext.Provider value={{ showPopup, hidePopup }}>
      {children}
      {popup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                {getIcon()}
                <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">{popup.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{popup.message}</p>
              </div>
              <div className="flex gap-3 justify-center">
                {popup.type === 'confirmation' ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2.5 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      {popup.cancelText || 'Cancel'}
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {popup.confirmText || 'Confirm'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={hidePopup}
                    autoFocus
                    className={`px-8 py-2.5 text-white rounded-lg transition-colors font-medium ${
                      popup.type === 'warning' 
                        ? 'bg-orange-500 hover:bg-orange-600' 
                        : popup.type === 'error'
                        ? 'bg-red-500 hover:bg-red-600'
                        : popup.type === 'success'
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Got it
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
};