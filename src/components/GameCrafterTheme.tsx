import { createContext, useContext } from 'react';

// Define Nintendo-inspired red from their branding
// This is the signature bright red used by Nintendo for the Switch, etc.
export const NINTENDO_RED = '#E60012';
export const NINTENDO_RED_DARK = '#B3000E';
export const NINTENDO_RED_LIGHT = '#FF4D4D';

// Game Crafter branded color scheme with Nintendo inspiration
export const GameCrafterColors = {
  // Primary colors
  primary: NINTENDO_RED,                // Nintendo signature red
  primaryDark: NINTENDO_RED_DARK,       // Darker variant for hover/active states
  primaryLight: NINTENDO_RED_LIGHT,     // Lighter variant for highlights/accents
  
  // Neutrals (elegant contrasting colors)
  dark: '#1A1A1A',                     // Near-black
  darkGray: '#333333',                 // Dark gray 
  mediumGray: '#666666',               // Medium gray
  lightGray: '#CCCCCC',                // Light gray
  offWhite: '#F8F8F8',                 // Off-white for backgrounds
  white: '#FFFFFF',                    // Pure white
  
  // Supporting palette for UI accents
  success: '#00C26E',                  // Green for success/completion
  warning: '#FFAB00',                  // Amber for warnings/alerts
  info: '#0091FF',                     // Blue for information
  error: '#FF3B30',                    // Red for errors (slightly different than brand red)
  
  // Playful accent colors (inspired by Nintendo's colorful controllers)
  accent1: '#209CEE',                  // Blue - neon blue joy-con
  accent2: '#FF4D55',                  // Red - neon red joy-con
  accent3: '#92CC41',                  // Green - reminiscent of Game Boy palette
  accent4: '#FDCA40',                  // Yellow - Switch Lite color
  accent5: '#9266CC',                  // Purple - GameCube controller color
  
  // Gradients
  gradient1: 'linear-gradient(135deg, #E60012 0%, #FF4D4D 100%)',       // Primary red gradient
  gradient2: 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)',       // Dark gradient
  gradient3: 'linear-gradient(135deg, #0091FF 0%, #209CEE 100%)',       // Blue accent gradient
  gradient4: 'linear-gradient(135deg, #92CC41 0%, #ADDA65 100%)',       // Green accent gradient
};

// Typography system
export const Typography = {
  fontFamily: {
    primary: '"Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif',
    display: '"Montserrat", "Helvetica Neue", Helvetica, Arial, sans-serif',
    mono: '"Roboto Mono", "Courier New", monospace',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
};

// Spacing system
export const Spacing = {
  '0': '0',
  '1': '0.25rem',      // 4px
  '2': '0.5rem',       // 8px
  '3': '0.75rem',      // 12px
  '4': '1rem',         // 16px
  '5': '1.25rem',      // 20px
  '6': '1.5rem',       // 24px
  '8': '2rem',         // 32px
  '10': '2.5rem',      // 40px
  '12': '3rem',        // 48px
  '16': '4rem',        // 64px
  '20': '5rem',        // 80px
  '24': '6rem',        // 96px
  '32': '8rem',        // 128px
};

// Border radius system
export const BorderRadius = {
  none: '0',
  sm: '0.125rem',      // 2px
  md: '0.25rem',       // 4px
  lg: '0.5rem',        // 8px
  xl: '0.75rem',       // 12px
  '2xl': '1rem',       // 16px
  '3xl': '1.5rem',     // 24px
  full: '9999px',      // Fully rounded (circles, pills)
};

// Shadows
export const Shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 3px rgba(230, 0, 18, 0.5)', // Primary color with opacity
  none: 'none',
};

// Animation durations
export const Durations = {
  fastest: '50ms',
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  slowest: '500ms',
};

// Animation easings
export const Easings = {
  // Standard CSS easings
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  // Custom Nintendo-like snappy animations
  bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  snappy: 'cubic-bezier(0.15, 1.15, 0.5, 1)',
  elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// Z-index system
export const ZIndex = {
  hide: -1,
  base: 0,
  elevated: 1,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1700,
  tooltip: 1800,
};

// Complete theme object
export const GameCrafterTheme = {
  colors: GameCrafterColors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  durations: Durations,
  easings: Easings,
  zIndex: ZIndex,
  
  // Component-specific styling
  components: {
    // Button variants
    button: {
      primary: {
        backgroundColor: GameCrafterColors.primary,
        hoverBackgroundColor: GameCrafterColors.primaryDark,
        textColor: GameCrafterColors.white,
        borderRadius: BorderRadius.lg,
        fontWeight: Typography.fontWeight.bold,
        boxShadow: Shadows.md,
      },
      secondary: {
        backgroundColor: GameCrafterColors.white,
        hoverBackgroundColor: GameCrafterColors.offWhite,
        textColor: GameCrafterColors.dark,
        borderColor: GameCrafterColors.lightGray,
        borderRadius: BorderRadius.lg,
        fontWeight: Typography.fontWeight.medium,
        boxShadow: Shadows.sm,
      },
      success: {
        backgroundColor: GameCrafterColors.success,
        hoverBackgroundColor: '#00A85C',
        textColor: GameCrafterColors.white,
        borderRadius: BorderRadius.lg,
        fontWeight: Typography.fontWeight.bold,
        boxShadow: Shadows.md,
      },
      danger: {
        backgroundColor: GameCrafterColors.error,
        hoverBackgroundColor: '#D9302C',
        textColor: GameCrafterColors.white,
        borderRadius: BorderRadius.lg,
        fontWeight: Typography.fontWeight.bold,
        boxShadow: Shadows.md,
      },
      link: {
        textColor: GameCrafterColors.primary,
        hoverTextColor: GameCrafterColors.primaryDark,
        textDecoration: 'none',
        hoverTextDecoration: 'underline',
        fontWeight: Typography.fontWeight.medium,
      },
    },
    
    // Card styling
    card: {
      backgroundColor: GameCrafterColors.white,
      borderRadius: BorderRadius.xl,
      boxShadow: Shadows.lg,
      padding: Spacing['6'],
      headerFontSize: Typography.fontSize.xl,
      headerFontWeight: Typography.fontWeight.bold,
    },
    
    // Input styling
    input: {
      backgroundColor: GameCrafterColors.white,
      borderColor: GameCrafterColors.lightGray,
      borderRadius: BorderRadius.lg,
      focusBorderColor: GameCrafterColors.primary,
      fontSize: Typography.fontSize.base,
      padding: `${Spacing['3']} ${Spacing['4']}`,
      boxShadow: Shadows.sm,
      focusBoxShadow: Shadows.outline,
    },
    
    // Navigation
    navigation: {
      backgroundColor: GameCrafterColors.white,
      textColor: GameCrafterColors.darkGray,
      activeTextColor: GameCrafterColors.primary,
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.medium,
      activeFontWeight: Typography.fontWeight.bold,
      boxShadow: Shadows.md,
    },
    
    // Game preview
    gamePreview: {
      backgroundColor: GameCrafterColors.dark,
      borderRadius: BorderRadius.xl,
      boxShadow: Shadows.xl,
      padding: Spacing['4'],
      headerColor: GameCrafterColors.white,
      controlBackgroundColor: GameCrafterColors.primary,
      controlTextColor: GameCrafterColors.white,
    },
  }
};

// Create context to provide theme throughout the app
const ThemeContext = createContext(GameCrafterTheme);

// Hook to use the theme
export const useGameCrafterTheme = () => useContext(ThemeContext);

export default GameCrafterTheme;