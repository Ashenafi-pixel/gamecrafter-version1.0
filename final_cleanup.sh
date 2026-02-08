#\!/bin/bash

# List of files to process
FILES=(
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step10_DeepSimulation.tsx"
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step11_MarketCompliance.tsx" 
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step5_GameFrameDesigner.tsx"
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step6_BackgroundCreator.tsx"
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step7_WinAnimationWorkshop.tsx"
  "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step4_SymbolGeneration.tsx"
)

for file in "${FILES[@]}"; do
  echo "Processing $file..."
  
  # Remove any remaining API endpoints references
  sed -i '/API Endpoint/d' "$file"
  sed -i '/\/api\/v1\//d' "$file"
  
  echo "Done with $file"
done

echo "Finished final API documentation cleanup"
