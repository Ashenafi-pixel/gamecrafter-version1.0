# Dynamic Balance Endpoint Configuration Documentation

## Overview

The GameCrafter system uses a flexible, configuration-driven approach for integrating balance API endpoints into exported games. This allows game developers to dynamically configure balance integration without modifying code, enabling seamless integration with different gaming platforms and APIs.

## Architecture

### 1. Configuration-Driven Design

The balance integration is controlled through a centralized configuration object that defines:

- **API Endpoints**: Platform URLs and specific balance endpoints
- **Authentication**: JWT token handling and provider information
- **Game Metadata**: Game IDs, provider details, and currency settings
- **UI Integration**: Optional balance UI components and display settings

### 2. Configuration Structure

```typescript
interface GameBundleConfig {
  // Core balance API configuration
  balanceApi: {
    platformUrl: string;           // Base URL for balance API
    jwtToken: string;              // Authentication token (set at runtime)
    gameProvider: string;          // Gaming platform identifier
    gameId: string;                // Unique game identifier
    currency: string;               // Default currency (USD, BTC, ETH)
    timeout?: number;              // API request timeout in milliseconds
  };
  
  // Integration settings
  enableBalanceIntegration: boolean;  // Master switch for balance features
  autoSyncBalance: boolean;           // Automatic balance synchronization
  includeBalanceUI: boolean;          // Show balance UI components
  currency: string;                   // Default currency for display
}
```

## Implementation Approach

### 1. Configuration UI Integration

The configuration is exposed through the game export interface in `Step7_Export.tsx`:

```typescript
// Balance API Configuration UI
<div className="balance-api-config">
  <h3>Balance API Integration</h3>
  
  <div className="config-field">
    <label>Platform URL:</label>
    <input
      type="text"
      id="balance-platform-url"
      placeholder="https://your-platform.com/api"
      defaultValue="https://api.latam-crypto.com"
    />
  </div>
  
  <div className="config-field">
    <label>Game Provider:</label>
    <input
      type="text"
      id="balance-game-provider"
      placeholder="Your provider name"
      defaultValue="latam-crypto"
    />
  </div>
  
  <div className="config-field">
    <label>Game ID:</label>
    <input
      type="text"
      id="balance-game-id"
      placeholder="Unique game identifier"
    />
  </div>
  
  <div className="config-field">
    <label>Currency:</label>
    <select id="balance-currency">
      <option value="USD">USD</option>
      <option value="BTC">BTC</option>
      <option value="ETH">ETH</option>
    </select>
  </div>
  
  <div className="config-field">
    <label>
      <input type="checkbox" id="enable-balance-integration" />
      Enable Balance Integration
    </label>
  </div>
  
  <div className="config-field">
    <label>
      <input type="checkbox" id="include-balance-ui" />
      Show Balance UI
    </label>
  </div>
</div>
```

### 2. Configuration Extraction

The `getBalanceConfig()` function extracts configuration from the UI:

```typescript
function getBalanceConfig(): GameBundleConfig {
  return {
    balanceApi: {
      platformUrl: document.getElementById('balance-platform-url')?.value || '',
      jwtToken: '', // Set at runtime via JWT token exchange
      gameProvider: document.getElementById('balance-game-provider')?.value || '',
      gameId: document.getElementById('balance-game-id')?.value || '',
      currency: document.getElementById('balance-currency')?.value || 'USD',
      timeout: 10000
    },
    enableBalanceIntegration: document.getElementById('enable-balance-integration')?.checked || false,
    autoSyncBalance: true,
    includeBalanceUI: document.getElementById('include-balance-ui')?.checked || false,
    currency: document.getElementById('balance-currency')?.value || 'USD'
  };
}
```

### 3. Dynamic HTML Generation

The configuration is dynamically injected into exported game HTML:

