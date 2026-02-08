export const generateAppCss = () => `.App {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* Custom Keyframes for Tailwind animations */
@keyframes settingsSlideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes winPopupSlideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes colorPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.5);
  }
}

.slot-machine-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.game-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
  .hold-spin-top-bar{
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%);
  padding: 12px 24px;
  border-radius: 25px;
  z-index: 2000;
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
  animation: pulse 2s ease-in-out infinite;
}
  .hold-spin-counter{
  display: flex;
  align-items: center;
  justify-content: center;
}
 

  .hold-spin-win-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);   /* dark overlay */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;                     /* stay on top */
  animation: fadeIn 0.4s ease;
}

.hold-spin-win-content {
  background: linear-gradient(145deg, #1e1e1e, #2d2d2d);
  border: 2px solid gold;
  border-radius: 16px;
  padding: 32px 48px;
  text-align: center;
  box-shadow: 0 0 15px gold, 0 0 60px rgba(255, 215, 0, 0.5);
  color: #fff;
  max-width: 420px;
  animation: popIn 0.3s ease;
}

.hold-spin-win-content h2 {
  font-size: 1.8rem;
  margin-bottom: 20px;
  color: gold;
  text-shadow: 0 0 3px #ffda47, 0 0 12px #ff9800;
}

.hold-spin-win-amount {
  font-size: 1.5rem;
  margin-bottom: 16px;
}

.win-label {
  font-weight: bold;
  margin-right: 8px;
  color: #ccc;
}

.win-value {
  font-weight: bold;
  font-size: 2rem;
  color: #00ff7f; /* neon green for win */
  text-shadow: 0 0 3px #00ff7f, 0 0 16px #00cc66;
}

.hold-spin-win-details {
  font-size: 1rem;
  color: #aaa;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes popIn {
  from { transform: scale(0.8); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}


/* UI Overlay */
.slot-game-ui {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.8) 100%);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  z-index: 1000;
  font-family: 'Segoe UI', sans-serif;
}

/* UI Sections */
.ui-left, .ui-right {
  display: flex;
  align-items: center;
  gap: 24px;
  min-width: 200px;
}

.ui-center {
  display: flex;
  align-items: center;
  gap: 32px;
  flex: 1;
  justify-content: center;
}

/* Icon Buttons */
.menu-btn, .info-btn, .sound-btn, .settings-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-btn:hover, .info-btn:hover, .sound-btn:hover, .settings-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

/* Sound Control Container */
.sound-control-container, .settings-control-container {
  position: relative;
  display: flex;
  align-items: center;
}

.sound-bar-popup {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 16px 12px;
  backdrop-filter: blur(10px);
  z-index: 1001;
  animation: soundBarSlideUp 0.2s ease-out;
}

@keyframes soundBarSlideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.sound-bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  height: 120px;
}

.sound-bar-track {
  position: relative;
  width: 6px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.sound-bar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, #FFB800 0%, #FFD700 100%);
  border-radius: 3px;
  transition: height 0.1s ease;
}

.sound-bar-handle {
  position: absolute;
  left: 50%;
  transform: translateX(-50%) translateY(50%);
  width: 12px;
  height: 12px;
  background: #FFD700;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: bottom 0.1s ease;
  opacity: 0;
  pointer-events: none;
}

.sound-bar-track:hover .sound-bar-handle {
  opacity: 1;
}

.sound-slider {
  position: absolute;
  top: 0;
  left: -10px;
  width: 26px;
  height: 80px;
  opacity: 0;
  cursor: pointer;
  transform: rotate(-90deg);
}

.sound-value {
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  min-width: 35px;
}


/* Button Icons */
.button-icon {
  width: 45px;
  height: 45px;
  object-fit: contain;
  filter: brightness(0.8);
  transition: filter 0.2s ease;
}

.button-icon:hover {
  filter: brightness(1);
}

.spin-button-icon {
  width: 75px;
  height: 75px;
  object-fit: contain;
}

/* Control Buttons with Labels */
.auto-btn, .quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.auto-btn:hover, .quick-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.auto-btn.active {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border: 1px solid #2ecc71;
}

.auto-btn.active:hover {
  background: rgba(46, 204, 113, 0.3);
  color: #27ae60;
}

.auto-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auto-btn:disabled:hover {
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
}

/* Modal Header and Close Button */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  color: white;
  margin: 0;
  font-size: 20px;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #bdc3c7;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Main Spin Button */
.main-spin-btn {
  background: linear-gradient(135deg, #FFB800 0%, #FFA000 100%);
  border: none;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(255, 184, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.main-spin-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(255, 184, 0, 0.6);
}

.main-spin-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.main-spin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, #666 0%, #555 100%);
}

.main-spin-btn.spinning {
  animation: spin-pulse 1s ease-in-out infinite;
}

@keyframes spin-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Animation feedback */
.reel-container {
  transition: filter 0.3s ease;
}

.reel-container.spinning {
  filter: blur(2px);
}

/* Performance optimizations */
.game-canvas {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Step7 Integration Indicators */
.animation-status {
  position: fixed;
  top: 40px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1001;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.animation-status.visible {
  opacity: 1;
}

.animation-status.speed-indicator::before {
  content: '🎯 ';
}

.animation-status.blur-indicator::before {
  content: '💫 ';
}

.animation-status.easing-indicator::before {
  content: '🌊 ';
}

/* Display Elements */
.bet-display, .balance-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.bet-display .label, .balance-display .label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 1);
  margin-bottom: 2px;
  letter-spacing: 0.5px;
}

.value{
  display: flex ;
  gap: 4px;
  align-items: center;
}
  
.bet-control-buttons{
  cursor: pointer;
}

.bet-display .value, .balance-display .value {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.bet-controls {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.bet-controls button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 24px;
  height: 20px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
}

.bet-controls button:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Win Display */
.win-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.win-display .label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 1);
  margin-bottom: 2px;
  letter-spacing: 0.5px;
}

.win-display .value {
  font-size: 14px;
  font-weight: 600;
  color: #FFB800;
  text-shadow: 0 0 8px rgba(255, 184, 0, 0.6);
}

/* Right Side Win Display with Number Images */
.right-win-display {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: whitesmoke;
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(25px);
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.4);
  z-index: 1500;
  animation: zoomInOut 2.1s ease-out infinite;
}

@keyframes zoomInOut {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.09);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

@keyframes winDisplaySlideIn {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

/* Animated Number Effects */
.animated-number {
  display: inline-block;
  animation: numberPulse 0.3s ease-out;
  transition: all 0.2s ease;
}

.animated-number:hover {
  transform: scale(1.1);
}

@keyframes numberPulse {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.win-amount-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.win-currency {
  font-size: 24px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
}

.win-digits {
  display: flex;
  align-items: center;
}

.win-digit-image {
  height: 32px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
}
  .win-decimal-image {
  height: 22px;
  width: auto;
  object-fit: contain;
  margin-top: 12px;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
}

.win-digit-text {
  font-size: 24px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
}

/* Branding Bar */
.branding-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  padding: 6px 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
}

.brand-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  font-weight: 500;
}

/* Enhanced Loading Overlay - Step9 Integration */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  overflow: hidden;
}

.loading-content {
  position: relative;
  width: 100%;
  height: 100%;
  color: white;
}

/* Studio Logo */
.loading-logo {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2001;
}

.loading-logo-image {
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(255, 184, 0, 0.3);
  animation: logo-glow 1s ease-in-out infinite alternate;
}

.loading-logo-placeholder {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #FFB800 0%, #FFA000 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: white;
  box-shadow: 0 8px 32px rgba(255, 184, 0, 0.3);
  animation: logo-glow 2s ease-in-out infinite alternate;
}

@keyframes logo-glow {
  0% { box-shadow: 0 8px 32px rgba(255, 184, 0, 0.3); }
  100% { box-shadow: 0 12px 48px rgba(255, 184, 0, 0.5); }
}

/* Loading Sprite */
.loading-sprite-container {
  position: absolute;
  top: 65%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2002;
}

.loading-sprite-image {
  object-fit: contain;
  filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
}

.loading-sprite {
  width: 40px;
  height: 40px;
  background: radial-gradient(circle, #FFD700 0%, #FFA500 70%, #FF8C00 100%);
  border-radius: 50%;
  position: relative;
  box-shadow: 
    0 0 20px rgba(255, 215, 0, 0.6),
    inset 0 0 20px rgba(255, 255, 255, 0.2);
}

.loading-sprite::before {
  content: '';
  position: absolute;
  top: 20%;
  left: 20%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 50%);
  border-radius: 50%;
}

@keyframes sprite-roll {
  0% { transform: rotate(0deg) translateX(0px); }
  25% { transform: rotate(90deg) translateX(10px); }
  50% { transform: rotate(180deg) translateX(0px); }
  75% { transform: rotate(270deg) translateX(-10px); }
  100% { transform: rotate(360deg) translateX(0px); }
}

@keyframes sprite-bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -15px, 0);
  }
  70% {
    transform: translate3d(0, -8px, 0);
  }
  90% {
    transform: translate3d(0, -3px, 0);
  }
}

@keyframes sprite-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Animation classes for loading sprite */
.sprite-bounce {
  animation: sprite-bounce 2s ease-in-out infinite;
}

.sprite-pulse {
  animation: sprite-pulse 1.5s ease-in-out infinite;
}

.sprite-roll {
  animation: sprite-roll 2s linear infinite;
}

/* Progress Bar */
.loading-progress {
  position: absolute;
  top: 65%;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  max-width: 400px;
  z-index: 2001;
}

/* Circular Progress */
.loading-progress-circular {
  position: absolute;
  z-index: 2001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circular-progress {
  transform: rotate(-90deg);
}

.circular-progress-bg {
  opacity: 0.3;
}

.circular-progress-fill {
  transition: stroke-dashoffset 0.3s ease;
  filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));
}

.circular-percentage {
  position: absolute;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.loading-bar {
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hiden;
  margin-bottom: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.loading-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700 0%, #FFB800 50%, #FFA000 100%);
  border-radius: 6px;
  transition: width 0.3s ease;
  position: relative;
  box-shadow: 
    0 0 10px rgba(255, 215, 0, 0.5),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.loading-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, transparent 100%);
  border-radius: 6px 6px 0 0;
}

.loading-percentage {
  font-size: 16px;
  font-weight: 600;
  color: #FFD700;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-top: 5px;
}

/* Loading Text */
.loading-text {
  position: absolute;
  top: 75%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  z-index: 2001;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  animation: text-fade 2s ease-in-out infinite alternate;
}

@keyframes text-fade {
  0% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* Custom Message */
.loading-custom-message {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  z-index: 2001;
  letter-spacing: 1px;
}

/* Background Animation */
.loading-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(255, 184, 0, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(255, 140, 0, 0.05) 0%, transparent 50%);
  animation: background-pulse 4s ease-in-out infinite alternate;
}

@keyframes background-pulse {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Sound Bar & Settings Responsive */
@media (max-width: 768px) {
  .sound-bar-popup {
    bottom: 50px;
    padding: 12px 8px;
  }
  
  .sound-bar-container {
    height: 100px;
    gap: 8px;
  }
  
  .sound-bar-track {
    height: 60px;
  }
  
  .sound-value {
    font-size: 10px;
  }
  
  .sound-bar-handle {
    width: 10px;
    height: 10px;
  }
  
  .settings-popup {
    bottom: 50px;
    right: -20px;
    min-width: 180px;
    padding: 12px;
  }
  
  .volume-track {
    width: 60px;
  }
  
  .volume-handle {
    width: 10px;
    height: 10px;
  }
  
  .settings-label {
    font-size: 12px;
  }
  
  .volume-value {
    font-size: 10px;
  }
}

/* Free Spin Feature Styles */
.free-spin-announcement,
.pick-click-announcement {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.5s ease-out;
}

.free-spin-content {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(255, 215, 0, 0.5);
  animation: bounceIn 0.6s ease-out;
}

.free-spin-content h2 {
  font-size: 32px;
  font-weight: bold;
  color: #000;
  margin: 0 0 16px 0;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.3);
}

.free-spin-content p {
  font-size: 24px;
  font-weight: 600;
  color: #000;
  margin: 0 0 12px 0;
}

.scatter-info {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.free-spin-indicator {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%);
  padding: 12px 24px;
  border-radius: 25px;
  z-index: 2000;
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

.free-spin-text {
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.main-spin-btn.free-spin-mode {
  background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
}

.main-spin-btn.free-spin-mode:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(255, 107, 53, 0.6);
}


.scatter-info {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.free-spin-indicator {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%);
  padding: 12px 24px;
  border-radius: 25px;
  z-index: 2000;
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
  animation: pulse 2s ease-in-out infinite;
 transition: opacity 0.5s ease, transform 0.5s ease;
}

.free-spin-indicator.fade-out {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.free-spin-text {
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.main-spin-btn.free-spin-mode {
  background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
}

.main-spin-btn.free-spin-mode:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(255, 107, 53, 0.6);
}


@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(1.05);
  }
}

/* Wheel Bonus Styles */
.wheel-bonus-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
  animation: fadeIn 0.5s ease-out;
}

.wheel-bonus-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(255, 215, 0, 0.3);
  border: 2px solid #FFD700;
  max-width: 500px;
  width: 90%;
}

.wheel-bonus-header h2 {
  color: #FFD700;
  font-size: 32px;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.wheel-bonus-header p {
  color: white;
  font-size: 18px;
  margin: 0 0 30px 0;
}

.wheel-canvas {
  border: 3px solid #FFD700;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.wheel-canvas:hover {
  transform: scale(1.05);
}

.wheel-instructions {
  color: white;
  font-size: 16px;
  margin: 20px 0;
  font-weight: 500;
}

.wheel-result {
  margin-top: 20px;
  padding: 20px;
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid #FFD700;
  border-radius: 10px;
}

.wheel-result h3 {
  color: #FFD700;
  font-size: 24px;
  margin: 0 0 15px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.collect-btn {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  color: #000;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
}

.collect-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .slot-game-ui {
    padding: 0 24px;
    height: 64px;
  }
  
  .ui-left, .ui-right {
    gap: 16px;
    min-width: 160px;
  }
  
  .ui-center {
    gap: 24px;
  }
  
  .main-spin-btn {
    width: 56px;
    height: 56px;
  }
  
  .loading-progress {
    width: 70%;
  }
  
  .circular-progress {
    width: 100px;
    height: 100px;
  }
  
  .circular-percentage {
    font-size: 16px;
  }
  
  
  .loading-sprite-image,
  .loading-sprite {
    width: 35px;
    height: 35px;
  }
}

@media (max-width: 768px) {
  .free-spin-content {
    padding: 30px 20px;
    margin: 0 20px;
  }
  
  .free-spin-content h2 {
    font-size: 24px;
  }
  
  .free-spin-content p {
    font-size: 18px;
  }
  
  .free-spin-indicator {
    top: 10px;
    padding: 8px 16px;
  }
  
  .free-spin-text {
    font-size: 14px;
  }
  
  .win-details-popup {
    min-width: 280px;
    max-width: 90vw;
    padding: 20px;
  }
  
  .win-details-header h3 {
    font-size: 20px;
  }
  
  .total-win {
    font-size: 16px;
  }
  
  .win-detail-item {
    padding: 10px 12px;
  }
  
  .line-number {
    font-size: 12px;
  }
  
  .win-amount {
    font-size: 14px;
  }
  
  .win-description {
    font-size: 11px;
  }
  
  .slot-game-ui {
    padding: 0 16px;
    height: 56px;
  }
  
  .ui-left, .ui-right {
    gap: 12px;
    min-width: 120px;
  }
  
  .ui-center {
    gap: 16px;
  }
  
  .main-spin-btn {
    width: 48px;
    height: 48px;
  }
  
  .bet-display .value, .balance-display .value, .win-display .value {
    font-size: 12px;
  }
  
  .right-win-display {
    right: 10px;
    padding: 12px;
  }
  
  .win-currency, .win-digit-text {
    font-size: 18px;
  }
  
  .win-digit-image {
    height: 24px;
  }
  
  .loading-text {
    font-size: 16px;
  }
  
  .loading-progress {
    width: 80%;
  }
  
  .circular-progress {
    width: 80px;
    height: 80px;
  }
  
  .circular-percentage {
    font-size: 14px;
  }
  
  .loading-sprite-image,
  .loading-sprite {
    width: 30px;
    height: 30px;
  }
  
  .loading-custom-message {
    font-size: 12px;
  }
  
  .animation-status {
    top: 20px;
    right: 10px;
    font-size: 10px;
    padding: 4px 8px;
  }
}

.pick-click-content {
  background: linear-gradient(135deg, #9C27B0 0%, #673AB7 100%);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(156, 39, 176, 0.5);
  animation: bounceIn 0.6s ease-out;
}

.pick-click-content h2 {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  margin: 0 0 16px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.pick-click-content p {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 12px 0;
}

.bonus-info {
  font-size: 16px;
  color: #E1BEE7;
  font-weight: 500;
}

.pick-click-win-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.5s ease-out;
}

.pick-click-win-content {
  background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(76, 175, 80, 0.5);
  animation: bounceIn 0.6s ease-out;
  border: 3px solid #FFD700;
}

.pick-click-win-content h2 {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  margin: 0 0 20px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.pick-click-win-amount {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.win-label {
  font-size: 18px;
  font-weight: 600;
  color: #E8F5E8;
}

.win-value {
  font-size: 36px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
  animation: numberPulse 1s ease-out infinite;
}

.pick-click-win-details {
  font-size: 16px;
  color: #E8F5E8;
  font-weight: 500;
}

/* Responsive Design for Info Modal */
@media (max-width: 768px) {

  .pick-click-content {
    padding: 30px 20px;
    margin: 0 20px;
  }
  
  .pick-click-content h2 {
    font-size: 24px;
  }
  
  .pick-click-content p {
    font-size: 18px;
  }
  
  .pick-click-win-content {
    padding: 30px 20px;
    margin: 0 20px;
  }
  
  .pick-click-win-content h2 {
    font-size: 24px;
  }
  
  .win-value {
    font-size: 28px;
  }
}
`;

