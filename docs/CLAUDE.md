# SlotAI Project Information

## Project Description
SlotAI is an application for designing and visualizing slot machine games. It includes components for theme generation, core mechanics configuration, bonus features, math model adjustment, symbol management, and more.

## Server Management Commands
- Start server: `node simple-server.js` or `run-server.bat` (Windows)
- Stop server: Press Ctrl+C in the terminal
- Access application: http://localhost:3500

## Key Development Commands
- Build: `npm run build`  
- Development server: `npm run dev`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`

## Fooocus API Integration
- Default API endpoint: http://localhost:8888
- API endpoint is configurable in the UI settings
- Fallback to placeholder images when API isn't available

## RTP and Math Considerations
- Default RTP: 96%
- Optimal symbol count: 8-12 symbols
- Special symbols (wild, scatter) affect RTP distribution
- Volatility scale: 1-10, with low (1-3), medium (4-7), and high (8-10)

## Symbol Management
- Optimal configuration: 1 wild, 1 scatter, 3-4 high-paying, 5-6 low-paying
- Symbols use generated images from the theme when available
- Symbol weights affect RTP and hit frequency

## Grid Configuration
- Landscape: 5x3 grid layout
- Portrait: 3x5 grid layout
- Supports paylines and cluster pays mechanics

## Code Standards
- React/TypeScript for frontend
- Express for the server
- Netlify functions for API interactions
- Use consistent styling with the existing codebase
- Tailwind CSS for styling

## Repository Structure
- `/src`: Frontend React code
- `/dist`: Build output
- `/public`: Static assets
- `/netlify/functions`: Serverless functions

## Current Issues Being Fixed
1. Fooocus API Integration: Fixed URL and request formats
2. Symbol display: Updated code to show generated theme symbols 
3. RTP calculation: Improved to account for symbol count
4. Server access: Added convenience scripts for server management