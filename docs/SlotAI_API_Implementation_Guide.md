# SlotAI API Implementation Guide

This comprehensive guide provides developers with detailed information for implementing the SlotAI API, including all endpoints, data structures, request/response formats, authentication methods, error handling patterns, and implementation best practices.

## API Overview

The SlotAI API provides robust functionality for:
1. Game configuration management (CRUD operations)
2. Image generation for theme assets and symbols
3. AI-assisted game design and analysis
4. Game simulation and mathematical verification
5. Asset management and storage

## Base URL

Production environment:
```
https://api.slotai.com/v1
```

Development/Testing environment:
```
http://localhost:3500/api/v1
```

Staging environment:
```
https://staging-api.slotai.com/v1
```

## Authentication

All API endpoints require authentication using API keys. The API supports two authentication methods:

### Bearer Token Authentication (Preferred)
```
Headers:
  Authorization: Bearer ${apiKey}
```

### API Key Authentication
```
Headers:
  X-API-Key: ${apiKey}
```

Different services require different API keys:
- `CLAUDE_API_KEY`: Required for AI services and game analysis
- `OPENAI_API_KEY`: Required for DALL-E image generation
- `GEMINI_API_KEY`: Required for Google's AI services and theme generation
- `SLOTAI_API_KEY`: Master key for all SlotAI-specific services

### Example Authentication

JavaScript:
```javascript
const response = await fetch('https://api.slotai.com/v1/configurations', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});
```

Python:
```python
import requests

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.slotai.com/v1/configurations', headers=headers)
```

## API Endpoints

### Configuration Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /configurations | Get all game configurations |
| POST   | /configurations | Create new configuration |
| GET    | /configurations/:gameId | Get specific configuration |
| PUT    | /configurations/:gameId | Update entire configuration |
| PATCH  | /configurations/:gameId | Partial update of configuration |
| DELETE | /configurations/:gameId | Delete configuration |
| POST   | /configurations/:gameId/clone | Clone configuration |
| POST   | /configurations/:gameId/validate | Validate configuration |
| GET    | /configurations/:gameId/history | Get configuration version history |

### Image Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /generation/text-to-image | Generate slot imagery from text prompt |
| POST   | /generation/batch | Generate multiple images in a batch |
| POST   | /openai/dalle | Generate images with DALL-E |
| POST   | /gemini/image | Generate images with Google Gemini |
| GET    | /generation/status/:jobId | Check status of generation job |

### AI Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /test | Test API connectivity |
| POST   | /analyze | Analyze game description for theme/feature suggestions |
| POST   | /chat | Chat with Claude AI for game design assistance |
| POST   | /math/analyze | Analyze game math model |
| POST   | /theme/suggest | Get theme suggestions for a game concept |

### Game Simulation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /simulation/run | Run game simulation with specified parameters |
| GET    | /simulation/:simulationId | Get simulation results |
| POST   | /simulation/batch | Run multiple simulations |
| GET    | /simulation/statistics | Get aggregated statistics across simulations |

### Netlify Functions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /.netlify/functions/claude | AI functions (test/analyze/chat) |
| POST   | /.netlify/functions/generate-images | Generate theme/symbol images |

## Request/Response Formats

### Configuration Endpoints

#### Get All Configurations

**Request:**
```
GET /configurations?status=active&limit=10&page=1
```

Optional query parameters:
- `status`: Filter by configuration status (active, draft, archived)
- `limit`: Number of items per page (default: 20)
- `page`: Page number (default: 1)
- `sort`: Sort field (default: "updatedAt")
- `order`: Sort order ("asc" or "desc", default: "desc")

**Response:**
```json
{
  "data": [
    {
      "id": "game-id-1",
      "version": "v1",
      "status": "active",
      "createdAt": "2023-01-15T14:32:10Z",
      "updatedAt": "2023-01-16T09:12:45Z",
      "config": {
        "gameId": "game-id-1",
        "theme": { /* Theme configuration */ },
        "bet": { /* Bet configuration */ },
        "rtp": { /* RTP configuration */ },
        "volatility": { /* Volatility settings */ },
        "reels": { /* Reel configuration */ },
        "bonus": { /* Bonus features */ }
      }
    },
    /* Additional game configurations */
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

#### Create Configuration

**Request:**
```
POST /configurations
Content-Type: application/json

