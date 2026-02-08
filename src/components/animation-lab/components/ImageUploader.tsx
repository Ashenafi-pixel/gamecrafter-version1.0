/**
 * Image Uploader Component
 * Handles image upload and sprite detection for Simple Mode
 */

import React, { useState, useCallback, useRef } from 'react';
import { professionalSpriteAtlas } from '../../../utils/professionalSpriteAtlas';

interface ImageUploaderProps {
  onImageUploaded: (result: any) => void;
  isProcessing: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUploaded, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File) => {
    try {
      setUploadProgress(10);
      
      // Create image URL
      const imageUrl = URL.createObjectURL(file);
      setUploadProgress(30);

      // Load image to get dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      setUploadProgress(50);

      // Create atlas with pixel-perfect detection
      const atlasResult = await professionalSpriteAtlas.createAtlasWithPixelPerfectBounds(
        imageUrl,
        {
          alphaThreshold: 50,
          minSpriteSize: 100,
          maxSprites: 15,
          mergeDistance: 3,
          useGPTLabeling: false
        }
      );

      setUploadProgress(90);

      if (atlasResult.success) {
        console.log('🎯 Sprite detection complete:', atlasResult);
        onImageUploaded(atlasResult);
        setUploadProgress(100);
        
        // Reset progress after success
        setTimeout(() => setUploadProgress(0), 1000);
      } else {
        throw new Error(atlasResult.error || 'Failed to process image');
      }

    } catch (error) {
      console.error('❌ Image processing failed:', error);
      setUploadProgress(0);
      // Show error to user
      alert('Failed to process image. Please try a different image.');
    }
  }, [onImageUploaded]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    processImage(file);
  }, [processImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
      />

      {/* Upload area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? '#3b82f6' : '#cbd5e1'}`,
          borderRadius: '12px',
          padding: '32px',
          background: isDragging ? '#dbeafe' : '#f8fafc',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Progress bar */}
        {uploadProgress > 0 && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '4px',
            width: `${uploadProgress}%`,
            background: 'linear-gradient(90deg, #3b82f6, #10b981)',
            transition: 'width 0.3s ease',
            borderRadius: '2px'
          }} />
        )}

        {uploadProgress > 0 ? (
          // Processing state
          <div>
            <div style={{
              fontSize: '32px',
              marginBottom: '12px',
              animation: 'spin 2s linear infinite'
            }}>
              🎯
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#3b82f6',
              marginBottom: '4px'
            }}>
              Analyzing Sprites... {uploadProgress}%
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              AI is detecting and classifying your sprites
            </div>
          </div>
        ) : (
          // Upload state
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {isDragging ? '📥' : '🖼️'}
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              {isDragging ? 'Drop Image Here' : 'Upload Sprite Image'}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '16px'
            }}>
              Drag & drop or click to browse • PNG, JPG, WebP supported
            </div>
            
            {/* Sample formats */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              <span>✅ Sprite Sheets</span>
              <span>✅ Symbol Images</span>
              <span>✅ Game Assets</span>
            </div>
          </div>
        )}
      </div>

      {/* Style for spinning animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImageUploader;