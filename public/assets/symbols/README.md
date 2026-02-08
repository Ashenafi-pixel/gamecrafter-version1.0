# Symbol Placeholder Images

This directory is used for custom slot machine symbol images. 

## Recommended Symbol Structure

For optimal game design, include the following types of symbols:

1. **Wild Symbol** (1): Typically the highest paying and often acts as a substitute for other symbols
2. **Scatter Symbol** (1): Triggers bonus features and pays in any position
3. **High-paying Symbols** (3-4): Thematic symbols related to your game's theme
4. **Low-paying Symbols** (4-6): Often card suits or card values (A, K, Q, J, 10, 9)

## File Naming Convention

Use the following naming pattern for your symbol images:
- `wild.png` - For the wild symbol
- `scatter.png` - For the scatter symbol
- `high_1.png`, `high_2.png`, etc. - For high-paying symbols
- `low_1.png`, `low_2.png`, etc. - For low-paying symbols

## Image Requirements

- Format: PNG with transparency or JPG
- Size: Recommended 256x256 pixels (square)
- Background: Transparent (PNG) for best results
- File size: Keep under 100KB per image for optimal performance

## Symbol Count

The optimal number of symbols depends on your grid size:
- For a 3x3 grid: 6-8 symbols
- For a 5x3 grid: 8-10 symbols
- For larger grids: 10-12 symbols

Too few symbols will make the game too easy, while too many will make wins too rare.

## Default Fallbacks

If you don't provide custom symbols, the game will use built-in fallback images.