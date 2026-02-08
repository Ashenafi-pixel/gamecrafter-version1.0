import { GameConfig } from './gameTypes';
export const generateLoadingComponent = () => `import React from 'react';
import { LoadingScreenProps } from '../types';

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, message, config }) => {
  // Get loading configuration from config or use defaults
  const loadingConfig = config?.loadingExperience || {
    backgroundColor: '#1a1a2e',
    accentColor: '#ffd700',
    textColor: '#ffffff',
    customMessage: 'GameStudio™ - 2024',
    showPercentage: true,
    studioLogoSize: 80,
    spriteSize: 40,
    progressBarWidth: 60
  };
  
  // Get loading assets configuration from store
  const loadingAssets = config?.loadingAssets || {};
  const studioLogoConfig = loadingAssets?.studioLogo || { x: 50, y: 15, size: 80 };
  const loadingSpriteConfig = loadingAssets?.loadingSprite || { position: 'center', animation: 'spin', size: 40 };
  const progressBarConfig = loadingAssets?.progressBar || { x: 50, y: 65, width: 60, display: 'bar' , color:'#ffd700' };
  const customMessageConfig = loadingAssets?.customMessage || { x: 50, y: 90, size: 14, text: 'GameStudio™ - 2024' };
  
  // Get percentage position configuration from Step9
  const percentagePosition = config?.loadingAssets?.percentagePosition || 'above';
  
  const hasStudioLogo = config?.studioLogo && config.studioLogo.trim() !== '';
  const hasLoadingSprite = config?.loadingSprite && config.loadingSprite.trim() !== '';
  
  // Determine if we should use circular or bar progress
  const isCircularProgress = loadingConfig.progressStyle === 'circular' || progressBarConfig.display === 'circular';
  
  // Calculate percentage position based on Step9 configuration
  const getPercentagePosition = () => {
    if (isCircularProgress) {
      switch (percentagePosition) {
        case 'above':
          return {
            left: progressBarConfig.x +'%',
            top: (progressBarConfig.y - 12) + '%',
            transform: 'translate(-50%, -50%)'
          };
        case 'below':
          return {
            left: progressBarConfig.x + '%',
            top: (progressBarConfig.y + 12) + '%',
            transform: 'translate(-50%, -50%)'
          };
        case 'right':
          return {
            left: (progressBarConfig.x + 12)+'%',
            top: progressBarConfig.y +'%',
            transform: 'translate(-50%, -50%)'
          };
        case 'center':
        default:
          return {
            left: progressBarConfig.x + '%',
            top: progressBarConfig.y +'%',
            transform: 'translate(-50%, -50%)'
          };
      }
    } else {
      switch (percentagePosition) {
        case 'above':
          return {
            left: progressBarConfig.x + '%',
            top: (progressBarConfig.y - 5)+'%',
            transform: 'translate(-50%, -50%)'
          };
        case 'below':
          return {
            left: progressBarConfig.x + '%',
            top: (progressBarConfig.y + 5) + '%',
            transform: 'translate(-50%, -50%)'
          };
          case 'right': 
          return {
            left: (progressBarConfig.x + (progressBarConfig.width / 2) + 5) + '%',
            top: progressBarConfig.y + '%',
            transform: 'translate(-50%, -50%)'
          };
        default:
          return {
            left: progressBarConfig.x + '%',
            top: (progressBarConfig.y + 3) + '%',
            transform: 'translate(-50%, -50%)'
          };
      }
    }
  };
  
  // Calculate sprite position based on settings
  // const getSpritePosition = () => {
  //   if (isCircularProgress) {
  //     switch (loadingSpriteConfig.position) {
  //       case 'in-bar':
  //         const angle = -Math.PI / 2 + (progress / 100) * Math.PI * 2;
  //         const radius = 60;
  //         const spriteX = progressBarConfig.x + Math.cos(angle) * (radius * 0.8);
  //         const spriteY = progressBarConfig.y + Math.sin(angle) * (radius * 0.8);
  //         return {
  //           left: \`\${spriteX}%\`,
  //           top: \`\${spriteY}%\`,
  //           transform: 'translate(-50%, -50%)'
  //         };
  //       case 'above-bar':
  //         return {
  //           left: \`\${progressBarConfig.x}%\`,
  //           top: \`\${progressBarConfig.y - 12}%\`,
  //           transform: 'translate(-50%, -50%)'
  //         };
  //       case 'below-bar':
  //         return {
  //           left: \`\${progressBarConfig.x}%\`,
  //           top: \`\${progressBarConfig.y + 12}%\`,
  //           transform: 'translate(-50%, -50%)'
  //         };
  //       default:
  //         return {
  //           left: \`\${progressBarConfig.x}%\`,
  //           top: \`\${progressBarConfig.y}%\`,
  //           transform: 'translate(-50%, -50%)'
  //         };
  //     }
  //   } else {
  //     switch (loadingSpriteConfig.position) {
  //       case 'in-bar':
  //         // Position sprite relative to progress bar center, accounting for CSS translateX(-50%)
  //         const progressOffset = (progressBarConfig.width * (progress / 100)) - (progressBarConfig.width / 2);
  //         const spriteX = progressBarConfig.x + progressOffset;
  //         return {
  //           left: \`\${spriteX}%\`,
  //           top: \`\${progressBarConfig.y}%\`,
  //           transform: 'translate(-50%, -50%)'
  //         };
  //       case 'above-bar':
  //         return {
  //           left: \`\${progressBarConfig.x}%\`,
  //           top: \`\${progressBarConfig.y - 5}%\`,
  //           transform: 'translate(-50%, -50%)'
  //         };
  //       case 'below-bar':
  //         return {
  //           left: \`\${progressBarConfig.x}%\`,
  //           top: \`\${progressBarConfig.y + 5}%\`,
  //           transform: 'translate(-50%, -50%)'
  //         };
  //       default:
  //         return {
  //           left: \`\${progressBarConfig.x}%\`,
  //           top: \`\${progressBarConfig.y}%\`,
  //           transform: 'translate(-50%, -50%)'
  //         };
  //     }
  //   }
  // };
  
  // Get animation class based on settings
  const getAnimationClass = () => {
    switch (loadingSpriteConfig.animation) {
      case 'bounce':
        return 'sprite-bounce';
      case 'pulse':
        return 'sprite-pulse';
      case 'spin':
      default:
        return 'sprite-roll';
    }
  };
  
  return (
    <div className="loading-overlay" style={{ background: loadingConfig.backgroundColor }}>
      <div className="loading-content">
        {/* Studio Logo - Only show if available */}
        {hasStudioLogo && (
          <div 
            className="loading-logo"
            style={{
              position: 'absolute',
              left: \`\${studioLogoConfig.x}%\`,
              top: \`\${studioLogoConfig.y}%\`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <img 
              src={config.studioLogo} 
              alt="Studio Logo" 
              className="loading-logo-image"
              style={{ 
                width: \`\${studioLogoConfig.size}px\`,
                height: \`\${studioLogoConfig.size}px\`
              }}
            />
          </div>
        )}
        

        
        {/* Progress Bar - Conditional Rendering */}
        {isCircularProgress ? (
          <div 
            className="loading-progress-circular"
            style={{ 
              position: 'absolute',
              left: \`\${progressBarConfig.x}%\`,
              top: \`\${progressBarConfig.y}%\`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <svg className="circular-progress" width="120" height="120">
              <circle
                className="circular-progress-bg"
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="8"
              />
              <circle
                className="circular-progress-fill"
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={loadingConfig.accentColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={\`\${2 * Math.PI * 50}\`}
                strokeDashoffset={\`\${2 * Math.PI * 50 * (1 - progress / 100)}\`}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            {loadingConfig.showPercentage && percentagePosition === 'center' && (
              <div className="circular-percentage">
                {Math.round(progress)}%
              </div>
            )}
          </div>
        ) : (
          <div 
            className="loading-progress"
            style={{ 
              position: 'absolute',
              left: \`\${progressBarConfig.x}%\`,
              top: \`\${progressBarConfig.y}%\`,
              width: \`\${progressBarConfig.width}%\`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="loading-bar">
              <div 
                className="loading-fill" 
                style={{ 
                  width: \`\${progress}%\`,
                  background: loadingConfig.accentColor
                }}
              >
                {/* Loading Sprite as child of progress fill */}
                {hasLoadingSprite && loadingSpriteConfig.position === 'in-bar' && (
                  <div 
                    className="loading-sprite-in-bar"
                    style={{
                      position: 'absolute',
                      right: '-20px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1
                    }}
                  >
                    <img 
                      src={config.loadingSprite} 
                      alt="Loading Sprite" 
                      className={\`loading-sprite-image \${getAnimationClass()}\`}
                      style={{ 
                        width: \`\${loadingSpriteConfig.size}px\`,
                        height: \`\${loadingSpriteConfig.size}px\`
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Loading Sprite for other positions */}
            {hasLoadingSprite && loadingSpriteConfig.position !== 'in-bar' && (
              <div 
                className="loading-sprite-container"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: loadingSpriteConfig.position === 'above-bar' ? '-40px' : '40px',
                  transform: 'translateX(-50%)',
                  zIndex: 2002
                }}
              >
                <img 
                  src={config.loadingSprite} 
                  alt="Loading Sprite" 
                  className={\`loading-sprite-image \${getAnimationClass()}\`}
                  style={{ 
                    width: \`\${loadingSpriteConfig.size}px\`,
                    height: \`\${loadingSpriteConfig.size}px\`
                  }}
                />
              </div>
            )}
            
          </div>
        )}
        
        {/* Percentage Display - Positioned based on Step9 configuration */}
        {loadingConfig.showPercentage && percentagePosition !== 'center' && (
          <div 
            className="loading-percentage-positioned" 
            style={{
              position: 'absolute',
              ...getPercentagePosition(),
              color: loadingConfig.accentColor,
              fontSize: '16px',
              fontWeight: '600',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              zIndex: 2002
            }}
          >
            {Math.round(progress)}%
          </div>
        )}
        
        {/* Loading Message */}
        <div 
          className="loading-text" 
          style={{ 
            position: 'absolute',
            left: '50%',
            top: '75%',
            transform: 'translateX(-50%)',
            color: loadingConfig.textColor
          }}
        >
          {message}
        </div>
        
        {/* Custom Message */}
        <div 
          className="loading-custom-message" 
          style={{ 
            position: 'absolute',
            left: \`\${customMessageConfig.x}%\`,
            top: \`\${customMessageConfig.y}%\`,
            transform: 'translate(-50%, -50%)',
            color: loadingConfig.textColor,
            fontSize: \`\${customMessageConfig.size}px\`
          }}
        >
          {customMessageConfig.text || loadingConfig.customMessage}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;`

