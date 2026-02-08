@echo off
echo Stopping any running servers...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak

:: Replace timestamp in file to force reload
echo // Cache buster timestamp: %TIME% > .\src\cache-buster.ts
echo export const CACHE_BUSTER = '%TIME%'; >> .\src\cache-buster.ts

:: Touch the file to update timestamp
type nul > src\components\visual-journey\VisualJourney.tsx.new
type src\components\visual-journey\VisualJourney.tsx >> src\components\visual-journey\VisualJourney.tsx.new
type nul > src\components\visual-journey\VisualJourney.tsx.new2
type src\components\visual-journey\VisualJourney.tsx.new >> src\components\visual-journey\VisualJourney.tsx.new2
move /y src\components\visual-journey\VisualJourney.tsx.new2 src\components\visual-journey\VisualJourney.tsx
del src\components\visual-journey\VisualJourney.tsx.new

echo Starting development server...
npm run dev
