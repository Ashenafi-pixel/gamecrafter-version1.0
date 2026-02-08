# SlotAI Asset Dimensions Guide

This guide provides the exact dimensions required for creating custom assets for your slot machine game.

## Frame Dimensions

Frames should be created with the following specifications:

- **Width**: 768 pixels
- **Height**: 768 pixels (1:1 square ratio)
- **Format**: PNG with alpha transparency
- **Transparent Center**: The frame should have a transparent rectangular cutout in the center (70-80% of the frame area)
- **Border Width**: Approximately 10-15% of the image width on each side
- **Consistency**: The border should be roughly even on all sides
- **Important**: Make sure the transparency is properly set to alpha = 0 for the center cutout

### Frame Design Tips

- Use clean edges between the frame and the transparent center
- Keep decorative elements on the outer border, not overlapping the transparent center
- Test your frame on different backgrounds to ensure the transparency works correctly
- Avoid using inner grid lines if you select "No Inner Grid" in the frame settings

## Background Dimensions

Backgrounds should be created with the following specifications:

- **Width**: 1024 pixels
- **Height**: 768 pixels
- **Aspect Ratio**: 4:3 (aspect-video)
- **Format**: PNG or JPG
- **Content Placement**: Important elements should be in the center, as edges might be cropped on some screen sizes
- **Design Area**: While the frame will overlay the background, design the entire background (don't leave a blank center)

### Background Design Tips

- Use a design that works well with your frame
- If using patterns or textures, ensure they tile properly if animated
- Keep the background visually interesting but not distracting
- Maintain sufficient contrast with your symbols and UI elements

## Symbol Dimensions

Symbols should be created with the following specifications:

- **Width**: 256 pixels (recommended)
- **Height**: 256 pixels (recommended)
- **Format**: PNG with transparency
- **Design Area**: Use the center 80% of the image for the main symbol content

### Symbol Design Tips

- Design symbols that are recognizable at smaller sizes
- High-value symbols should appear visually more valuable
- Use consistent visual language across all symbol types
- Wild and Scatter symbols should be visually distinctive

## Uploading Custom Assets

You can upload custom assets in the following steps:

1. **Frames**: Upload in Step 5 (Game Frame Designer)
2. **Backgrounds**: Upload in Step 6 (Background Creator)
3. **Symbols**: Upload in Step 4 (Symbol Generation)

When uploading, ensure your images match the specifications for optimal results.