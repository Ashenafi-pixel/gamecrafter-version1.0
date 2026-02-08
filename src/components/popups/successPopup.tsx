import React from 'react';
import { usePopup } from './PopupProvider';

interface SuccessPopupProps {
  title: string;
  message: string;
  onClose?: () => void;
}

export const SuccessPopup: React.FC<SuccessPopupProps> = ({
  title,
  message,
  onClose,
}) => {
  const { showPopup } = usePopup();

  React.useEffect(() => {
    showPopup({
      type: 'success',
      title,
      message,
      onConfirm: onClose,
    });
  }, [title, message, onClose, showPopup]);

  return null;
};

// Hook for easy success popup usage
export const useSuccessPopup = () => {
  const { showPopup } = usePopup();

  const showSuccess = (
    title: string,
    message: string,
    onClose?: () => void
  ) => {
    showPopup({
      type: 'success',
      title,
      message,
      onConfirm: onClose,
    });
  };

  return { showSuccess };
};