export const generateInfoPage = (config: GameConfig) => {
  const symbols = Array.isArray(config.symbols) ? config.symbols : Object.values(config.symbols || {});
  const bonusSymbols = config?.theme?.generated?.bonusSymbols || {};
  
  // Use actual symbol keys from GameStore
  let symbolTypes: string[];
  if (!Array.isArray(config.symbols) && config.symbols && typeof config.symbols === 'object') {
    symbolTypes = Object.keys(config.symbols);
  } else {
    // Generate symbol types for array format
    symbolTypes = symbols.map((_, index) => {
      if (index === 0) return 'wild';
      if (index <= 3) return `high${index}`;
      if (index <= 6) return `medium${index - 3}`;
      return `low${index - 6}`;
    });
  }
  
  // Add bonus symbol types
  const bonusSymbolTypes: string[] = [];
  Object.keys(bonusSymbols).forEach(key => {
    const symbolName = key.replace('bonus_', '');
    bonusSymbolTypes.push(symbolName);
  });
  
  const allSymbols = [...symbols, ...Object.values(bonusSymbols)];
  const allSymbolTypes = [...symbolTypes, ...bonusSymbolTypes];
  
  // Generate symbol paytable (including bonus symbols)
  const getSymbolPaytable = (symbolType: string) => {
    if (symbolType === 'wild') {
      return { 3: 50, 4: 200, 5: 1000 };
    } else if (symbolType === 'scatter') {
      return { 3: 10, 4: 50, 5: 200 };
    } else if (symbolType === 'bonus') {
      return { 3: 20, 4: 100, 5: 500 };
    } else if (symbolType.startsWith('high')) {
      const multiplier = 4 - (parseInt(symbolType.replace('high', '')) || 1);
      return { 3: 15 + multiplier * 5, 4: 60 + multiplier * 20, 5: 300 + multiplier * 100 };
    } else if (symbolType.startsWith('medium')) {
      const multiplier = 3 - (parseInt(symbolType.replace('medium', '')) || 1);
      return { 3: 6 + multiplier * 2, 4: 25 + multiplier * 8, 5: 100 + multiplier * 50 };
    } else if (symbolType.startsWith('low')) {
      const multiplier = 3 - (parseInt(symbolType.replace('low', '')) || 1);
      return { 3: 2 + multiplier * 1, 4: 10 + multiplier * 5, 5: 40 + multiplier * 20 };
    } else {
      return { 3: 5, 4: 20, 5: 80 };
    }
  };
  
  // Get available symbols with their actual names and paytables (including bonus symbols)
  const availableSymbols = allSymbols.map((symbolUrl, index) => {
    if (!symbolUrl) return null;
    const symbolName = allSymbolTypes[index] || `symbol_${index + 1}`;
    const paytable = getSymbolPaytable(symbolName);
    return {
      name: symbolName,
      path: `/assets/symbols/${symbolName}.png`,
      paytable
    };
  }).filter(Boolean);

  return `import React from 'react';

interface InfoPageProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
}

const InfoPage: React.FC<InfoPageProps> = ({ isOpen, onClose, gameTitle }) => {
  if (!isOpen) return null;

  const formatSymbolName = (name: string) => {
    return name.replace(/(\\d+)$/, ' $1');
  };

  const symbols = [
    ${availableSymbols.map(symbol => `{ name: '${symbol?.name}', path: '${symbol?.path}', paytable: ${JSON.stringify(symbol?.paytable)} }`).join(',\n    ')}
  ];

  const gameRules = [
    'Match 3 or more identical symbols on adjacent reels to win',
    'Wild symbols substitute for all other symbols except scatter',
    'Scatter symbols trigger bonus features when 3+ appear anywhere',
    'Higher value symbols pay more than lower value symbols',
    'All wins are multiplied by the current bet amount'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[3000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-4xl max-h-[90vh] w-[90%] overflow-y-auto shadow-2xl border border-gray-600" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-600">
          <h1 className="text-3xl font-bold text-yellow-400 text-shadow">{gameTitle}</h1>
          <button className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div className="mb-8">
          <h2 className="text-white text-2xl mb-4 font-semibold">Game Symbols</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {symbols.map((symbol, index) => (
              <div key={index} className="flex items-center gap-4 bg-white bg-opacity-5 p-4 rounded-xl border border-gray-600 hover:bg-opacity-10 transition-all hover:-translate-y-1">
                <img src={symbol.path} alt={symbol.name} className="w-16 h-16 object-contain rounded-lg bg-white bg-opacity-10 p-1" />
                <div className="flex flex-col gap-1">
                  <span className="text-white font-semibold text-base tracking-wide">{formatSymbolName(symbol.name).toUpperCase()}</span>
                  <div className="flex flex-col gap-0.5">
                    {Object.entries(symbol.paytable).map(([count, payout]) => (
                      <span key={count} className="text-yellow-400 text-xs font-medium">{count}x = {payout}x</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-white text-2xl mb-4 font-semibold">Game Rules</h2>
          <ul className="list-none p-0 m-0">
            {gameRules.map((rule, index) => (
              <li key={index} className="text-gray-300 text-base leading-relaxed mb-3 pl-6 relative before:content-['•'] before:text-yellow-400 before:text-xl before:absolute before:left-0 before:-top-0.5">{rule}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InfoPage;`;
};

