#\!/bin/bash

# List of files to process
FILES=(
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step3_ReelConfiguration.tsx"
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step4_SymbolGeneration.tsx"
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step5_GameFrameDesigner.tsx"
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step6_BackgroundCreator.tsx"
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step7_WinAnimationWorkshop.tsx"
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step8_BonusFeatures.tsx"
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step9_MathLab.tsx"
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step10_DeepSimulation.tsx"
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step11_MarketCompliance.tsx"
)

for file in "${FILES[@]}"; do
  # Check if file exists
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Remove API Integration Notes from JSDoc
    sed -i '/API Integration Notes:/,/-.*-/d' "$file"
    
    # Remove API Documentation Reference section
    sed -i '/{\/\* API Documentation Reference \*\/}/,/<\/div>/d' "$file"
    
    # Remove API Integration Section
    sed -i '/{\/\* API Integration Section \*\/}/,/<\/div>/d' "$file"
    
    # Fix potential double empty lines caused by removals
    sed -i '/^\s*$/N;/^\s*\n\s*$/D' "$file"
    
    echo "Done with $file"
  else
    echo "File $file not found\!"
  fi
done

echo "Finished removing API documentation sections"
