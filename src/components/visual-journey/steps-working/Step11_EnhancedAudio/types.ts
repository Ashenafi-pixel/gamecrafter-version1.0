import type { ReactNode } from "react";

export type SoundItemKey =
  | "bgm_main" | "bgm_alt_loop"
  | "reel_start" | "reel_loop" | "reel_stop_soft" | "reel_stop_hard"
  | "ui_spin_press" | "ui_click" | "ui_countdown" | "ui_coin_tally"
  | "win_small" | "win_medium" | "win_big" | "win_mega"
  | "bonus_trigger" | "fs_start" | "fs_end"
  | "feat_scatter" | "feat_nearmiss" | "feat_activate"
  | "amb_casino";

export type Answer = {
  sourceType: "generated" | "uploaded";
  prompt?: string;
  fileName?: string;
  url: string;
  lufs?: number;
  sr?: number;
  dur?: number;
  keySig?: string;
  bpm?: number;
  hasIssues?: boolean;
};

export type Pack = {
  key: string;
  icon: ReactNode;
  label: string;
  title: string;
  description?: string;
  items: Array<{
    key: SoundItemKey;
    label: string;
    placeholder?: string;
    defaultPrompt?: string;
    maxDuration?: number;
    defaultDuration?: number;
  }>;
  defaultVolume?: number;
};

export type ThemePreset = "Candy Land" | "Ancient Egypt" | "Western" | "Cyberpunk" | "Aztec" | "Custom";
export type QualityPreset = "Lite" | "Standard" | "AAA";

export type WizardState = {
  current: number;
  answers: Record<SoundItemKey, Answer | undefined>;
  themePreset: ThemePreset;
  qualityPreset: QualityPreset;
  abCompareMode: boolean;
  previousVersions: Record<SoundItemKey, Answer | undefined>;
  enabledItems: Record<string, Set<SoundItemKey>>;
  loadingStates: Record<SoundItemKey, boolean>;
};