export const generateMenuModal = () => `import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { TabType, MenuModalProps } from '../types';

const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // if (!isOpen) return null;

  const handleTabClick = (tab: TabType) => {
    if (tab === 'logout') {
      setShowLogoutConfirm(true);
      setActiveTab('logout');
    } else {
      setShowLogoutConfirm(false);
      setActiveTab(tab);
    }
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('game_logged_in');
    onLogout();
    onClose();
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
    setActiveTab('account');
  };

  const renderContent = () => {
    if (showLogoutConfirm) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h3 className="text-red-400 text-2xl mb-4">Confirm Logout</h3>
          <p className="text-gray-300 text-base mb-8">Are you sure you want to logout?</p>
          <div className="flex gap-4">
            <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:-translate-y-0.5" onClick={handleLogoutConfirm}>Yes</button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold border border-gray-500 transition-all hover:-translate-y-0.5" onClick={handleLogoutCancel}>No</button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'account':
        return (
          <div>
           <h3 className="text-white text-2xl mb-6 font-semibold">Account Information</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-600">
                <label className="text-gray-400 font-medium">Player ID:</label>
                <span className="text-white font-semibold">DEMO_USER_001</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-600">
                <label className="text-gray-400 font-medium">Account Type:</label>
                <span className="text-white font-semibold">Demo Account</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-600">
                <label className="text-gray-400 font-medium">Registration Date:</label>
                <span className="text-white font-semibold">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-600">
                <label className="text-gray-400 font-medium">Status:</label>
                <span className="text-green-500 font-semibold">Active</span>
              </div>
            </div>
          </div>
        );
      case 'history':
        return (
          <div>
            <h3 className="text-white text-2xl mb-6 font-semibold">Game History</h3>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-4 p-3 bg-white bg-opacity-5 rounded-lg items-center">
                <span className="text-gray-400 text-sm">{new Date().toLocaleDateString()}</span>
                <span className="text-white font-medium">Game Started</span>
                <span className="text-right text-white font-semibold">-</span>
              </div>
              <div className="grid grid-cols-3 gap-4 p-3 bg-white bg-opacity-5 rounded-lg items-center">
                <span className="text-gray-400 text-sm">{new Date().toLocaleDateString()}</span>
                <span className="text-white font-medium">Demo Spin</span>
                <span className="text-right text-green-500 font-semibold">+$50</span>
              </div>
              <div className="grid grid-cols-3 gap-4 p-3 bg-white bg-opacity-5 rounded-lg items-center">
                <span className="text-gray-400 text-sm">{new Date().toLocaleDateString()}</span>
                <span className="text-white font-medium">Demo Spin</span>
                <span className="text-right text-red-400 font-semibold">-$10</span>
              </div>
            </div>
          </div>
        );
      case 'help':
        return (
          <div>
            <h3 className="text-white text-2xl mb-6 font-semibold">Help & Support</h3>
            <div className="flex flex-col gap-6">
              <div>
                <h4 className="text-yellow-400 text-lg mb-3 font-semibold">Contact Information</h4>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3 items-center">
                    <strong className="text-gray-300 min-w-[80px]">Email:</strong>
                    <span className="text-white">support@demogame.com</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <strong className="text-gray-300 min-w-[80px]">Phone:</strong>
                    <span className="text-white">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <strong className="text-gray-300 min-w-[80px]">Hours:</strong>
                    <span className="text-white">24/7 Demo Support</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-yellow-400 text-lg mb-3 font-semibold">Quick Help</h4>
                <ul className="list-none p-0 m-0">
                  <li className="text-gray-300 py-2 pl-5 relative before:content-['•'] before:text-yellow-400 before:absolute before:left-0">Click SPIN to start the game</li>
                  <li className="text-gray-300 py-2 pl-5 relative before:content-['•'] before:text-yellow-400 before:absolute before:left-0">Use +/- buttons to adjust your bet</li>
                  <li className="text-gray-300 py-2 pl-5 relative before:content-['•'] before:text-yellow-400 before:absolute before:left-0">Match symbols to win prizes</li>
                  <li className="text-gray-300 py-2 pl-5 relative before:content-['•'] before:text-yellow-400 before:absolute before:left-0">Check your balance in the top left</li>
                </ul>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
   <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Menu" 
      className="w-4/5 max-w-4xl h-4/5 max-h-[700px]"
    >
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 bg-black bg-opacity-20 py-6 flex flex-col gap-2 border-r border-gray-600">
          <button 
            className={\`bg-transparent border-none text-gray-300 px-6 py-4 text-left text-base font-medium cursor-pointer transition-all border-l-4 border-transparent hover:bg-white hover:bg-opacity-5 hover:text-white \${
              activeTab === 'account' ? 'bg-yellow-400 bg-opacity-10 text-yellow-400 border-l-yellow-400' : ''
            }\`}
            onClick={() => handleTabClick('account')}
          >
            Account
          </button>
          <button 
            className={\`bg-transparent border-none text-gray-300 px-6 py-4 text-left text-base font-medium cursor-pointer transition-all border-l-4 border-transparent hover:bg-white hover:bg-opacity-5 hover:text-white \${
              activeTab === 'history' ? 'bg-yellow-400 bg-opacity-10 text-yellow-400 border-l-yellow-400' : ''
            }\`}
            onClick={() => handleTabClick('history')}
          >
            History
          </button>
          <button 
            className={\`bg-transparent border-none text-gray-300 px-6 py-4 text-left text-base font-medium cursor-pointer transition-all border-l-4 border-transparent hover:bg-white hover:bg-opacity-5 hover:text-white \${
              activeTab === 'help' ? 'bg-yellow-400 bg-opacity-10 text-yellow-400 border-l-yellow-400' : ''
            }\`}
            onClick={() => handleTabClick('help')}
          >
            Help
          </button>
          <button 
            className={\`menu-tab logout-tab \${activeTab === 'logout' ? 'active' : ''}\`}
            onClick={() => handleTabClick('logout')}
          >
            Logout
          </button>
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </BaseModal>
  );
};

export default MenuModal;`;

