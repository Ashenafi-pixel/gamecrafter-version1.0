import { GameConfig } from './gameTypes';
export const generateIndexHtml = (gameName: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${gameName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

export const generateMainTsx = () => `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

export const generateAppTsx = (config: GameConfig) => `
import SlotMachine from './components/SlotMachine'
import { ThemeProvider } from './context/ThemeContext'
import './App.css'
import './styles/modals.css'
import './styles/theme.css'

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <SlotMachine/>
      </div>
    </ThemeProvider>
  )
}

export default App`;

export const generateIndexCss = () => `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
  overflow: hidden;
}

#root {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}`;

export const gitignore = () =>`
# Node modules
node_modules/

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS files
.DS_Store
Thumbs.db

# Build outputs
dist/
build/
.cache/
.tmp/

# IDE/editor settings
.vscode/
.idea/
*.swp

# Dependency locks (optional, if you don’t want to commit them)
# package-lock.json
# yarn.lock
# pnpm-lock.yaml
`

export const generateStore = () => `
import { create } from 'zustand';

interface GameStore {
    balance: number;
    setBalance: (fnOrValue: number | ((prev: number) => number)) => void;
    bet: number;
    setBet: (bet: number) => void;
    showMenu: boolean;
    setShowMenu: (showMenu: boolean) => void;
    showInfo: boolean;
    showSettings: boolean;
    setShowSettings: (showSettings: boolean) => void;
    setShowInfo: (showInfo: boolean) => void;
    isAutoPlay: boolean;
    setIsAutoPlay: (isAutoPlay: boolean) => void;
    isSpinning: boolean;
    setIsSpinning: (isSpinning: boolean) => void;
    isWinAnimationPlaying: boolean;
    setIsWinAnimationPlaying: (isWinAnimationPlaying: boolean) => void;
    isInFreeSpinMode: boolean;
    setIsInFreeSpinMode: (isInFreeSpinMode: boolean) => void;
    isInHoldSpinMode: boolean;
    setIsInHoldSpinMode: (isInHoldSpinMode: boolean) => void;
    holdSpinSpinsRemaining: number;
    setHoldSpinSpinsRemaining: (holdSpinSpinsRemaining: number) => void;
    freeSpinsRemaining: number;
    setFreeSpinsRemaining: (freeSpinsRemaining: number) => void;
    autoSpinCount: number;
    setAutoSpinCount: (autoSpinCount: number) => void;
    showSoundBar: boolean;
    setShowSoundBar: (showSoundBar: boolean) => void;
    soundVolume: number;
    setSoundVolume: (soundVolume: number) => void;
    showAutoPlaySettings: boolean;
    setShowAutoPlaySettings: (showAutoPlaySettings: boolean) => void;
}

export const useGameStore = create<GameStore>()((set) => ({
    balance: 1000,
    setBalance: (fnOrValue) =>
        set((state) => ({
          balance:
            typeof fnOrValue === 'function'
              ? fnOrValue(state.balance)
              : fnOrValue,
        })),
      
    bet: 10,
    setBet: (bet: number) => set({ bet }),
    showMenu: false,
    setShowMenu: (showMenu: boolean) => set({ showMenu }),
    showSettings: false,
    setShowSettings: (showSettings: boolean) => set({ showSettings }),
    showInfo: false,
    setShowInfo: (showInfo: boolean) => set({ showInfo }),
    isAutoPlay: false,
    setIsAutoPlay: (isAutoPlay: boolean) => set({ isAutoPlay }),
    isSpinning: false,
    setIsSpinning: (isSpinning: boolean) => set({ isSpinning }),
    isWinAnimationPlaying: false,
    setIsWinAnimationPlaying: (isWinAnimationPlaying: boolean) => set({ isWinAnimationPlaying }),
    isInFreeSpinMode: false,
    setIsInFreeSpinMode: (isInFreeSpinMode: boolean) => set({ isInFreeSpinMode }),
    isInHoldSpinMode: false,
    setIsInHoldSpinMode: (isInHoldSpinMode: boolean) => set({ isInHoldSpinMode }),
    holdSpinSpinsRemaining: 0,
    setHoldSpinSpinsRemaining: (holdSpinSpinsRemaining: number) => set({ holdSpinSpinsRemaining }),
    freeSpinsRemaining: 0,
    setFreeSpinsRemaining: (freeSpinsRemaining: number) => set({ freeSpinsRemaining }),
    autoSpinCount: 0,
    setAutoSpinCount: (autoSpinCount: number) => set({ autoSpinCount }),
    showSoundBar: false,
    setShowSoundBar: (showSoundBar: boolean) => set({ showSoundBar }),
    soundVolume: 75,
    setSoundVolume: (soundVolume: number) => set({ soundVolume }),
    showAutoPlaySettings: false,
    setShowAutoPlaySettings: (showAutoPlaySettings: boolean) => set({ showAutoPlaySettings }),
}));`