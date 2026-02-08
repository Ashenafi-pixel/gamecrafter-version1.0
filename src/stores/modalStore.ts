import { create } from 'zustand';

interface ModalState {
  // Modal states
  isSpriteSheetGeneratorOpen: boolean;
  isImageGeneratorOpen: boolean;
  
  // Actions
  openSpriteSheetGenerator: () => void;
  closeSpriteSheetGenerator: () => void;
  openImageGenerator: () => void;
  closeImageGenerator: () => void;
  closeAllModals: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  // Initial state
  isSpriteSheetGeneratorOpen: false,
  isImageGeneratorOpen: false,
  
  // Actions
  openSpriteSheetGenerator: () => {
    set({ isSpriteSheetGeneratorOpen: true });
  },
  
  closeSpriteSheetGenerator: () => {
    set({ isSpriteSheetGeneratorOpen: false });
  },
  
  openImageGenerator: () => {
    set({ isImageGeneratorOpen: true });
  },
  
  closeImageGenerator: () => {
    set({ isImageGeneratorOpen: false });
  },
  
  closeAllModals: () => {
    set({
      isSpriteSheetGeneratorOpen: false,
      isImageGeneratorOpen: false,
    });
  },
}));
