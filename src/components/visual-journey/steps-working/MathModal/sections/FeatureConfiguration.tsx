import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, ChevronUp, ChevronDown, Sparkles, Target, RotateCcw, Crown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../ui/Card';
import { Slider } from '../../../../ui/Slider';
import type { FeatureSettings } from '../types/math';

interface FeatureConfigurationProps {
  featureSettings: FeatureSettings;
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  updateFeatureSetting: (feature: keyof FeatureSettings, field: string, value: number) => void;
    isFeatureEnabled: (feature: string) => boolean;   // ✅ ADD THIS

}

// export function FeatureConfiguration({ featureSettings, expandedSections, toggleSection, updateFeatureSetting }: FeatureConfigurationProps) {
export function FeatureConfiguration({ 
  featureSettings, 
  expandedSections, 
  toggleSection, 
  updateFeatureSetting,
  isFeatureEnabled               //  ADD THIS
}: FeatureConfigurationProps) {

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => toggleSection('featureConfig')}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Feature Configuration
          </CardTitle>
          {expandedSections.has('featureConfig') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        <CardDescription className="text-xs text-gray-500">
          Configure individual feature mechanics and trigger rates
        </CardDescription>
      </CardHeader>
      <AnimatePresence>
        {expandedSections.has('featureConfig') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='border-t pt-2'
          >
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Free Spins */}
                {isFeatureEnabled('freeSpins') && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 uw:text-3xl">
                    <Sparkles className="h-4 w-4 uw:h-8 uw:w-8 text-purple-600" />
                    Free Spins Feature
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Trigger Rate (1 in X spins):</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[featureSettings.freeSpins.triggerRate]}
                          onValueChange={([value]) => updateFeatureSetting('freeSpins', 'triggerRate', value)}
                          min={80}
                          max={200}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{featureSettings.freeSpins.triggerRate}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Average Spins:</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[featureSettings.freeSpins.averageSpins]}
                          onValueChange={([value]) => updateFeatureSetting('freeSpins', 'averageSpins', value)}
                          min={8}
                          max={20}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{featureSettings.freeSpins.averageSpins}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Retrigger Rate:</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[featureSettings.freeSpins.retriggerRate * 100]}
                          onValueChange={([value]) => updateFeatureSetting('freeSpins', 'retriggerRate', value / 100)}
                          min={5}
                          max={30}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{(featureSettings.freeSpins.retriggerRate * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* Pick Bonus */}
                {isFeatureEnabled('pickAndClick') && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 uw:text-3xl">
                    <Target className="h-4 w-4 uw:h-8 uw:w-8 text-blue-600" />
                    Pick Bonus Feature
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Trigger Rate (1 in X spins):</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[featureSettings.pickBonus.triggerRate]}
                          onValueChange={([value]) => updateFeatureSetting('pickBonus', 'triggerRate', value)}
                          min={150}
                          max={400}
                          step={5}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{featureSettings.pickBonus.triggerRate}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Number of Picks:</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[featureSettings.pickBonus.picks]}
                          onValueChange={([value]) => updateFeatureSetting('pickBonus', 'picks', value)}
                          min={3}
                          max={8}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{featureSettings.pickBonus.picks}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Avg Multiplier:</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[featureSettings.pickBonus.avgMultiplier]}
                          onValueChange={([value]) => updateFeatureSetting('pickBonus', 'avgMultiplier', value)}
                          min={5}
                          max={25}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{featureSettings.pickBonus.avgMultiplier}x</span>
                      </div>
                    </div>
                  </div>
                </div>
                )}
                {/* Wheel Feature */}
                {isFeatureEnabled('wheel') && (
                <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 uw:text-3xl">
                    <RotateCcw className="h-4 w-4 uw:h-8 uw:w-8 text-orange-600" />
                    Wheel Feature
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Trigger Rate (1 in X spins):</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[featureSettings.wheel.triggerRate]}
                          onValueChange={([value]) => updateFeatureSetting('wheel', 'triggerRate', value)}
                          min={300}
                          max={600}
                          step={10}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{featureSettings.wheel.triggerRate}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Wheel Segments:</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[featureSettings.wheel.segments]}
                          onValueChange={([value]) => updateFeatureSetting('wheel', 'segments', value)}
                          min={6}
                          max={12}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{featureSettings.wheel.segments}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Max Multiplier:</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[featureSettings.wheel.maxMultiplier]}
                          onValueChange={([value]) => updateFeatureSetting('wheel', 'maxMultiplier', value)}
                          min={25}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{featureSettings.wheel.maxMultiplier}x</span>
                      </div>
                    </div>
                  </div>
                </div>
                )}
                {/* Hold & Win */}
                {isFeatureEnabled('holdAndSpin') && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 uw:text-3xl">
                    <Crown className="h-4 w-4 uw:h-8 uw:w-8 text-green-600" />
                    Hold & Win Feature
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Trigger Rate (1 in X spins):</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[featureSettings.holdWin.triggerRate]}
                          onValueChange={([value]) => updateFeatureSetting('holdWin', 'triggerRate', value)}
                          min={400}
                          max={800}
                          step={10}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{featureSettings.holdWin.triggerRate}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Avg Symbols:</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[featureSettings.holdWin.avgSymbols]}
                          onValueChange={([value]) => updateFeatureSetting('holdWin', 'avgSymbols', value)}
                          min={4}
                          max={12}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{featureSettings.holdWin.avgSymbols}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm uw:text-2xl text-gray-600">Max Symbols:</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[featureSettings.holdWin.maxSymbols]}
                          onValueChange={([value]) => updateFeatureSetting('holdWin', 'maxSymbols', value)}
                          min={12}
                          max={20}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm uw:text-2xl w-12">{featureSettings.holdWin.maxSymbols}</span>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
