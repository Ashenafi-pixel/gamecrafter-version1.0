export const gameTypes = [
  {
    id: 'classic-reels',
    title: 'Classic Reels',
    description: '5x3 grid with payline wins',
    preview: '/animations/classic-reels.mp4',
    placeholder: '/themes/classic-reels.avif',
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
    title: 'Ways to Win',
    description: 'Win in any position on adjacent reels',
    preview: '/animations/ways-slots.mp4',
    placeholder: '/themes/ways-to-win.avif',
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
    title: 'Grid Slots',
    description: 'Cluster pays on a large grid',
    preview: '/animations/grid-slots.mp4',
    placeholder: '/themes/grid-slot.avif',
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
    title: 'Megaways™ Style',
    description: 'Variable rows with up to 117,649 ways',
    preview: '/animations/megaways.mp4',
    placeholder: '/themes/megaways-style.avif',
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
    title: 'Hold & Win',
    description: 'Respins feature with sticky symbols',
    preview: '/animations/hold-and-win.mp4',
    placeholder: '/themes/hold-and-win.avif',
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
    title: 'Infinity Reels',
    description: 'Expandable reels with no upper limit',
    preview: '/animations/infinity-reels.mp4',
    placeholder: '/themes/infinity-reels.avif',
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
  {
    id: 'scratch',
    title: 'Scratch Card',
    description: 'Instant win games with reveal mechanics',
    preview: 'none',
    placeholder: 'none',
    highlightFeatures: ['Custom Brush', 'Asset Layers', 'Instant Wins'],
    config: {
      gameType: 'scratch',
      scratch: {
        layout: { rows: 3, columns: 3, shape: 'square' },
        mechanic: { type: 'match_3' },
        brush: { size: 40, shape: 'circle' }
      }
    }
  }
];