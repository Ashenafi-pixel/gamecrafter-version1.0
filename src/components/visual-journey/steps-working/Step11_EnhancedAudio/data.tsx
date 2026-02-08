import type { Pack } from "./types";
import { Music, Disc, MousePointer, Trophy, Sparkles, Star, Waves } from "lucide-react";

export const packs: Pack[] = [
  {
    key: "background",
    icon: <Music className="h-5 w-5 uw:h-10 uw:w-10" />,
    label: "Background",
    title: "Background Music",
    description: "Set the musical foundation for your slot experience",
    items: [
      {
        key: "bgm_main",
        label: "Music Bed",
        placeholder: "Main background music for gameplay",
        defaultPrompt: "upbeat electronic, 120 BPM, light tension"
      },
      {
        key: "bgm_alt_loop",
        label: "Alternate Loop",
        placeholder: "Alternative music variation",
        defaultPrompt: "reduced texture, same key/BPM"
      }
    ]
  },
  {
    key: "reel",
    icon: <Disc className="h-5 w-5 uw:h-10 uw:w-10" />,
    label: "Reels",
    title: "Reel Pack",
    description: "Mechanical sounds for the spinning reels",
    items: [
      {
        key: "reel_start",
        label: "Reel Start",
        placeholder: "Sound when reels begin spinning",
        defaultPrompt: "soft whoosh, subtle click"
      },
      {
        key: "reel_loop",
        label: "Reel Loop",
        placeholder: "Continuous sound while reels are spinning",
        defaultPrompt: "gentle mechanical whirr"
      },
      {
        key: "reel_stop_soft",
        label: "Stop Soft",
        placeholder: "Gentle reel stop sound",
        defaultPrompt: "dampened clack"
      },
      {
        key: "reel_stop_hard",
        label: "Stop Hard",
        placeholder: "Sharp reel stop sound",
        defaultPrompt: "sharp clack + metallic ping"
      }
    ]
  },
  {
    key: "ui",
    icon: <MousePointer className="h-5 w-5 uw:h-10 uw:w-10" />,
    label: "UI Micro",
    title: "UI Micro Pack",
    description: "Small interface interaction sounds",
    items: [
      {
        key: "ui_spin_press",
        label: "Spin Press",
        placeholder: "Sound when pressing the spin button",
        defaultPrompt: "snappy click w/ tiny bass"
      },
      {
        key: "ui_click",
        label: "Click",
        placeholder: "General UI click sound",
        defaultPrompt: "soft tick"
      },
      {
        key: "ui_countdown",
        label: "Countdown",
        placeholder: "Countdown timer tick",
        defaultPrompt: "softened metronome"
      },
      {
        key: "ui_coin_tally",
        label: "Coin Tally",
        placeholder: "Sound for counting coins/credits",
        defaultPrompt: "percussive tick 120 BPM"
      }
    ]
  },
  {
    key: "wins",
    icon: <Trophy className="h-5 w-5 uw:h-10 uw:w-10" />,
    label: "Wins",
    title: "Win Suite",
    description: "Celebratory sounds for different win levels",
    items: [
      {
        key: "win_small",
        label: "Small Win",
        placeholder: "Sound for small wins",
        defaultPrompt: "0.6s bell arpeggio"
      },
      {
        key: "win_medium",
        label: "Medium Win",
        placeholder: "Sound for medium wins",
        defaultPrompt: "1.2s bells + chimes"
      },
      {
        key: "win_big",
        label: "Big Win",
        placeholder: "Sound for big wins",
        defaultPrompt: "2s brass + cymbal swell"
      },
      {
        key: "win_mega",
        label: "Mega Win",
        placeholder: "Sound for mega wins",
        defaultPrompt: "triumphant loop 120 BPM"
      }
    ]
  },
  {
    key: "bonus",
    icon: <Sparkles className="h-5 w-5 uw:h-10 uw:w-10" />,
    label: "Bonus",
    title: "Bonus Suite",
    description: "Special sounds for bonus features",
    items: [
      {
        key: "bonus_trigger",
        label: "Bonus Trigger",
        placeholder: "Sound when bonus is triggered",
        defaultPrompt: "rising whoosh + hit"
      },
      {
        key: "fs_start",
        label: "Free Spins Start",
        placeholder: "Sound when free spins begin",
        defaultPrompt: "shimmering swell"
      },
      {
        key: "fs_end",
        label: "Free Spins End",
        placeholder: "Sound when free spins end",
        defaultPrompt: "gentle resolve chord"
      }
    ]
  },
  {
    key: "features",
    icon: <Star className="h-5 w-5 uw:h-10 uw:w-10" />,
    label: "Features",
    title: "Feature & Tease",
    description: "Special event and near-miss sounds",
    items: [
      {
        key: "feat_scatter",
        label: "Scatter",
        placeholder: "Sound for scatter symbols",
        defaultPrompt: "crystalline ping"
      },
      {
        key: "feat_nearmiss",
        label: "Near Miss",
        placeholder: "Sound for near-miss events",
        defaultPrompt: "rising shimmer"
      },
      {
        key: "feat_activate",
        label: "Feature Activate",
        placeholder: "Sound when special features activate",
        defaultPrompt: "energetic burst"
      }
    ]
  },
  {
    key: "ambience",
    icon: <Waves className="h-5 w-5 uw:h-10 uw:w-10" />,
    label: "Ambience",
    title: "Ambience",
    description: "Background atmosphere for the casino setting",
    items: [
      {
        key: "amb_casino",
        label: "Casino Ambience",
        placeholder: "Background casino atmosphere",
        defaultPrompt: "distant crowd murmur, soft machines"
      }
    ]
  }
];