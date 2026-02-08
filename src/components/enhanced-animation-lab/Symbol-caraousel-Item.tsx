import { SymbolConfig } from "../../types/EnhancedAnimationLabStep4";
import SpinePlayer from "../spine/SpinePlayer"; // Import SpinePlayer

interface SymbolCarouselItemProps {
  symbol: SymbolConfig;
  isSelected: boolean;
  onClick: () => void;
  isGenerating?: boolean;
  progress?: number;
  spineData?: any; // Add spineData prop
}

const SymbolCarouselItem: React.FC<SymbolCarouselItemProps> = ({
  symbol,
  isSelected,
  onClick,
  isGenerating = false,
  progress = 0,
  spineData
}) => {
  const getFrameStyle = () => {
    // ... (rest of style logic)
    if (isSelected) {
      return 'ring-2 ring-red-500 ring-offset-2';
    }

    switch (symbol.rarity) {
      default: // Common symbols
        return 'border border-gray-300';
    }
  };

  const getSymbolTypeIcon = () => {
    const type = symbol.gameSymbolType?.toLowerCase() || '';
    if (type.includes('wild')) return '✨';
    if (type.includes('scatter')) return '🎯';
    if (type.includes('bonus')) return '🎁';
    if (type.includes('high')) return '💎';
    if (type.includes('low')) return '🃏';
    return '🎰';
  };

  const getRarityIcon = () => {
    // Check if rarity is defined, otherwise default
    if (!symbol.rarity) return '';

    switch (symbol.rarity.toUpperCase()) {
      case 'LEGENDARY': return '⭐';
      case 'EPIC': return '🟣';
      case 'RARE': return '🔵';
      case 'COMMON': return '⚪';
      default: return '';
    }
  };

  const getSymbolTypeColor = () => {
    const type = symbol.gameSymbolType?.toLowerCase() || '';
    if (type.includes('wild')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (type.includes('scatter')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (type.includes('bonus')) return 'bg-pink-100 text-pink-800 border-pink-200';
    if (type.includes('high')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (type.includes('low')) return 'bg-blue-100 text-slate-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // ... (icon helpers)

  return (
    <div
      onClick={onClick}
      className={`
        relative group w-[120px] h-[120px] uw:w-[200px] uw:h-[200px] bg-white rounded-lg cursor-pointer
        transition-all duration-200 hover:shadow-md 
        ${getFrameStyle()}
      `}
    >
      {/* Symbol Image Area */}
      <div className="relative w-full h-[90px] uw:h-[140px] bg-gray-50 rounded-t-lg flex items-center justify-center overflow-hidden">
        {spineData ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <SpinePlayer
              spineData={spineData}
              width={100}
              height={100}
              animationName="idle"
              isPlaying={isSelected}
            />
          </div>
        ) : symbol.imageUrl ? (
          <img
            src={symbol.imageUrl}
            alt={symbol.name}
            className="max-w-full max-h-full uw:h-44 uw:w-44 object-contain p-3 m-auto"
          />
        ) : isGenerating ? (
          <div className="flex flex-col items-center p-3">
            <div className="w-8 h-8  border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="h-1.5 bg-red-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <div className="text-2xl mb-1">🖼️</div>
            <span className="text-xs ">Empty</span>
          </div>
        )}

        {/* Completion Badge */}
        {symbol.imageUrl && (
          <div className="absolute top-2 right-2 w-4 h-4 uw:h-6 uw:w-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-xs uw:text-2xl">✓</span>
          </div>
        )}

        {/* Symbol Type Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className="text-sm uw:text-xl">{getSymbolTypeIcon()}</span>
          <span className="text-xs uw:text-xl">{getRarityIcon()}</span>
        </div>
      </div>

      {/* UW Preview for slides (shows on hover at uw breakpoint) */}
      <div className="hidden uw:group-hover:flex absolute left-1/2 -top-4 transform -translate-x-1/2 -translate-y-full w-[260px] h-[260px] bg-white rounded-lg shadow-xl items-center justify-center p-3 z-50 pointer-events-none">
        {symbol.imageUrl ? (
          <img src={symbol.imageUrl} alt={symbol.name} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <div className="text-3xl mb-1">🖼️</div>
            <span className="text-sm">Empty</span>
          </div>
        )}
      </div>

      {/* Symbol Info */}
      <div className="h-[30px] px-2 py-1 flex items-center justify-center">
        {/* <span className="uw:text-xl text-xs font-medium text-gray-700 truncate">
          {symbol.name}
        </span> */}
        <div className={`uw:text-xl text-xs px-0.5 rounded border text-center min-w-[40px] ${getSymbolTypeColor()}`}>
          {symbol.gameSymbolType?.toUpperCase() || 'SYM'}
        </div>
      </div>
    </div>
  );
};

export default SymbolCarouselItem