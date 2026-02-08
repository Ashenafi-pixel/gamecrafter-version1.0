import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ChevronUp, ChevronDown, Activity, ArrowUpDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../ui/Card';
import { Slider } from '../../../../ui/Slider';
import type { VolatilityControls, Step12Configuration } from '../types/math';

interface VolatilityTuningProps {
  volatilityControls: VolatilityControls;
  computedVolatility: number;
  step12Config: Step12Configuration;
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  updateVolatilityControl: (control: keyof VolatilityControls, value: number) => void;
}

export function VolatilityTuning({ 
  volatilityControls, 
  computedVolatility, 
  step12Config, 
  businessMetrics, 
  expandedSections, 
  toggleSection, 
  updateVolatilityControl 
}: VolatilityTuningProps) {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => toggleSection('volatilityTuning')}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Volatility Tuning
          </CardTitle>
          {expandedSections.has('volatilityTuning') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        <CardDescription className="text-xs text-gray-500">
          Advanced volatility controls for player experience tuning
        </CardDescription>
      </CardHeader>
      <AnimatePresence>
        {expandedSections.has('volatilityTuning') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='border-t pt-2'
          >
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Volatility Index */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 uw:text-3xl">
                    <Activity className="h-4 w-4 uw:h-8 uw:w-8 text-red-600" />
                    Volatility Index
                  </h4>
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-gray-200"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${(computedVolatility / 10) * 88} 88`}
                          className="text-red-600"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl  font-bold">{computedVolatility}</span>
                      </div>
                    </div>
                    <p className="text-sm uw:text-2xl text-gray-600">
                      {computedVolatility <= 3 ? 'Low Volatility' :
                       computedVolatility <= 6 ? 'Medium Volatility' :
                       'High Volatility'}
                    </p>
                  </div>
                </div>

                {/* Volatility Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 uw:text-3xl">
                    <ArrowUpDown className="h-4 w-4 uw:h-8 uw:w-8 text-blue-600" />
                    Control Parameters
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Big Win Concentration:</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Slider
                          value={[volatilityControls.bigWinConcentration]}
                          onValueChange={([value]) => updateVolatilityControl('bigWinConcentration', value)}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{volatilityControls.bigWinConcentration}%</span>
                      </div>
                      <p className="text-xs uw:text-2xl text-gray-500 mt-1">Higher = More big wins, fewer small wins</p>
                    </div>
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Hit Rate vs Win Size:</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Slider
                          value={[volatilityControls.hitRateVsWinSize]}
                          onValueChange={([value]) => updateVolatilityControl('hitRateVsWinSize', value)}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{volatilityControls.hitRateVsWinSize}%</span>
                      </div>
                      <p className="text-xs uw:text-2xl text-gray-500 mt-1">Lower = Higher hit rate, smaller wins</p>
                    </div>
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Feature Power vs Trigger:</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Slider
                          value={[volatilityControls.featurePowerVsTrigger]}
                          onValueChange={([value]) => updateVolatilityControl('featurePowerVsTrigger', value)}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{volatilityControls.featurePowerVsTrigger}%</span>
                      </div>
                      <p className="text-xs uw:text-2xl text-gray-500 mt-1">Higher = Rarer but more powerful features</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Characteristics */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium uw:text-3xl mb-3">Session Characteristics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 uw:text-2xl">Max Win Multiplier:</span>
                    <div className="font-bold text-lg uw:text-2xl">{step12Config.maxWin.toLocaleString()}×</div>
                    <div className="text-xs text-gray-500 uw:text-2xl">Theoretical maximum</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