{
  "id": "ocean-treasures",
  "version": "v1", 
  "status": "draft",
  "config": {
    "gameId": "ocean-treasures",
    "theme": {
      "mainTheme": "Deep Ocean",
      "artStyle": "cartoon",
      "colorScheme": "cool-blue",
      "mood": "mysterious",
      "description": "Underwater adventure with sea creatures and hidden treasures"
    },
    "bet": {
      "min": 0.20,
      "max": 100,
      "increment": 0.20,
      "defaultBet": 1.00,
      "maxLines": 20,
      "defaultLines": 20
    },
    "rtp": {
      "targetRTP": 96,
      "volatilityScale": 6
    }
    /* Additional configuration properties */
  }
}
```

**Response:** 
```json
{
  "id": "ocean-treasures",
  "version": "v1", 
  "status": "draft",
  "createdAt": "2023-06-15T14:32:10Z",
  "updatedAt": "2023-06-15T14:32:10Z",
  "config": {
    "gameId": "ocean-treasures",
    "theme": {
      "mainTheme": "Deep Ocean",
      "artStyle": "cartoon",
      "colorScheme": "cool-blue",
      "mood": "mysterious",
      "description": "Underwater adventure with sea creatures and hidden treasures"
    },
    "bet": {
      "min": 0.20,
      "max": 100,
      "increment": 0.20,
      "defaultBet": 1.00,
      "maxLines": 20,
      "defaultLines": 20
    },
    "rtp": {
      "targetRTP": 96,
      "volatilityScale": 6
    }
    /* Additional configuration properties */
  }
}
```

#### Get Specific Configuration

**Request:**
```
GET /configurations/ocean-treasures?version=v1&includeMetadata=true
```

Optional query parameters:
- `version`: Get a specific version of the configuration (latest if not specified)
- `includeMetadata`: Include additional metadata in the response (default: false)
- `includeSimulationData`: Include simulation results in the response (default: false)

**Response:** Same format as Create Configuration, with optional metadata:
```json
{
  "id": "ocean-treasures",
  "version": "v1", 
  "status": "draft",
  "createdAt": "2023-06-15T14:32:10Z",
  "updatedAt": "2023-06-15T14:32:10Z",
  "config": { /* Full configuration object */ },
  "metadata": {
    "author": "user@example.com",
    "lastSimulation": "2023-06-15T16:45:22Z",
    "simulationResults": {
      "rtp": 95.87,
      "hitFrequency": 21.5,
      "volatility": 6.2
    },
    "generatedAssets": {
      "symbols": 12,
      "backgrounds": 1,
      "animations": 3
    },
    "versionHistory": [
      {
        "version": "v1",
        "createdAt": "2023-06-15T14:32:10Z",
        "author": "user@example.com"
      }
    ]
  }
}
```

#### Update Configuration

**Request:**
```
PUT /configurations/ocean-treasures
Content-Type: application/json

{
  "id": "ocean-treasures",
  "version": "v1",
  "status": "active",
  "config": {
    "gameId": "ocean-treasures",
    "theme": {
      "mainTheme": "Deep Ocean Treasures",
      "artStyle": "realistic",
      "colorScheme": "cool-blue",
      "mood": "mysterious",
      "description": "Underwater adventure with sea creatures and ancient sunken treasures"
    },
    /* Full updated configuration object */
  }
}
```

**Response:** The updated configuration in the same format as the request, with updated timestamps.

#### Partial Update

**Request:**
```
PATCH /configurations/ocean-treasures
Content-Type: application/json

{
  "id": "ocean-treasures",
  "config": {
    "theme": {
      "artStyle": "realistic",
      "description": "Underwater adventure with sea creatures and ancient sunken treasures"
    },
    "bet": {
      "max": 200
    }
  }
}
```

**Response:** The complete updated configuration with the patched fields changed.

#### Delete Configuration

**Request:**
```
DELETE /configurations/ocean-treasures?softDelete=true
```

Optional query parameters:
- `softDelete`: If true, marks the configuration as deleted but doesn't remove it (default: false)
- `deleteAssets`: If true, also deletes associated generated assets (default: false)

**Response:** Empty with 204 status code for success, or:
```json
{
  "message": "Configuration 'ocean-treasures' has been marked as deleted",
  "id": "ocean-treasures",
  "deletedAt": "2023-06-15T17:25:33Z"
}
```

#### Clone Configuration

**Request:**
```
POST /configurations/ocean-treasures/clone
Content-Type: application/json

{
  "targetGameId": "ocean-treasures-high-volatility",
  "overrides": {
    "rtp": {
      "targetRTP": 96.5,
      "volatilityScale": 8
    },
    "theme": {
      "mainTheme": "Deep Ocean Treasures - High Volatility Edition"
    }
  },
  "cloneAssets": true
}
```

**Response:** The new configuration with applied overrides.

#### Validate Configuration

**Request:**
```
POST /configurations/ocean-treasures/validate
Content-Type: application/json

{
  "validateMath": true,
  "validateAssets": true,
  "runSimulation": true,
  "simulationSpins": 10000
}
```

**Response:**
```json
{
  "valid": true,
  "warnings": [
    {
      "field": "rtp.targetRTP",
      "message": "Target RTP of 96.5% is higher than recommended for US market"
    },
    {
      "field": "reels.symbols.count",
      "message": "Symbol count (14) is higher than optimal range (8-12)"
    }
  ],
  "errors": [],
  "simulationResults": {
    "actualRTP": 96.38,
    "hitFrequency": 22.7,
    "volatility": 8.1,
    "maxWin": 2450,
    "averageWin": 4.32
  }
}
```

### Image Generation Endpoints

#### Generate Image from Text

**Request:**
```
POST /generation/text-to-image
Content-Type: application/json

