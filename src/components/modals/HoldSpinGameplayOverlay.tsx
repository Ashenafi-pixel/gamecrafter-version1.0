import React from "react";

interface HoldSpinGameplayOverlayProps {
  spinsRemaining: number;
  totalWin: number;
  lockedSymbolsCount: number;
}

const HoldSpinGameplayOverlay: React.FC<HoldSpinGameplayOverlayProps> = ({
  spinsRemaining,
  totalWin,
  lockedSymbolsCount,
}) => {
  return (
    <div
      className="
        absolute top-3 left-1/2 -translate-x-1/2
        bg-black/90 backdrop-blur-sm border border-yellow-400 
        flex items-center justify-between gap-3 sm:gap-6
        px-3 sm:px-5 h-[55px] rounded-md 
        shadow-[0_0_10px_rgba(255,215,0,0.5)] z-[9999]
        min-w-[260px] sm:min-w-[360px] max-w-[85%]
      "
    >
      {/* RESPINS */}
      <div
        className="
          flex flex-col items-center justify-center
          text-yellow-400 font-semibold text-sm sm:text-base
          drop-shadow-[0_0_3px_rgba(255,215,0,0.8)]
          leading-tight
        "
      >
        <span className="text-[9px] sm:text-[10px] text-yellow-300 tracking-wider">
          RESPINS
        </span>
        <span className="text-base sm:text-lg">{spinsRemaining}</span>
      </div>

      {/* LOCKED */}
      <div
        className="
          flex flex-col items-center justify-center
          text-white font-medium text-sm sm:text-base
          drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]
          leading-tight
        "
      >
        <span className="text-[9px] sm:text-[10px] tracking-wider flex items-center gap-1">
          <span>🔒</span> LOCKED
        </span>
        <span className="text-base sm:text-lg">{lockedSymbolsCount}</span>
      </div>

      {/* WIN */}
      <div
        className="
          flex flex-col items-center justify-center
          text-green-400 font-semibold text-sm sm:text-base
          drop-shadow-[0_0_3px_rgba(0,255,0,0.8)]
          leading-tight
        "
      >
        <span className="text-[9px] sm:text-[10px] tracking-wider">WIN</span>
        <span className="text-base sm:text-lg">${totalWin.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default HoldSpinGameplayOverlay;
