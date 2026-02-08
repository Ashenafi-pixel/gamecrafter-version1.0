import React, { useState } from 'react';
import { enhancedOpenaiClient } from '../utils/enhancedOpenaiClient';
import { Download, Loader, Upload } from 'lucide-react';

const ImageGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'edit'>('generate');
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1024x1024' | '1024x1792' | '1792x1024'>('1024x1024');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      if (activeTab === 'edit' && uploadedImage) {
        const result = await enhancedOpenaiClient.generateImageWithConfig({
          prompt,
          sourceImage: uploadedImage,
          size,
        });
        if (result.success && result.images?.[0]) {
          setGeneratedImage(result.images[0]);
        } else {
          throw new Error(result.error || 'Failed to edit image');
        }
      } else {
        const result = await enhancedOpenaiClient.generateImage(prompt, {
          size,
          quality: 'high'
        });
        setGeneratedImage(result.imageUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'generate'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Generate
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'edit'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Edit
        </button>
      </div>

      <div className="space-y-4 mb-6">
        {/* Upload Image - Only in Edit Tab */}
        {activeTab === 'edit' && (
          <div>
            <label className="block text-sm font-medium mb-2">Upload Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Uploaded" className="max-h-48 mx-auto rounded" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload image</span>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>
        <div className='flex items-center justify-center gap-4'>
          <div className='flex items-center justify-center gap-4 w-1/2'>
            <label className="block text-sm font-medium mb-2">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as typeof size)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1024x1024">1024x1024 (Square)</option>
              <option value="1024x1536">1024x1536 (Portrait)</option>
              <option value="1536x1024">1536x1024 (Landscape)</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || (activeTab === 'edit' && !uploadedImage)}
            className="w-1/2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                {activeTab === 'edit' ? 'Editing...' : 'Generating...'}
              </>
            ) : (
              activeTab === 'edit' ? 'Edit Image' : 'Generate Image'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
          {error}
        </div>
      )}

      {generatedImage && (
        <div className="space-y-4 relative">
          <div className="border rounded-lg overflow-hidden bg-gray-50 ">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full h-auto"
            />
          </div>

          <button
            onClick={handleDownload}
            className="absolute top-2 right-2 px-3 py-3 text-white rounded-lg font-medium hover:bg-green-300 hover:text-black flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