export const modalCss = () =>`
/* Shared Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.5s ease-out;
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 32px;
  max-width: 800px;
  max-height: 90vh;
  width: 90%;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  color: #FFD700;
  margin: 0;
  font-size: 24px;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #bdc3c7;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* BaseModal Styles */
.modal-body {
  color: #ecf0f1;
}

/* Menu Modal Styles */
.menu-modal .modal-content {
  max-width: 900px;
  padding: 0;
  overflow: hidden;
}

.menu-body {
  display: flex;
  min-height: 500px;
}

.menu-sidebar {
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  width: 200px;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.menu-tab {
  background: none;
  border: none;
  color: #bdc3c7;
  padding: 15px 20px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
}

.menu-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.menu-tab.active {
  background: #3498db;
  color: white;
}

.menu-tab.logout-tab {
  margin-top: auto;
  color: #e74c3c;
}

.menu-tab.logout-tab:hover {
  background: #e74c3c;
  color: white;
}

.menu-content {
  flex: 1;
  padding: 30px;
}

.tab-content h3 {
  color: #FFD700;
  margin-bottom: 20px;
}

.account-info, .history-list, .help-content {
  color: #ecf0f1;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.status-active {
  color: #2ecc71;
  font-weight: bold;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.history-amount.win {
  color: #2ecc71;
}

.history-amount.loss {
  color: #e74c3c;
}

.logout-confirm {
  text-align: center;
  padding: 40px;
}

.logout-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 20px;
}

.logout-yes, .logout-no {
  padding: 10px 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.logout-yes {
  background: #e74c3c;
  color: white;
}

.logout-no {
  background: #95a5a6;
  color: white;
}

/* Pick & Click Modal Styles */
.pick-click-modal .modal-content {
  max-width: 600px;
}

.pick-click-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.pick-click-grid {
  display: grid;
  gap: 10px;
  margin: 20px 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.pick-click-cell {
  aspect-ratio: 1;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: 2px solid #2c3e50;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
  font-weight: bold;
  color: white;
  transition: all 0.3s ease;
  min-height: 80px;
}

.pick-click-cell:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

.pick-click-cell.revealed {
  cursor: default;
  transform: scale(1);
}

.pick-click-cell.revealed.high-prize {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  border-color: #d35400;
}

.pick-click-cell.revealed.medium-prize {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  border-color: #7d3c98;
}

.pick-click-cell.revealed.low-prize {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  border-color: #229954;
}

.pick-click-cell.revealed.extra-pick {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  border-color: #a93226;
}

.pick-click-cell.revealed.multiplier {
  background: linear-gradient(135deg, #f1c40f, #f39c12);
  border-color: #e67e22;
}

.number-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.digit-image {
  height: 30px;
  width: auto;
}

.digit-text {
  font-size: 24px;
  font-weight: bold;
}

.pick-click-complete {
  text-align: center;
  margin-top: 20px;
  padding: 20px;
  background: rgba(46, 204, 113, 0.2);
  border-radius: 8px;
}

.final-win {
  font-size: 24px;
  color: #f1c40f;
  margin: 10px 0;
}

.collect-btn {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.collect-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);
}

/* Announcement Modal Styles */
.announcement-overlay {
  background: rgba(0, 0, 0, 0.9);
}

.announcement-content {
  background: transparent;
  color: white;
  text-align: center;
  padding: 0px;
  border-radius: 16px;
  max-width: 500px;
  animation: bounceIn 0.8s ease-out;
  overflow: hidden;
}

.announcement-content h2 {
  font-size: 32px;
  margin-bottom: 15px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.announcement-content p {
  font-size: 18px;
  margin-bottom: 10px;
}

.announcement-info {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 15px;
}

/* Announcement Image Styles */
.announcement-image-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.announcement-image {
  width: 100%;
  height: auto;
  border-radius: 12px;
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.announcement-image.loaded {
  opacity: 1;
  transform: scale(1);
}

.announcement-image.loading {
  opacity: 0;
  transform: scale(0.9);
}

/* Near Miss Modal Styles */
.near-miss-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
  animation: fadeIn 0.5s ease-out;
}

.near-miss-content {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  text-align: center;
  padding: 40px;
  border-radius: 16px;
  max-width: 450px;
  width: 90%;
  animation: shakeIn 0.8s ease-out;
  box-shadow: 0 20px 60px rgba(231, 76, 60, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.near-miss-content h2 {
  font-size: 28px;
  margin-bottom: 15px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  color: #fff;
}

.near-miss-content p {
  font-size: 18px;
  margin-bottom: 15px;
  font-weight: bold;
}

.near-miss-info {
  font-size: 16px;
  opacity: 0.9;
  margin: 15px 0;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 8px;
}

.near-miss-encouragement {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 20px;
  font-style: italic;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}`

