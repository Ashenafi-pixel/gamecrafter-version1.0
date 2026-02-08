import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, ChevronUp, ChevronDown, Target, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../ui/Card';
import { Slider } from '../../../../ui/Slider';
import type { EditableFeatureContribution } from '../types/math';

interface RTPBalancingProps {
  editableFeatures: EditableFeatureContribution;
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  updateFeatureRTP: (feature: keyof Omit<EditableFeatureContribution, 'constraints'>, value: number) => void;
  isFeatureEnabled?: (feature: string) => boolean;
}

export function RTPBalancing({ editableFeatures, expandedSections, toggleSection, updateFeatureRTP, isFeatureEnabled }: RTPBalancingProps) {
  // Calculate available feature RTP (100% - base game)
  const availableFeatureRTP = 100 - editableFeatures.basePct;

  // Calculate current total of enabled features
  const getEnabledFeaturesTotal = () => {
    let total = 0;
    if (!isFeatureEnabled || isFeatureEnabled('freeSpins')) total += editableFeatures.fsPct;
    if (!isFeatureEnabled || isFeatureEnabled('pickAndClick')) total += editableFeatures.pickPct;
    if (!isFeatureEnabled || isFeatureEnabled('wheel')) total += editableFeatures.wheelPct;
    if (!isFeatureEnabled || isFeatureEnabled('holdAndSpin')) total += editableFeatures.holdPct;
    if (!isFeatureEnabled || isFeatureEnabled('respin')) total += editableFeatures.respinPct;
    return total;
  };

  const enabledFeaturesTotal = getEnabledFeaturesTotal();

  // Calculate max value for a specific feature based on other enabled features
  const getMaxForFeature = (featureKey: keyof typeof editableFeatures) => {
    if (!isFeatureEnabled) return 30; // Default max if no filter

    let otherFeaturesTotal = 0;
    if (featureKey !== 'fsPct' && isFeatureEnabled('freeSpins')) otherFeaturesTotal += editableFeatures.fsPct;
    if (featureKey !== 'pickPct' && isFeatureEnabled('pickAndClick')) otherFeaturesTotal += editableFeatures.pickPct;
    if (featureKey !== 'wheelPct' && isFeatureEnabled('wheel')) otherFeaturesTotal += editableFeatures.wheelPct;
    if (featureKey !== 'holdPct' && isFeatureEnabled('holdAndSpin')) otherFeaturesTotal += editableFeatures.holdPct;
    if (featureKey !== 'respinPct' && isFeatureEnabled('respin')) otherFeaturesTotal += editableFeatures.respinPct;

    return Math.max(0, availableFeatureRTP - otherFeaturesTotal);
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => toggleSection('rtpBalance')}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {/* <PieChart className="h-4 w-4 text-blue-600" /> */}
            RTP Balancing Controls
          </CardTitle>
          {expandedSections.has('rtpBalance') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        <CardDescription className="text-xs text-gray-500">
          Fine-tune RTP allocation between base game and features
        </CardDescription>
      </CardHeader>
      <AnimatePresence>
        {expandedSections.has('rtpBalance') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='border-t pt-2'
          >
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Base Game RTP */}
                <div className="space-y-4">
                  <h4 className="font-medium uw:text-2xl flex items-center gap-2">
                    {/* <Target className="h-4 w-4 text-blue-600" /> */}
                    Base Game RTP
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm uw:text-2xl">Base Game:</span>
                      <span className="font-mono text-sm uw:text-2xl">{editableFeatures.basePct}%</span>
                    </div>
                    <Slider
                      value={[editableFeatures.basePct]}
                      onValueChange={([value]) => updateFeatureRTP('basePct', value)}
                      min={editableFeatures.constraints.basePctRange[0]}
                      max={editableFeatures.constraints.basePctRange[1]}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs uw:text-2xl text-gray-500">
                      <span>{editableFeatures.constraints.basePctRange[0]}%</span>
                      <span>{editableFeatures.constraints.basePctRange[1]}%</span>
                    </div>
                  </div>
                </div>

                {/* Feature Total RTP */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 uw:text-2xl">
                    {/* <Sparkles className="h-4 w-4 text-purple-600" /> */}
                    Feature Total RTP
                  </h4>
                  <div className="space-y-2">
                    {(!isFeatureEnabled || isFeatureEnabled('freeSpins')) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm uw:text-2xl">Free Spins:</span>
                        <div className="flex items-center justify-between gap-2 w-[50%]">
                          <Slider
                            value={[editableFeatures.fsPct]}
                            onValueChange={([value]) => updateFeatureRTP('fsPct', value)}
                            max={getMaxForFeature('fsPct')}
                            min={0}
                            step={0.5}
                            className="w-2"
                          />
                          <span className="font-mono text-sm uw:text-2xl w-10">{editableFeatures.fsPct.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                    {(!isFeatureEnabled || isFeatureEnabled('pickAndClick')) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm uw:text-2xl">Pick Bonus:</span>
                        <div className="flex items-center justify-between gap-2 w-[50%]">
                          <Slider
                            value={[editableFeatures.pickPct]}
                            onValueChange={([value]) => updateFeatureRTP('pickPct', value)}
                            max={getMaxForFeature('pickPct')}
                            min={0}
                            step={0.5}
                            className="w-24"
                          />
                          <span className="font-mono text-sm uw:text-2xl w-10">{editableFeatures.pickPct.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                    {(!isFeatureEnabled || isFeatureEnabled('wheel')) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm uw:text-2xl">Wheel Feature:</span>
                        <div className="flex items-center justify-between gap-2 w-[50%]">
                          <Slider
                            value={[editableFeatures.wheelPct]}
                            onValueChange={([value]) => updateFeatureRTP('wheelPct', value)}
                            max={getMaxForFeature('wheelPct')}
                            min={0}
                            step={0.5}
                            className="w-24"
                          />
                          <span className="font-mono text-sm uw:text-2xl w-10">{editableFeatures.wheelPct.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                    {(!isFeatureEnabled || isFeatureEnabled('holdAndSpin')) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm uw:text-2xl">Hold & Win:</span>
                        <div className="flex items-center justify-between gap-2 w-[50%]">
                          <Slider
                            value={[editableFeatures.holdPct]}
                            onValueChange={([value]) => updateFeatureRTP('holdPct', value)}
                            max={getMaxForFeature('holdPct')}
                            min={0}
                            step={0.5}
                            className="w-24"
                          />
                          <span className="font-mono text-sm uw:text-2xl w-10">{editableFeatures.holdPct.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                    {(!isFeatureEnabled || isFeatureEnabled('respin')) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm uw:text-2xl">Respin Feature:</span>
                        <div className="flex items-center justify-between gap-2 w-[50%]">
                          <Slider
                            value={[editableFeatures.respinPct]}
                            onValueChange={([value]) => updateFeatureRTP('respinPct', value)}
                            max={getMaxForFeature('respinPct')}
                            min={0}
                            step={0.5}
                            className="w-24"
                          />
                          <span className="font-mono text-sm uw:text-2xl w-10">{editableFeatures.respinPct.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                    {isFeatureEnabled &&
                      !isFeatureEnabled('freeSpins') &&
                      !isFeatureEnabled('pickAndClick') &&
                      !isFeatureEnabled('wheel') &&
                      !isFeatureEnabled('holdAndSpin') &&
                      !isFeatureEnabled('respin') && (
                        <div className="text-sm text-gray-400 italic uw:text-2xl text-center py-2">
                          No bonus features enabled
                        </div>
                      )}
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between font-medium uw:text-2xl mb-1">
                      <span>Available for Features:</span>
                      <span className="font-mono">{availableFeatureRTP.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm uw:text-2xl">
                      <span className={enabledFeaturesTotal > availableFeatureRTP ? 'text-red-600' : 'text-gray-600'}>
                        Current Features Total:
                      </span>
                      <span className={`font-mono ${enabledFeaturesTotal > availableFeatureRTP ? 'text-red-600' : enabledFeaturesTotal < availableFeatureRTP ? 'text-orange-600' : 'text-green-600'}`}>
                        {enabledFeaturesTotal.toFixed(1)}%
                      </span>
                    </div>
                    {enabledFeaturesTotal < availableFeatureRTP && (
                      <div className="text-xs text-orange-600 mt-1 uw:text-2xl">
                        {(availableFeatureRTP - enabledFeaturesTotal).toFixed(1)}% remaining
                      </div>
                    )}
                    {enabledFeaturesTotal > availableFeatureRTP && (
                      <div className="text-xs text-red-600 mt-1 uw:text-2xl">
                        Exceeds available by {(enabledFeaturesTotal - availableFeatureRTP).toFixed(1)}%
                      </div>
                    )}
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
