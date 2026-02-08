import React from 'react';
import { useWarningPopup, useConfirmationPopup, usePopup } from './index';

// Example component showing how to use the popup system
export const PopupExamples: React.FC = () => {
  const { showWarning } = useWarningPopup();
  const { showConfirmation } = useConfirmationPopup();
  const { showPopup } = usePopup();

  const handleWarningExample = () => {
    showWarning(
      'Warning',
      'This action cannot be undone. Please make sure you want to proceed.',
      () => console.log('Warning dismissed')
    );
  };

  const handleConfirmationExample = () => {
    showConfirmation(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      {
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: () => console.log('Item deleted'),
        onCancel: () => console.log('Deletion cancelled'),
      }
    );
  };

  const handleErrorExample = () => {
    showPopup({
      type: 'error',
      title: 'Error',
      message: 'Something went wrong. Please try again later.',
    });
  };

  const handleInfoExample = () => {
    showPopup({
      type: 'info',
      title: 'Information',
      message: 'Your changes have been saved successfully.',
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold mb-4">Popup Examples</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleWarningExample}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Show Warning
        </button>
        
        <button
          onClick={handleConfirmationExample}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Show Confirmation
        </button>
        
        <button
          onClick={handleErrorExample}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Show Error
        </button>
        
        <button
          onClick={handleInfoExample}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Show Info
        </button>
      </div>
    </div>
  );
};