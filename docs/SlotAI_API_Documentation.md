# SlotAI API Documentation

## Table of Contents
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Game Configuration Object](#game-configuration-object)
- [Theme Options](#theme-options)
- [Symbol Configuration](#symbol-configuration)
- [Bet Configuration](#bet-configuration)
- [RTP and Volatility](#rtp-and-volatility)
- [Reel Configuration](#reel-configuration)
- [Bonus Features](#bonus-features)
  - [Free Spins](#free-spins)
  - [Multipliers](#multipliers)
  - [Special Symbols](#special-symbols)
  - [Expanding Wilds](#expanding-wilds)
  - [Stacked Symbols](#stacked-symbols)
  - [Cascading Reels](#cascading-reels)
  - [Gamble Feature](#gamble-feature)
- [Animations](#animations)
  - [Symbol Animations](#symbol-animations)
  - [Win Animations](#win-animations)
  - [Special Effect Animations](#special-effect-animations)
- [Audio Configuration](#audio-configuration)
- [Mobile Optimization](#mobile-optimization)
- [Player Experience](#player-experience)
- [Analytics Integration](#analytics-integration)
- [Localization](#localization)
- [Certification](#certification)
- [Game Rules](#game-rules)
- [Distribution](#distribution)

## API Endpoints

### Configuration Management
```
GET    /api/v1/configurations           Get all game configurations
POST   /api/v1/configurations           Create new configuration
GET    /api/v1/configurations/:gameId   Get specific configuration
PUT    /api/v1/configurations/:gameId   Update configuration
PATCH  /api/v1/configurations/:gameId   Partial update
DELETE /api/v1/configurations/:gameId   Delete configuration
POST   /api/v1/configurations/:gameId/clone  Clone configuration
```

### Image Generation
```
POST /api/v1/generation/text-to-image   Generate slot imagery from prompt
POST /api/v1/openai/dalle               Generate images with DALL-E
```

### AI Integration
```
POST /api/test                          Test API connectivity
POST /api/analyze                       Analyze game description
POST /api/chat                          Chat with Claude AI
```

### Netlify Functions
```
POST /.netlify/functions/claude         AI functions (test/analyze/chat)
POST /.netlify/functions/generate-images Generate theme/symbol images
```

## Authentication

All API requests require authentication via API key:

```
Headers:
  Authorization: Bearer ${apiKey}
  X-API-Key: ${apiKey}
```

Different APIs may require different keys:
- Claude API key for AI services
- OpenAI API key for DALL-E image generation
- Gemini API key for Google's AI services

## Game Configuration Object

The main configuration object structure:

```json
{
  "id": "game-id",
  "version": "v1",
  "status": "active",
  "config": {
    "gameId": "game-id",
    "theme": { /* Theme configuration */ },
    "bet": { /* Bet configuration */ },
    "rtp": { /* RTP configuration */ },
    "volatility": { /* Volatility settings */ },
    "reels": { /* Reel configuration */ },
    "bonus": { /* Bonus features */ },
    "audio": { /* Audio settings */ },
    "playerExperience": { /* Player experience settings */ },
    "mobile": { /* Mobile optimization */ },
    "analytics": { /* Analytics integration */ },
    "certification": { /* Certification requirements */ },
    "distribution": { /* Distribution settings */ },
    "gameRules": { /* Game rules configuration */ },
    "localization": { /* Localization settings */ }
  }
}
```

## Theme Options

```json
"theme": {
  "mainTheme": "Deep Ocean",
  "artStyle": "cartoon",
  "colorScheme": "cool-blue",
  "mood": "mysterious",
  "description": "Underwater adventure with sea creatures",
  "includeCardSymbols": true,
  "includeWild": true,
  "includeScatter": true,
  "selectedSymbols": ["dolphin", "treasure", "seaweed"],
  "references": [
    "https://example.com/reference1.jpg",
    "https://example.com/reference2.jpg"
  ],
  "generated": {
    "background": "/path/to/background.png",
    "symbols": [
      "/path/to/symbol1.png", 
      "/path/to/symbol2.png"
    ],
    "frame": "/path/to/frame.png"
  }
}
```

Available art styles:
- cartoon
- realistic
- hand-drawn
- 3D
- pixel-art
- neon
- vintage
- minimalist
- comic
- watercolor

Available color schemes:
- warm-vibrant
- cool-blue
- golden-warm
- neon-bright
- mystical-purple
- earthy-natural
- pastel
- monochrome
- high-contrast
- seasonal (autumn, winter, spring, summer)

Available moods:
- mysterious
- playful
- exciting
- relaxing
- magical
- dark
- cheerful
- suspenseful
- romantic
- nostalgic

## Symbol Configuration

Found within the reels configuration:

```json
"symbols": {
  "count": {
    "total": 10,
    "high": 3,
    "medium": 3,
    "low": 4
  },
  "list": [
    {
      "id": "wild",
      "name": "Wild Symbol",
      "type": "wild",
      "imageUrl": "/path/to/wild.png",
      "animation": {
        "type": "particle",
        "effect": "sparkle",
        "duration": 2000,
        "onWin": true,
        "onAppear": false
      },
      "substitutes": ["all", "!scatter"],
      "multiplier": 2,
      "weight": 5,
      "payouts": {
        "3": 5,
        "4": 25,
        "5": 100
      }
    },
    {
      "id": "scatter",
      "name": "Scatter Symbol",
      "type": "scatter",
      "imageUrl": "/path/to/scatter.png",
      "animation": {
        "type": "reveal",
        "effect": "glow",
        "duration": 2500,
        "onWin": true,
        "onAppear": true
      },
      "triggers": "freespin",
      "count": {
        "3": 10,
        "4": 15,
        "5": 20
      },
      "weight": 3,
      "payouts": {
        "3": 3,
        "4": 10,
        "5": 50
      },
      "paysAnyway": true
    },
    {
      "id": "high1",
      "name": "High Symbol 1",
      "type": "high",
      "imageUrl": "/path/to/high1.png",
      "animation": {
        "type": "spin",
        "effect": "shine",
        "duration": 1500,
        "onWin": true,
        "onAppear": false
      },
      "weight": 8,
      "payouts": {
        "3": 3,
        "4": 10,
        "5": 50
      }
    },
    // Additional symbols...
  ]
}
```

Symbol types:
- wild
- scatter
- high
- medium
- low
- special
- bonus

Animation types:
- spin
- reveal
- particle
- pulse
- bounce
- flip
- shake
- zoom
- move
- fade
- rotate
- custom

Effect types:
- sparkle
- glow
- shine
- highlight
- explosion
- smoke
- flames
- bubbles
- shatter
- glitch
- rainbow
- lightning
- coins
- confetti

## Bet Configuration

```json
"bet": {
  "min": 0.20,
  "max": 100,
  "increment": 0.20,
  "quickOptions": [0.20, 0.50, 1.00, 5.00, 10.00, 20.00, 50.00, 100.00],
  "defaultBet": 1.00,
  "maxLines": 30,
  "defaultLines": 20,
  "linesCost": 0.01,
  "betMultiplier": 1,
  "selectableLines": true,
  "autospin": {
    "enabled": true,
    "options": [10, 25, 50, 100, "until feature"]
  },
  "currencySymbol": "$",
  "allowMaxBet": true
}
```

## RTP and Volatility

```json
"rtp": {
  "baseRTP": 92,
  "bonusRTP": 3,
  "featureRTP": 1,
  "targetRTP": 96,
  "volatilityScale": 6,
  "hitFrequency": 20,
  "maxWinMultiplier": 2500,
  "variants": [
    {
      "id": "high",
      "targetRTP": 96,
      "volatilityScale": 8,
      "marketRestrictions": ["UK", "SE"]
    },
    {
      "id": "medium",
      "targetRTP": 94,
      "volatilityScale": 6,
      "marketRestrictions": []
    },
    {
      "id": "low",
      "targetRTP": 92,
      "volatilityScale": 4,
      "marketRestrictions": ["US"]
    }
  ],
  "symbolContribution": {
    "high": 30,
    "medium": 20,
    "low": 15,
    "wild": 20,
    "scatter": 15
  }
},
"volatility": {
  "level": "medium", // low, medium, high, extreme
  "scale": 6, // 1-10
  "averageFeatureFrequency": 150, // spins
  "bigWinFrequency": 200, // spins
  "longestDrySpell": 100, // spins
  "settings": {
    "drySpellProtection": true,
    "progressiveRTP": false,
    "bigWinGuarantee": false
  }
}
```

## Reel Configuration

```json
"reels": {
  "layout": {
    "type": "standard", // standard, grid, hexagonal, irregular
    "rows": 3,
    "columns": 5,
    "visibleSymbols": {
      "reel1": 3,
      "reel2": 3,
      "reel3": 3,
      "reel4": 3,
      "reel5": 3
    }
  },
  "spinType": "spinning", // spinning, instant, cascading
  "spinSpeed": "medium", // slow, medium, fast
  "spinDirection": "down", // up, down
  "stopBehavior": "sequential", // sequential, random, all-at-once
  "weightedReels": true,
  "dynamicReels": false,
  "expandingReels": false,
  "reelStrips": {
    "base": {
      "reel1": ["wild", "high1", "medium1", "low1", "high2", "medium2", "low2"],
      "reel2": ["high1", "medium1", "low1", "scatter", "high2", "medium2", "low2"],
      "reel3": ["wild", "high1", "medium1", "low1", "high2", "scatter", "low2"],
      "reel4": ["high1", "medium1", "low1", "high2", "medium2", "low2", "scatter"],
      "reel5": ["wild", "high1", "medium1", "low1", "high2", "medium2", "low2"]
    },
    "freespin": {
      "reel1": ["wild", "wild", "high1", "medium1", "low1", "high2", "medium2"],
      "reel2": ["high1", "medium1", "low1", "scatter", "high2", "wild", "medium2"],
      "reel3": ["wild", "wild", "high1", "medium1", "scatter", "high2", "low2"],
      "reel4": ["high1", "medium1", "low1", "wild", "high2", "medium2", "scatter"],
      "reel5": ["wild", "wild", "high1", "medium1", "low1", "high2", "medium2"]
    }
  },
  "weightDistribution": {
    "base": {
      "reel1": [10, 10, 15, 20, 15, 15, 15],
      "reel2": [15, 15, 20, 5, 15, 15, 15],
      "reel3": [10, 15, 15, 20, 15, 5, 20],
      "reel4": [15, 15, 20, 15, 15, 15, 5],
      "reel5": [10, 15, 15, 20, 15, 15, 10]
    },
    "freespin": {
      "reel1": [15, 15, 15, 15, 15, 15, 10],
      "reel2": [15, 15, 15, 10, 15, 15, 15],
      "reel3": [15, 15, 15, 15, 10, 15, 15],
      "reel4": [15, 15, 15, 15, 15, 15, 10],
      "reel5": [15, 15, 15, 15, 15, 15, 10]
    }
  },
  "paymentType": "payline", // payline, ways, cluster, adjacency
  "paylines": [
    {"id": 1, "path": [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]]},
    {"id": 2, "path": [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]},
    {"id": 3, "path": [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]]},
    // Additional paylines...
  ],
  "clusters": {
    "minimumSize": 5,
    "diagonalAllowed": true,
    "payMultiplier": {
      "5": 1,
      "6": 2,
      "7": 3,
      "8": 5,
      "9": 10,
      "10+": 20
    }
  },
  "respin": {
    "enabled": false,
    "trigger": "winWithMultiplier",
    "maxRespins": 3,
    "multiplierProgression": [1, 2, 3, 5]
  }
}
```

## Bonus Features

```json
"bonus": {
  "freeSpins": {
    "enabled": true,
    "trigger": {
      "type": "scatter",
      "count": 3,
      "symbol": "scatter"
    },
    "count": {
      "3": 10,
      "4": 15,
      "5": 20
    },
    "multiplier": 1,
    "retrigger": true,
    "maxRetriggers": 3,
    "specialReels": true,
    "additionalFeatures": ["extra_wilds", "multiplier_progression"],
    "introAnimation": true,
    "outroAnimation": true,
    "backgroundChange": true,
    "musicChange": true,
    "guaranteedWin": false,
    "collectibles": false
  },
  "multipliers": {
    "base": {
      "enabled": true,
      "type": "symbol", // symbol, win, wild, feature
      "values": [2, 3, 5],
      "progression": {
        "enabled": false,
        "sequence": [1, 2, 3, 5, 10],
        "reset": "spin"
      },
      "display": "symbol", // symbol, overlay, meter
      "animation": "glow"
    },
    "feature": {
      "enabled": true,
      "type": "feature",
      "values": [2, 3, 5, 10],
      "progression": {
        "enabled": true,
        "sequence": [2, 3, 5, 10, 15, 20],
        "reset": "end_feature"
      },
      "display": "meter",
      "animation": "increment"
    }
  },
  "wilds": {
    "standard": {
      "enabled": true,
      "substitutes": ["all", "!scatter"],
      "multiplier": 1,
      "payouts": true
    },
    "expanding": {
      "enabled": true,
      "direction": "vertical",
      "trigger": "any_position",
      "animation": "expand"
    },
    "sticky": {
      "enabled": false,
      "duration": "feature",
      "animation": "pulse"
    },
    "stacked": {
      "enabled": true,
      "reels": [1, 5],
      "gameMode": "base" // base, feature, both
    },
    "random": {
      "enabled": false,
      "minCount": 1,
      "maxCount": 3,
      "trigger": "random",
      "gameMode": "feature"
    },
    "walking": {
      "enabled": false,
      "direction": "left",
      "stepsPerSpin": 1,
      "animation": "walk"
    }
  },
  "scatters": {
    "standard": {
      "enabled": true,
      "trigger": "freespin",
      "payouts": true,
      "paysAnyway": true
    },
    "collector": {
      "enabled": false,
      "targetCount": 10,
      "reward": "jackpot",
      "resetOn": "feature_end"
    }
  },
  "cascadingReels": {
    "enabled": false,
    "multiplierProgression": [1, 2, 3, 5],
    "maxCascades": 10,
    "removeMethod": "explode", // explode, fade, sink
    "fillMethod": "fall", // fall, slide, appear
    "speedIncrease": true
  },
  "respins": {
    "enabled": false,
    "trigger": "win",
    "winningSymbolsStick": true,
    "onlyAddNew": true,
    "maxRespins": 3,
    "endCondition": "no_new_symbols"
  },
  "gamble": {
    "enabled": true,
    "maxRounds": 5,
    "maxWinMultiplier": 32,
    "types": ["card_color", "card_suit", "ladder"],
    "defaultType": "card_color",
    "oddsCardColor": 0.5,
    "oddsCardSuit": 0.25,
    "oddsLadder": [0.5, 0.5, 0.4, 0.3, 0.2]
  },
  "buyFeature": {
    "enabled": false,
    "cost": 100,
    "features": ["freespin"],
    "rtpAdjustment": 0
  },
  "jackpot": {
    "enabled": false,
    "type": "fixed", // fixed, progressive, multi-level
    "levels": ["mini", "minor", "major", "grand"],
    "values": {
      "mini": 10,
      "minor": 50,
      "major": 500,
      "grand": 10000
    },
    "trigger": "symbol_combination",
    "triggerChance": 0.0001
  },
  "bonusGame": {
    "enabled": false,
    "type": "pick_and_click",
    "trigger": "scatter",
    "options": 12,
    "picksAllowed": 3,
    "prizes": ["cash", "multiplier", "freespin"],
    "maxWin": 100
  },
  "megaways": {
    "enabled": false,
    "minWays": 324,
    "maxWays": 117649,
    "variableReels": true,
    "cascading": true
  }
}
```

### Free Spins

Free spin configuration options:
- `enabled`: Whether free spins are enabled
- `trigger`: What triggers free spins (scatter, bonus, etc.)
- `count`: Number of free spins awarded (based on trigger count)
- `multiplier`: Win multiplier during free spins
- `retrigger`: Whether free spins can be retriggered
- `maxRetriggers`: Maximum number of retriggers allowed
- `specialReels`: Whether special reels are used
- `additionalFeatures`: Additional features during free spins

### Multipliers

Multiplier configuration options:
- `enabled`: Whether multipliers are enabled
- `type`: Type of multiplier (symbol, win, wild, feature)
- `values`: Possible multiplier values
- `progression`: Progression settings for multipliers
- `display`: How multipliers are displayed

### Special Symbols

#### Wilds

Wild symbol options:
- `standard`: Regular wild symbols
- `expanding`: Wilds that expand to cover reels
- `sticky`: Wilds that stay for multiple spins
- `stacked`: Wilds that appear stacked on reels
- `random`: Randomly added wilds
- `walking`: Wilds that move positions between spins

#### Scatters

Scatter symbol options:
- `standard`: Regular scatter symbols
- `collector`: Scatters that accumulate for rewards

### Expanding Wilds

Expanding wild configuration:
- `enabled`: Whether expanding wilds are enabled
- `direction`: Direction of expansion (vertical, horizontal, both)
- `trigger`: When wilds expand
- `animation`: Expansion animation

### Stacked Symbols

Stacked symbol configuration:
- `enabled`: Whether stacked symbols are enabled
- `symbols`: Which symbols can appear stacked
- `reels`: Which reels have stacked symbols
- `gameMode`: When stacked symbols appear

### Cascading Reels

Cascading reels configuration:
- `enabled`: Whether cascading reels are enabled
- `multiplierProgression`: Multiplier increase with cascades
- `maxCascades`: Maximum number of cascades per spin
- `removeMethod`: How winning symbols are removed
- `fillMethod`: How empty positions are filled

### Gamble Feature

Gamble feature configuration:
- `enabled`: Whether gamble feature is enabled
- `maxRounds`: Maximum number of gamble rounds
- `maxWinMultiplier`: Maximum win multiplier
- `types`: Types of gamble games available
- `odds`: Odds for different gamble options

## Animations

```json
"animations": {
  "symbols": {
    "idle": {
      "enabled": true,
      "type": "subtle",
      "frequency": "random",
      "duration": 2000
    },
    "win": {
      "enabled": true,
      "type": "highlight",
      "duration": 3000,
      "bySymbolType": {
        "wild": "sparkle",
        "scatter": "pulse",
        "high": "zoom",
        "medium": "bounce",
        "low": "shine"
      }
    },
    "appear": {
      "enabled": true,
      "type": "fade",
      "duration": 200,
      "stagger": true
    }
  },
  "reels": {
    "spin": {
      "type": "standard", // standard, blur, 3d
      "acceleration": true,
      "deceleration": true,
      "duration": {
        "min": 800,
        "max": 1200
      },
      "blurAmount": 5,
      "easing": "cubic-bezier(0.25, 0.1, 0.25, 1)"
    },
    "anticipation": {
      "enabled": true,
      "trigger": {
        "twoScatters": true,
        "potentialBigWin": true
      },
      "type": "shake",
      "duration": 3000,
      "sound": true
    },
    "stop": {
      "type": "bounce",
      "stagger": true,
      "staggerTime": 200,
      "duration": 300
    }
  },
  "wins": {
    "standard": {
      "enabled": true,
      "type": "sequential", // sequential, all-at-once
      "duration": 2000,
      "paylineDisplay": true,
      "symbolHighlight": true,
      "soundCue": true
    },
    "bigWin": {
      "enabled": true,
      "threshold": 50, // x bet
      "type": "explosion",
      "duration": 5000,
      "particles": true,
      "cameraShake": true,
      "slowMotion": true
    },
    "megaWin": {
      "enabled": true,
      "threshold": 100, // x bet
      "type": "coins",
      "duration": 8000,
      "particles": true,
      "specialBackground": true
    },
    "epicWin": {
      "enabled": true,
      "threshold": 250, // x bet
      "type": "fireworks",
      "duration": 10000,
      "specialEffects": ["confetti", "flare", "zoom"]
    }
  },
  "features": {
    "freeSpin": {
      "intro": {
        "enabled": true,
        "type": "sequence",
        "duration": 5000,
        "skippable": true,
        "elements": ["logo", "counter", "background_change"]
      },
      "outro": {
        "enabled": true,
        "type": "summary",
        "duration": 3000,
        "skippable": true,
        "elements": ["total_win", "return_transition"]
      }
    },
    "bonusGame": {
      "intro": {
        "enabled": true,
        "type": "reveal",
        "duration": 3000,
        "skippable": true
      },
      "selection": {
        "highlight": true,
        "animation": "pulse",
        "sound": true
      },
      "reveal": {
        "animation": "flip",
        "duration": 1000,
        "stagger": true
      }
    }
  },
  "user interface": {
    "buttons": {
      "hover": {
        "enabled": true,
        "type": "scale",
        "amount": 1.1,
        "duration": 100
      },
      "press": {
        "enabled": true,
        "type": "compress",
        "amount": 0.9,
        "duration": 100
      },
      "disabled": {
        "enabled": true,
        "type": "desaturate",
        "amount": 0.5
      }
    },
    "transitions": {
      "screenChange": {
        "type": "fade",
        "duration": 300,
        "easing": "ease-in-out"
      },
      "popups": {
        "type": "scale",
        "duration": 200,
        "easing": "ease-out"
      }
    }
  },
  "particles": {
    "enabled": true,
    "presets": {
      "coins": {
        "particleCount": 100,
        "duration": 3000,
        "gravity": true,
        "color": ["#FFD700", "#FFC800", "#FFAA00"],
        "size": [10, 20],
        "shape": "circle",
        "rotation": true,
        "opacity": [0.8, 1]
      },
      "sparkles": {
        "particleCount": 50,
        "duration": 2000,
        "gravity": false,
        "color": ["#FFFFFF", "#FFFFAA", "#FFFF00"],
        "size": [5, 10],
        "shape": "star",
        "rotation": true,
        "opacity": [0.5, 1]
      },
      "confetti": {
        "particleCount": 200,
        "duration": 5000,
        "gravity": true,
        "color": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"],
        "size": [5, 15],
        "shape": "rectangle",
        "rotation": true,
        "opacity": [0.8, 1]
      }
    }
  }
}
```

### Symbol Animations

Symbol animations include:
- `idle`: Subtle animations when symbols are not active
- `win`: Animations when symbols are part of a win
- `appear`: Animations when symbols first appear

Animation types:
- `subtle`: Gentle breathing effect
- `highlight`: Glow or highlight effect
- `sparkle`: Sparkling particle effect
- `pulse`: Pulsing size effect
- `zoom`: Quick zoom in and out
- `bounce`: Bouncing up and down
- `shine`: Light passing over symbol
- `flip`: 3D flip effect
- `shake`: Shaking effect
- `rotate`: Rotation effect
- `move`: Movement animation
- `fade`: Fade in/out effect

### Win Animations

Win animations include:
- `standard`: Normal win animations
- `bigWin`: Animations for larger wins
- `megaWin`: Animations for very large wins
- `epicWin`: Animations for enormous wins

Animation types:
- `sequential`: Wins highlighted one by one
- `all-at-once`: All wins highlighted simultaneously
- `explosion`: Explosive particle effect
- `coins`: Raining coins effect
- `fireworks`: Fireworks display
- `confetti`: Confetti shower
- `flare`: Light flare effect
- `zoom`: Camera zoom effect

### Special Effect Animations

Special effect animations:
- `particles`: Customizable particle systems
- `transitions`: Screen transition effects
- `camera`: Camera movement effects
- `timingEffects`: Slow-motion, speed-up effects
- `shaders`: Special shader effects

## Audio Configuration

```json
"audio": {
  "music": {
    "enabled": true,
    "baseGameTrack": "underwater_adventure.mp3",
    "freeSpinTrack": "underwater_treasure.mp3",
    "bonusGameTrack": "underwater_mystery.mp3",
    "volume": 0.7,
    "fadeTime": 1000,
    "looping": true
  },
  "soundEffects": {
    "enabled": true,
    "volume": 0.8,
    "sets": {
      "base": {
        "reelStart": "reel_start.mp3",
        "reelStop": ["reel_stop_1.mp3", "reel_stop_2.mp3", "reel_stop_3.mp3"],
        "win": ["win_small.mp3", "win_medium.mp3", "win_big.mp3"],
        "noWin": "no_win.mp3",
        "buttonPress": "button_press.mp3",
        "anticipation": "anticipation.mp3"
      },
      "symbols": {
        "wild": "wild.mp3",
        "scatter": "scatter.mp3",
        "high": ["high_1.mp3", "high_2.mp3", "high_3.mp3"],
        "medium": ["medium_1.mp3", "medium_2.mp3", "medium_3.mp3"],
        "low": ["low_1.mp3", "low_2.mp3", "low_3.mp3", "low_4.mp3"]
      },
      "wins": {
        "payline": "payline_win.mp3",
        "way": "way_win.mp3",
        "cluster": "cluster_win.mp3",
        "bigWin": "big_win.mp3",
        "megaWin": "mega_win.mp3",
        "epicWin": "epic_win.mp3",
        "jackpot": "jackpot_win.mp3"
      },
      "features": {
        "freeSpinTrigger": "freespin_trigger.mp3",
        "freeSpinWin": "freespin_win.mp3",
        "freeSpinEnd": "freespin_end.mp3",
        "bonusGameTrigger": "bonus_trigger.mp3",
        "bonusGameWin": "bonus_win.mp3",
        "bonusGameEnd": "bonus_end.mp3",
        "multiplier": "multiplier.mp3",
        "expandingWild": "expanding_wild.mp3",
        "stickyWild": "sticky_wild.mp3",
        "cascade": "cascade.mp3",
        "respinTrigger": "respin_trigger.mp3",
        "respin": "respin.mp3",
        "gamblingStart": "gamble_start.mp3",
        "gamblingWin": "gamble_win.mp3",
        "gamblingLose": "gamble_lose.mp3"
      }
    }
  },
  "voiceOver": {
    "enabled": false,
    "volume": 0.9,
    "language": "en",
    "lines": {
      "welcome": "welcome.mp3",
      "bigWin": "big_win.mp3",
      "freeSpinStart": "freespin_start.mp3",
      "freeSpinEnd": "freespin_end.mp3",
      "bonusGame": "bonus_game.mp3"
    }
  },
  "dynamicMixing": {
    "enabled": true,
    "winVolumeIncrease": true,
    "featureMusicTransition": true,
    "anticipationMusicChange": true
  },
  "positionalAudio": {
    "enabled": false,
    "symbols": true,
    "interface": true
  },
  "mute": {
    "allSounds": false,
    "music": false,
    "effects": false,
    "voiceOver": false
  },
  "preloadStrategy": "all" // all, on-demand, streaming
}
```

## Mobile Optimization

```json
"mobile": {
  "orientation": {
    "preferred": "landscape",
    "allowPortrait": true,
    "autoRotate": true,
    "portraitLayout": {
      "reelPosition": "top",
      "controlsPosition": "bottom",
      "infoPosition": "popup"
    }
  },
  "interface": {
    "scalingStrategy": "responsive",
    "adaptiveControls": true,
    "touchTargetSize": "large",
    "simplifiedInPortrait": true,
    "hideOptionalElements": true,
    "swipeGestures": true,
    "fastPlay": true
  },
  "performance": {
    "lowerEffectsQuality": true,
    "reducedParticles": true,
    "optimizedAssets": true,
    "preloadStrategy": "on-demand",
    "memoryManagement": "aggressive"
  },
  "deviceSpecific": {
    "ios": {
      "safeAreaAdjustment": true,
      "notchCompensation": true,
      "webAppCapable": true
    },
    "android": {
      "fullscreen": true,
      "highRefreshRateSupport": true,
      "backButtonHandler": true
    }
  },
  "network": {
    "lowBandwidthMode": true,
    "offlineReady": false,
    "saveData": true,
    "progressiveLoading": true
  },
  "powerSaving": {
    "enabled": true,
    "reducedFrameRate": true,
    "dimInactiveScreen": true,
    "pauseOnBackground": true
  }
}
```

## Player Experience

```json
"playerExperience": {
  "firstTimeUser": {
    "tutorialEnabled": true,
    "introAnimation": true,
    "tooltipsEnabled": true,
    "guidedFirstSpin": true,
    "featureExplanation": true
  },
  "gameInfo": {
    "paytable": {
      "accessible": true,
      "animated": true,
      "showRealValues": true,
      "organization": "by_value" // by_value, by_type, custom
    },
    "gameRules": {
      "accessible": true,
      "comprehensive": true,
      "visualExamples": true
    },
    "winPresentations": {
      "highlightWinningLines": true,
      "showWinAmount": true,
      "celebrate": true,
      "animationDuration": "medium" // short, medium, long
    }
  },
  "interface": {
    "spinButton": {
      "size": "large",
      "position": "bottom-right",
      "stopEnabled": true,
      "pulseOnIdle": true
    },
    "autoplay": {
      "enabled": true,
      "options": [10, 25, 50, 100, "until feature"],
      "stopConditions": {
        "anyWin": false,
        "featureTrigger": true,
        "balanceIncrease": false,
        "balanceDecrease": true,
        "singleWinExceeds": true
      }
    },
    "turboMode": {
      "enabled": true,
      "spinDuration": 300,
      "skipAnimations": true
    },
    "responsiveDesign": {
      "adaptToScreenSize": true,
      "minWidth": 320,
      "maxWidth": 3840,
      "preserveAspectRatio": true
    }
  },
  "accessibility": {
    "highContrast": false,
    "colorBlindSupport": true,
    "screenReaderSupport": false,
    "keyboardNavigation": true,
    "adjustableTextSize": true,
    "reduceMotion": true,
    "hapticFeedback": true
  },
  "history": {
    "lastSpins": true,
    "winHistory": true,
    "gameLog": true,
    "roundReplay": false,
    "showRTP": true,
    "showVolatility": true
  },
  "responsible": {
    "realityCheck": true,
    "sessionLimits": true,
    "lossLimits": true,
    "winLimits": true,
    "depositLimits": true,
    "timeoutOption": true
  }
}
```

## Analytics Integration

```json
"analytics": {
  "enabled": true,
  "events": {
    "gameLoad": true,
    "gameStart": true,
    "spin": true,
    "win": true,
    "feature": true,
    "errorState": true,
    "sessionEnd": true
  },
  "metrics": {
    "spinCount": true,
    "winFrequency": true,
    "averageWin": true,
    "hitFrequency": true,
    "featureTriggerRate": true,
    "sessionLength": true,
    "returnToPlayer": true
  },
  "tracking": {
    "userId": true,
    "sessionId": true,
    "deviceInfo": true,
    "location": false,
    "timeStamp": true,
    "betAmount": true,
    "balanceChanges": true,
    "featureResults": true
  },
  "storage": {
    "local": true,
    "remote": true,
    "retentionPeriod": 90,
    "anonymized": true
  },
  "reporting": {
    "realTime": true,
    "daily": true,
    "weekly": true,
    "monthly": true,
    "custom": true
  },
  "integrations": {
    "googleAnalytics": false,
    "mixpanel": false,
    "custom": true,
    "operators": true
  }
}
```

## Localization

```json
"localization": {
  "enabled": true,
  "defaultLanguage": "en",
  "supportedLanguages": [
    "en", "es", "de", "fr", "it", "pt", "ru", "ja", "zh", "ko"
  ],
  "textElements": {
    "gameTitle": {
      "en": "Deep Ocean Adventure",
      "es": "Aventura en el Océano Profundo",
      "de": "Tiefsee-Abenteuer",
      "fr": "Aventure des Océans Profonds"
    },
    "buttons": {
      "spin": {
        "en": "Spin",
        "es": "Girar",
        "de": "Drehen",
        "fr": "Tourner"
      },
      "maxBet": {
        "en": "Max Bet",
        "es": "Apuesta Máxima",
        "de": "Max Einsatz",
        "fr": "Mise Max"
      },
      "autoplay": {
        "en": "Autoplay",
        "es": "Auto Juego",
        "de": "Automatisch",
        "fr": "Jeu Auto"
      }
    },
    "symbols": {
      "wild": {
        "en": "Wild",
        "es": "Comodín",
        "de": "Wild",
        "fr": "Joker"
      },
      "scatter": {
        "en": "Scatter",
        "es": "Dispersión",
        "de": "Streusymbol",
        "fr": "Dispersion"
      }
    },
    "features": {
      "freeSpins": {
        "en": "Free Spins",
        "es": "Giros Gratis",
        "de": "Freispiele",
        "fr": "Tours Gratuits"
      },
      "bonus": {
        "en": "Bonus Game",
        "es": "Juego de Bonificación",
        "de": "Bonusspiel",
        "fr": "Jeu Bonus"
      },
      "wildFeature": {
        "en": "Wild Feature",
        "es": "Función Comodín",
        "de": "Wild-Funktion",
        "fr": "Fonction Joker"
      }
    },
    "wins": {
      "bigWin": {
        "en": "Big Win",
        "es": "Gran Victoria",
        "de": "Großer Gewinn",
        "fr": "Gros Gain"
      },
      "megaWin": {
        "en": "Mega Win",
        "es": "Victoria Mega",
        "de": "Mega Gewinn",
        "fr": "Méga Gain"
      },
      "epicWin": {
        "en": "Epic Win",
        "es": "Victoria Épica",
        "de": "Epischer Gewinn",
        "fr": "Gain Épique"
      }
    },
    "paytable": {
      "title": {
        "en": "Paytable",
        "es": "Tabla de Pagos",
        "de": "Gewinntabelle",
        "fr": "Table des Gains"
      },
      "symbolTitle": {
        "en": "Symbol",
        "es": "Símbolo",
        "de": "Symbol",
        "fr": "Symbole"
      },
      "payoutTitle": {
        "en": "Payout",
        "es": "Pago",
        "de": "Auszahlung",
        "fr": "Paiement"
      }
    },
    "gameRules": {
      "title": {
        "en": "Game Rules",
        "es": "Reglas del Juego",
        "de": "Spielregeln",
        "fr": "Règles du Jeu"
      }
    }
  },
  "numberFormat": {
    "decimal": {
      "en": ".",
      "de": ",",
      "fr": ","
    },
    "thousands": {
      "en": ",",
      "de": ".",
      "fr": " "
    }
  },
  "currencyFormat": {
    "USD": {
      "symbol": "$",
      "position": "before",
      "format": "${value}"
    },
    "EUR": {
      "symbol": "€",
      "position": "after",
      "format": "{value}€"
    },
    "GBP": {
      "symbol": "£",
      "position": "before",
      "format": "£{value}"
    }
  },
  "dateFormat": {
    "en": "MM/DD/YYYY",
    "de": "DD.MM.YYYY",
    "fr": "DD/MM/YYYY"
  },
  "timeFormat": {
    "en": "h:mm A",
    "de": "HH:mm",
    "fr": "HH:mm"
  },
  "rtlSupport": {
    "enabled": true,
    "languages": ["ar", "he"]
  }
}
```

## Certification

```json
"certification": {
  "rtp": {
    "theoretical": 96.0,
    "verified": true,
    "testCycles": 1000000000,
    "variance": 0.5,
    "confidenceInterval": 0.1
  },
  "randomness": {
    "generator": "certified",
    "tested": true,
    "algorithm": "SHA-256",
    "seedMethod": "system_time_mixed",
    "periodicity": "none"
  },
  "jurisdictions": {
    "MGA": {
      "certified": true,
      "licenseNumber": "MGA/B2B/123/4567",
      "requirements": {
        "minRTP": 92,
        "maxWin": 50000,
        "gameRules": true,
        "responsibleGaming": true,
        "autoPlayLimits": true
      },
      "restrictions": {
        "maxStake": 100,
        "maxWinMultiplier": 5000,
        "fastPlay": false
      }
    },
    "UKGC": {
      "certified": true,
      "licenseNumber": "123-45678-R-987654",
      "requirements": {
        "minRTP": 94,
        "displayRTP": true,
        "realityChecks": true,
        "autoPlayLimits": true,
        "speedOfPlay": "standard"
      },
      "restrictions": {
        "maxStake": 5,
        "turboSpin": false,
        "autoplayStopConditions": true
      }
    }
  },
  "compliance": {
    "fairness": {
      "tested": true,
      "verifiable": true,
      "documentation": true,
      "thirdPartyAudit": true
    },
    "display": {
      "accuracy": true,
      "odds": true,
      "payouts": true,
      "gameRules": true
    },
    "playerProtection": {
      "ageVerification": true,
      "responsibleGaming": true,
      "sessionLimits": true,
      "realityChecks": true,
      "selfExclusion": true
    },
    "technicalStandards": {
      "security": true,
      "reliability": true,
      "fraud": true,
      "dataProtection": true
    }
  },
  "testingLab": {
    "name": "Gaming Laboratories International",
    "reportNumber": "GLI-123456-789",
    "date": "2023-05-15",
    "validUntil": "2025-05-15"
  }
}
```

## Game Rules

```json
"gameRules": {
  "basic": {
    "layout": "5x3",
    "paylines": 20,
    "payDirection": "left-to-right",
    "minBet": 0.20,
    "maxBet": 100,
    "coinValues": [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1.00],
    "maxCoinsPerLine": 1,
    "wildSubstitutes": true,
    "wildExceptions": ["scatter"]
  },
  "winning": {
    "minSymbolsForWin": 3,
    "paylineMultiplier": true,
    "allWaysMultiplier": false,
    "scatterPaysAnyway": true,
    "winCombinationMethod": "highest",
    "simultaneousWins": true
  },
  "freeSpins": {
    "triggerSymbols": "scatter",
    "minTriggerCount": 3,
    "freeSpin3": 10,
    "freeSpin4": 15,
    "freeSpin5": 20,
    "retriggerable": true,
    "maxRetriggers": 3,
    "multiplier": 1
  },
  "symbols": {
    "wild": {
      "name": "Wild Trident",
      "substitutes": true,
      "excludes": ["scatter"],
      "paysOnItsOwn": true,
      "multiplier": 1,
      "specialFeatures": ["expanding"]
    },
    "scatter": {
      "name": "Treasure Chest",
      "paysAnyway": true,
      "triggers": "freespin",
      "multiplier": 1
    },
    "high1": {
      "name": "Mermaid",
      "pays": {
        "3": 5,
        "4": 25,
        "5": 100
      }
    },
    "high2": {
      "name": "Shark",
      "pays": {
        "3": 4,
        "4": 20,
        "5": 80
      }
    },
    "high3": {
      "name": "Octopus",
      "pays": {
        "3": 3,
        "4": 15,
        "5": 60
      }
    },
    "medium1": {
      "name": "Starfish",
      "pays": {
        "3": 2,
        "4": 10,
        "5": 40
      }
    },
    "medium2": {
      "name": "Seahorse",
      "pays": {
        "3": 2,
        "4": 8,
        "5": 30
      }
    },
    "medium3": {
      "name": "Fish",
      "pays": {
        "3": 1,
        "4": 5,
        "5": 25
      }
    },
    "low1": {
      "name": "A",
      "pays": {
        "3": 1,
        "4": 4,
        "5": 20
      }
    },
    "low2": {
      "name": "K",
      "pays": {
        "3": 1,
        "4": 3,
        "5": 15
      }
    },
    "low3": {
      "name": "Q",
      "pays": {
        "3": 0.5,
        "4": 2,
        "5": 10
      }
    },
    "low4": {
      "name": "J",
      "pays": {
        "3": 0.5,
        "4": 1.5,
        "5": 8
      }
    }
  },
  "bonusFeatures": {
    "expandingWilds": {
      "description": "When a Wild symbol appears, it expands to cover the entire reel",
      "triggeredBy": "wild",
      "applicableReels": [1, 3, 5]
    },
    "freeSpin": {
      "description": "3 or more Scatter symbols trigger Free Spins with special features",
      "additionalDetails": "During Free Spins, additional Wilds are added to the reels"
    }
  },
  "gamble": {
    "available": true,
    "maxRounds": 5,
    "maxWin": 5000,
    "options": ["card_color", "card_suit"],
    "description": "Guess the color or suit of the next card to double or quadruple your win"
  },
  "payout": {
    "maxWin": 5000,
    "maxWinLimit": 500000,
    "currency": "credits",
    "rtpRange": [94.5, 96.5]
  },
  "rng": {
    "certified": true,
    "description": "Game uses a certified random number generator that ensures fair and random outcomes"
  }
}
```

## Distribution

```json
"distribution": {
  "platforms": {
    "desktop": true,
    "mobile": true,
    "tablet": true
  },
  "os": {
    "windows": true,
    "mac": true,
    "ios": true,
    "android": true,
    "linux": true
  },
  "browsers": {
    "chrome": true,
    "firefox": true,
    "safari": true,
    "edge": true,
    "opera": true
  },
  "channels": {
    "webBased": true,
    "downloadable": false,
    "nativeApp": false,
    "embeddable": true
  },
  "operators": {
    "onboarding": {
      "documentation": true,
      "api": true,
      "technicalSupport": true,
      "integrationGuide": true,
      "certifications": true
    },
    "customization": {
      "logoReplacement": true,
      "colorScheme": true,
      "userExperience": false,
      "rtpVariants": true
    },
    "reporting": {
      "realTime": true,
      "daily": true,
      "weekly": true,
      "monthly": true,
      "custom": true
    }
  },
  "hosting": {
    "cdn": true,
    "cloudOptimized": true,
    "loadBalancing": true,
    "geoDistribution": true,
    "backupSystems": true
  },
  "updates": {
    "automatic": true,
    "schedulable": true,
    "manualApproval": true,
    "rollback": true,
    "changeLog": true
  },
  "security": {
    "encryption": true,
    "fraud": true,
    "ddos": true,
    "vulnerabilityTesting": true,
    "penetrationTesting": true
  },
  "performance": {
    "loadTime": "< 3 seconds",
    "frameRate": "> 30 fps",
    "memoryUsage": "< 200 MB",
    "networkUsage": "< 5 MB per session",
    "optimizedAssets": true
  }
}
```