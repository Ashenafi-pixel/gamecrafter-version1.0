export const gameTypes = [
  {
    id: 'slots_v2',
    category: 'slots',
    title: 'Slots 2.0 (Preview)',
    description: 'Next-gen streamlined workflow',
    preview: '/animations/classic-reels.mp4',
    placeholder: '/thumbnails/slots.jpg',
    highlightFeatures: ['6-Step Workflow', 'Unified Tools', 'Instant Preview'],
    config: {
      reels: {
        payMechanism: 'betlines',
        layout: { shape: 'rectangle', reels: 5, rows: 3 },
        betlines: 20
      }
    }
  },
  {
    id: 'classic-reels',
    category: 'slots',
    title: 'Classic Reels',
    description: '5x3 grid with payline wins',
    preview: '/animations/classic-reels.mp4',
    placeholder: '/thumbnails/slots.jpg',
    highlightFeatures: ['Multiple paylines', 'Traditional symbols', 'Familiar mechanics'],
    config: {
      reels: {
        payMechanism: 'betlines',
        layout: {
          shape: 'rectangle',
          reels: 5,
          rows: 3
        },
        betlines: 20
      }
    }
  },
  {
    id: 'ways-slots',
    category: 'slots',
    title: 'Ways to Win',
    description: 'Win in any position on adjacent reels',
    preview: '/animations/ways-slots.mp4',
    placeholder: '/thumbnails/slots.jpg',
    highlightFeatures: ['243-1024 ways to win', 'Adjacent reel wins', 'Higher hit frequency'],
    config: {
      reels: {
        payMechanism: 'ways',
        layout: {
          shape: 'rectangle',
          reels: 5,
          rows: 3
        }
      }
    }
  },
  {
    id: 'grid-slots',
    category: 'slots',
    title: 'Grid Slots',
    description: 'Cluster pays on a large grid',
    preview: '/animations/grid-slots.mp4',
    placeholder: '/thumbnails/grid.jpg',
    highlightFeatures: ['Cluster pays', 'Symbol cascades', 'Expanding grid possibilities'],
    config: {
      reels: {
        payMechanism: 'cluster',
        layout: {
          shape: 'square',
          reels: 6,
          rows: 6
        },
        cluster: {
          minSymbols: 5,
          diagonalAllowed: false
        }
      }
    }
  },
  {
    id: 'megaways',
    category: 'slots',
    title: 'Megaways™ Style',
    description: 'Variable rows with up to 117,649 ways',
    preview: '/animations/megaways.mp4',
    placeholder: '/thumbnails/slots.jpg',
    highlightFeatures: ['Variable reel heights', 'Massive win potential', 'Cascading symbols'],
    config: {
      reels: {
        payMechanism: 'ways',
        layout: {
          shape: 'rectangle',
          reels: 6,
          rows: 7
        },
        betlines: 0
      },
      volatility: {
        level: 'high',
        variance: 15,
        hitRate: 20,
        maxWinPotential: 10000
      }
    }
  },
  {
    id: 'hold-and-win',
    category: 'slots',
    title: 'Hold & Win',
    description: 'Respins feature with sticky symbols',
    preview: '/animations/hold-and-win.mp4',
    placeholder: '/thumbnails/slots.jpg',
    highlightFeatures: ['Respins mechanic', 'Jackpot prizes', 'Symbol collection'],
    config: {
      reels: {
        payMechanism: 'betlines',
        layout: {
          shape: 'rectangle',
          reels: 5,
          rows: 3
        },
        betlines: 20
      },
      bonus: {
        holdAndSpin: {
          enabled: true,
          gridSize: [5, 3],
          initialRespins: 3,
          maxSymbolValue: 100,
          resetRespins: true
        }
      }
    }
  },
  {
    id: 'infinity-reels',
    category: 'slots',
    title: 'Infinity Reels',
    description: 'Expandable reels with no upper limit',
    preview: '/animations/infinity-reels.mp4',
    placeholder: '/thumbnails/slots.jpg',
    highlightFeatures: ['Expanding reels', 'Multiplier growth', 'Unlimited potential'],
    config: {
      reels: {
        payMechanism: 'ways',
        layout: {
          shape: 'rectangle',
          reels: 3,
          rows: 3
        }
      },
      volatility: {
        level: 'high',
        variance: 18,
        hitRate: 15,
        maxWinPotential: 20000
      }
    }
  },
  // SCRATCH CARDS
  {
    id: 'scratch-match3',
    category: 'scratch',
    title: 'Match-3 Scratch',
    description: 'Classic match 3 amounts/symbols to win',
    preview: 'none',
    placeholder: '/thumbnails/scratch.jpg',
    highlightFeatures: ['Classic Gameplay', 'Instant Wins', 'Customizable'],
    config: {
      gameType: 'scratch',
      scratch: {
        layout: { rows: 3, columns: 3, shape: 'square' },
        mechanic: { type: 'match_3' },
        brush: { size: 40, shape: 'circle' }
      }
    }
  },
  {
    id: 'scratch-symbol',
    category: 'scratch',
    title: 'Symbol Hunt',
    description: 'Find a specific lucky symbol to win',
    preview: 'none',
    placeholder: '/thumbnails/scratch.jpg',
    highlightFeatures: ['Target Search', 'Themed Objects', 'Quick Play'],
    config: {
      gameType: 'scratch',
      scratch: {
        layout: { rows: 4, columns: 4, shape: 'square' },
        mechanic: { type: 'find_symbol' },
        brush: { size: 40, shape: 'circle' }
      }
    }
  },
  {
    id: 'scratch-numbers',
    category: 'scratch',
    title: 'Lucky Numbers',
    description: 'Match your numbers to winning numbers',
    preview: 'none',
    placeholder: '/thumbnails/scratch.jpg',
    highlightFeatures: ['Lottery Style', 'Number Matching', 'High Volatility'],
    config: {
      gameType: 'scratch',
      scratch: {
        layout: { rows: 5, columns: 2, shape: 'rectangle' },
        mechanic: { type: 'lucky_number' },
        brush: { size: 30, shape: 'circle' }
      }
    }
  },
  {
    id: 'scratch',
    category: 'scratch',
    title: 'Scratch Card',
    description: 'Design instant win scratch card games',
    preview: '/animations/scratch-card.mp4',
    placeholder: '/thumbnails/scratch.jpg',
    highlightFeatures: ['Instant win mechanic', 'Custom scratch tools', 'Multiple prize tiers'],
    config: {
      gameType: 'scratch',
      scratch: {
        layout: { rows: 3, columns: 3, shape: 'square' },
        mechanic: { type: 'match_3', winningSymbol: 'prize' },
        brush: { size: 20, shape: 'circle', revealMode: 'scratch' },
        overlay: { image: '', color: '#C0C0C0', opacity: 1 },
        background: { type: 'color', value: '#ffffff' },
        symbols: { style: 'theme' },
        mascot: { enabled: false, source: 'none', position: 'bottom-right', scale: 1 },
        prizes: []
      }
    }
  },
  // CRASH GAMES
  {
    id: 'crash',
    category: 'crash',
    title: 'Crash',
    description: 'High-stakes multiplier curve game',
    preview: 'none',
    placeholder: '/thumbnails/crash.png',
    highlightFeatures: ['Multiplier Curve', 'Multiplayer Social', 'Cashout Mechanic'],
    config: {
      gameType: 'crash',
      crash: {
        mechanics: { growthAlgorithm: 'exponential', maxMultiplier: 100, crashProbability: 0.01 },
        visuals: { theme: 'classic' }
      }
    }
  },
  // TABLE GAMES
  {
    id: 'table-blackjack',
    category: 'table',
    title: 'Blackjack',
    description: 'Classic casino card game',
    preview: 'none',
    placeholder: '/thumbnails/table.jpg',
    highlightFeatures: ['Strategic Play', 'Dealer Interaction', 'High RTP'],
    config: {
      gameType: 'table',
      table: { type: 'blackjack' }
    }
  },
  {
    id: 'table-roulette',
    category: 'table',
    title: 'Roulette',
    description: 'European and American Roulette styles',
    preview: 'none',
    placeholder: '/thumbnails/table.jpg',
    highlightFeatures: ['Betting Table', 'Wheel Animation', 'Multiple Bet Types'],
    config: {
      gameType: 'table',
      table: { type: 'roulette' }
    }
  }
];