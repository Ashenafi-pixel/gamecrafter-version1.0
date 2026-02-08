# Step 5 Preset/Advanced Toggle Fix

## Problem

In the application workflow, Step 5 in the UI is actually using the Step6_BackgroundCreator.tsx component and showing "Background Design" as the title. The "Preset/Advanced" toggle needed to be added in a centered position below the "Game Assets" heading and above the "Background & Frame Creator" subheading.

## Solution

1. Added a viewMode state to the Step6_BackgroundCreator.tsx component:
   ```jsx
   const [viewMode, setViewMode] = useState<'preset' | 'advanced'>('preset');
   ```

2. Added the centered Preset/Advanced toggle UI section:
   ```jsx
   {/* Centered Preset/Advanced toggle */}
   <div className="flex flex-col items-center justify-center mb-3 sm:mb-4 md:mb-6">
     <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 text-center">Background & Frame Creator</h2>
     
     <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
       <span className={`text-sm sm:text-base ${viewMode === 'preset' ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
         Preset
       </span>
       <div 
         className="relative inline-block w-10 sm:w-12 h-5 sm:h-6 bg-gray-200 rounded-full cursor-pointer"
         onClick={() => setViewMode(viewMode === 'preset' ? 'advanced' : 'preset')}
       >
         <div 
           className={`absolute w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 top-0.5 ${
             viewMode === 'advanced' ? 'translate-x-5 sm:translate-x-6 bg-blue-600' : 'translate-x-0.5'
           }`}
         ></div>
         <div className={`absolute inset-0 rounded-full transition-colors duration-300 ${
           viewMode === 'advanced' ? 'bg-blue-400' : ''
         }`}></div>
       </div>
       <span className={`text-sm sm:text-base ${viewMode === 'advanced' ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
         Advanced
       </span>
     </div>
   </div>
   ```

## Implementation Details

- Placed the toggle in the correct location in the UI hierarchy:
  1. "Game Assets" (main heading) 
  2. "Background & Frame Creator" (sub-heading)
  3. Preset/Advanced toggle (centered below sub-heading)

- Styled the toggle with:
  - Light gray background
  - Rounded pill shape
  - Blue highlighting for the active option
  - Smooth transition animations

## Result

The UI now has a proper heading structure with:
- "Game Assets" as the main heading
- "Background & Frame Creator" as the sub-heading
- A centered Preset/Advanced toggle that's visible and easy to use
- Clear visual indication of which mode is currently active