```typescript
export const generateScratchHTML = (cleanConfig: any, balanceConfig?: GameBundleConfig): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>${cleanConfig.displayName || 'Scratch Card'} | Game Crafter</title>
      <!-- Game assets and styles -->
    </head>
    <body>
      <!-- Game container -->
      
      <!-- Balance UI Components (conditionally injected) -->
      ${generateScratchBalanceUI(balanceConfig)}
      
      <!-- Balance Integration Script (conditionally injected) -->
      ${generateScratchBalanceIntegrationScript(balanceConfig)}
      
      <!-- Main game script -->
      <script>
        // Game initialization logic
      </script>
    </body>
    </html>
  `;
};
```

### 4. Balance Integration Script Generation

The balance API client is dynamically generated based on configuration:

```typescript
export const generateScratchBalanceIntegrationScript = (balanceConfig?: GameBundleConfig): string => {
  if (!balanceConfig || !balanceConfig.enableBalanceIntegration) {
    return '';
  }

  return `
    <script>
      // Global balance configuration
      window.BALANCE_CONFIG = {
        balanceApi: {
          platformUrl: '${balanceConfig.balanceApi.platformUrl}',
          jwtToken: '',
          gameProvider: '${balanceConfig.balanceApi.gameProvider}',
          gameId: '${balanceConfig.balanceApi.gameId}',
          currency: '${balanceConfig.balanceApi.currency}',
          timeout: ${balanceConfig.balanceApi.timeout || 10000}
        },
        enableBalanceIntegration: ${balanceConfig.enableBalanceIntegration},
        autoSyncBalance: ${balanceConfig.autoSyncBalance},
        includeBalanceUI: ${balanceConfig.includeBalanceUI},
        currency: '${balanceConfig.currency}'
      };
      
      // Balance API Client Class
      class ScratchBalanceManager {
        constructor(config) {
          this.config = config;
          this.apiClient = {
            baseUrl: config.balanceApi.platformUrl,
            jwtToken: '', // Set at runtime
            currency: config.currency,
            timeout: config.balanceApi.timeout
          };
        }
        
        // Dynamic API endpoint construction
        async makeRequest(endpoint, method = 'GET', data = null) {
          const url = this.apiClient.baseUrl + endpoint;
          // ... request logic
        }
        
        // Balance operations
        async getBalance() {
          return await this.makeRequest('/balance', 'GET');
        }
        
        async debit(amount, currency) {
          return await this.makeRequest('/debit', 'POST', {
            amount,
            currency,
            gameId: this.config.balanceApi.gameId
          });
        }
        
        async credit(amount, currency) {
          return await this.makeRequest('/credit', 'POST', {
            amount,
            currency,
            gameId: this.config.balanceApi.gameId
          });
        }
      }
      
      // Initialize balance manager
      const balanceManager = new ScratchBalanceManager(window.BALANCE_CONFIG);
    </script>
  `;
};
```

## Dynamic Endpoint Resolution

### 1. Base URL Configuration

The platform URL is configurable through the UI:

```typescript
// Example configurations:
const platformUrls = {
  'latam-crypto': 'https://api.latam-crypto.com',
  'betconstruct': 'https://api.betconstruct.com',
  'softswiss': 'https://api.softswiss.com',
  'custom': 'https://your-custom-platform.com'
};
```

### 2. Endpoint Construction

Endpoints are dynamically constructed based on the base URL:

```typescript
class ScratchBalanceManager {
  // Dynamic endpoint construction
  getBalanceEndpoint() {
    return `${this.apiClient.baseUrl}/balance`;
  }
  
  getDebitEndpoint() {
    return `${this.apiClient.baseUrl}/debit`;
  }
  
  getCreditEndpoint() {
    return `${this.apiClient.baseUrl}/credit`;
  }
  
  // Example: https://api.latam-crypto.com/balance
  // Example: https://api.betconstruct.com/debit
}
```

### 3. Request Routing

All balance requests are routed through the configured platform:

```typescript
async makeRequest(endpoint, method = 'GET', data = null) {
  const url = this.config.balanceApi.platformUrl + endpoint;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + this.apiClient.jwtToken,
    'X-Game-ID': this.config.balanceApi.gameId,
    'X-Game-Provider': this.config.balanceApi.gameProvider
  };
  
  const options = {
    method: method,
    headers: headers
  };
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }
  
  return await fetch(url, options);
}
```

## JWT Token Management

### 1. Token Exchange Protocol

The system uses PostMessage for secure token exchange:

```typescript
async getJWTToken() {
  return new Promise((resolve, reject) => {
    if (window.parent !== window) {
      // Request JWT token from parent window
      window.parent.postMessage({
        type: 'REQUEST_JWT_TOKEN',
        gameId: window.GAME_CONFIG?.gameId || 'unknown'
      }, '*');
      
      // Listen for JWT token response
      const tokenHandler = (event) => {
        if (event.data.type === 'JWT_TOKEN_RESPONSE') {
          window.removeEventListener('message', tokenHandler);
          this.jwtToken = event.data.token;
          resolve(event.data.token);
        }
      };
      
      window.addEventListener('message', tokenHandler);
    } else {
      // For testing outside iframe
      this.jwtToken = 'test-jwt-token-' + Date.now();
      resolve(this.jwtToken);
    }
  });
}
```

### 2. Token Refresh

Automatic token refresh handling:

```typescript
setupEventListeners() {
  window.addEventListener('message', (event) => {
    if (event.data.type === 'JWT_TOKEN_REFRESH') {
      this.jwtToken = event.data.token;
      if (this.apiClient) {
        this.apiClient.jwtToken = event.data.token;
      }
    }
  });
}
```

## Multi-Platform Support

### 1. Platform-Specific Configurations

Different platforms can be supported through configuration:

```typescript
const platformConfigs = {
  'latam-crypto': {
    platformUrl: 'https://api.latam-crypto.com',
    endpoints: {
      balance: '/balance',
      debit: '/debit',
      credit: '/credit'
    },
    headers: {
      'X-Platform': 'latam-crypto'
    }
  },
  'betconstruct': {
    platformUrl: 'https://api.betconstruct.com',
    endpoints: {
      balance: '/v1/wallet/balance',
      debit: '/v1/wallet/debit',
      credit: '/v1/wallet/credit'
    },
    headers: {
      'X-Platform': 'betconstruct'
    }
  }
};
```

### 2. Dynamic Platform Selection

The platform can be selected based on configuration:

```typescript
class ScratchBalanceManager {
  constructor(config) {
    this.config = config;
    this.platformConfig = platformConfigs[config.balanceApi.gameProvider] || platformConfigs['default'];
  }
  
