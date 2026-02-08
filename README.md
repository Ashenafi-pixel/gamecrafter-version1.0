# SlotAI

SlotAI is an application for designing and visualizing slot machine games. It includes components for theme generation, core mechanics configuration, bonus features, math model adjustment, symbol management, and more.

## Local Development

### Prerequisites
- Node.js (version 18 or later)
- npm

### Running Locally
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Access the application at: http://localhost:5173

## Deployment to Render.com

This project is configured for easy deployment to Render.com. There are two ways to deploy:

### Method 1: Automatic Deployment using Blueprint (Recommended)

1. Fork this repository to your GitHub account
2. Login to [Render.com](https://render.com)
3. Click "New" and select "Blueprint"
4. Connect your GitHub account and select your forked repository
5. Render will automatically deploy your application using the configuration in `render.yaml`

### Method 2: Manual Deployment

1. Login to [Render.com](https://render.com)
2. Click "New" and select "Web Service"
3. Connect your GitHub repository
4. Use the following settings:
   - Environment: Node
   - Build Command: `npm ci && npm run build`
   - Start Command: `node static-server.cjs`
   - Auto-Deploy: Yes (if you want automatic deployments on Git push)
5. Click "Create Web Service"

## Configuration

The default port is 3500, but when deployed to Render, it will use the PORT environment variable provided by the platform.

## Features

- Theme generation and visualization
- Symbol management and creation
- Core mechanics configuration
- Bonus features setup
- Math model adjustment
- RTP and volatility settings
- Win animation workshop
- Full-screen slot machine visualization

## License


This project is proprietary software. All rights reserved.