{
  "prompt": "A wild symbol featuring a golden trident with glowing blue energy and ocean waves in the background, for a slot game",
  "id": "wild-symbol",
  "gameId": "ocean-treasures",
  "options": {
    "width": 512,
    "height": 512,
    "negativePrompt": "text, words, letters, blurry, distorted, ugly, low quality",
    "steps": 30,
    "seed": 42,
    "style": "realistic",
    "model": "sdxl"
  }
}
```

**Response:**
```json
{
  "id": "wild-symbol",
  "gameId": "ocean-treasures",
  "imageUrl": "https://storage.slotai.com/images/ocean-treasures/wild-symbol.png",
  "thumbnailUrl": "https://storage.slotai.com/images/ocean-treasures/thumbnails/wild-symbol.png", 
  "prompt": "A wild symbol featuring a golden trident with glowing blue energy and ocean waves in the background, for a slot game",
  "seed": 42,
  "metadata": {
    "width": 512,
    "height": 512,
    "model": "sdxl",
    "generatedAt": "2023-06-15T14:55:22Z"
  }
}
```

#### Generate Multiple Images in Batch

**Request:**
```
POST /generation/batch
Content-Type: application/json

{
  "gameId": "ocean-treasures",
  "batchName": "ocean-symbols",
  "images": [
    {
      "id": "wild-symbol",
      "prompt": "A wild symbol featuring a golden trident with glowing blue energy and ocean waves in the background, for a slot game"
    },
    {
      "id": "scatter-symbol",
      "prompt": "A scatter symbol featuring a treasure chest overflowing with gold coins and jewels, with mysterious bubbles, for an underwater slot game"
    },
    {
      "id": "high-symbol-1",
      "prompt": "A high-paying symbol featuring a majestic dolphin jumping through a water ring, for an underwater slot game"
    }
  ],
  "options": {
    "width": 512,
    "height": 512,
    "negativePrompt": "text, words, letters, blurry, distorted, ugly, low quality",
    "steps": 30,
    "model": "sdxl",
    "style": "realistic"
  }
}
```

**Response:**
```json
{
  "batchId": "batch-1234",
  "gameId": "ocean-treasures",
  "status": "processing",
  "progress": {
    "total": 3,
    "completed": 0,
    "failed": 0
  },
  "estimatedCompletionTime": "2023-06-15T15:05:22Z",
  "statusCheckUrl": "https://api.slotai.com/v1/generation/status/batch-1234"
}
```

#### Check Status of Generation Job

**Request:**
```
GET /generation/status/batch-1234
```

**Response:**
```json
{
  "batchId": "batch-1234",
  "gameId": "ocean-treasures",
  "status": "completed",
  "progress": {
    "total": 3,
    "completed": 3,
    "failed": 0
  },
  "completedAt": "2023-06-15T15:03:45Z",
  "results": [
    {
      "id": "wild-symbol",
      "status": "completed",
      "imageUrl": "https://storage.slotai.com/images/ocean-treasures/wild-symbol.png",
      "thumbnailUrl": "https://storage.slotai.com/images/ocean-treasures/thumbnails/wild-symbol.png"
    },
    {
      "id": "scatter-symbol",
      "status": "completed",
      "imageUrl": "https://storage.slotai.com/images/ocean-treasures/scatter-symbol.png",
      "thumbnailUrl": "https://storage.slotai.com/images/ocean-treasures/thumbnails/scatter-symbol.png"
    },
    {
      "id": "high-symbol-1",
      "status": "completed",
      "imageUrl": "https://storage.slotai.com/images/ocean-treasures/high-symbol-1.png",
      "thumbnailUrl": "https://storage.slotai.com/images/ocean-treasures/thumbnails/high-symbol-1.png"
    }
  ]
}
```

### AI Integration Endpoints

#### Test API Connectivity

**Request:**
```
POST /test
Content-Type: application/json

{
  "message": "test connection"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API connection successful",
  "apiVersion": "1.0.5",
  "services": {
    "claude": "available",
    "openai": "available",
    "gemini": "available",
    "simulation": "available"
  }
}
```

#### Analyze Game Description

**Request:**
```
POST /analyze
Content-Type: application/json

