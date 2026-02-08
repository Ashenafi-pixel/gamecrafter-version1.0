/**
 * Symbol Composition & Animation Studio
 * Interactive canvas for positioning, layering, and animating sprite assets
 * Professional slot game symbol creation with full user control
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { ProfessionalAtlasResult } from '../../../utils/professionalSpriteAtlas';
import { gsap } from 'gsap';
import AnimationSelectionModal from './AnimationSelectionModal';

interface CompositionAsset {
  id: string;
  name: string;
  frameData: any;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  zIndex: number;
  visible: boolean;
  animation: string;
  type: 'text' | 'character' | 'object' | 'effect';
}

interface SymbolComposition {
  id: string;
  name: string;
  assets: CompositionAsset[];
  canvasSize: { width: number; height: number };
  createdAt: string;
}

interface SymbolCompositionStudioProps {
  atlasResult: ProfessionalAtlasResult;
  onSaveComposition?: (composition: SymbolComposition) => void;
  onExportAnimation?: (composition: SymbolComposition) => void;
}

const SymbolCompositionStudio: React.FC<SymbolCompositionStudioProps> = ({
  atlasResult,
  onSaveComposition,
  onExportAnimation
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedAtlasImage, setLoadedAtlasImage] = useState<HTMLImageElement | null>(null);
  const [compositionAssets, setCompositionAssets] = useState<CompositionAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [compositionName, setCompositionName] = useState('My Symbol');
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [animatingAsset, setAnimatingAsset] = useState<string | null>(null);
  const [isSelectionBoxActive, setIsSelectionBoxActive] = useState(false);
  const [selectionBox, setSelectionBox] = useState({ startX: 0, startY: 0, endX: 0, endY: 0 });
  const animationFrameRef = useRef<number>();

  // Canvas dimensions - reduced for realistic symbol size
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 300;

  // Load atlas image
  useEffect(() => {
    if (!atlasResult.success) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedAtlasImage(img);
      initializeComposition();
    };
    img.src = atlasResult.atlasImageUrl;
  }, [atlasResult]);

  // Initialize composition with all sprites
  const initializeComposition = useCallback(() => {
    const assets: CompositionAsset[] = [];
    let textIndex = 0;
    let characterIndex = 0;
    let objectIndex = 0;

    Object.entries(atlasResult.atlasMetadata.frames).forEach(([spriteName, frameData]) => {
      const asset: CompositionAsset = {
        id: `asset_${spriteName}_${Date.now()}`,
        name: spriteName,
        frameData: frameData.frame,
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        zIndex: 1,
        visible: true,
        animation: 'none',
        type: 'object' // Default type
      };

      // Categorize and position assets intelligently
      if (spriteName.length === 1 || /^[a-z](_\d+)?$/i.test(spriteName)) {
        // Text letters
        asset.type = 'text';
        asset.position = { 
          x: 30 + (textIndex * 35), 
          y: 80 
        };
        asset.scale = 0.25; // Scale down letters significantly for realistic size
        asset.zIndex = 10; // Text in front
        asset.animation = 'bouncy_wave';
        textIndex++;
      } else if (spriteName.includes('dog') || spriteName.includes('character')) {
        // Main character
        asset.type = 'character';
        asset.position = { 
          x: CANVAS_WIDTH / 2 - 20, 
          y: CANVAS_HEIGHT / 2 + 30 
        };
        asset.scale = 0.2; // Scale down character for realistic size
        asset.zIndex = 5; // Character middle layer
        asset.animation = 'idle_breathing';
        characterIndex++;
      } else {
        // Objects and effects
        asset.type = spriteName.includes('bone') ? 'object' : 'effect';
        asset.position = { 
          x: 60 + (objectIndex * 60), 
          y: CANVAS_HEIGHT / 2 + 80 
        };
        asset.scale = 0.15; // Scale down objects/effects for realistic size
        asset.zIndex = spriteName.includes('bone') ? 6 : 2; // Objects front, effects back
        asset.animation = spriteName.includes('bone') ? 'bounce' : 'glow_pulse';
        objectIndex++;
      }

      assets.push(asset);
    });

    // Sort by zIndex for proper layering
    assets.sort((a, b) => a.zIndex - b.zIndex);
    setCompositionAssets(assets);
    console.log(`🎭 Initialized composition with ${assets.length} assets`);
  }, [atlasResult]);

  // Render composition to canvas
  const renderComposition = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedAtlasImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable smooth high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear canvas with dark background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid for positioning reference
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw assets in z-index order
    const sortedAssets = [...compositionAssets]
      .filter(asset => asset.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    sortedAssets.forEach((asset) => {
      ctx.save();

      // Apply transforms
      ctx.translate(asset.position.x, asset.position.y);
      ctx.rotate(asset.rotation * Math.PI / 180);
      ctx.scale(asset.scale, asset.scale);

      // Draw sprite from atlas
      const frame = asset.frameData;
      if (frame) {
        ctx.drawImage(
          loadedAtlasImage,
          frame.x, frame.y, frame.w, frame.h,
          -frame.w / 2, -frame.h / 2, frame.w, frame.h
        );
      }

      // Draw selection border if selected (single or multi-selection)
      const isSelected = selectedAsset === asset.id || selectedAssets.includes(asset.id);
      const isMultiSelected = selectedAssets.includes(asset.id);
      
      if (isSelected) {
        ctx.strokeStyle = isMultiSelected ? '#ff6b00' : '#00ff00'; // Orange for multi-select, green for single
        ctx.lineWidth = isMultiSelected ? 4 : 3;
        ctx.strokeRect(
          -frame.w / 2 - 5, -frame.h / 2 - 5,
          frame.w + 10, frame.h + 10
        );
        
        // Draw corner handles
        const handleSize = isMultiSelected ? 10 : 8;
        ctx.fillStyle = isMultiSelected ? '#ff6b00' : '#00ff00';
        ctx.fillRect(-frame.w / 2 - handleSize/2, -frame.h / 2 - handleSize/2, handleSize, handleSize);
        ctx.fillRect(frame.w / 2 - handleSize/2, -frame.h / 2 - handleSize/2, handleSize, handleSize);
        ctx.fillRect(-frame.w / 2 - handleSize/2, frame.h / 2 - handleSize/2, handleSize, handleSize);
        ctx.fillRect(frame.w / 2 - handleSize/2, frame.h / 2 - handleSize/2, handleSize, handleSize);
      }

      ctx.restore();
    });

    // Draw selection box if active
    if (isSelectionBoxActive) {
      ctx.strokeStyle = '#0080ff';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.strokeRect(
        selectionBox.startX, 
        selectionBox.startY, 
        selectionBox.endX - selectionBox.startX, 
        selectionBox.endY - selectionBox.startY
      );
      ctx.setLineDash([]);
    }

    // Draw info overlay
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    const selectedCount = selectedAssets.length > 0 ? selectedAssets.length : (selectedAsset ? 1 : 0);
    ctx.fillText(`Assets: ${sortedAssets.length} | Selected: ${selectedCount}`, 10, 20);
    ctx.fillText(`Canvas: ${canvas.width}x${canvas.height}`, 10, 35);
  }, [compositionAssets, selectedAsset, selectedAssets, loadedAtlasImage, isSelectionBoxActive, selectionBox]);

  // Start render loop
  useEffect(() => {
    const animate = () => {
      renderComposition();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderComposition]);

  // Mouse event handlers for drag & drop with multi-selection support
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    console.log(`🖱️ Mouse down at canvas coordinates: (${x.toFixed(1)}, ${y.toFixed(1)})`);

    const isCtrlKey = event.ctrlKey || event.metaKey;
    const isShiftKey = event.shiftKey;

    // Find clicked asset (reverse z-order for top-most selection)
    const sortedAssets = [...compositionAssets]
      .filter(asset => asset.visible)
      .sort((a, b) => b.zIndex - a.zIndex);

    let foundAsset = null;
    for (const asset of sortedAssets) {
      const frame = asset.frameData;
      if (!frame) continue;

      // Account for asset scale in hit detection
      const scaledWidth = frame.w * asset.scale;
      const scaledHeight = frame.h * asset.scale;
      
      const assetLeft = asset.position.x - scaledWidth / 2;
      const assetRight = asset.position.x + scaledWidth / 2;
      const assetTop = asset.position.y - scaledHeight / 2;
      const assetBottom = asset.position.y + scaledHeight / 2;

      if (x >= assetLeft && x <= assetRight && y >= assetTop && y <= assetBottom) {
        foundAsset = asset;
        break;
      }
    }

    if (foundAsset) {
      console.log(`✅ Found asset: ${foundAsset.name}`);
      
      if (isCtrlKey) {
        // Multi-selection with Ctrl+click
        if (selectedAssets.includes(foundAsset.id)) {
          // Remove from selection
          setSelectedAssets(prev => prev.filter(id => id !== foundAsset.id));
          if (selectedAsset === foundAsset.id) {
            setSelectedAsset(null);
          }
        } else {
          // Add to selection
          setSelectedAssets(prev => [...prev, foundAsset.id]);
          setSelectedAsset(foundAsset.id);
        }
      } else if (isShiftKey && selectedAsset) {
        // Select range (all text letters between selected and clicked)
        const currentIndex = compositionAssets.findIndex(a => a.id === selectedAsset);
        const clickedIndex = compositionAssets.findIndex(a => a.id === foundAsset.id);
        
        if (currentIndex >= 0 && clickedIndex >= 0) {
          const startIndex = Math.min(currentIndex, clickedIndex);
          const endIndex = Math.max(currentIndex, clickedIndex);
          const rangeAssets = compositionAssets
            .slice(startIndex, endIndex + 1)
            .filter(asset => asset.type === 'text') // Only select text letters in range
            .map(asset => asset.id);
          
          setSelectedAssets(rangeAssets);
        }
      } else {
        // Single selection
        if (selectedAssets.includes(foundAsset.id)) {
          // Already selected in multi-selection, start dragging all
          setIsDragging(true);
        } else {
          // Clear multi-selection and select single asset
          setSelectedAssets([]);
          setSelectedAsset(foundAsset.id);
          setIsDragging(true);
        }
      }
      
      setDragOffset({
        x: x - foundAsset.position.x,
        y: y - foundAsset.position.y
      });
    } else {
      // No asset found - start selection box or clear selection
      if (!isCtrlKey) {
        setSelectedAsset(null);
        setSelectedAssets([]);
      }
      
      // Start selection box
      setIsSelectionBoxActive(true);
      setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
    }
  }, [compositionAssets, selectedAsset, selectedAssets]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    if (isSelectionBoxActive) {
      // Update selection box
      setSelectionBox(prev => ({ ...prev, endX: x, endY: y }));
      
      // Find assets within selection box
      const boxLeft = Math.min(selectionBox.startX, x);
      const boxRight = Math.max(selectionBox.startX, x);
      const boxTop = Math.min(selectionBox.startY, y);
      const boxBottom = Math.max(selectionBox.startY, y);
      
      const assetsInBox = compositionAssets.filter(asset => {
        if (!asset.visible) return false;
        
        const frame = asset.frameData;
        if (!frame) return false;
        
        const scaledWidth = frame.w * asset.scale;
        const scaledHeight = frame.h * asset.scale;
        const assetLeft = asset.position.x - scaledWidth / 2;
        const assetRight = asset.position.x + scaledWidth / 2;
        const assetTop = asset.position.y - scaledHeight / 2;
        const assetBottom = asset.position.y + scaledHeight / 2;
        
        return assetLeft >= boxLeft && assetRight <= boxRight && 
               assetTop >= boxTop && assetBottom <= boxBottom;
      });
      
      setSelectedAssets(assetsInBox.map(asset => asset.id));
    } else if (isDragging && (selectedAsset || selectedAssets.length > 0)) {
      // Dragging assets
      const deltaX = x - dragOffset.x;
      const deltaY = y - dragOffset.y;
      
      // Calculate movement delta from current positions
      const moveX = deltaX - (selectedAsset ? 
        compositionAssets.find(a => a.id === selectedAsset)?.position.x || 0 : 0);
      const moveY = deltaY - (selectedAsset ? 
        compositionAssets.find(a => a.id === selectedAsset)?.position.y || 0 : 0);

      // Move all selected assets
      const assetsToMove = selectedAssets.length > 0 ? selectedAssets : 
                         (selectedAsset ? [selectedAsset] : []);
      
      setCompositionAssets(prev => prev.map(asset => {
        if (assetsToMove.includes(asset.id)) {
          const newX = Math.max(0, Math.min(canvas.width, deltaX));
          const newY = Math.max(0, Math.min(canvas.height, deltaY));
          
          return {
            ...asset,
            position: { x: newX, y: newY }
          };
        }
        return asset;
      }));
    }
  }, [isDragging, selectedAsset, selectedAssets, dragOffset, isSelectionBoxActive, selectionBox.startX, selectionBox.startY, compositionAssets]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      console.log(`✅ Finished dragging asset(s)`);
    }
    if (isSelectionBoxActive) {
      console.log(`✅ Finished selection box with ${selectedAssets.length} assets selected`);
    }
    setIsDragging(false);
    setIsSelectionBoxActive(false);
  }, [isDragging, isSelectionBoxActive, selectedAssets.length]);

  // Asset control functions
  const updateAssetProperty = useCallback((assetId: string, property: keyof CompositionAsset, value: any) => {
    setCompositionAssets(prev => prev.map(asset => 
      asset.id === assetId 
        ? { ...asset, [property]: value }
        : asset
    ));
  }, []);

  // Update multiple assets at once (for group operations)
  const updateMultipleAssets = useCallback((assetIds: string[], property: keyof CompositionAsset, value: any) => {
    setCompositionAssets(prev => prev.map(asset => 
      assetIds.includes(asset.id)
        ? { ...asset, [property]: value }
        : asset
    ));
  }, []);

  // Scale multiple assets by a factor (relative scaling)
  const scaleMultipleAssets = useCallback((assetIds: string[], scaleFactor: number) => {
    setCompositionAssets(prev => prev.map(asset => 
      assetIds.includes(asset.id)
        ? { ...asset, scale: Math.max(0.05, Math.min(0.8, asset.scale * scaleFactor)) }
        : asset
    ));
  }, []);

  // Set absolute scale for multiple assets
  const setMultipleAssetsScale = useCallback((assetIds: string[], scale: number) => {
    setCompositionAssets(prev => prev.map(asset => 
      assetIds.includes(asset.id)
        ? { ...asset, scale: Math.max(0.05, Math.min(0.8, scale)) }
        : asset
    ));
  }, []);

  // Keyboard shortcuts for scaling and fine positioning (supports multi-selection)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Get active assets (multi-selection takes priority)
      const activeAssets = selectedAssets.length > 0 ? selectedAssets : 
                          (selectedAsset ? [selectedAsset] : []);
      
      if (activeAssets.length === 0) return;

      let handled = true;
      const step = event.shiftKey ? 10 : 1; // Larger steps with Shift

      switch (event.key) {
        case 'ArrowUp':
          activeAssets.forEach(assetId => {
            const asset = compositionAssets.find(a => a.id === assetId);
            if (asset) {
              updateAssetProperty(assetId, 'position', {
                ...asset.position,
                y: Math.max(0, asset.position.y - step)
              });
            }
          });
          break;
        case 'ArrowDown':
          activeAssets.forEach(assetId => {
            const asset = compositionAssets.find(a => a.id === assetId);
            if (asset) {
              updateAssetProperty(assetId, 'position', {
                ...asset.position,
                y: Math.min(CANVAS_HEIGHT, asset.position.y + step)
              });
            }
          });
          break;
        case 'ArrowLeft':
          activeAssets.forEach(assetId => {
            const asset = compositionAssets.find(a => a.id === assetId);
            if (asset) {
              updateAssetProperty(assetId, 'position', {
                ...asset.position,
                x: Math.max(0, asset.position.x - step)
              });
            }
          });
          break;
        case 'ArrowRight':
          activeAssets.forEach(assetId => {
            const asset = compositionAssets.find(a => a.id === assetId);
            if (asset) {
              updateAssetProperty(assetId, 'position', {
                ...asset.position,
                x: Math.min(CANVAS_WIDTH, asset.position.x + step)
              });
            }
          });
          break;
        case '+':
        case '=':
          scaleMultipleAssets(activeAssets, 1.1); // Scale up by 10%
          break;
        case '-':
          scaleMultipleAssets(activeAssets, 0.9); // Scale down by 10%
          break;
        case 'Delete':
        case 'Backspace':
          updateMultipleAssets(activeAssets, 'visible', false);
          break;
        case 'r':
        case 'R':
          activeAssets.forEach(assetId => {
            const asset = compositionAssets.find(a => a.id === assetId);
            if (asset) {
              updateAssetProperty(assetId, 'rotation', asset.rotation + (event.shiftKey ? -15 : 15));
            }
          });
          break;
        case 'a':
        case 'A':
          if (event.ctrlKey || event.metaKey) {
            // Select all assets
            const allAssetIds = compositionAssets.filter(a => a.visible).map(a => a.id);
            setSelectedAssets(allAssetIds);
            setSelectedAsset(null);
          } else {
            handled = false;
          }
          break;
        case 'Escape':
          // Clear all selections
          setSelectedAsset(null);
          setSelectedAssets([]);
          break;
        default:
          handled = false;
      }

      if (handled) {
        event.preventDefault();
        console.log(`⌨️ Keyboard shortcut: ${event.key} (${activeAssets.length} assets)`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAsset, selectedAssets, compositionAssets, updateAssetProperty, updateMultipleAssets, scaleMultipleAssets]);

  const moveAssetLayer = useCallback((assetId: string, direction: 'up' | 'down') => {
    setCompositionAssets(prev => {
      const asset = prev.find(a => a.id === assetId);
      if (!asset) return prev;

      const newZIndex = direction === 'up' ? asset.zIndex + 1 : asset.zIndex - 1;
      return prev.map(a => 
        a.id === assetId 
          ? { ...a, zIndex: Math.max(1, Math.min(20, newZIndex)) }
          : a
      );
    });
  }, []);

  // Animation functions
  const playCompositionAnimation = useCallback(() => {
    if (isPlaying) return;

    setIsPlaying(true);
    console.log('🎬 Playing composition animation...');

    compositionAssets.forEach((asset, index) => {
      if (!asset.visible || asset.animation === 'none') return;

      // Find the actual DOM element or create animation object
      const animationData = {
        x: asset.position.x,
        y: asset.position.y,
        scale: asset.scale,
        rotation: asset.rotation
      };

      switch (asset.animation) {
        case 'bouncy_wave':
          gsap.fromTo(animationData, {
            y: asset.position.y + 50,
            scale: 0.5
          }, {
            y: asset.position.y,
            scale: asset.scale,
            duration: 0.8,
            delay: index * 0.1,
            ease: "back.out(1.7)",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'position', { x: animationData.x, y: animationData.y });
              updateAssetProperty(asset.id, 'scale', animationData.scale);
            }
          });
          break;

        case 'idle_breathing':
          gsap.to(animationData, {
            scale: asset.scale * 1.05,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "power2.inOut",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'scale', animationData.scale);
            }
          });
          break;

        case 'bounce':
          gsap.to(animationData, {
            y: asset.position.y - 20,
            duration: 0.6,
            yoyo: true,
            repeat: -1,
            ease: "power2.inOut",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'position', { x: animationData.x, y: animationData.y });
            }
          });
          break;

        case 'scale_pulse':
          gsap.to(animationData, {
            scale: asset.scale * 1.2,
            duration: 0.6,
            delay: index * 0.15,
            yoyo: true,
            repeat: 2,
            ease: "power2.inOut",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'scale', animationData.scale);
            }
          });
          break;

        case 'typewriter':
          gsap.fromTo(animationData, {
            scale: 0,
            rotation: 0
          }, {
            scale: asset.scale,
            duration: 0.3,
            delay: index * 0.2,
            ease: "back.out(1.7)",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'scale', animationData.scale);
              updateAssetProperty(asset.id, 'rotation', animationData.rotation);
            }
          });
          break;

        case 'elastic_bounce':
          gsap.fromTo(animationData, {
            y: asset.position.y - 100,
            scale: 0.8
          }, {
            y: asset.position.y,
            scale: asset.scale,
            duration: 1.2,
            delay: index * 0.1,
            ease: "elastic.out(1, 0.5)",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'position', { x: animationData.x, y: animationData.y });
              updateAssetProperty(asset.id, 'scale', animationData.scale);
            }
          });
          break;

        case 'rotation_wave':
          gsap.to(animationData, {
            rotation: asset.rotation + 360,
            duration: 1.0,
            delay: index * 0.1,
            ease: "power2.inOut",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'rotation', animationData.rotation);
            }
          });
          break;

        case 'glow_reveal':
          gsap.fromTo(animationData, {
            scale: 0.5,
            rotation: -180
          }, {
            scale: asset.scale,
            rotation: 0,
            duration: 1.0,
            delay: index * 0.15,
            ease: "power2.out",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'scale', animationData.scale);
              updateAssetProperty(asset.id, 'rotation', animationData.rotation);
            }
          });
          break;

        case 'excited_jump':
          gsap.to(animationData, {
            y: asset.position.y - 40,
            duration: 0.4,
            yoyo: true,
            repeat: 3,
            ease: "power2.inOut",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'position', { x: animationData.x, y: animationData.y });
            }
          });
          break;

        case 'tail_wag':
          gsap.to(animationData, {
            rotation: asset.rotation + 30,
            duration: 0.3,
            yoyo: true,
            repeat: 5,
            ease: "power2.inOut",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'rotation', animationData.rotation);
            }
          });
          break;

        case 'head_shake':
          gsap.to(animationData, {
            x: asset.position.x + 10,
            duration: 0.1,
            yoyo: true,
            repeat: 6,
            ease: "power2.inOut",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'position', { x: animationData.x, y: animationData.y });
            }
          });
          break;

        case 'victory_pose':
          gsap.to(animationData, {
            scale: asset.scale * 1.3,
            rotation: asset.rotation + 15,
            duration: 0.8,
            yoyo: true,
            repeat: 1,
            ease: "back.out(1.7)",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'scale', animationData.scale);
              updateAssetProperty(asset.id, 'rotation', animationData.rotation);
            }
          });
          break;

        case 'float':
          gsap.to(animationData, {
            y: asset.position.y - 15,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "power2.inOut",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'position', { x: animationData.x, y: animationData.y });
            }
          });
          break;

        case 'spin':
          gsap.to(animationData, {
            rotation: asset.rotation + 360,
            duration: 2,
            repeat: -1,
            ease: "none",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'rotation', animationData.rotation);
            }
          });
          break;

        case 'wobble':
          gsap.to(animationData, {
            x: asset.position.x + 5,
            scale: asset.scale * 0.95,
            duration: 0.2,
            yoyo: true,
            repeat: 8,
            ease: "power2.inOut",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'position', { x: animationData.x, y: animationData.y });
              updateAssetProperty(asset.id, 'scale', animationData.scale);
            }
          });
          break;

        case 'orbit':
          const radius = 50;
          gsap.to(animationData, {
            motionPath: {
              path: `M${asset.position.x},${asset.position.y} A${radius},${radius} 0 1,1 ${asset.position.x},${asset.position.y + 0.1}`,
              autoRotate: true
            },
            duration: 3,
            repeat: -1,
            ease: "none",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'position', { x: animationData.x, y: animationData.y });
              updateAssetProperty(asset.id, 'rotation', animationData.rotation);
            }
          });
          break;

        case 'glow_pulse':
          gsap.to(animationData, {
            scale: asset.scale * 1.1,
            duration: 1.5,
            yoyo: true,
            repeat: -1,
            ease: "power2.inOut",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'scale', animationData.scale);
            }
          });
          break;

        case 'particle_burst':
          gsap.fromTo(animationData, {
            scale: 0.1,
            rotation: 0
          }, {
            scale: asset.scale * 1.5,
            rotation: 720,
            duration: 0.8,
            ease: "power2.out",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'scale', animationData.scale);
              updateAssetProperty(asset.id, 'rotation', animationData.rotation);
            },
            onComplete: () => {
              gsap.to(animationData, {
                scale: asset.scale,
                rotation: 0,
                duration: 0.5,
                ease: "power2.inOut",
                onUpdate: () => {
                  updateAssetProperty(asset.id, 'scale', animationData.scale);
                  updateAssetProperty(asset.id, 'rotation', animationData.rotation);
                }
              });
            }
          });
          break;

        case 'fade_shimmer':
          gsap.fromTo(animationData, {
            scale: 0.8
          }, {
            scale: asset.scale * 1.1,
            duration: 1.0,
            yoyo: true,
            repeat: 2,
            ease: "power2.inOut",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'scale', animationData.scale);
            }
          });
          break;

        case 'smoke_drift':
          gsap.to(animationData, {
            y: asset.position.y - 30,
            scale: asset.scale * 0.8,
            duration: 3,
            ease: "power2.out",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'position', { x: animationData.x, y: animationData.y });
              updateAssetProperty(asset.id, 'scale', animationData.scale);
            }
          });
          break;

        case 'energy_field':
          gsap.to(animationData, {
            scale: asset.scale * 1.2,
            rotation: asset.rotation + 180,
            duration: 0.3,
            yoyo: true,
            repeat: 6,
            ease: "power2.inOut",
            onUpdate: () => {
              updateAssetProperty(asset.id, 'scale', animationData.scale);
              updateAssetProperty(asset.id, 'rotation', animationData.rotation);
            }
          });
          break;
      }
    });

    setTimeout(() => {
      setIsPlaying(false);
      // Kill all GSAP animations
      compositionAssets.forEach(asset => {
        gsap.killTweensOf({ x: asset.position.x, y: asset.position.y, scale: asset.scale, rotation: asset.rotation });
      });
    }, 6000);
  }, [compositionAssets, isPlaying, updateAssetProperty]);

  // Save composition
  const saveComposition = useCallback(() => {
    const composition: SymbolComposition = {
      id: `composition_${Date.now()}`,
      name: compositionName,
      assets: compositionAssets,
      canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      createdAt: new Date().toISOString()
    };

    if (onSaveComposition) {
      onSaveComposition(composition);
    }

    // Save to localStorage
    const savedCompositions = JSON.parse(localStorage.getItem('symbol_compositions') || '[]');
    savedCompositions.push(composition);
    localStorage.setItem('symbol_compositions', JSON.stringify(savedCompositions));

    console.log(`💾 Saved composition: ${composition.name}`);
  }, [compositionName, compositionAssets, onSaveComposition]);

  // Open animation selection modal
  const openAnimationModal = useCallback((assetId: string) => {
    setAnimatingAsset(assetId);
    setShowAnimationModal(true);
  }, []);

  // Apply animation configuration to asset
  const applyAnimationConfig = useCallback((config: any) => {
    if (!animatingAsset) return;

    setCompositionAssets(prev => prev.map(asset => 
      asset.id === animatingAsset 
        ? { ...asset, animation: config.name }
        : asset
    ));

    console.log(`🎨 Applied animation "${config.name}" to asset ${animatingAsset}`);
  }, [animatingAsset]);

  const selectedAssetData = compositionAssets.find(asset => asset.id === selectedAsset);
  const animatingAssetData = compositionAssets.find(asset => asset.id === animatingAsset);

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#ffffff', 
      borderRadius: '12px', 
      border: '2px solid #e5e7eb',
      display: 'flex',
      gap: '24px'
    }}>
      {/* Left Column: Composition Canvas */}
      <div style={{ flex: '2' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
            🎭 Symbol Composition Studio
          </h3>
          <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
            Drag assets to position • Ctrl+click multi-select • Shift+click range select • +/- to scale group
          </p>
        </div>

        {/* Canvas */}
        <div style={{ 
          border: '2px solid #d1d5db', 
          borderRadius: '8px', 
          overflow: 'hidden',
          backgroundColor: '#1a1a1a',
          position: 'relative'
        }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              cursor: isDragging ? 'grabbing' : selectedAsset ? 'grab' : 'crosshair',
              userSelect: 'none',
              imageRendering: 'auto'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* Canvas Controls */}
        <div style={{ 
          marginTop: '16px', 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'center' 
        }}>
          <input
            type="text"
            value={compositionName}
            onChange={(e) => setCompositionName(e.target.value)}
            placeholder="Symbol name"
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              flex: '1'
            }}
          />
          
          <button
            onClick={playCompositionAnimation}
            disabled={isPlaying}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: isPlaying ? '#9ca3af' : '#8b5cf6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: isPlaying ? 'not-allowed' : 'pointer'
            }}
          >
            {isPlaying ? '⏳ Playing...' : '▶️ Play Animation'}
          </button>

          <button
            onClick={saveComposition}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            💾 Save Composition
          </button>
        </div>
      </div>

      {/* Right Column: Asset Management Panel */}
      <div style={{ flex: '1', minWidth: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            🎨 Asset Manager
          </h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                const letterAssets = compositionAssets.filter(a => a.type === 'text' && a.visible).map(a => a.id);
                setSelectedAssets(letterAssets);
                setSelectedAsset(null);
              }}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📝 Select Letters
            </button>
            <button
              onClick={() => {
                const allAssets = compositionAssets.filter(a => a.visible).map(a => a.id);
                setSelectedAssets(allAssets);
                setSelectedAsset(null);
              }}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🎯 Select All
            </button>
          </div>
        </div>

        {/* Selected Asset(s) Controls */}
        {(selectedAssetData || selectedAssets.length > 0) && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '16px', 
            border: '2px solid #10b981', 
            borderRadius: '8px',
            backgroundColor: '#f0fdf4'
          }}>
            <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
              {selectedAssets.length > 0 ? 
                `🎯 Multi-Selection: ${selectedAssets.length} assets` :
                `🎯 Selected: ${selectedAssetData?.name}`
              }
            </h5>
            
            <div style={{ fontSize: '11px', color: '#059669', marginBottom: '12px', fontStyle: 'italic' }}>
              {selectedAssets.length > 0 ? 
                '💡 Tip: Ctrl+click to add/remove • Shift+click to select range • Ctrl+A to select all' :
                '💡 Tip: Use arrow keys to move, +/- to scale, R to rotate, Del to hide'
              }
            </div>
            
            {selectedAssets.length > 0 ? (
              // Multi-selection controls
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setMultipleAssetsScale(selectedAssets, 0.1)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔍➖ Tiny
                  </button>
                  
                  <button
                    onClick={() => setMultipleAssetsScale(selectedAssets, 0.25)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔍 Normal
                  </button>
                  
                  <button
                    onClick={() => setMultipleAssetsScale(selectedAssets, 0.4)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔍➕ Large
                  </button>
                  
                  <button
                    onClick={() => scaleMultipleAssets(selectedAssets, 1.1)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ⬆️ Scale Up
                  </button>
                  
                  <button
                    onClick={() => scaleMultipleAssets(selectedAssets, 0.9)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ⬇️ Scale Down
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => updateMultipleAssets(selectedAssets, 'visible', false)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    👁️‍🗨️ Hide All
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedAssets([]);
                      setSelectedAsset(null);
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Clear Selection
                  </button>
                </div>
              </div>
            ) : (
              // Single selection controls
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <label>
                  X Position:
                  <input
                    type="number"
                    value={Math.round(selectedAssetData?.position.x || 0)}
                    onChange={(e) => selectedAssetData && updateAssetProperty(selectedAsset!, 'position', {
                      ...selectedAssetData.position,
                      x: parseInt(e.target.value) || 0
                    })}
                    style={{ width: '100%', padding: '4px', marginTop: '2px' }}
                  />
                </label>
                
                <label>
                  Y Position:
                  <input
                    type="number"
                    value={Math.round(selectedAssetData?.position.y || 0)}
                    onChange={(e) => selectedAssetData && updateAssetProperty(selectedAsset!, 'position', {
                      ...selectedAssetData.position,
                      y: parseInt(e.target.value) || 0
                    })}
                    style={{ width: '100%', padding: '4px', marginTop: '2px' }}
                  />
                </label>
                
                <label>
                  Scale:
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={selectedAssetData?.scale || 0.25}
                    onChange={(e) => selectedAssetData && updateAssetProperty(selectedAsset!, 'scale', parseFloat(e.target.value))}
                    style={{ width: '100%', marginTop: '2px' }}
                  />
                  <span>{((selectedAssetData?.scale || 0.25) * 100).toFixed(0)}%</span>
                </label>
                
                <label>
                  Z-Index:
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={selectedAssetData?.zIndex || 1}
                    onChange={(e) => selectedAssetData && updateAssetProperty(selectedAsset!, 'zIndex', parseInt(e.target.value) || 1)}
                    style={{ width: '100%', padding: '4px', marginTop: '2px' }}
                  />
                </label>
              </div>
            )}

            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => moveAssetLayer(selectedAsset!, 'up')}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ⬆️ Bring Forward
              </button>
              
              <button
                onClick={() => moveAssetLayer(selectedAsset!, 'down')}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ⬇️ Send Back
              </button>
              
              <button
                onClick={() => updateAssetProperty(selectedAsset!, 'scale', Math.max(0.05, selectedAssetData.scale - 0.05))}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔍➖ Smaller
              </button>
              
              <button
                onClick={() => updateAssetProperty(selectedAsset!, 'scale', Math.min(0.8, selectedAssetData.scale + 0.05))}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔍➕ Bigger
              </button>
            </div>
          </div>
        )}

        {/* Asset List */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {compositionAssets
            .sort((a, b) => b.zIndex - a.zIndex)
            .map((asset) => (
              <div
                key={asset.id}
                onClick={(e) => {
                  const isCtrlKey = e.ctrlKey || e.metaKey;
                  
                  if (isCtrlKey) {
                    // Multi-selection with Ctrl+click
                    if (selectedAssets.includes(asset.id)) {
                      setSelectedAssets(prev => prev.filter(id => id !== asset.id));
                      if (selectedAsset === asset.id) setSelectedAsset(null);
                    } else {
                      setSelectedAssets(prev => [...prev, asset.id]);
                      setSelectedAsset(asset.id);
                    }
                  } else {
                    // Single selection
                    setSelectedAsset(asset.id);
                    setSelectedAssets([]);
                  }
                }}
                style={{
                  padding: '12px',
                  margin: '8px 0',
                  border: selectedAssets.includes(asset.id) ? '2px solid #ff6b00' : 
                         (selectedAsset === asset.id ? '2px solid #10b981' : '1px solid #d1d5db'),
                  borderRadius: '8px',
                  backgroundColor: selectedAssets.includes(asset.id) ? '#fff7ed' : 
                                  (selectedAsset === asset.id ? '#f0fdf4' : '#f9fafb'),
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{asset.name}</strong>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {asset.type} • Z: {asset.zIndex} • {asset.animation}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAnimationModal(asset.id);
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Select Animation"
                    >
                      🎨
                    </button>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={asset.visible}
                        onChange={(e) => updateAssetProperty(asset.id, 'visible', e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      👁️
                    </label>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Animation Selection Modal */}
      {animatingAssetData && (
        <AnimationSelectionModal
          isOpen={showAnimationModal}
          assetName={animatingAssetData.name}
          assetType={animatingAssetData.type}
          currentAnimation={animatingAssetData.animation}
          onClose={() => {
            setShowAnimationModal(false);
            setAnimatingAsset(null);
          }}
          onApply={applyAnimationConfig}
        />
      )}
    </div>
  );
};

export default SymbolCompositionStudio;