# Saved Symbol Images

This directory contains symbol images saved for different games.

## Structure

Images are organized by gameId in the following structure:

```
/saved-images/
  /{gameId1}/
    symbol1_wild.png
    symbol2_scatter.png
    ...
  /{gameId2}/
    ...
```

## Usage

1. Images are automatically saved here when generated via the GPT-image-1 API
2. Each game has its own directory based on the gameId
3. Symbol filenames include the symbolId and name for easy reference

## Notes

- Do not delete this directory or the README file
- The directory structure is created automatically as needed
- Images can be accessed directly via URL at `/saved-images/{gameId}/{filename}`