{
  "description": "Deep Ocean Adventure is an underwater-themed slot game featuring sea creatures, sunken treasures, and ancient ruins. It has wilds, scatters, and a free spins feature with expanding wilds. The game should have a mysterious atmosphere with bioluminescent creatures occasionally appearing on the reels."
}
```

**Response:**
```json
{
  "theme": {
    "mainTheme": "Deep Ocean",
    "artStyle": "cartoon",
    "colorScheme": "cool-blue",
    "mood": "mysterious",
    "description": "Underwater adventure with sea creatures, sunken treasures, and ancient ruins",
    "recommendedSymbols": [
      {"name": "dolphin", "type": "high", "description": "Playful dolphin with bioluminescent highlights"},
      {"name": "treasure chest", "type": "scatter", "description": "Ancient chest overflowing with gold and jewels"},
      {"name": "trident", "type": "wild", "description": "Golden trident with glowing blue energy"},
      {"name": "coral", "type": "low", "description": "Colorful coral formation with small fish"},
      {"name": "anchor", "type": "low", "description": "Rusty anchor partially covered in seaweed"},
      {"name": "turtle", "type": "medium", "description": "Sea turtle with glowing patterns on its shell"},
      {"name": "ruins", "type": "high", "description": "Submerged ancient temple column with carvings"},
      {"name": "jellyfish", "type": "medium", "description": "Translucent jellyfish with bioluminescent glow"}
    ]
  },
  "features": {
    "wilds": true,
    "expandingWilds": true,
    "scatters": true,
    "freeSpins": true,
    "bioluminescentEffects": true
  },
  "recommendations": [
    {
      "type": "feature",
      "title": "Pearl Collection Feature",
      "description": "Add a pearl collection feature where players gather pearls during base game for progressive wins or bonus trigger"
    },
    {
      "type": "animation",
      "title": "Bubble Animation Effects",
      "description": "Add bubble animations for transitions between base game and features"
    },
    {
      "type": "bonus",
      "title": "Shipwreck Treasure Hunt",
      "description": "A bonus game where players select areas of a shipwreck to reveal hidden treasures"
    },
    {
      "type": "mechanic",
      "title": "Rising Wild Reels",
      "description": "Wilds that expand upward like bubbles rising to the surface"
    }
  ],
  "mathModel": {
    "recommendedRTP": 96,
    "recommendedVolatility": 6,
    "hitFrequency": 22,
    "recommendedSymbolCount": 10,
    "symbolDistribution": {
      "wild": 1,
      "scatter": 1,
      "high": 3,
      "medium": 2,
      "low": 3
    },
    "freeSpinFrequency": 150
  }
}
```

#### Chat with Claude AI

**Request:**
```
POST /chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "I need suggestions for bonus features in my underwater-themed slot game that would work well with expanding wilds"}
  ],
  "gameId": "ocean-treasures",
  "temperature": 0.7
}
```

**Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Here are some bonus features that would pair well with expanding wilds in your underwater-themed slot game:\n\n1. **Pressure Wave Feature**: When expanding wilds appear, they create a 'pressure wave' that can transform adjacent symbols into wilds or high-paying symbols.\n\n2. **Rising Bubbles**: Wilds start at the bottom row and bubble up through the reels over several spins, creating a trail of wilds.\n\n3. **Treasure Chest Multiplier**: When an expanding wild appears next to a treasure chest symbol, it multiplies wins by 2x, 3x, or 5x.\n\n4. **Deep Dive Free Spins**: Triggered by scatter symbols, but with enhanced expanding wilds that can cover multiple reels simultaneously.\n\n5. **Kraken's Grasp**: Random feature where tentacles grab regular symbols and transform them into expanding wilds.\n\n6. **Sunken Ship Respins**: Expanding wilds lock in place and award respins, with additional wilds increasing the respin count.\n\n7. **Whirlpool Wild**: A central wild that expands in a spiral pattern across the reels.\n\n8. **Coral Reef Collection**: Players collect coral symbols during base game, and when enough are collected, all coral symbols transform into expanding wilds for several spins.\n\nThese features complement expanding wilds while enhancing your underwater theme with relevant visual concepts."
  },
  "metadata": {
    "promptTokens": 24,
    "completionTokens": 215,
    "model": "claude-3-opus-20240229"
  }
}
```

### Simulation Endpoints

#### Run Game Simulation

**Request:**
```
POST /simulation/run
Content-Type: application/json

{
  "gameId": "ocean-treasures",
  "spins": 100000,
  "bet": 1.00,
  "lines": 20,
  "simulationType": "detailed",
  "includeSpinResults": false,
  "saveResults": true
}
```

**Response:**
```json
{
  "simulationId": "sim-5678",
  "gameId": "ocean-treasures",
  "status": "running",
  "progress": {
    "current": 0,
    "total": 100000
  },
  "estimatedCompletionTime": "2023-06-15T15:25:22Z",
  "statusCheckUrl": "https://api.slotai.com/v1/simulation/sim-5678"
}
```

#### Get Simulation Results

**Request:**
```
GET /simulation/sim-5678
```

**Response:**
```json
{
  "simulationId": "sim-5678",
  "gameId": "ocean-treasures",
  "status": "completed",
  "parameters": {
    "spins": 100000,
    "bet": 1.00,
    "lines": 20
  },
  "results": {
    "rtp": 95.87,
    "rtpComponents": {
      "baseGame": 65.32,
      "freeSpins": 28.55,
      "features": 2.00
    },
    "hitFrequency": 22.3,
    "featureFrequency": {
      "freeSpins": 155,
      "expandingWilds": 46
    },
    "volatility": 6.2,
    "winDistribution": {
      "0x-1x": 45.2,
      "1x-5x": 39.7,
      "5x-10x": 10.1,
      "10x-50x": 4.2,
      "50x-100x": 0.6,
      "100x+": 0.2
    },
    "highestWin": {
      "amount": 2450.00,
      "multiplier": 2450,
      "spin": 78425,
      "feature": "freeSpins"
    },
    "winsBySymbol": {
      "wild": 15.2,
      "dolphin": 12.5,
      "treasure": 10.8,
      "ruins": 9.7,
      "turtle": 8.5,
      "jellyfish": 8.2,
      "coral": 7.1,
      "anchor": 6.9
    }
  },
  "completedAt": "2023-06-15T15:22:45Z"
}
```

