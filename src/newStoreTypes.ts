export interface GameStoreTypes {
    projectName: string;
    balance: number;
    bet: number;
    theme: string;
    gameType: string;
    gridPreset: { rows: number; reels: number };
    betlines: number;
    betlinePatterns: any[];
    background: {
      image: string;
      style?: string;
      position?: { x: number; y: number };
      scale?: number;
      fit?: string;
    };
    outerFrame: {
      image:string;
      scale: number;
      position: { x: number, y: number };
      stretch: { x: number, y: number };
    };
    reelFrame: {
      image:string;
      gap: number;
      position: { x: number, y: number };
      stretch: { x: number, y: number };
    };
    uiButtons : {
      playButton?: string;
      autoPlayButton?: string;
      menuButton?: string;
      soundButton?: string;
      settingsButton?: string;
    };
    gameLogo: string;
  
    setProjectName: (name: string) => void;
    setBalance: (balance: number) => void;
    setBet: (bet: number) => void;
    setThemeName: (name: string) => void;
    setGameType: (type: string) => void;
    setGridPreset: (preset: { rows: number; reels: number }) => void;
    setBetlines: (betlines: number) => void;
    setBetlinePatterns: (betlinePatterns: any[]) => void;
    setBackground: (background: Partial<GameStoreTypes['background']>) => void;
    setOuterFrame: (outerFrame: Partial<GameStoreTypes['outerFrame']>) => void;
    setReelFrame: (reelFrame: Partial<GameStoreTypes['reelFrame']>) => void;
    setUiButtons: (uiButtons: Partial<GameStoreTypes['uiButtons']>) => void;
    setGameLogo: (gameLogo: string) => void;
  }