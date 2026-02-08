import React, { useRef } from 'react';
import { Upload, Loader } from 'lucide-react';

interface FileUploadButtonProps {
  onFileSelected: (file: File) => void;
  isUploading?: boolean;
  buttonText?: string;
  className?: string;
  acceptTypes?: string;
  small?: boolean;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelected,
  isUploading = false,
  buttonText = 'Upload',
  className = '',
  acceptTypes = 'image/*',
  small = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Only accept specified file types
    if (!file.type.match(acceptTypes.replace(/\*/g, '.*'))) {
      alert(`Please select a valid file (${acceptTypes.replace('/*', '') || 'image'} files only)`);
      return;
    }
    
    // Pass the file to parent component
    onFileSelected(file);
    
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <button
        onClick={triggerFileInput}
        disabled={isUploading}
        className={`${small ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} flex items-center justify-center gap-1 rounded transition-colors ${
          isUploading
            ? 'bg-gray-200 text-gray-500 cursor-wait'
            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
        } ${className}`}
        type="button"
      >
        {isUploading ? (
          <>
            <Loader className={`${small ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Upload className={`${small ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span>{buttonText}</span>
          </>
        )}
      </button>
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={acceptTypes}
        onChange={handleFileChange}
      />
    </>
  );
};

export default FileUploadButton;