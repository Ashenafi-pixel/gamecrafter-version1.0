import React, { useState, useCallback, useEffect } from 'react';
import { AIImageAnalyzer, AIAnalysisConfig } from '../ai/AIImageAnalyzer';

interface AIConfigPanelProps {
  aiAnalyzer: AIImageAnalyzer | null;
  onConfigChange: (config: Partial<AIAnalysisConfig>) => void;
  onAPIKeySet: (apiKey: string) => void;
  className?: string;
}

export const AIConfigPanel: React.FC<AIConfigPanelProps> = ({
  aiAnalyzer,
  onConfigChange,
  onAPIKeySet,
  className = ''
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [config, setConfig] = useState<AIAnalysisConfig>({
    useAI: true, // Start with AI enabled for MVP
    fallbackToHeuristic: true,
    confidenceThreshold: 0.7,
    enableComponentAnalysis: true,
    enableAnimationAssessment: true,
    cacheResults: true
  });
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'connected' | 'failed'>('connected'); // Start connected for MVP
  const [stats, setStats] = useState({
    enabled: false,
    requestCount: 0,
    lastRequestTime: null as Date | null,
    averageProcessingTime: 0
  });

  /**
   * Update configuration
   */
  const updateConfig = useCallback((key: keyof AIAnalysisConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    aiAnalyzer?.updateConfig(newConfig);
    onConfigChange(newConfig);
  }, [config, aiAnalyzer, onConfigChange]);

  /**
   * Handle API key submission
   */
  const handleApiKeySubmit = useCallback(async () => {
    if (!apiKey.trim()) return;

    try {
      setConnectionStatus('testing');
      onAPIKeySet(apiKey.trim());
      
      // Test connection if analyzer is available
      if (aiAnalyzer) {
        const isConnected = await aiAnalyzer.testAIConnection();
        setConnectionStatus(isConnected ? 'connected' : 'failed');
        
        if (isConnected) {
          updateConfig('useAI', true);
        }
      } else {
        setConnectionStatus('connected');
        updateConfig('useAI', true);
      }
    } catch (error) {
      setConnectionStatus('failed');
      console.error('Failed to set API key:', error);
    }
  }, [apiKey, aiAnalyzer, onAPIKeySet, updateConfig]);

  /**
   * Handle disable AI
   */
  const handleDisableAI = useCallback(() => {
    aiAnalyzer?.disableAI();
    updateConfig('useAI', false);
    setConnectionStatus('unknown');
  }, [aiAnalyzer, updateConfig]);

  /**
   * Update stats periodically
   */
  useEffect(() => {
    if (!aiAnalyzer) return;

    const updateStats = () => {
      const aiStats = aiAnalyzer.getAIStats();
      setStats(aiStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [aiAnalyzer]);

  /**
   * Get connection status color and text
   */
  const getConnectionDisplay = () => {
    switch (connectionStatus) {
      case 'testing':
        return { color: '#ffc107', text: 'Testing...' };
      case 'connected':
        return { color: '#28a745', text: 'Connected' };
      case 'failed':
        return { color: '#dc3545', text: 'Failed' };
      default:
        return { color: '#6c757d', text: 'Not configured' };
    }
  };

  const connectionDisplay = getConnectionDisplay();

  return (
    <div className={`ai-config-panel ${className}`} style={{
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
        AI Configuration
      </h3>

      {/* Connection Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Status:</span>
        <span style={{ 
          color: connectionDisplay.color, 
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {connectionDisplay.text}
        </span>
      </div>

      {/* MVP Notice */}
      <div style={{
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: '#e8f5e8',
        borderRadius: '4px',
        border: '1px solid #c3e6c3'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d5a2d', marginBottom: '4px' }}>
          🚀 MVP Mode Active
        </div>
        <div style={{ fontSize: '12px', color: '#2d5a2d' }}>
          AI is pre-configured and ready to use. No manual setup required.
        </div>
      </div>

      {/* API Key Configuration */}
      {!config.useAI && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontSize: '14px', 
            fontWeight: 'bold' 
          }}>
            OpenAI API Key:
          </label>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApiKeySubmit();
                }
              }}
            />
            
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showApiKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          <button
            onClick={handleApiKeySubmit}
            disabled={!apiKey.trim() || connectionStatus === 'testing'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: apiKey.trim() && connectionStatus !== 'testing' ? 'pointer' : 'not-allowed',
              opacity: apiKey.trim() && connectionStatus !== 'testing' ? 1 : 0.6,
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {connectionStatus === 'testing' ? 'Testing...' : 'Connect'}
          </button>
          
          <p style={{ 
            fontSize: '12px', 
            color: '#6c757d', 
            margin: '8px 0 0 0',
            lineHeight: 1.4
          }}>
            Enter your OpenAI API key to enable AI-powered image analysis.
            Your key is stored locally and never shared.
          </p>
        </div>
      )}

      {/* AI Configuration Options */}
      {config.useAI && (
        <div style={{ marginBottom: '20px' }}>
          {/* Disable AI Button */}
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={handleDisableAI}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Disable AI
            </button>
          </div>

          {/* Configuration Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Fallback to Heuristic */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={config.fallbackToHeuristic}
                onChange={(e) => updateConfig('fallbackToHeuristic', e.target.checked)}
              />
              <span style={{ fontSize: '14px' }}>Fallback to heuristic analysis</span>
            </label>

            {/* Component Analysis */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={config.enableComponentAnalysis}
                onChange={(e) => updateConfig('enableComponentAnalysis', e.target.checked)}
              />
              <span style={{ fontSize: '14px' }}>Enable component analysis</span>
            </label>

            {/* Animation Assessment */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={config.enableAnimationAssessment}
                onChange={(e) => updateConfig('enableAnimationAssessment', e.target.checked)}
              />
              <span style={{ fontSize: '14px' }}>Enable animation assessment</span>
            </label>

            {/* Cache Results */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={config.cacheResults}
                onChange={(e) => updateConfig('cacheResults', e.target.checked)}
              />
              <span style={{ fontSize: '14px' }}>Cache analysis results</span>
            </label>

            {/* Confidence Threshold */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                Confidence Threshold: {(config.confidenceThreshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={config.confidenceThreshold}
                onChange={(e) => updateConfig('confidenceThreshold', parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6c757d' }}>
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats.enabled && (
        <div style={{
          padding: '12px',
          backgroundColor: '#e8f5e8',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
            AI Statistics
          </h4>
          
          <div style={{ fontSize: '12px', color: '#2d5a2d' }}>
            <div>Requests: {stats.requestCount}</div>
            {stats.lastRequestTime && (
              <div>Last: {stats.lastRequestTime.toLocaleTimeString()}</div>
            )}
            {stats.averageProcessingTime > 0 && (
              <div>Avg Time: {stats.averageProcessingTime.toFixed(0)}ms</div>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div style={{
        fontSize: '12px',
        color: '#6c757d',
        lineHeight: 1.4,
        marginTop: '16px'
      }}>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>AI Analysis Features:</strong>
        </p>
        <ul style={{ margin: 0, paddingLeft: '16px' }}>
          <li>Intelligent object classification</li>
          <li>Component segmentation for animation</li>
          <li>Animation potential assessment</li>
          <li>Confidence scoring and validation</li>
        </ul>
      </div>
    </div>
  );
};

export default AIConfigPanel;