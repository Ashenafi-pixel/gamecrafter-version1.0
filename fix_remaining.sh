#\!/bin/bash

# Fix Step8_BonusFeatures.tsx
FILE="/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step8_BonusFeatures.tsx"
sed -i '/API Data Structure Example/,/{\/\* API Endpoint Details \*\/}/d' "$FILE" 
sed -i '/API Endpoint/,/application\/json/d' "$FILE"
sed -i 's/  );\n};/  );\n};\n/' "$FILE"
sed -i 's/      <BonusFeatures \/>\n\n        <\/div>/      <BonusFeatures \/>\n    <\/div>/' "$FILE"

# Fix Step9_MathLab.tsx
FILE="/mnt/c/ClaudeCode/Slotai/src/components/visual-journey/steps/Step9_MathLab.tsx"
sed -i '/API Data Structure Example/,/{\/\* API Endpoint Details \*\/}/d' "$FILE"
sed -i '/API Endpoint/,/application\/json/d' "$FILE"
sed -i 's/  );\n};/  );\n};\n/' "$FILE"
sed -i 's/      <VisualMathLab \/>\n\n        <\/div>/      <VisualMathLab \/>\n    <\/div>/' "$FILE"

# Re-add proper closing for Step files
sed -i '/^const Step8_BonusFeatures: React.FC/,$ s/    <\/div>\n  );\n};/    <\/div>\n  );\n};\n\nexport default Step8_BonusFeatures;/' "$FILE"
sed -i '/^const Step9_MathLab: React.FC/,$ s/    <\/div>\n  );\n};/    <\/div>\n  );\n};\n\nexport default Step9_MathLab;/' "$FILE"

echo "Finished fixing remaining files"
