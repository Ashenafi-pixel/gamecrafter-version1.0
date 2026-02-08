export const NormalUiButtons = () => 
    `import { useGameStore } from '../store';
import { gameConfig } from '../config/gameConfig';

interface UiButtonsProps {
    startAutoPlayWithSpins: (spins: number) => void;
    handleSpin: () => void;
    adjustBet: (amount: number) => void;
    displayedWinAmount: number;
    soundSystem: any;
    soundControlRef: React.RefObject<HTMLDivElement>;
    settingsRef: React.RefObject<HTMLDivElement>;
}

const UiButtons:React.FC<UiButtonsProps> = ({startAutoPlayWithSpins, handleSpin, adjustBet, displayedWinAmount, soundSystem, soundControlRef, settingsRef}) => {
    const {setShowMenu, setShowInfo, balance,  isAutoPlay, isSpinning, isWinAnimationPlaying, isInFreeSpinMode, isInHoldSpinMode, holdSpinSpinsRemaining, autoSpinCount, 
        showSoundBar, setShowSoundBar,soundVolume,setSoundVolume, showSettings, setShowSettings,bet,showAutoPlaySettings, setShowAutoPlaySettings
     } = useGameStore();
    const config = gameConfig;
    return (
        <div className="slot-game-ui themed-component">
        {/* Left UI */}
        <div className="ui-left">
          <button className="menu-btn" onClick={() => setShowMenu(true)}>
            {config.uiElements?.menuButton ? (
              <img src={config.uiElements.menuButton} alt="Menu" className="button-icon" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            )}
          </button>
          
          <button className="info-btn" onClick={() => setShowInfo(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </button>

          <div className="balance-display themed-secondary">
            <div className="label">Balance</div>
            <div className="value">\${balance}</div>
          </div>
        </div>

        {/* Center UI */}
        <div className="ui-center">
        <div className="autoplay-control-container" style={{ position: 'relative' }}>
          <button
            className={\`auto-btn \${isAutoPlay ? 'active' : ''}\`}
            onClick={(e) => {
                e.stopPropagation();
                setShowAutoPlaySettings(true);
              }}
            disabled={isSpinning || isWinAnimationPlaying || (!isInFreeSpinMode && balance < bet)}
          >
            {config.uiElements?.autoplayButton ? (
              <img src={config.uiElements.autoplayButton} alt="Auto" className="button-icon" />
            ) : (
             <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              <span>{isAutoPlay ? \`AUTO (\${autoSpinCount})\` : 'AUTO'}</span>
              </>
            )}
          </button>
          {showAutoPlaySettings && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-95 border border-gray-600 rounded-xl p-4 z-[10000] backdrop-blur-sm shadow-2xl min-w-[280px]" onClick={(e) => e.stopPropagation()}>
                <p className="text-gray-300 mb-3 text-sm">Select spins:</p>
                <div className="flex flex-col gap-2">
                  {[5, 10, 25, 50, 100].map(count => (
                    <button
                      key={count}
                      className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 hover:border-blue-500 rounded-lg text-white p-2 transition-all flex justify-between items-center text-sm"
                      onClick={() => {
                        startAutoPlayWithSpins(count);
                        setShowAutoPlaySettings(false);
                      }}
                      disabled={balance < bet * count}
                    >
                      <span>{count} Spins</span>
                      <span className="text-gray-400">\${(bet * count).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bet-display themed-secondary">
            <div className="label">Bet</div>
            <div className="value">
            <svg onClick={() => adjustBet(-1)} className='bet-control-buttons'
              xmlns="http://www.w3.org/2000/svg" 
                  width="20" height="20" viewBox="0 0 24 24" 
                  fill="none" stroke="currentColor" strokeWidth="2" 
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="8" y1="12" x2="16" y2="12" />
              </svg>

            \${bet}
            <svg onClick={() => adjustBet(1)} className='bet-control-buttons'
            xmlns="http://www.w3.org/2000/svg" 
              width="20" height="20" viewBox="0 0 24 24" 
              fill="none" stroke="currentColor" strokeWidth="2" 
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            </div>
          </div>

          <button
            className={\`main-spin-btn \${isSpinning ? 'spinning' : ''} \${isInFreeSpinMode ? 'free-spin-mode' : ''} \${isInHoldSpinMode ? 'hold-spin-mode' : ''}\`}
            onClick={handleSpin}
            disabled={isSpinning || (!isInFreeSpinMode && isWinAnimationPlaying) || (!isInFreeSpinMode && !isInHoldSpinMode && balance < bet) || (isInHoldSpinMode && holdSpinSpinsRemaining <= 0)}
          >
            {config.uiElements?.spinButton ? (
              <img src={config.uiElements.spinButton} alt={isInHoldSpinMode ? "Respin" : isInFreeSpinMode ? "Free Spin" : "Spin"} className="spin-button-icon" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          <div className="win-display themed-secondary">
            <div className="label">Win</div>
            <div className="value animated-number">{displayedWinAmount.toFixed(2)}</div>
          </div>

          <button className="quick-btn">
            {config.uiElements?.quickButton ? (
              <img src={config.uiElements.quickButton} alt="Quick" className="button-icon" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 1v3l3.5-3.5L20 4l-3.5 3.5L20 11h-3V8.5L13 12l4 3.5V13h3l-3.5 3.5L20 20l-3.5-3.5L13 20v-3l-3.5 3.5L6 17l3.5-3.5L6 10h3v2.5L13 9l-4-3.5V8H6l3.5-3.5L6 1l3.5 3.5L13 1z"/>
              </svg>
            )}
            <span>QUICK</span>
          </button>
        </div>

        {/* Right UI */}
        <div className="ui-right">
          <div className="sound-control-container" ref={soundControlRef}>
            <button className="sound-btn" onClick={() => soundSystem.toggleSoundBar(showSoundBar, setShowSoundBar)}>
              {config.uiElements?.soundButton ? (
                <img src={config.uiElements.soundButton} alt="Sound" className="button-icon" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              )}
            </button>
            
            {showSoundBar && (
              <div className="sound-bar-popup" onMouseDown={(e) => e.stopPropagation()}>
                <div className="sound-bar-container">
                  <div className="sound-bar-track">
                    <div 
                      className="sound-bar-fill" 
                      style={{ height: \`\${soundVolume}%\` }}
                    />
                    <div 
                      className="sound-bar-handle" 
                      style={{ bottom: \`\${soundVolume}%\` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={soundVolume}
                      onChange={(e) => soundSystem.updateVolume(e.target.value, setSoundVolume)}
                      className="sound-slider"
                      // orient="vertical"
                    />
                  </div>
                  <div className="sound-value">{soundVolume}%</div>
                </div>
              </div>
            )}
          </div>

          <div className="settings-control-container" ref={settingsRef}>
            <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
              {config.uiElements?.settingsButton ? (
                <img src={config.uiElements.settingsButton} alt="Settings" className="button-icon" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
              )}
            </button>
            
          </div>
        </div>
      </div>
    )
}
export default UiButtons;
    `

