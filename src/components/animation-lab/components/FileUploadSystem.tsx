import React, { useRef, useState, useCallback } from 'react';
import { AssetManager } from '../core/AssetManager';

interface FileUploadSystemProps {
  assetManager: AssetManager;
  onAssetLoaded: (assetId: string, metadata: any) => void;
  onError: (error: string) => void;
  acceptedFormats?: string[];
  maxFileSize?: number; // in MB
  multiple?: boolean;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export const FileUploadSystem: React.FC<FileUploadSystemProps> = ({
  assetManager,
  onAssetLoaded,
  onError,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  maxFileSize = 10, // 10MB default
  multiple = true
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());

  /**
   * Validate file before processing
   */
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Unsupported file format: ${file.type}. Supported formats: ${acceptedFormats.join(', ')}`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size: ${maxFileSize}MB`;
    }

    return null;
  }, [acceptedFormats, maxFileSize]);

  /**
   * Process uploaded files
   */
  const processFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const fileId = `${Date.now()}_${file.name}`;
      
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        onError(validationError);
        continue;
      }

      // Initialize upload progress
      setUploadProgress(prev => new Map(prev).set(fileId, {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      }));

      try {
        // Update progress to processing
        setUploadProgress(prev => new Map(prev).set(fileId, {
          fileName: file.name,
          progress: 50,
          status: 'processing'
        }));

        // Generate unique asset ID
        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Load asset through AssetManager
        const texture = await assetManager.loadImageAsset(assetId, file, file.name);
        
        // Get metadata
        const metadata = assetManager.getMetadata(assetId);
        
        // Update progress to complete
        setUploadProgress(prev => new Map(prev).set(fileId, {
          fileName: file.name,
          progress: 100,
          status: 'complete'
        }));

        // Notify parent component
        onAssetLoaded(assetId, metadata);

        // Remove from progress after delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newMap = new Map(prev);
            newMap.delete(fileId);
            return newMap;
          });
        }, 2000);

      } catch (error) {
        // Update progress to error
        setUploadProgress(prev => new Map(prev).set(fileId, {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }));

        onError(`Failed to load ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [assetManager, onAssetLoaded, onError, validateFile]);

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drag over to false if leaving the drop zone entirely
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (rect) {
      const isOutside = 
        e.clientX < rect.left || 
        e.clientX > rect.right || 
        e.clientY < rect.top || 
        e.clientY > rect.bottom;
      
      if (isOutside) {
        setIsDragOver(false);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    
    // Reset input value to allow same file to be selected again
    e.target.value = '';
  }, [processFiles]);

  /**
   * Open file dialog
   */
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Format file size for display
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className="file-upload-system">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        style={{
          border: `2px dashed ${isDragOver ? '#007bff' : '#ccc'}`,
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragOver ? '#f8f9fa' : '#ffffff',
          transition: 'all 0.3s ease',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div className="upload-icon" style={{ fontSize: '48px', color: '#6c757d', marginBottom: '16px' }}>
          📁
        </div>
        
        <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
          {isDragOver ? 'Drop files here' : 'Upload Image Assets'}
        </h3>
        
        <p style={{ margin: '0 0 16px 0', color: '#6c757d' }}>
          Drag and drop your images here, or click to browse
        </p>
        
        <div style={{ fontSize: '14px', color: '#6c757d' }}>
          <p>Supported formats: {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')}</p>
          <p>Maximum file size: {maxFileSize}MB</p>
        </div>
      </div>

      {/* Upload progress */}
      {uploadProgress.size > 0 && (
        <div className="upload-progress" style={{ marginTop: '20px' }}>
          <h4 style={{ margin: '0 0 16px 0' }}>Upload Progress</h4>
          
          {Array.from(uploadProgress.entries()).map(([fileId, progress]) => (
            <div key={fileId} className="progress-item" style={{ 
              marginBottom: '12px',
              padding: '12px',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontWeight: 'bold' }}>{progress.fileName}</span>
                <span style={{ 
                  color: progress.status === 'error' ? '#dc3545' : 
                         progress.status === 'complete' ? '#28a745' : '#007bff',
                  textTransform: 'capitalize'
                }}>
                  {progress.status}
                </span>
              </div>
              
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: '#e9ecef', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${progress.progress}%`, 
                  height: '100%', 
                  backgroundColor: progress.status === 'error' ? '#dc3545' : 
                                   progress.status === 'complete' ? '#28a745' : '#007bff',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              
              {progress.error && (
                <div style={{ 
                  marginTop: '8px', 
                  color: '#dc3545', 
                  fontSize: '14px'
                }}>
                  Error: {progress.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadSystem;