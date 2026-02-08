import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, ChevronUp, ChevronDown, Target, PieChart, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../ui/Card';
import { Progress } from '../../../../ui/Progress';
import type { DistributionBand, MathSummary } from '../types/math';

interface HitDistributionProps {
  mathSummary: MathSummary;
  distribution: DistributionBand[];
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
}

export function HitDistribution({ mathSummary, distribution, expandedSections, toggleSection }: HitDistributionProps) {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => toggleSection('hitDistribution')}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Hit & Win Distribution
          </CardTitle>
          {expandedSections.has('hitDistribution') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        <CardDescription className="text-xs text-gray-500">
          Control hit rates and win distribution patterns
        </CardDescription>
      </CardHeader>
      <AnimatePresence>
        {expandedSections.has('hitDistribution') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='border-t pt-2'
          >
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hit Rate Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 uw:text-3xl">
                    <Target className="h-4 w-4 uw:h-8 uw:w-8 text-green-600" />
                    Hit Rate Controls
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm uw:text-2xl">Overall Hit Rate:</span>
                        <span className="font-mono text-sm uw:text-2xl">{mathSummary.hitRate}%</span>
                      </div>
                      <Progress value={mathSummary.hitRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm uw:text-2xl">Big Win Rate (10x+):</span>
                        <span className="font-mono text-sm uw:text-2xl">2.3%</span>
                      </div>
                      <Progress value={2.3} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm uw:text-2xl">Feature Trigger:</span>
                        <span className="font-mono text-sm uw:text-2xl ">1.2%</span>
                      </div>
                      <Progress value={1.2} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Distribution Bands */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 uw:text-3xl">
                    <PieChart className="h-4 w-4 uw:h-8 uw:w-8 text-blue-600" />
                    Distribution Bands
                  </h4>
                  <div className="space-y-2">
                    {distribution.map((band, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs uw:text-2xl">{band.band}</span>
                        <span className="text-xs uw:text-2xl ">{band.band}</span>
                        <div className="flex items-center gap-2 flex-1 ml-2 uw:ml-4">
                          <div className="w-16 uw:w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(band.freqPct / 100) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs uw:text-2xl font-mono w-10 uw:ml-4">{band.freqPct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Win Frequency Analysis */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 uw:text-3xl">
                    <TrendingUp className="h-4 w-4 uw:h-8 uw:w-8 text-orange-600 " />
                    Win Frequency
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-sm uw:text-2xl font-medium text-orange-800">Small Wins (0.1x-2x)</div>
                      <div className="text-xs uw:text-2xl text-orange-600">78.2% of all wins</div>
                      <div className="text-xs uw:text-2xl text-gray-500">Every ~3.8 spins</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-sm uw:text-2xl font-medium text-yellow-800">Medium Wins (2x-10x)</div>
                      <div className="text-xs uw:text-2xl text-yellow-600">19.5% of all wins</div>
                      <div className="text-xs uw:text-2xl text-gray-500">Every ~15.2 spins</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-sm uw:text-2xl font-medium text-red-800">Big Wins (10x+)</div>
                      <div className="text-xs uw:text-2xl text-red-600">2.3% of all wins</div>
                      <div className="text-xs uw:text-2xl text-gray-500">Every ~128 spins</div>
                    </div>
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