export const UltimateUiButtons = () =>`
import { useGameStore } from '../store';
import { gameConfig } from '../config/gameConfig';
import { Minus, Plus } from 'lucide-react';

interface UiButtonsProps {
    startAutoPlayWithSpins: (spins: number) => void;
    handleSpin: () => void;
    adjustBet: (amount: number) => void;
    displayedWinAmount: number;
    soundSystem: any;
    soundControlRef: React.RefObject<HTMLDivElement>;
    settingsRef: React.RefObject<HTMLDivElement>;
}

const UiButtons:React.FC<UiButtonsProps> = ({startAutoPlayWithSpins, handleSpin, adjustBet, displayedWinAmount, soundSystem, soundControlRef, settingsRef}) => {
    const {setShowMenu, setShowInfo, balance,  isAutoPlay, isSpinning, isWinAnimationPlaying, isInFreeSpinMode, isInHoldSpinMode, holdSpinSpinsRemaining, autoSpinCount, 
        showSoundBar, setShowSoundBar,soundVolume,setSoundVolume, showSettings, setShowSettings,bet,showAutoPlaySettings, setShowAutoPlaySettings
     } = useGameStore();
       const config = gameConfig;
    return (
        <div
            data-testid="slot-ui"
            className={\`slot-game-ui w-full justify-between flex gap-3 items-center px-3 text-white \`}
            style={{

                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                height: '100px',
                zIndex: 100,
                pointerEvents: 'auto',
                overflow: 'visible'
            }}
        >
            {/* Left Section */}
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                    {/* Hamburger Menu Icon */}
                    <button
                        className="cursor-pointer flex items-center justify-center"
                        onClick={() => setShowMenu(true)}
                        style={{
                            width: '30px',
                            height: '30px',
                            background: 'transparent',
                            // border: 'none',
                            padding: '0'
                        }}
                    >
                          {config.uiElements?.menuButton ? ( 
                            <img
                                src={config.uiElements.menuButton}
                                alt="Menu"
                                className="w-full h-full object-contain"
                                style={{
                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                }}
                              
                            />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                    {/* Sound/Mute Button */}
                     <div  ref={soundControlRef}>
                    <button
                        className="cursor-pointer"
                        onClick={() => soundSystem.toggleSoundBar(showSoundBar, setShowSoundBar)}
                        style={{
                            width: '30px',
                            height: '30px',
                            backgroundColor: 'transparent',
                            // border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {config.uiElements?.soundButton ? (
                            <img
                                src={config.uiElements.soundButton}
                                alt="Sound"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                }}
                               
                            />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className={\`h-6 w-6 \${!showSoundBar ? 'opacity-50' : ''}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showSoundBar ? "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"} />
                            </svg>
                        )}
                    </button>
                    {showSoundBar && (
              <div className="sound-bar-popup" onMouseDown={(e) => e.stopPropagation()}>
                <div className="sound-bar-container">
                  <div className="sound-bar-track">
                    <div 
                      className="sound-bar-fill" 
                      style={{ height: \`\${soundVolume}%\` }}
                    />
                    <div 
                      className="sound-bar-handle" 
                      style={{ bottom: \`\${soundVolume}%\` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={soundVolume}
                      onChange={(e) => soundSystem.updateVolume(e.target.value, setSoundVolume)}
                      className="sound-slider"
                      // orient="vertical"
                    />
                  </div>
                  <div className="sound-value">{soundVolume}%</div>
                </div>
              </div>
            )}
                    </div>
                    
                </div>
                {/* Info Button */}
                <div className="flex items-center">
                    <div className="cursor-pointer"  onClick={() => setShowInfo(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                {/* Balance and Bet Section */}
                <div>
                    {/* Balance Display - Stacked */}
                    <div className="flex  items-center gap-2">
                        <div className="text-[1rem] font-bold text-orange-500 uppercase tracking-wide">CREDIT :</div>
                        <div className="font-bold text-[1rem]">{(balance)}</div>
                    </div>
                    {/* Bet Section - Stacked */}
                    <div className="flex gap-2 items-center">
                        <span className="text-[1rem] font-bold text-orange-500 uppercase tracking-wide">BET :</span>
                        <span className="font-bold text-[1rem]">{(bet)}</span>
                    </div>
                </div>
            </div>

            <div className='flex items-center gap-2'>
                {/* Settings Button */}
                <div className="flex items-center"  ref={settingsRef}>
                    <button
                        className="cursor-pointer"
                        onClick={() => setShowSettings(!showSettings)}
                        style={{
                            width: '50px',
                            height: '50px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {config.uiElements?.settingsButton ? (
                            <img
                                src={config.uiElements.settingsButton}
                                alt="Settings"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                }}
                               
                            />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    </button>
                </div>
                <div className='flex items-center rounded-full p-1 bg-black/40'>
                    <Minus className='w-4 h-4 cursor-pointer' onClick={() => adjustBet(-1)} />
                </div>
                {/* Center Section - Spin Controls (Centered) */}
                <div className=" flex flex-col items-center">
                    {/* Spin Button (centered) */}
                    <button
                        className={\`spin-btn 
                            text-black rounded-full w-[70px] h-[70px] flex items-center justify-center 
                            shadow-lg transform  transition-all duration-200 relative
                            z-200 active:scale-95
                            \${isSpinning
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer group hover:from-yellow-300 hover:to-yellow-500'}
                            \${!config.uiElements.spinButton
                                ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 border-yellow-700 border-2 '
                                : 'bg-transparent'}
                          \`}

                        onClick={handleSpin}

                        disabled={isSpinning}
                        aria-label="Spin"
                    >
                        {config.uiElements?.spinButton ? (
                            <img
                                src={config.uiElements.spinButton}
                                alt="Spin"
                                className="w-full h-full object-contain"
                                style={{
                                    filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                                    maxWidth: '100%',
                                    maxHeight: '100%'
                                }}
                               
                                onLoad={() => console.log('[SlotGameUI] Spin button loaded successfully')}
                            />
                        ) : (
                            <div className="flex items-center justify-center">
                                {/* Black arrow icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        )}
                    </button>
                    {/* Auto Spin Button */}
                         <div>
                    <button
                        className={\`flex flex-col items-center gap-1 cursor-pointer \`}
                          onClick={(e) => {
                            e.stopPropagation();    
                                setShowAutoPlaySettings(true);
                        }}
                        aria-label="Auto Spin"
                         disabled={isSpinning || isWinAnimationPlaying || (!isInFreeSpinMode && balance < bet)}
                    >
                        {config.uiElements?.autoplayButton ? (
                            <>
                                <div
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <img
                                        src={config.uiElements.autoplayButton}
                                        alt="Autoplay"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                        }}
                                        
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className='flex items-center justify-center border bg-black rounded-md p-1'>
                                    <span className="text-xs">AUTOPLAY</span>
                                </div>
                            </>
                        )}
                    </button>
                      {showAutoPlaySettings && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-95 border border-gray-600 rounded-xl p-4 z-[10000] backdrop-blur-sm shadow-2xl min-w-[280px]" onClick={(e) => e.stopPropagation()}>
                <p className="text-gray-300 mb-3 text-sm">Select spins:</p>
                <div className="flex flex-col gap-2">
                  {[5, 10, 25, 50, 100].map(count => (
                    <button
                      key={count}
                      className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 hover:border-blue-500 rounded-lg text-white p-2 transition-all flex justify-between items-center text-sm"
                      onClick={() => {
                        startAutoPlayWithSpins(count);
                        setShowAutoPlaySettings(false);
                      }}
                      disabled={balance < bet * count}
                    >
                      <span>{count} Spins</span>
                      <span className="text-gray-400">\${(bet * count).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>

                </div>
                <div className='flex items-center rounded-full p-1 bg-black/40'>
                    <Plus className='w-4 h-4 cursor-pointer' onClick={() => adjustBet(1)} />
                </div>
            </div>

            {/* Right Section */}

        </div>
    );
};
     export default UiButtons;`