export const animationCss = () => `
/* Shared Animations - Use Once */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes pulse {
  0%, 100% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.05); }
}

@keyframes popIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}`

export const generateThemeCss = () => `
/* Theme CSS Variables */
:root {
  /* Normal Theme */
  --theme-bg-primary: #1a1a2e;
  --theme-bg-secondary: #16213e;
  --theme-text-primary: #ffffff;
  --theme-text-secondary: #cccccc;
  --theme-accent: #ffd700;
  --theme-button-bg: #0f3460;
  --theme-button-hover: #16537e;
}

[data-theme="day"] {
  /* Day Theme */
  --theme-bg-primary: #f5f5dc;
  --theme-bg-secondary: #e6e6d4;
  --theme-text-primary: #2c1810;
  --theme-text-secondary: #32291c;
  --theme-accent: #ff8c00;
  --theme-button-bg: #daa520;
  --theme-button-hover: #b8860b;
}

[data-theme="night"] {
  /* Night Theme */
  --theme-bg-primary: #0a0a0a;
  --theme-bg-secondary: #1a1a1a;
  --theme-text-primary: #e0e0e0;
  --theme-text-secondary: #a0a0a0;
  --theme-accent: #4169e1;
  --theme-button-bg: #191970;
  --theme-button-hover: #483d8b;
}

/* Theme Button Styles */
.theme-selector {
  display: flex;
  gap: 8px;
  align-items: center;
}

.theme-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.theme-button.active {
  border-color: var(--theme-accent);
  box-shadow: 0 0 10px var(--theme-accent);
}

.theme-button:hover {
  transform: scale(1.1);
}

.theme-button.normal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.theme-button.day {
  background: linear-gradient(135deg, #f5f5dc 0%, #daa520 100%);
}

.theme-button.night {
  background: linear-gradient(135deg, #0a0a0a 0%, #4169e1 100%);
}

/* Apply theme colors to components */
.themed-component {
  background-color: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  transition: all 0.3s ease;
}

.themed-secondary {
  /* background-color: var(--theme-bg-secondary); */
  color: var(--theme-text-secondary);
  transition: all 0.3s ease;
}

.themed-button {
  background-color: var(--theme-button-bg);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-accent);
  transition: all 0.3s ease;
}

.themed-button:hover {
  background-color: var(--theme-button-hover);
}

/* Settings popup theming */
.settings-popup {
  border: 1px solid var(--theme-accent);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.settings-label {
  color: var(--theme-text-primary) !important;
}

.settings-description {
  color: var(--theme-text-secondary) !important;
}

/* UI displays theming */
.balance-display,
.bet-display,
.win-display {
  /* border: 1px solid var(--theme-accent); */
  border-radius: 8px;
  padding: 8px 12px;
}

.balance-display .label,
.bet-display .label,
.win-display .label {
  color: var(--theme-text-secondary);
  font-weight: bold;
}

.balance-display .value,
.bet-display .value,
.win-display .value {
  color: var(--theme-accent);
  font-weight: bold;
}

@keyframes shakeIn {
  0% {
    opacity: 0;
    transform: scale(0.5) rotate(-5deg);
  }
  25% {
    opacity: 0.5;
    transform: scale(0.8) rotate(2deg);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1) rotate(-1deg);
  }
  75% {
    opacity: 0.9;
    transform: scale(0.95) rotate(0.5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

`


