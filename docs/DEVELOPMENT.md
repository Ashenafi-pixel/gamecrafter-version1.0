# SlotMaker AI Development Tracking

## Project Overview
SlotMaker AI is a comprehensive slot game creation tool that allows users to design and configure casino games with an intuitive step-by-step process.

## Core Features

### Game Types
- [x] Slot Games
- [ ] Scratch Cards (Coming Soon)
- [ ] Video Bingo (Coming Soon)
- [ ] Table Games (Coming Soon)

### Step-by-Step Configuration
1. Core Mechanics
   - [x] Pay Mechanism Selection
   - [x] Grid Configuration
   - [x] Configuration Summary
   - [x] Mobile-Responsive Layout

2. Symbols & Payouts
   - [x] Symbol Management
   - [x] Payout Configuration
   - [x] Weight Distribution
   - [x] Symbol Preview

3. Bonus Features
   - [x] Free Spins
   - [x] Pick & Click
   - [x] Wheel Bonus
   - [x] Hold & Spin

4. Math Model
   - [x] RTP Configuration
   - [x] Volatility Settings
   - [x] Game Simulation
   - [x] Statistical Analysis

5. Theme
   - [x] Visual Style
   - [x] Color Scheme
   - [x] Sound Design
   - [x] Animations

6. UI Design
   - [x] Layout Selection
   - [x] Button Configuration
   - [x] Responsive Design
   - [x] Theme Customization

7. Game Rules
   - [x] Rule Configuration
   - [x] Documentation Generation
   - [x] Localization Support

8. AI Tools
   - [x] Asset Generation
   - [x] Math Model Optimization
   - [x] Theme Suggestions

## Recent Updates

### Version 1.0.0
- Initial release with core slot game creation functionality
- Implemented step-by-step configuration process
- Added basic AI-powered suggestions
- Mobile-responsive design

### Current Development
- Refining core mechanics UI/UX
- Improving mobile responsiveness
- Enhancing configuration summary display
- Adding validation and error handling

## Upcoming Features
1. Enhanced AI Integration
   - Automated math model balancing
   - Smart symbol design suggestions
   - Theme generation assistance

2. Advanced Customization
   - Custom reel configurations
   - Advanced bonus feature builder
   - Dynamic symbol animations

3. Testing & Certification
   - RNG certification tools
   - Automated testing suite
   - Compliance checkers

## Technical Stack
- React 18.3.1
- TypeScript
- Tailwind CSS
- Vite
- Zustand (State Management)
- Recharts (Data Visualization)
- Lucide React (Icons)

## Development Guidelines
1. Code Structure
   - Follow component-based architecture
   - Maintain type safety with TypeScript
   - Use Tailwind CSS for styling

2. State Management
   - Use Zustand for global state
   - Keep component state local when possible
   - Implement proper state persistence

3. UI/UX Standards
   - Maintain consistent spacing
   - Follow color scheme guidelines
   - Ensure mobile responsiveness
   - Implement proper loading states

4. Performance
   - Optimize component rendering
   - Implement proper code splitting
   - Monitor bundle size

## Testing Strategy
1. Unit Tests
   - Component testing
   - State management
   - Utility functions

2. Integration Tests
   - Feature workflows
   - State interactions
   - API integration

3. E2E Tests
   - User journeys
   - Cross-browser testing
   - Mobile testing

## Deployment
- Automated deployment via Netlify
- Environment-specific configurations
- Proper versioning and tagging

## Running the Development Server

### Local Development

1. **Standard Development Mode**
   ```
   npm run dev
   ```
   This runs the Vite development server for the frontend only.

2. **Development with Mock API**
   ```
   ./run-dev.sh
   ```
   This runs a special development server that includes mock API endpoints for testing game configuration loading and saving. The mock API server stores configurations in a `mock-db` folder as JSON files.

3. **API Configuration**
   - Default API URL for production: `https://a451-66-81-180-173.ngrok-free.app`
   - For local development with mock API: `http://localhost:3500`
   - API endpoints follow the format: `/v1/configurations`

### API Integration

The application integrates with an API for game configuration management:

- **API Setup**: Configure API URL and credentials in the API & Saved Games section
- **Local Testing**: Use the development server with mock API for local testing
- **Endpoints**:
  - GET `/v1/configurations` - List all game configurations
  - GET `/v1/configurations/:gameId` - Get a specific configuration
  - POST `/v1/configurations` - Create a new configuration
  - PUT `/v1/configurations/:gameId` - Update a configuration
  - DELETE `/v1/configurations/:gameId` - Delete a configuration
  - POST `/v1/configurations/:gameId/clone` - Clone a configuration

#### API Connection Strategy

The application connects directly to the Swagger API for retrieving game configurations:

1. **Direct Swagger API**: Uses the configured Swagger API endpoint (https://a451-66-81-180-173.ngrok-free.app/v1/configurations)
2. **Sample Data**: Falls back to sample data only if the API is unavailable or returns errors

The connection logic uses XMLHttpRequest for direct API access and comprehensive error handling for different response formats.

#### API Testing and Debugging

For testing the API connection directly:
- Use the `/api-test.html` page - a graphical tool for API connectivity testing
- Run the local development server with `./run-dev.sh` for testing with mock data
- Check the browser console for detailed API connection logs

## Known Issues
1. UI/UX
   - [ ] Configuration summary spacing on mobile
   - [ ] Touch interactions on grid selection
   - [ ] Responsive layout improvements needed

2. Features
   - [ ] Advanced grid configurations
   - [ ] Custom pay mechanism definitions
   - [ ] Enhanced mobile controls
   
3. API Integration
   - [x] HTML instead of JSON responses from API - Fixed with improved error handling and local mock API
   - [x] Better handling of different API response formats - Implemented comprehensive content-type detection
   - [x] Improved error messages for API connectivity issues - Added detailed error feedback
   - [x] Added tiered fallback approach to ensure application remains functional when APIs are unavailable

## Contributing
1. Branch Strategy
   - main: Production-ready code
   - develop: Development branch
   - feature/*: New features
   - bugfix/*: Bug fixes

2. Pull Request Process
   - Code review required
   - Tests must pass
   - Documentation updated
   - Changelog entry added

## Documentation
- Component documentation
- API documentation
- User guides
- Development guides

## License
MIT License