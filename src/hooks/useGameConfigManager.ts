import { useGameStore } from '../stores/gameStore';

export const useGameConfigManager = () => {
  const { 
    savedGameConfigs, 
    saveGameConfig, 
    loadGameConfig, 
    deleteGameConfig 
  } = useGameStore();

  return {
    savedConfigs: savedGameConfigs,
    saveConfig: saveGameConfig,
    loadConfig: loadGameConfig,
    deleteConfig: deleteGameConfig
  };
};