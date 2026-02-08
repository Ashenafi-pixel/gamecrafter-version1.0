#\!/bin/bash

# Clean up references to endpoints and swagger/API schema in specific locations
# but avoid touching actual API functionality in API-related files

# Fix APIExport files - these need to retain functionality but we can remove documentation parts
sed -i '/API Integration Notes/d' "/mnt/c/ClaudeCode/Slotai/src/components/direct-steps/APIExport.tsx" 
sed -i '/API Documentation/d' "/mnt/c/ClaudeCode/Slotai/src/components/direct-steps/APIExport.tsx"
sed -i '/View Full Schema/d' "/mnt/c/ClaudeCode/Slotai/src/components/direct-steps/APIExport.tsx"

sed -i '/API Integration Notes/d' "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step12_APIExport.tsx"
sed -i '/API Documentation/d' "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step12_APIExport.tsx"
sed -i '/View Full Schema/d' "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step12_APIExport.tsx"

# Fix references to Swagger in APISetup.tsx but preserve functionality
sed -i 's/Swagger specification/API format/g' "/mnt/c/ClaudeCode/Slotai/src/components/APISetup.tsx"
sed -i '/Swagger schema/d' "/mnt/c/ClaudeCode/Slotai/src/components/APISetup.tsx"

# Fix LightningTestComponent - check if it has API documentation
grep -n "API Documentation" "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/win-animation/LightningTestComponent.tsx"
sed -i '/API Documentation/d' "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/win-animation/LightningTestComponent.tsx"
sed -i '/API Endpoint/d' "/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/win-animation/LightningTestComponent.tsx"

echo "Final cleanup complete"