export const ModernUiButtons = () => `
import React, { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store";
import { gameConfig } from "../config/gameConfig";
import { Minus, Plus } from "lucide-react";

interface UiButtonsProps {
  startAutoPlayWithSpins: (spins: number) => void;
  handleSpin: () => void;
  adjustBet: (amount: number) => void;
  displayedWinAmount: number;
  soundSystem: any;
  soundControlRef: React.RefObject<HTMLDivElement>;
  settingsRef: React.RefObject<HTMLDivElement>;
}

const UiButtons: React.FC<UiButtonsProps> = ({
  startAutoPlayWithSpins,
  handleSpin,
  adjustBet,
  soundSystem,
  soundControlRef,
  settingsRef
}) => {
  const {
    setShowMenu,
    setShowInfo,
    balance,
    isSpinning,
    isWinAnimationPlaying,
    isInFreeSpinMode,
    showSoundBar,
    setShowSoundBar,
    soundVolume,
    setSoundVolume,
    showSettings,
    setShowSettings,
    bet,
    showAutoPlaySettings,
    setShowAutoPlaySettings
  } = useGameStore();

  const config = gameConfig;

  // ⭐ BET VALUES SLIDER
  const betValues = [0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500];
  const [centerIndex, setCenterIndex] = useState(2);

  const rootRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<HTMLDivElement>(null);
  const settingsModalRef = useRef<HTMLDivElement>(null);

  const setBetAmount = (value: number) => {
    adjustBet(value - bet);
    const newIndex = betValues.indexOf(value);
    if (newIndex !== -1) setCenterIndex(newIndex);
  };

  const handleDecreaseBet = () => {
    if (centerIndex > 0) {
      const newIndex = centerIndex - 1;
      setCenterIndex(newIndex);
      adjustBet(betValues[newIndex] - bet);
    }
  };

  const handleIncreaseBet = () => {
    if (centerIndex < betValues.length - 1) {
      const newIndex = centerIndex + 1;
      setCenterIndex(newIndex);
      adjustBet(betValues[newIndex] - bet);
    }
  };

  // ⭐ CLOSE popups on outside click
  useEffect(() => {
    function handleOutside(e: any) {
      // Check if click is outside autoplay modal
      if (showAutoPlaySettings && autoPlayRef.current && !autoPlayRef.current.contains(e.target)) {
        setShowAutoPlaySettings(false);
      }
      // Check if click is outside sound modal
      if (showSoundBar && soundRef.current && !soundRef.current.contains(e.target)) {
        setShowSoundBar(false);
      }
      // Check if click is outside settings modal
      if (showSettings && settingsModalRef.current && !settingsModalRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showAutoPlaySettings, showSoundBar, showSettings]);

  return (
   <div
  ref={rootRef}
  className="w-full flex items-center justify-between fixed bottom-0 left-0 right-0 px-4 text-white overflow-visible"
  style={{
    height: "150px",
    zIndex: 100
  }}
>


      {/* LEFT SECTION */}
      <div className="flex items-center gap-6">

        {/* MENU */}
        <button
          onClick={() => setShowMenu(true)}
          className="w-10 h-10 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center shadow-inner"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        {/* BALANCE */}
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-300 uppercase">BALANCE</span>
          <span className="font-bold text-lg">{balance.toFixed(2)}</span>
        </div>
      </div>

      {/* CENTER — BET SLIDER */}
      <div className="flex items-center gap-2">

        {/* LEFT TRIANGLE */}
        <button
          onClick={handleDecreaseBet}
          className="relative w-10 h-10 flex items-center justify-center"
        >
          <div className="absolute w-0 h-0 border-y-[18px] border-y-transparent border-r-[28px] border-r-[#2bb4ff]" />
        </button>

        {/* BET VALUES */}
        <div className="flex items-center gap-1">
          {betValues.map((value, idx) => {
            const active = idx === centerIndex;
            return (
              <button
                key={value}
                onClick={() => setBetAmount(value)}
                className={\`
                  w-10 min-w-[45px] h-[34px] rounded-md flex items-center justify-center
                  text-sm font-semibold transition-all
                  \${active
                    ? "bg-gradient-to-b from-[#2bb4ff] to-[#1a8fd9] border border-[#4ecaff] text-white shadow-[0_0_12px_rgba(43,180,255,0.8)] scale-105"
                    : "bg-[#1c1c1c] text-gray-300 border border-[#444] hover:bg-[#333]"
                  }
                \`}
              >
                {value}
              </button>
            );
          })}
        </div>

        {/* RIGHT TRIANGLE */}
        <button
          onClick={handleIncreaseBet}
          className="relative w-10 h-10 flex items-center justify-center"
        >
          <div className="absolute w-0 h-0 border-y-[18px] border-y-transparent border-l-[28px] border-l-[#2bb4ff]" />
        </button>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3">

        {/* SOUND */}
        <button
          onClick={() => setShowSoundBar(!showSoundBar)}
          className="w-10 h-10 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center shadow-inner"
        >
          {config.uiElements?.soundButton ? (
            <img src={config.uiElements.soundButton} className="w-6 h-6 object-contain" />
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5.6 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.6l4.7-4.7C11 3.6 12 4.1 12 5v14c0 .9-1 1.3-1.7.7L5.6 15z" />
              {showSoundBar && <path d="M15.5 9a5 5 0 010 6m2.5-8a9 9 0 010 10" />}
            </svg>
          )}
        </button>

        {/* SETTINGS */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center shadow-inner"
        >
          <svg className="w-6 h-6 text-white" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9.7 3a1.5 1.5 0 012.6 0l.4 1.2c.2.6.7 1 1.4 1l1.3.1A1.5 1.5 0 0117 8l-.9 1a1.5 1.5 0 000 2l.9 1c.7.7.2 2-1 2l-1.3.1c-.7 0-1.1.4-1.4 1l-.4 1.2a1.5 1.5 0 01-2.6 0l-.4-1.2c-.2-.6-.7-1-1.4-1l-1.3-.1a1.5 1.5 0 01-1-2.5l.9-1a1.5 1.5 0 000-2l-.9-1A1.5 1.5 0 016.5 5l1.3-.1c.7 0 1.1-.4 1.4-1L9.7 3z"/>
            <circle cx="12" cy="12" r="3" fill="white" />
          </svg>
        </button>

        {/* AUTOPLAY */}
        <button
          onClick={() => setShowAutoPlaySettings(true)}
          className="w-10 h-10 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center shadow-inner"
        >
          <svg className="w-7 h-7 text-yellow-400" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
            <path d="M4 4v5h.6m15.3 2A8 8 0 004.6 9m0 0H9m11 11v-5h-.6m0 0a8 8 0 01-15.3-2m15.3 2H15" />
          </svg>
        </button>

        {/* SPIN BUTTON */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="w-[90px] h-[90px] mt-[-20px] rounded-full bg-[#6bff60] border-4 border-[#48d53e] shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition"
        >
          <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* AUTOPLAY POPUP */}
      {showAutoPlaySettings && (
        <div ref={autoPlayRef} className="absolute bottom-full mb-2 right-[80px] bg-black/90 border border-gray-600 p-3 rounded-xl shadow-xl backdrop-blur">
          {[5, 10, 25, 50, 100].map((count) => (
            <button
              key={count}
              onClick={() => {
                startAutoPlayWithSpins(count);
                setShowAutoPlaySettings(false);
              }}
              className="w-full bg-[#222] hover:bg-[#333] text-white p-2 rounded-md text-sm my-1"
            >
              {count} Spins
            </button>
          ))}
        </div>
      )}

      {/* SOUND POPUP */}
      {showSoundBar && (
        <div ref={soundRef} className="absolute bottom-full mb-2 right-[140px] bg-black/90 border border-gray-600 p-4 rounded-xl">
          <input
            type="range"
            min="0"
            max="100"
            value={soundVolume}
            onChange={(e) => setSoundVolume(Number(e.target.value))}
          />
          <p className="text-center mt-1">{soundVolume}%</p>
        </div>
      )}

      {/* SETTINGS POPUP */}
      {showSettings && (
        <div ref={settingsModalRef} className="absolute bottom-full mb-2 right-[200px] bg-black/90 border border-gray-600 p-4 rounded-xl">
          <p className="text-sm">Settings content...</p>
        </div>
      )}
    </div>
  );
};

export default UiButtons;
`