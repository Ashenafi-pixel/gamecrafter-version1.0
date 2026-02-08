import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Download, Copy, Upload, Settings } from 'lucide-react';
import PixiAnimatedSymbol from '../visual-journey/steps-working/pixiSpriteSheet';

interface SpriteSheetGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GeneratedSprite {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  config: {
    symbolType: string;
    contentType: string;
    animationComplexity: string;
    gridCols?: number;
    gridRows?: number;
  };
}

interface GridAdjustmentModalProps {
  sprite: GeneratedSprite;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedSprite: GeneratedSprite) => void;
}

const GridAdjustmentModal: React.FC<GridAdjustmentModalProps> = ({
  sprite,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [gridCols, setGridCols] = useState(sprite.config.gridCols || 5);
  const [gridRows, setGridRows] = useState(sprite.config.gridRows || 5);

  const handleUpdate = () => {
    const updatedSprite: GeneratedSprite = {
      ...sprite,
      prompt: `${sprite.prompt.split(' (')[0]} (${gridCols}×${gridRows} grid)`,
      config: {
        ...sprite.config,
        gridCols,
        gridRows
      }
    };
    onUpdate(updatedSprite);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl shadow-2xl w-full max-w-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Adjust Grid Layout</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden mx-auto mb-2">
                  <PixiAnimatedSymbol
                    imageUrl={sprite.url}
                    width={128}
                    height={128}
                    animationSpeed={0.1}
                    gridCols={gridCols}
                    gridRows={gridRows}
                  />
                </div>
                <p className="text-sm text-gray-600">Preview with {gridCols}×{gridRows} grid</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Columns
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={gridCols}
                    onChange={(e) => setGridCols(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rows
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={gridRows}
                    onChange={(e) => setGridRows(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Total frames:</strong> {gridCols * gridRows}<br/>
                  <strong>Frame size:</strong> ~{Math.round(256/gridCols)}×{Math.round(256/gridRows)}px
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const SpriteSheetGeneratorModal: React.FC<SpriteSheetGeneratorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [generatedSprites, setGeneratedSprites] = useState<GeneratedSprite[]>([]);
  const [selectedSprite, setSelectedSprite] = useState<GeneratedSprite | null>(null);
  const [gridAdjustmentSprite, setGridAdjustmentSprite] = useState<GeneratedSprite | null>(null);
  const [uploadLayoutType, setUploadLayoutType] = useState<'single-row' | '5x5'>('single-row');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSpriteGenerated = (spriteUrl: string) => {
    const newSprite: GeneratedSprite = {
      id: `sprite_${Date.now()}`,
      url: spriteUrl,
      prompt: 'AI Generated Sprite', // This could be enhanced to capture the actual prompt
      timestamp: Date.now(),
      config: {
        symbolType: 'block',
        contentType: 'symbol-only',
        animationComplexity: 'medium'
      }
    };
    
    setGeneratedSprites(prev => [newSprite, ...prev]);
    setSelectedSprite(newSprite);
    console.log('✅ New sprite generated and added to collection:', newSprite);
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
      console.log('📋 Sprite URL copied to clipboard');
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDownload = (sprite: GeneratedSprite) => {
    const link = document.createElement('a');
    link.href = sprite.url;
    link.download = `animated_sprite_${sprite.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;

        // Detect sprite sheet dimensions to determine grid layout
        const img = new Image();
        img.onload = () => {
          const { width, height } = img;
          const aspectRatio = width / height;

          // Use user-selected layout type - simplified to just two options
          let gridCols = 5, gridRows = 5;
          let layoutDescription = '';

          if (uploadLayoutType === 'single-row') {
            // Single row layout
            gridRows = 1;

            // For single row, calculate columns based on assuming square frames
            // Frame width should approximately equal the image height
            gridCols = Math.max(1, Math.round(width / height));

            // Additional validation for very wide images
            if (aspectRatio > 50) {
              // For extremely wide images, limit frame size to minimum 16px
              gridCols = Math.floor(width / 16);
            }

            // Sanity check: limit to reasonable number of frames (1-100)
            gridCols = Math.min(100, Math.max(1, gridCols));

            layoutDescription = `Single row: ${gridCols} frames (${Math.round(width/gridCols)}×${height}px per frame)`;
            console.log(`🎬 Single row selected: ${width}×${height} → ${gridCols} frames in 1 row`);
            console.log(`📐 Frame dimensions: ${Math.round(width/gridCols)}×${height}px per frame`);
          } else {
            // 5x5 grid layout
            gridCols = 5;
            gridRows = 5;
            layoutDescription = '5×5 grid: 25 frames';
            console.log(`🎬 5×5 grid selected: ${width}×${height} → 5×5 grid (${Math.round(width/5)}×${Math.round(height/5)}px per frame)`);
          }

          const newSprite: GeneratedSprite = {
            id: `uploaded_${Date.now()}`,
            url: imageUrl,
            prompt: `Uploaded: ${file.name} (${layoutDescription})`,
            timestamp: Date.now(),
            config: {
              symbolType: 'uploaded',
              contentType: 'image',
              animationComplexity: 'medium',
              gridCols,
              gridRows
            }
          };

          setGeneratedSprites(prev => [newSprite, ...prev]);
          setSelectedSprite(newSprite);
          console.log('📁 Image uploaded with improved grid detection:', newSprite);
          console.log(`📐 Final grid settings: ${gridCols} cols × ${gridRows} rows = ${gridCols * gridRows} total frames`);
        };

        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeSprite = (id: string) => {
    setGeneratedSprites(prev => prev.filter(sprite => sprite.id !== id));
    if (selectedSprite?.id === id) {
      setSelectedSprite(null);
    }
  };

  const updateSpriteGrid = (updatedSprite: GeneratedSprite) => {
    setGeneratedSprites(prev =>
      prev.map(sprite => sprite.id === updatedSprite.id ? updatedSprite : sprite)
    );
    if (selectedSprite?.id === updatedSprite.id) {
      setSelectedSprite(updatedSprite);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">🎬 Animation Symbol Generator</h2>
                <p className="text-sm text-gray-600">Create AI-powered animated sprite sheets for your game</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex h-[calc(90vh-120px)]">
            {/* Left Panel - Generator */}
            <div className="flex-1 p-6 border-r border-gray-200 overflow-y-auto">
              <div className="max-w-md mx-auto space-y-2">
                <div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border-2 border-dashed border-gray-300">
                  <h3 className="text-lg font-semibold text-center">Generate New Sprite</h3>
                    <PixiAnimatedSymbol
                      enableGeneration={true}
                      onSpriteGenerated={handleSpriteGenerated}
                      width={300}
                      height={300}
                      animationSpeed={0.15}
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-4">or</div>

                  {/* Layout Selection */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">🎯 Select Your Sprite Sheet Layout:</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <input
                          type="radio"
                          name="layoutType"
                          value="single-row"
                          checked={uploadLayoutType === 'single-row'}
                          onChange={(e) => setUploadLayoutType(e.target.value as any)}
                          className="text-blue-600"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">➡️ Single Row (horizontal strip)</span>
                          <div className="text-xs text-gray-500">Perfect for 1600×50 type images with frames in one row</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <input
                          type="radio"
                          name="layoutType"
                          value="5x5"
                          checked={uploadLayoutType === '5x5'}
                          onChange={(e) => setUploadLayoutType(e.target.value as any)}
                          className="text-blue-600"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">🔲 5×5 Grid (25 frames)</span>
                          <div className="text-xs text-gray-500">Standard grid layout for AI-generated sprite sheets</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Sprite Sheet
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Supports PNG, JPG formats • Adjustable after upload
                  </p>
                </div>
              </div>
            </div>

            {/* Right Panel - Generated Sprites */}
            <div className="w-80 bg-gray-50 overflow-y-auto flex flex-col justify-between">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-semibold text-gray-800">Generated Sprites ({generatedSprites.length})</h3>
                <p className="text-xs text-gray-600 mt-1">Click on a sprite to preview it</p>
              </div>

              <div className="p-4 space-y-3">
                {generatedSprites.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sprites generated yet</p>
                    <p className="text-xs">Create your first animated sprite!</p>
                  </div>
                ) : (
                  generatedSprites.map((sprite) => (
                    <div
                      key={sprite.id}
                      className={`bg-white rounded-lg border-2 p-3 cursor-pointer transition-all ${
                        selectedSprite?.id === sprite.id 
                          ? 'border-blue-500 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSprite(sprite)}
                    >
                      {/* Sprite Preview */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <PixiAnimatedSymbol
                            imageUrl={sprite.url}
                            width={48}
                            height={48}
                            animationSpeed={0.1}
                            gridCols={sprite.config.gridCols}
                            gridRows={sprite.config.gridRows}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            Sprite #{sprite.id.slice(-4)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(sprite.timestamp).toLocaleTimeString()}
                          </p>
                          {sprite.config.symbolType === 'uploaded' && (
                            <p className="text-xs text-blue-600 font-medium">
                              {sprite.config.gridCols}×{sprite.config.gridRows} grid
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyUrl(sprite.url);
                          }}
                          className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(sprite);
                          }}
                          className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Save
                        </button>
                        {sprite.config.symbolType === 'uploaded' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setGridAdjustmentSprite(sprite);
                            }}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors flex items-center justify-center"
                            title="Adjust Grid Layout"
                          >
                            <Settings className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSprite(sprite.id);
                          }}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Selected Sprite Preview */}
          {selectedSprite && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800">Preview: Sprite #{selectedSprite.id.slice(-4)}</h4>
                  <p className="text-sm text-gray-600">Generated {new Date(selectedSprite.timestamp).toLocaleString()}</p>
                </div>
                <div className="w-20 h-20 bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <PixiAnimatedSymbol
                    imageUrl={selectedSprite.url}
                    width={80}
                    height={80}
                    animationSpeed={0.12}
                    gridCols={selectedSprite.config.gridCols}
                    gridRows={selectedSprite.config.gridRows}
                  />
                </div>
              </div>
            </div>
          )}
            </div>
          </div>

        </motion.div>
      </motion.div>

      {/* Grid Adjustment Modal */}
      {gridAdjustmentSprite && (
        <GridAdjustmentModal
          sprite={gridAdjustmentSprite}
          isOpen={!!gridAdjustmentSprite}
          onClose={() => setGridAdjustmentSprite(null)}
          onUpdate={updateSpriteGrid}
        />
      )}
    </AnimatePresence>
  );
};

export default SpriteSheetGeneratorModal;
