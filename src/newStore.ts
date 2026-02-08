import {create} from 'zustand';
import { GameStoreTypes } from './newStoreTypes';

export const GameStore = create<GameStoreTypes>()((set) => ({
  projectName: '',
  balance: 1000,
  bet: 10,
  theme: '',
  gameType: '',
  gridPreset: { rows: 3, reels: 5 },
  betlines: 25,
  betlinePatterns: [],
  background: {
    image: '',
    style: '',
    position: { x: 0, y: 0 },
    scale: 100,
    fit: 'cover',
  },
  outerFrame: {
    image:'',
    scale: 100,
    position: { x: 0, y: 0 },
    stretch: { x: 0, y: 0 }
  },
  reelFrame: {
    image:'',
    gap: 5,
    position: { x: 0, y: 0 },
    stretch: { x: 0, y: 0 }
  },
  uiButtons : {
    playButton: '',
    autoPlayButton: '',
    menuButton: '',
    soundButton: '',
    settingsButton: ''
  },
  gameLogo : '',

  setProjectName: (name) => set({ projectName: name }),
  setBalance: (balance) => set({ balance: balance }),
  setBet: (bet) => set({ bet: bet }),
  setThemeName: (name) => set({ theme: name }),
  setGameType: (type) => set({ gameType: type }),
  setGridPreset: (preset) => set({ gridPreset: preset }),
  setBetlines: (betlines) => set({ betlines }),
  setBetlinePatterns: (betlinePatterns) => set({ betlinePatterns }),
  setBackground: (newBackground) => set((state) => ({
    background: { ...state.background, ...newBackground }
  })),
  setOuterFrame: (newOuterFrame) => set((state) => ({
    outerFrame: { ...state.outerFrame, ...newOuterFrame }
  })),
  setReelFrame: (newReelFrame) => set((state) => ({
    reelFrame: { ...state.reelFrame, ...newReelFrame }
  })),
  setUiButtons: (newUiButtons) => set((state) => ({
    uiButtons: { ...state.uiButtons, ...newUiButtons }
  })),
  setGameLogo: (gameLogo) => set({ gameLogo })
}));