  getEndpoint(operation) {
    return this.platformConfig.endpoints[operation];
  }
}
```

## Security Considerations

### 1. Token Security

- JWT tokens are never stored in the game bundle
- Tokens are exchanged via secure PostMessage protocol
- Tokens have limited lifetime and automatic refresh

### 2. API Security

- All requests include authentication headers
- Game ID and provider are validated on the backend
- CORS policies restrict API access

### 3. Configuration Validation

```typescript
function validateBalanceConfig(config: GameBundleConfig): boolean {
  if (!config.enableBalanceIntegration) return true;
  
  return !!(
    config.balanceApi.platformUrl &&
    config.balanceApi.gameProvider &&
    config.balanceApi.gameId &&
    config.balanceApi.currency
  );
}
```

## Usage Examples

### 1. LATAM Crypto Integration

```typescript
const latamCryptoConfig: GameBundleConfig = {
  balanceApi: {
    platformUrl: 'https://api.latam-crypto.com',
    jwtToken: '',
    gameProvider: 'latam-crypto',
    gameId: 'scratch-game-001',
    currency: 'USD',
    timeout: 10000
  },
  enableBalanceIntegration: true,
  autoSyncBalance: true,
  includeBalanceUI: true,
  currency: 'USD'
};
```

### 2. Custom Platform Integration

```typescript
const customPlatformConfig: GameBundleConfig = {
  balanceApi: {
    platformUrl: 'https://your-platform.com/api/v1',
    jwtToken: '',
    gameProvider: 'custom-platform',
    gameId: 'my-scratch-game',
    currency: 'BTC',
    timeout: 15000
  },
  enableBalanceIntegration: true,
  autoSyncBalance: false,
  includeBalanceUI: true,
  currency: 'BTC'
};
```

## Testing and Debugging

### 1. Debug Logging

Comprehensive logging for debugging:

```typescript
console.log('🚀 [SCRATCH-BALANCE] Initializing Balance API Integration...');
console.log('📋 [SCRATCH-BALANCE] Config:', window.BALANCE_CONFIG);
console.log('🌐 [SCRATCH-BALANCE] Making ' + method + ' request to ' + endpoint + '...');
console.log('📤 [SCRATCH-BALANCE] Request details:', { url, method, headers, hasBody });
console.log('📥 [SCRATCH-BALANCE] Response status:', response.status);
```

### 2. Error Handling

Robust error handling for API failures:

```typescript
try {
  const response = await this.makeRequest('/balance', 'GET');
  this.balances = response.balances || {};
  this.emit('balanceUpdated', this.balances);
} catch (error) {
  console.error('❌ [SCRATCH-BALANCE] Failed to get balance:', error);
  this.handleError('Balance API error', error);
}
```

## Future Enhancements

### 1. Multi-Currency Support

- Support for multiple currencies per game
- Real-time currency conversion
- Currency-specific balance displays

### 2. Advanced Authentication

- OAuth2 integration
- API key authentication
- Multi-factor authentication support

### 3. Analytics Integration

- Balance transaction tracking
- Player behavior analytics
- Revenue reporting

## Conclusion

The dynamic balance endpoint configuration approach provides:

- **Flexibility**: Easy integration with different gaming platforms
- **Security**: Secure token management and API communication
- **Maintainability**: Configuration-driven, no code changes needed
- **Scalability**: Support for multiple platforms and currencies
- **Debugging**: Comprehensive logging and error handling

This architecture enables game developers to quickly integrate balance APIs from various platforms while maintaining security and reliability.