## Data Structures

### Game Configuration

The main game configuration object structure:

```json
{
  "gameId": "ocean-treasures",
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
  },
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
  },
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
    "level": "medium",
    "scale": 6,
    "averageFeatureFrequency": 150,
    "bigWinFrequency": 200,
    "longestDrySpell": 100,
    "settings": {
      "drySpellProtection": true,
      "progressiveRTP": false,
      "bigWinGuarantee": false
    }
  },
  "reels": {
    "layout": {
      "type": "standard",
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
    "spinType": "spinning",
    "spinSpeed": "medium",
    "spinDirection": "down",
    "stopBehavior": "sequential",
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
    "paymentType": "payline",
    "paylines": [
      {"id": 1, "path": [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]]},
      {"id": 2, "path": [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]},
      {"id": 3, "path": [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]]}
    ],
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
        }
      ]
    }
  },
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
        "type": "symbol",
        "values": [2, 3, 5],
        "progression": {
          "enabled": false,
          "sequence": [1, 2, 3, 5, 10],
          "reset": "spin"
        },
        "display": "symbol",
        "animation": "glow"
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
      }
    }
  },
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
        }
      }
    }
  }
}
```

## Implementation Best Practices

### Error Handling

The API uses standard HTTP status codes for error responses:

- 200: OK - Request succeeded
- 201: Created - Resource created successfully
- 204: No Content - Request succeeded, no response body
- 400: Bad Request - Invalid request parameters
- 401: Unauthorized - Missing or invalid API key
- 403: Forbidden - Valid API key but insufficient permissions
- 404: Not Found - Resource not found
- 409: Conflict - Resource already exists
- 422: Unprocessable Entity - Request format valid but semantically incorrect
- 429: Too Many Requests - Rate limit exceeded
- 500: Internal Server Error - Server-side error

Error response format:

```json
{
  "error": {
    "code": "invalid_parameter",
    "message": "Parameter 'gameId' is required",
    "details": {
      "field": "gameId",
      "issue": "missing_required_field"
    },
    "requestId": "req_12345"
  }
}
```

Common error codes:
- `invalid_parameter`: One or more parameters are invalid
- `unauthorized`: Authentication failed
- `forbidden`: Authenticated but insufficient permissions
- `not_found`: Resource not found
- `conflict`: Resource already exists
- `rate_limit_exceeded`: Too many requests
- `server_error`: Internal server error

### Error Handling Example

