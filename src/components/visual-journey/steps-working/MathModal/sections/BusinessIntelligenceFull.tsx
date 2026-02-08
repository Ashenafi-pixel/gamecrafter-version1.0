import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, DollarSign, Users, Trophy, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../ui/Card';
import { Button } from '../../../../ui/UIButton';

interface PlayerSegmentData {
  retention: number;
  sessionLength: number;
  weeklyGGR: number;
  description: string;
}

interface BusinessIntelligenceFullProps {
  businessMetrics: {
    weeklyGGRPerK: number;
    monthlyRevProjection: number;
    competitorBeats: number;
    developmentCostROI: number;
    regulatoryRisk: string;
  };
  playerSegmentData: Record<string, PlayerSegmentData>;
  selectedPlayerSegment: string;
  setSelectedPlayerSegment: (segment: string) => void;
  step12Config: {
    features: Array<{ enabled: boolean }>;
  };
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  getBIRangeEstimate: (value: number, label: string) => string;
}

export function BusinessIntelligenceFull({
  businessMetrics,
  playerSegmentData,
  selectedPlayerSegment,
  setSelectedPlayerSegment,
  step12Config,
  expandedSections,
  toggleSection,
  getBIRangeEstimate
}: BusinessIntelligenceFullProps) {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => toggleSection('businessIntelligence')}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Business Intelligence Dashboard (Full)
          </CardTitle>
          {expandedSections.has('businessIntelligence') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        <CardDescription className="text-xs text-gray-500">
          Advanced revenue projections, player segments, and competitive analysis
        </CardDescription>
      </CardHeader>
      <AnimatePresence>
        {expandedSections.has('businessIntelligence') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='border-t pt-2'
          >
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Projections */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 uw:text-3xl">
                    <DollarSign className="h-4 w-4 uw:h-6 uw:w-6 text-green-600" />
                    Revenue Projections
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm uw:text-2xl text-green-600">Weekly GGR per 1K Players</div>
                      <div className="font-bold text-xl uw:text-2xl text-green-800">
                        ${businessMetrics.weeklyGGRPerK.toLocaleString()}
                      </div>
                      <div className="text-xs uw:text-xl text-gray-500">
                        Range: {getBIRangeEstimate(businessMetrics.weeklyGGRPerK, 'Weekly GGR $')}
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm uw:text-2xl text-blue-600">Monthly Revenue (50K Players)</div>
                      <div className="font-bold text-xl uw:text-2xl text-blue-800">
                        ${(businessMetrics.monthlyRevProjection / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs uw:text-xl text-gray-500">
                        ROI: {businessMetrics.developmentCostROI} days
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm uw:text-2xl text-purple-600">Competitive Advantage</div>
                      <div className="font-bold text-xl uw:text-2xl text-purple-800">
                        {businessMetrics.competitorBeats}%
                      </div>
                      <div className="text-xs uw:text-xl text-gray-500">
                        Beats industry average
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Segments */}
                <div className="space-y-4">
                  <h4 className="font-medium uw:text-3xl flex items-center gap-2">
                    <Users className="h-4 w-4 uw:h-8 uw:w-8 text-blue-600" />
                    Player Segments
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(playerSegmentData).map(([segmentKey, data]) => (
                      <div key={segmentKey} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm uw:text-2xl">{data.description}</span>
                          <Button
                            size="sm"
                            variant={selectedPlayerSegment === segmentKey ? "default" : "outline"}
                            onClick={() => setSelectedPlayerSegment(segmentKey)}
                            className="h-6 text-xs uw:text-2xl px-2"
                          >
                            {selectedPlayerSegment === segmentKey ? 'Active' : 'Select'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600 uw:text-2xl">Retention:</span>
                            <div className="font-semibold uw:text-2xl">{data.retention}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600 uw:text-2xl">Session:</span>
                            <div className="font-semibold uw:text-2xl">{data.sessionLength}m</div>
                          </div>
                          <div>
                            <span className="text-gray-600 uw:text-2xl">GGR:</span>
                            <div className="font-semibold uw:text-2xl">${data.weeklyGGR.toFixed(0)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competitive Analysis */}
                <div className="space-y-4">
                  <h4 className="font-medium uw:text-3xl flex items-center gap-2">
                    <Trophy className="h-4 w-4 uw:h-8 uw:w-8 text-yellow-600" />
                    Competitive Analysis
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-sm text-yellow-600 uw:text-2xl">Market Position</div>
                      <div className="font-bold text-lg text-yellow-800 uw:text-xl">
                        Top {100 - businessMetrics.competitorBeats}%
                      </div>
                      <div className="text-xs uw:text-2xl text-gray-500">
                        Based on RTP, volatility, features
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-sm uw:text-2xl text-orange-600">Feature Advantage</div>
                      <div className="font-bold text-lg uw:text-xl text-orange-800">
                        {step12Config.features.filter(f => f.enabled).length} Features
                      </div>
                      <div className="text-xs uw:text-2xl text-gray-500">
                        vs 2.3 industry average
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-sm uw:text-2xl text-red-600">Risk Assessment</div>
                      <div className="font-bold text-lg uw:text-xl text-red-800">
                        {businessMetrics.regulatoryRisk}
                      </div>
                      <div className="text-xs uw:text-2xl text-gray-500">
                        Regulatory risk level
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Analytics */}
              <div className="mt-6 p-4 bg-gray-900 text-white rounded-lg">
                <h4 className="font-medium uw:text-3xl mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 uw:h-8 uw:w-8" />
                  Advanced Analytics Dashboard
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm uw:text-2xl">
                  <div className="p-3 bg-gray-800 rounded">
                    <div className="text-gray-300 uw:text-2xl">Player LTV</div>
                    <div className="font-bold text-xl uw:text-xl">${(businessMetrics.weeklyGGRPerK * 12).toLocaleString()}</div>
                    <div className="text-xsuw:text-2xl text-gray-400">12-week projection</div>
                  </div>
                  <div className="p-3 bg-gray-800 rounded">
                    <div className="text-gray-300 uw:text-2xl">Churn Rate</div>
                    <div className="font-bold text-xl uw:text-xl">{(100 - playerSegmentData[selectedPlayerSegment]?.retention || 0).toFixed(1)}%</div>
                    <div className="text-xs text-gray-400 uw:text-2xl">7-day churn</div>
                  </div>
                  <div className="p-3 bg-gray-800 rounded">
                    <div className="text-gray-300 uw:text-2xl">ARPU</div>
                    <div className="font-bold text-xl uw:text-xl">${(businessMetrics.weeklyGGRPerK / 7).toFixed(0)}</div>
                    <div className="text-xs text-gray-400 uw:text-2xl">Average revenue per user/day</div>
                  </div>
                  <div className="p-3 bg-gray-800 rounded">
                    <div className="text-gray-300 uw:text-2xl">Market Share</div>
                    <div className="font-bold text-xl uw:text-xl">{(businessMetrics.competitorBeats / 20).toFixed(1)}%</div>
                    <div className="text-xs text-gray-400 uw:text-2xl">Projected market capture</div>
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
