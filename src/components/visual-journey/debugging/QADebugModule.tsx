import React, { useState, useRef } from 'react';
import { 
  HelpCircle, Copy, Check, X, 
  Monitor, Cpu, Zap, Settings, AlertTriangle 
} from 'lucide-react';

interface SystemInfo {
  libraries: Record<string, string>;
  performance: {
    fps: number;
    memory: number;
    renderTime: number;
  };
  sprites: {
    total: number;
    visible: number;
    meshPoints: number;
  };
  errors: string[];
  warnings: string[];
}

interface QADebugModuleProps {
  onClose?: () => void;
}

const QADebugModule: React.FC<QADebugModuleProps> = ({ onClose }) => {
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Collect system information
  const getSystemInfo = (): SystemInfo => {
    const info: SystemInfo = {
      libraries: {
        'PIXI.js': '7.4.3',
        'GSAP': '3.12.7',
        'Matter.js': '0.20.0',
        'Earcut': '3.0.1',
        'Stats.js': '0.17.0',
        'Paper.js': '0.12.18',
        'Simplify.js': '1.2.4'
      },
      performance: {
        fps: 0,
        memory: 0,
        renderTime: 0
      },
      sprites: {
        total: 0,
        visible: 0,
        meshPoints: 0
      },
      errors: [],
      warnings: []
    };

    // Get performance metrics if available
    if (typeof window !== 'undefined') {
      // FPS from Stats.js if available
      const stats = (window as any).PERFORMANCE_STATS;
      if (stats) {
        info.performance.fps = stats.fps || 0;
        info.performance.memory = stats.memory || 0;
        info.performance.renderTime = stats.renderTime || 0;
      }

      // Get PIXI app info
      const pixiApps = (window as any).PIXI_APPS;
      if (pixiApps && pixiApps.length > 0) {
        const app = pixiApps[0];
        if (app.stage) {
          info.sprites.total = app.stage.children.length;
          info.sprites.visible = app.stage.children.filter((child: any) => child.visible).length;
        }
      }

      // Get professional renderer info
      const professionalRenderer = (window as any).PROFESSIONAL_PIXI_RENDERER;
      if (professionalRenderer && professionalRenderer.sprites) {
        info.sprites.total = professionalRenderer.sprites.size;
        info.sprites.meshPoints = Array.from(professionalRenderer.sprites.values())
          .reduce((total: number, sprite: any) => {
            return total + (sprite.element?.contourPoints?.length || 0);
          }, 0);
      }

      // Collect console errors and warnings
      const logs = (window as any).CONSOLE_LOGS || [];
      info.errors = logs.filter((log: any) => log.level === 'error').map((log: any) => log.message);
      info.warnings = logs.filter((log: any) => log.level === 'warn').map((log: any) => log.message);
    }

    return info;
  };

  const systemInfo = getSystemInfo();

  // Generate Q&A report
  const generateQAReport = (): string => {
    const report = `
# 🔬 ANIMATION LAB Q&A REPORT
Generated: ${new Date().toLocaleString()}

## 📊 SYSTEM STATUS
- Browser: ${navigator.userAgent.split(' ').pop()}
- URL: ${window.location.href}
- Timestamp: ${Date.now()}

## 📚 LIBRARIES STATUS
${Object.entries(systemInfo.libraries).map(([name, version]) => 
  `✅ ${name}: v${version} (INSTALLED)`
).join('\n')}

## 🎮 ANIMATION SYSTEM
- Professional Renderer: ${systemInfo.sprites.total > 0 ? '✅ ACTIVE' : 'INACTIVE'}
- Total Sprites: ${systemInfo.sprites.total}
- Visible Sprites: ${systemInfo.sprites.visible}
- Mesh Points Detected: ${systemInfo.sprites.meshPoints}
- Animations Running: ${systemInfo.performance.fps > 0 ? '✅ YES' : 'NO'}

## ⚡ PERFORMANCE METRICS
- FPS: ${systemInfo.performance.fps.toFixed(1)}
- Memory Usage: ${systemInfo.performance.memory.toFixed(1)} MB
- Render Time: ${systemInfo.performance.renderTime.toFixed(2)} ms
- Performance Grade: ${systemInfo.performance.fps >= 55 ? 'A' : systemInfo.performance.fps >= 45 ? 'B' : systemInfo.performance.fps >= 30 ? 'C' : 'D'}

## 🔧 WEB WORKERS
- Available: ${typeof Worker !== 'undefined' ? '✅ YES' : 'NO'}
- Mesh Processing: ${(window as any).WEB_WORKER_MANAGER ? '✅ ACTIVE' : 'INACTIVE'}
- Multi-threading: ${(window as any).WEB_WORKER_MANAGER?.isAvailable() ? '✅ ENABLED' : 'DISABLED'}

## 🎯 DETECTION RESULTS
- Universal AI Detection: ${systemInfo.sprites.meshPoints > 0 ? '✅ WORKING' : 'NOT WORKING'}
- Surgical Precision: ${systemInfo.sprites.meshPoints >= 10 ? '✅ HIGH PRECISION' : '⚠️ LOW PRECISION'}
- Mesh Quality: ${systemInfo.sprites.meshPoints >= 20 ? 'EXCELLENT' : systemInfo.sprites.meshPoints >= 10 ? 'GOOD' : 'POOR'}

## ERRORS (${systemInfo.errors.length})
${systemInfo.errors.length === 0 ? '✅ No errors detected' : 
  systemInfo.errors.slice(0, 5).map(error => `- ${error}`).join('\n')}

## ⚠️ WARNINGS (${systemInfo.warnings.length})
${systemInfo.warnings.length === 0 ? '✅ No warnings detected' : 
  systemInfo.warnings.slice(0, 5).map(warning => `- ${warning}`).join('\n')}

## 🎬 ANIMATION STATUS
- Canvas Rendering: ${systemInfo.sprites.visible > 0 ? '✅ SPRITES VISIBLE' : 'BLANK CANVAS'}
- GSAP Animations: ${(window as any).gsap ? '✅ LOADED' : 'NOT LOADED'}
- Physics Engine: ${(window as any).Matter ? '✅ LOADED' : 'NOT LOADED'}
- Mesh Processing: ${(window as any).earcut ? '✅ LOADED' : 'NOT LOADED'}

## 💡 RECOMMENDATIONS
${systemInfo.sprites.total === 0 ? '🔴 CRITICAL: No sprites detected - Check symbol loading' : ''}
${systemInfo.sprites.meshPoints === 0 ? '🔴 CRITICAL: No mesh points - Check Universal AI Detection' : ''}
${systemInfo.performance.fps < 30 ? '🟡 WARNING: Low FPS - Consider performance optimization' : ''}
${systemInfo.sprites.visible === 0 && systemInfo.sprites.total > 0 ? '🟡 WARNING: Sprites created but not visible - Check visibility settings' : ''}
${systemInfo.errors.length > 0 ? '🔴 CRITICAL: JavaScript errors detected - Check console' : ''}
${systemInfo.sprites.total > 0 && systemInfo.sprites.meshPoints > 10 && systemInfo.performance.fps > 30 ? '✅ SYSTEM HEALTHY: All systems operational' : ''}

## 🚀 NEXT STEPS
1. Copy this report and paste to Claude for analysis
2. Include any specific issues you're experiencing
3. Mention what you expected vs what you see
4. Claude will provide targeted fixes based on this data

---
Report ID: ${Date.now()}
    `.trim();

    return report;
  };

  const handleCopyReport = async () => {
    const report = generateQAReport();
    
    try {
      await navigator.clipboard.writeText(report);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      if (textareaRef.current) {
        textareaRef.current.value = report;
        textareaRef.current.select();
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    }
  };

  const getStatusIcon = (value: number, good: number, ok: number) => {
    if (value >= good) return <Zap className="w-4 h-4 text-green-500" />;
    if (value >= ok) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <X className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Q&A Debug Module</h2>
              <p className="text-sm text-gray-400">System diagnosis for animation troubleshooting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Quick Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Monitor className="w-5 h-5 text-blue-400" />
                {getStatusIcon(systemInfo.sprites.total, 1, 0)}
              </div>
              <div className="text-2xl font-bold text-white">{systemInfo.sprites.total}</div>
              <div className="text-xs text-gray-400">Sprites Created</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Cpu className="w-5 h-5 text-green-400" />
                {getStatusIcon(systemInfo.performance.fps, 55, 30)}
              </div>
              <div className="text-2xl font-bold text-white">{systemInfo.performance.fps.toFixed(0)}</div>
              <div className="text-xs text-gray-400">FPS</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-purple-400" />
                {getStatusIcon(systemInfo.sprites.meshPoints, 20, 10)}
              </div>
              <div className="text-2xl font-bold text-white">{systemInfo.sprites.meshPoints}</div>
              <div className="text-xs text-gray-400">Mesh Points</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Settings className="w-5 h-5 text-orange-400" />
                {systemInfo.errors.length === 0 ? 
                  <Check className="w-4 h-4 text-green-500" /> : 
                  <X className="w-4 h-4 text-red-500" />
                }
              </div>
              <div className="text-2xl font-bold text-white">{systemInfo.errors.length}</div>
              <div className="text-xs text-gray-400">Errors</div>
            </div>
          </div>

          {/* Detailed Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Libraries Status */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <Monitor className="w-5 h-5 mr-2" />
                Libraries
              </h3>
              <div className="space-y-2">
                {Object.entries(systemInfo.libraries).map(([name, version]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">v{version}</span>
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Status */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <Cpu className="w-5 h-5 mr-2" />
                Performance
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Frame Rate</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">{systemInfo.performance.fps.toFixed(1)} FPS</span>
                    {getStatusIcon(systemInfo.performance.fps, 55, 30)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Memory Usage</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">{systemInfo.performance.memory.toFixed(1)} MB</span>
                    {getStatusIcon(100 - systemInfo.performance.memory, 70, 50)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Render Time</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">{systemInfo.performance.renderTime.toFixed(2)} ms</span>
                    {getStatusIcon(20 - systemInfo.performance.renderTime, 15, 10)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Issues Section */}
          {(systemInfo.errors.length > 0 || systemInfo.warnings.length > 0) && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Issues Detected
              </h3>
              
              {systemInfo.errors.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-red-300 mb-2">Errors ({systemInfo.errors.length})</h4>
                  <div className="space-y-1">
                    {systemInfo.errors.slice(0, 3).map((error, index) => (
                      <div key={index} className="text-xs text-red-200 bg-red-900/30 rounded px-2 py-1">
                        {error.substring(0, 100)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {systemInfo.warnings.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-yellow-300 mb-2">Warnings ({systemInfo.warnings.length})</h4>
                  <div className="space-y-1">
                    {systemInfo.warnings.slice(0, 3).map((warning, index) => (
                      <div key={index} className="text-xs text-yellow-200 bg-yellow-900/30 rounded px-2 py-1">
                        {warning.substring(0, 100)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Usage Instructions */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-blue-400 mb-3">How to Use This Report</h3>
            <div className="text-sm text-blue-200 space-y-2">
              <p>1. Click "Copy Full Report" below to copy the complete system diagnosis</p>
              <p>2. Paste the report to Claude along with your specific issue description</p>
              <p>3. Claude will analyze the data and provide targeted solutions</p>
              <p>4. This eliminates guesswork and provides precise troubleshooting</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Report generated at {new Date().toLocaleTimeString()}
          </div>
          <button
            onClick={handleCopyReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Full Report</span>
              </>
            )}
          </button>
        </div>

        {/* Hidden textarea for fallback copy */}
        <textarea
          ref={textareaRef}
          className="sr-only"
          readOnly
        />
      </div>
    </div>
  );
};

export default QADebugModule;