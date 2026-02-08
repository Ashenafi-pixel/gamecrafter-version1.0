import React from 'react';
import { usePopup } from './PopupProvider';

interface WarningPopupProps {
  title: string;
  message: string;
  onClose?: () => void;
}

export const WarningPopup: React.FC<WarningPopupProps> = ({ title, message, onClose }) => {
  const { showPopup } = usePopup();

  React.useEffect(() => {
    showPopup({
      type: 'warning',
      title,
      message,
      onCancel: onClose,
    });
  }, [title, message, onClose, showPopup]);

  return null;
};

// Hook for easy warning popup usage
export const useWarningPopup = () => {
  const { showPopup } = usePopup();

  const showWarning = (title: string, message: string, onClose?: () => void) => {
    showPopup({
      type: 'warning',
      title,
      message,
      onCancel: onClose,
    });
  };

  return { showWarning };
};