export const baseModal = () => `
import React from 'react';
import { ModalProps, BaseModalProps } from '../types';

// Core Modal Component
 const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  className = '', 
  overlayClassName = '',
  closeOnOverlayClick = true,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && onClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={\`modal-overlay \${overlayClassName}\`} onClick={handleOverlayClick}>
      <div className={\`modal-content \${className}\`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

// Base Modal with Header (Main Export)
const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      className={className}
      showCloseButton={true}
    >
      <div className="modal-header">
        <h2>{title}</h2>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ×
          </button>
      </div>
      <div className="modal-body">
        {children}
      </div>
    </Modal>
  );
};

// Export both for flexibility
export { Modal };
export default BaseModal;`

export const anouncementModal = () => `import React, { useState, useEffect } from 'react';
import { Modal } from './BaseModal';
import { SAFE_COLORS, SafeColor } from '../types';
import { createAnnouncementSystem } from '../utils/announcementSystem';

interface AnnouncementModalProps {
  isOpen: boolean;
  title: string;
  subtitle: string;
  info?: string;
  bgColor: SafeColor | string;
  imageType?: string; // Type of announcement for image lookup
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ 
  isOpen, title, subtitle, info, bgColor, imageType 
}) => {
  const [announcementImage, setAnnouncementImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const announcementSystem = createAnnouncementSystem();

  // Check for announcement image when modal opens
  useEffect(() => {
    if (isOpen && imageType) {
      setImageLoaded(false);
      announcementSystem.checkAnnouncementImage(imageType)
        .then(imagePath => {
          setAnnouncementImage(imagePath);
          if (imagePath) {
            // Preload image for smooth display
            const img = new Image();
            img.onload = () => setImageLoaded(true);
            img.src = imagePath;
          }
        });
    } else {
      setAnnouncementImage(null);
      setImageLoaded(false);
    }
  }, [isOpen, imageType]);

  // Validate bgColor against safe colors or use default
  const safeColor = (bgColor in SAFE_COLORS) 
    ? SAFE_COLORS[bgColor as SafeColor] 
    : SAFE_COLORS.gold;

  return (
    <Modal 
      isOpen={isOpen} 
      className="announcement-content" 
      overlayClassName="announcement-overlay"
      closeOnOverlayClick={false}
    >
      {announcementImage ? (
        <div className="announcement-image-container">
          <img 
            src={announcementImage} 
            alt={title}
            className={\`announcement-image \${imageLoaded ? 'loaded' : 'loading'}\`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      ) : (
        <div style={{ background: safeColor }}>
          <h2>{title}</h2>
          <p>{subtitle}</p>
          {info && <div className="announcement-info">{info}</div>}
        </div>
      )}
    </Modal>
  );
};

export default AnnouncementModal;`