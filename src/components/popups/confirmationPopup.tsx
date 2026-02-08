import React from 'react';
import { usePopup } from './PopupProvider';

interface ConfirmationPopupProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) => {
  const { showPopup } = usePopup();

  React.useEffect(() => {
    showPopup({
      type: 'confirmation',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
    });
  }, [title, message, confirmText, cancelText, onConfirm, onCancel, showPopup]);

  return null;
};

// Hook for easy confirmation popup usage
export const useConfirmationPopup = () => {
  const { showPopup } = usePopup();

  const showConfirmation = (
    title: string,
    message: string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      onConfirm?: () => void;
      onCancel?: () => void;
    }
  ) => {
    showPopup({
      type: 'confirmation',
      title,
      message,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      onConfirm: options?.onConfirm,
      onCancel: options?.onCancel,
    });
  };

  return { showConfirmation };
};