import React, { useRef } from 'react';
import { Upload, Sparkles, Loader2, X, Image as ImageIcon } from 'lucide-react';

interface UnifiedAssetControlProps {
    label: string;
    subLabel?: string;
    icon?: React.ReactNode;
    value: string; // The description text
    onValueChange: (val: string) => void;
    imagePreview?: string; // If set, shows the remove button
    onRemoveImage?: () => void;
    onUpload: (file: File) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    placeholder?: string;
    className?: string; // Allow minimal styling overrides
}

export const UnifiedAssetControl: React.FC<UnifiedAssetControlProps> = ({
    label,
    subLabel,
    icon,
    value,
    onValueChange,
    imagePreview,
    onRemoveImage,
    onUpload,
    onGenerate,
    isGenerating,
    placeholder = "Describe asset...",
    className = ""
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file);
        }
        e.target.value = ''; // Reset
    };

    return (
        <div className={`bg-white rounded-lg p-2 border border-slate-200 shadow-sm ${className}`}>
            {/* Header Row */}
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-indigo-50 rounded flex items-center justify-center text-indigo-600">
                        {icon || <ImageIcon size={12} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-xs">{label}</h4>
                        {subLabel && <p className="text-[9px] text-slate-400 font-medium leading-none">{subLabel}</p>}
                    </div>
                </div>
                {imagePreview ? (
                    <button
                        onClick={onRemoveImage}
                        className="text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                    >
                        <X size={10} /> Remove
                    </button>
                ) : (
                    <span className="text-[10px] font-medium text-slate-400">Upload or Generate</span>
                )}
            </div>

            {/* Content Row */}
            <div className="flex gap-2">
                {/* Description / Input Area */}
                <div className="flex-1">
                    <textarea
                        value={value}
                        onChange={(e) => onValueChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full h-full min-h-[36px] bg-slate-50 border border-slate-200 rounded p-2 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none resize-none placeholder:text-slate-400 leading-tight"
                    />
                </div>

                {/* Button Stack */}
                <div className="flex flex-col gap-1.5 w-28 shrink-0">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 w-full py-1 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-[10px] font-bold rounded transition-all shadow-sm"
                    >
                        <Upload size={10} />
                        Choose
                    </button>
                    <button
                        onClick={onGenerate}
                        disabled={isGenerating || !value.trim()}
                        className={`flex items-center justify-center gap-1.5 w-full py-1 text-white text-[10px] font-bold rounded shadow-sm transition-all
                            ${isGenerating || !value.trim()
                                ? 'bg-indigo-300 cursor-not-allowed'
                                : 'bg-indigo-500 hover:bg-indigo-600 active:scale-95'
                            }`}
                    >
                        {isGenerating ? (
                            <Loader2 className="animate-spin" size={10} />
                        ) : (
                            <Sparkles size={10} />
                        )}
                        {isGenerating ? 'Gen...' : 'Generate'}
                    </button>
                </div>
            </div>
        </div>
    );
};