JavaScript:
```javascript
async function getConfiguration(gameId) {
  try {
    const response = await fetch(`https://api.slotai.com/v1/configurations/${gameId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error.code} - ${errorData.error.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching configuration:', error);
    
    // Implement retry logic for transient errors
    if (error.message.includes('rate_limit_exceeded') || error.message.includes('server_error')) {
      return await retryWithBackoff(getConfiguration, [gameId], 3, 1000);
    }
    
    throw error;
  }
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, args, maxRetries, initialDelay) {
  let retries = 0;
  let delay = initialDelay;
  
  while (retries < maxRetries) {
    try {
      return await fn(...args);
    } catch (error) {
      retries++;
      if (retries >= maxRetries) throw error;
      
      console.log(`Retrying after ${delay}ms... (${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}
```

### Rate Limiting

The API implements rate limiting to prevent abuse:

- Standard tier: 60 requests per minute
- Premium tier: 300 requests per minute
- Enterprise tier: Customizable limits

Rate limit headers in responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1614556800
```

### Rate Limit Handling Example

```javascript
async function makeApiRequest(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  // Check for rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || 5;
    console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
    
    // Wait for the specified time and retry
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return makeApiRequest(url, method, body);
  }
  
  return response;
}
```

### Pagination

For endpoints that return lists of items, pagination is supported using the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20, max: 100)
- `sort`: Field to sort by (default: varies by endpoint)
- `order`: Sort order, "asc" or "desc" (default: "desc")

Pagination response format:

```json
{
  "data": [
    /* Array of items */
  ],
  "pagination": {
    "total": 142,
    "page": 2,
    "limit": 20,
    "pages": 8,
    "nextPage": 3,
    "prevPage": 1,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### Pagination Example

```javascript
async function getAllConfigurations() {
  const allConfigurations = [];
  let page = 1;
  let hasNext = true;
  
  while (hasNext) {
    const response = await fetch(`https://api.slotai.com/v1/configurations?page=${page}&limit=50`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    allConfigurations.push(...data.data);
    
    hasNext = data.pagination.hasNext;
    page = data.pagination.nextPage;
  }
  
  return allConfigurations;
}
```

### Webhooks

The API can send webhook notifications for important events:

1. Register a webhook endpoint:

```
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-server.com/api/webhooks/slotai",
  "events": ["config.created", "config.updated", "image.generated"],
  "secret": "your_webhook_secret"
}
```

2. Webhook payload format:

```json
{
  "event": "config.created",
  "timestamp": "2023-06-15T14:32:10Z",
  "data": {
    "gameId": "ocean-treasures",
    "version": "v1"
  },
  "signature": "sha256=..."
}
```

3. Verify webhook signature:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const expectedSignature = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// Express.js webhook handler example
app.post('/api/webhooks/slotai', (req, res) => {
  const signature = req.headers['x-slotai-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, 'your_webhook_secret');
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = req.body.event;
  const data = req.body.data;
  
  // Handle different event types
  switch (event) {
    case 'config.created':
      handleConfigCreated(data);
      break;
    case 'config.updated':
      handleConfigUpdated(data);
      break;
    case 'image.generated':
      handleImageGenerated(data);
      break;
    default:
      console.log(`Unhandled event type: ${event}`);
  }
  
  res.status(200).send('Webhook received');
});
```

## SDK Examples

### JavaScript SDK

```javascript
import SlotAiClient from 'slotai-sdk';

// Initialize client
const client = new SlotAiClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.slotai.com/v1'
});

// Create a new game configuration
async function createGame() {
  try {
    const newGame = await client.configurations.create({
      gameId: 'ocean-treasures',
      theme: {
        mainTheme: 'Deep Ocean',
        artStyle: 'cartoon',
        colorScheme: 'cool-blue',
        mood: 'mysterious',
        description: 'Underwater adventure with sea creatures and treasure'
      },
      bet: {
        min: 0.20,
        max: 100,
        increment: 0.20
      },
      rtp: {
        targetRTP: 96,
        volatilityScale: 6
      }
    });
    
    console.log('Game created:', newGame);
    return newGame;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
}

// Generate a symbol image
async function generateSymbol(gameId, symbolName, description) {
  try {
    const prompt = `A ${description} for an underwater themed slot game, centered, with transparent background`;
    const result = await client.generation.textToImage(prompt, `${symbolName}`, {
      gameId,
      width: 512,
      height: 512,
      negativePrompt: 'text, words, letters, blurry, distorted'
    });
    
    console.log('Symbol generated:', result);
    return result;
  } catch (error) {
    console.error('Error generating symbol:', error);
    throw error;
  }
}

// Run a simulation
async function runSimulation(gameId) {
  try {
    const simulation = await client.simulation.run({
      gameId,
      spins: 50000,
      bet: 1.00,
      lines: 20
    });
    
    console.log('Simulation started:', simulation);
    
    // Poll for simulation results
    let results = null;
    while (!results || results.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 5000));
      results = await client.simulation.getResults(simulation.simulationId);
      console.log(`Simulation progress: ${results.progress.current}/${results.progress.total}`);
    }
    
    console.log('Simulation results:', results);
    return results;
  } catch (error) {
    console.error('Error running simulation:', error);
    throw error;
  }
}

// Complete workflow example
async function createAndConfigureGame() {
  // Create game configuration
  const game = await createGame();
  
  // Generate symbol images
  const wildSymbol = await generateSymbol(game.gameId, 'wild', 'golden trident with blue energy aura, wild symbol');
  const scatterSymbol = await generateSymbol(game.gameId, 'scatter', 'treasure chest overflowing with gold and jewels, scatter symbol');
  
  // Update configuration with generated assets
  await client.configurations.update(game.gameId, {
    config: {
      theme: {
        generated: {
          symbols: [
            wildSymbol.imageUrl,
            scatterSymbol.imageUrl
          ]
        }
      },
      reels: {
        symbols: {
          list: [
            {
              id: "wild",
              name: "Wild Trident",
              type: "wild",
              imageUrl: wildSymbol.imageUrl
            },
            {
              id: "scatter",
              name: "Treasure Chest",
              type: "scatter",
              imageUrl: scatterSymbol.imageUrl
            }
          ]
        }
      }
    }
  });
  
  // Run simulation
  const simulationResults = await runSimulation(game.gameId);
  
  return {
    game,
    symbols: [wildSymbol, scatterSymbol],
    simulationResults
  };
}

// Run the example
createAndConfigureGame()
  .then(result => console.log('Game created and configured successfully'))
  .catch(error => console.error('Error:', error));
```

### Python SDK

```python
from slotai_sdk import SlotAiClient
import time

# Initialize client
client = SlotAiClient(
    api_key='your_api_key',
    base_url='https://api.slotai.com/v1'
)

# Create game configuration
def create_game():
    try:
        new_game = client.configurations.create({
            "gameId": "ocean-treasures-py",
            "theme": {
                "mainTheme": "Deep Ocean",
                "artStyle": "cartoon",
                "colorScheme": "cool-blue",
                "mood": "mysterious",
                "description": "Underwater adventure with sea creatures and treasure"
            },
            "bet": {
                "min": 0.20,
                "max": 100,
                "increment": 0.20
            },
            "rtp": {
                "targetRTP": 96,
                "volatilityScale": 6
            }
        })
        
        print(f"Game created: {new_game['id']}")
        return new_game
    except Exception as e:
        print(f"Error creating game: {str(e)}")
        raise e

# Generate a symbol image
def generate_symbol(game_id, symbol_name, description):
    try:
        prompt = f"A {description} for an underwater themed slot game, centered, with transparent background"
        result = client.generation.text_to_image(
            prompt=prompt,
            id=symbol_name,
            game_id=game_id,
            options={
                "width": 512,
                "height": 512,
                "negativePrompt": "text, words, letters, blurry, distorted"
            }
        )
        
        print(f"Symbol generated: {result['imageUrl']}")
        return result
    except Exception as e:
        print(f"Error generating symbol: {str(e)}")
        raise e

# Run a simulation
def run_simulation(game_id):
    try:
        simulation = client.simulation.run({
            "gameId": game_id,
            "spins": 50000,
            "bet": 1.00,
            "lines": 20
        })
        
        print(f"Simulation started: {simulation['simulationId']}")
        
        # Poll for simulation results
        results = None
        while not results or results['status'] != 'completed':
            time.sleep(5)
            results = client.simulation.get_results(simulation['simulationId'])
            print(f"Simulation progress: {results['progress']['current']}/{results['progress']['total']}")
        
        print(f"Simulation results: RTP={results['results']['rtp']}%")
        return results
    except Exception as e:
        print(f"Error running simulation: {str(e)}")
        raise e

# Complete workflow
def create_and_configure_game():
    # Create game configuration
    game = create_game()
    
    # Generate symbol images
    wild_symbol = generate_symbol(game['id'], 'wild', 'golden trident with blue energy aura, wild symbol')
    scatter_symbol = generate_symbol(game['id'], 'scatter', 'treasure chest overflowing with gold and jewels, scatter symbol')
    
    # Update configuration with generated assets
    client.configurations.update(game['id'], {
        "config": {
            "theme": {
                "generated": {
                    "symbols": [
                        wild_symbol['imageUrl'],
                        scatter_symbol['imageUrl']
                    ]
                }
            },
            "reels": {
                "symbols": {
                    "list": [
                        {
                            "id": "wild",
                            "name": "Wild Trident",
                            "type": "wild",
                            "imageUrl": wild_symbol['imageUrl']
                        },
                        {
                            "id": "scatter",
                            "name": "Treasure Chest",
                            "type": "scatter",
                            "imageUrl": scatter_symbol['imageUrl']
                        }
                    ]
                }
            }
        }
    })
    
    # Run simulation
    simulation_results = run_simulation(game['id'])
    
    return {
        "game": game,
        "symbols": [wild_symbol, scatter_symbol],
        "simulationResults": simulation_results
    }

# Run the example
if __name__ == "__main__":
    try:
        result = create_and_configure_game()
        print("Game created and configured successfully")
    except Exception as e:
        print(f"Error: {str(e)}")
```

## Implementation Checklist

When implementing the SlotAI API, ensure you cover these essential aspects:

1. **Setup and Configuration**
   - [ ] Register for API access and obtain API keys
   - [ ] Configure environment-specific base URLs
   - [ ] Set up proper API key storage and management
   - [ ] Install SDK or set up HTTP client library
   - [ ] Configure logging and monitoring

2. **Authentication**
   - [ ] Implement Bearer token authentication
   - [ ] Securely store API keys using environment variables
   - [ ] Handle authentication errors with proper logging
   - [ ] Implement key rotation mechanism
   - [ ] Monitor API key usage

3. **Error Handling**
   - [ ] Implement robust error handling for all API calls
   - [ ] Add retry logic with exponential backoff for transient errors
   - [ ] Set up consistent error handling patterns
   - [ ] Log detailed error information for debugging
   - [ ] Create user-friendly error messages
   - [ ] Handle 429 rate limiting errors properly

4. **Configuration Management**
   - [ ] Implement CRUD operations for game configurations
   - [ ] Validate configurations before sending
   - [ ] Implement proper version management
   - [ ] Create data models matching API schemas
   - [ ] Implement configuration backup strategy
   - [ ] Add validation for all required fields

5. **Image Generation**
   - [ ] Implement prompt construction for consistent results
   - [ ] Store and manage generated assets
   - [ ] Implement fallbacks for when generation fails
   - [ ] Add image caching mechanism
   - [ ] Handle batch generation for symbols
   - [ ] Implement image optimization if needed

6. **AI Integration**
   - [ ] Implement AI analysis for game descriptions
   - [ ] Set up AI chat capability for design assistance
   - [ ] Implement context management for chat history
   - [ ] Handle AI service outages gracefully
   - [ ] Cache common AI responses when appropriate

7. **Simulation and Testing**
   - [ ] Implement simulation running and result retrieval
   - [ ] Add simulation status monitoring
   - [ ] Create dashboards for simulation results
   - [ ] Implement automated testing based on simulation results
   - [ ] Set up alerts for simulation failures

8. **Performance Optimization**
   - [ ] Implement request caching for frequent API calls
   - [ ] Handle rate limiting with queuing mechanism
   - [ ] Optimize payload sizes for faster transmission
   - [ ] Implement connection pooling
   - [ ] Add request batching where applicable
   - [ ] Monitor API performance metrics

9. **Security**
   - [ ] Validate all inputs before sending to API
   - [ ] Implement webhook signature verification
   - [ ] Use TLS for all communications
   - [ ] Implement proper CORS configuration if needed
   - [ ] Sanitize data from API responses before use
   - [ ] Implement access controls for different user roles

10. **Monitoring and Logging**
    - [ ] Set up API call logging
    - [ ] Implement performance monitoring
    - [ ] Create alerts for API errors
    - [ ] Track rate limit usage
    - [ ] Monitor webhook delivery and processing
    - [ ] Set up transaction tracing

11. **Webhooks** (if using)
    - [ ] Register webhook endpoints
    - [ ] Implement signature verification
    - [ ] Set up retry mechanism for failed webhook deliveries
    - [ ] Create webhook event handlers
    - [ ] Add monitoring for webhook processing
    - [ ] Implement idempotent webhook handling

## Common Integration Challenges and Solutions

### Challenge: Rate Limiting
**Solution:** Implement a request queue with rate limiting awareness. Monitor the `X-RateLimit-*` headers and adjust request timing dynamically.

```javascript
class RateLimitedQueue {
  constructor(requestsPerMinute) {
    this.queue = [];
    this.processing = false;
    this.interval = 60000 / requestsPerMinute;
    this.lastRequestTime = 0;
  }

  add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const now = Date.now();
    const timeToWait = Math.max(0, this.lastRequestTime + this.interval - now);
    
    setTimeout(async () => {
      const { fn, resolve, reject } = this.queue.shift();
      this.lastRequestTime = Date.now();
      
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.processing = false;
        this.process();
      }
    }, timeToWait);
  }
}

// Usage
const apiQueue = new RateLimitedQueue(60); // 60 requests per minute

async function makeApiRequest(url, method, body) {
  return apiQueue.add(async () => {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    // Adjust rate limit dynamically based on headers
    if (response.headers.has('X-RateLimit-Limit')) {
      const limit = parseInt(response.headers.get('X-RateLimit-Limit'));
      apiQueue.interval = 60000 / limit;
    }
    
    return response;
  });
}
```

### Challenge: Handling Large Configuration Objects
**Solution:** Use a schema validation library to ensure configuration objects are valid before sending them to the API.

```javascript
import Ajv from 'ajv';
import configSchema from './schemas/gameConfigSchema.json';

const ajv = new Ajv();
const validateConfig = ajv.compile(configSchema);

async function updateConfiguration(gameId, config) {
  const valid = validateConfig(config);
  
  if (!valid) {
    console.error('Configuration validation failed:', validateConfig.errors);
    throw new Error('Invalid configuration: ' + ajv.errorsText(validateConfig.errors));
  }
  
  // Proceed with API call
  return client.configurations.update(gameId, config);
}
```

### Challenge: Managing Asset Generation Workflow
**Solution:** Implement a state machine for asset generation that handles retries and fallbacks.

```javascript
async function generateGameAssets(gameId, theme) {
  const assetTypes = {
    background: {
      prompt: `${theme.description} background scene for a slot game, panoramic view`,
      retries: 3,
      fallbackUrl: 'https://storage.slotai.com/defaults/backgrounds/underwater.png'
    },
    wild: {
      prompt: `Wild symbol for ${theme.mainTheme} themed slot game, centered icon`,
      retries: 3,
      fallbackUrl: 'https://storage.slotai.com/defaults/symbols/wild.png'
    },
    scatter: {
      prompt: `Scatter symbol for ${theme.mainTheme} themed slot game, centered icon`,
      retries: 3,
      fallbackUrl: 'https://storage.slotai.com/defaults/symbols/scatter.png'
    }
    // Add more asset types as needed
  };
  
  const results = {};
  
  for (const [type, config] of Object.entries(assetTypes)) {
    let success = false;
    let attempts = 0;
    
    while (!success && attempts < config.retries) {
      attempts++;
      try {
        console.log(`Generating ${type} (attempt ${attempts}/${config.retries})...`);
        const result = await client.generation.textToImage(
          config.prompt,
          `${type}`,
          {
            gameId,
            width: 512,
            height: 512
          }
        );
        results[type] = result;
        success = true;
      } catch (error) {
        console.error(`Error generating ${type} (attempt ${attempts}):`, error);
        if (attempts >= config.retries) {
          console.log(`Using fallback for ${type}`);
          results[type] = { imageUrl: config.fallbackUrl };
        }
      }
    }
  }
  
  return results;
}
```

## Support

For API support, please contact:
- Email: api-support@slotai.com
- Documentation: https://docs.slotai.com/api
- Status page: https://status.slotai.com
- API changelog: https://docs.slotai.com/changelog

### Community Resources
- GitHub repository: https://github.com/slotai/slotai-sdk
- SDK documentation: https://docs.slotai.com/sdk
- Sample projects: https://github.com/slotai/examples
- API discussion forum: https://community.slotai.com/api

## Changelog

### v1.1.0 (2023-06-15)
- Added batch image generation endpoint
- Improved simulation results with detailed statistics
- Added RTP variant support in configurations
- Enhanced error handling with request IDs

### v1.0.5 (2023-05-20)
- Fixed issue with webhook signature verification
- Improved rate limiting algorithm
- Added support for multiple theme styles

### v1.0.0 (2023-04-01)
- Initial API release
- Core configuration management
- Basic image generation
- Simple simulation capabilities