import { SymbolConfig } from "../../types/EnhancedAnimationLabStep4";


interface BonusSymbolCarouselProps {
  symbol: SymbolConfig;
  isSelected: boolean;
  onClick: () => void;
  isGenerating?: boolean;
  progress?: number;
}

const BonusSymbolCarousel: React.FC<BonusSymbolCarouselProps> = ({ 
  symbol, 
  isSelected, 
  onClick, 
  isGenerating = false, 
  progress = 0 
}) => {
  const getFrameStyle = () => {
    if (isSelected) {
      return 'ring-2 ring-red-500 ring-offset-2';
    }
    switch (symbol.rarity) {
      default: 
        return 'border border-gray-300';
    }
  };
  
  const getRarityIcon = () => {
    switch (symbol.rarity) {
      case 'legendary':
        return '👑';
      case 'epic':
        return '⚡';
      case 'rare':
        return '⭐';
      default:
        return '⭕';
    }
  };

  const getSymbolTypeIcon = () => {
    switch (symbol.gameSymbolType) {
      case 'bonus':
        return '🃏';
      case 'free':
        return '💫';
      case 'jackpot':
        return '💎';
      default:
        return '🎯';
    }
  };

  const getSymbolTypeColor = () => {
    switch (symbol.gameSymbolType) {
      case 'bonus':
        return 'bg-yellow-100 text-green-800 border-green-200';
        case 'free':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'jackpot':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <div
      onClick={onClick}
      className={`
        w-[120px] h-[120px] flex flex-col justify-center bg-white rounded-lg cursor-pointer
        transition-all duration-200 hover:shadow-md uw:w-[240px] uw:h-[200px] 
        ${getFrameStyle()}
      `}
    >
      {/* Symbol Image Area */}
      <div className="relative w-full h-[90px] bg-gray-50 rounded-t-lg flex items-center justify-center overflow-hidden uw:h-[150px] uw:items-end">
        {symbol.imageUrl ? (
          <img
            src={symbol.imageUrl}
            alt={symbol.name}
            className="w-full h-full object-contain p-3"
          />
        ) : isGenerating ? (
          <div className="flex flex-col items-center p-3">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 bg-red-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <div className="text-2xl mb-1 uw:text-5xl">🖼️</div>
            <span className="text-xs uw:text-2xl">Empty</span>
          </div>
        )}
        
        {/* Completion Badge */}
        {symbol.imageUrl && (
          <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-xs uw:text-2xl">✓</span>
          </div>
        )}
        
        {/* Symbol Type Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className="text-sm uw:text-3xl">{getSymbolTypeIcon()}</span>
          <span className="text-xs uw:text-2xl">{getRarityIcon()}</span>
        </div>
      </div>

      {/* Symbol Info */}
      <div className="h-[30px] px-2 py-1 flex items-center justify-between uw:h-[70px]">
        <span className="text-xs font-medium text-gray-700 truncate uw:text-2xl">
          {symbol.name}
        </span>
        <div className={`text-xs px-1 py-0.5 rounded border text-center min-w-[40px] uw:text-2xl ${getSymbolTypeColor()}`}>
          {symbol.gameSymbolType?.toUpperCase() || 'SYM'}
        </div>
      </div>
    </div>
  );
};

export default BonusSymbolCarousel