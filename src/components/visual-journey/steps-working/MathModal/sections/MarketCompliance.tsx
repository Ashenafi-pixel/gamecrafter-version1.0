import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../ui/Card';
import { Badge } from '../../../../ui/Badge';
import { Progress } from '../../../../ui/Progress';

interface ComplianceMarket {
  name: string;
  status: 'compliant' | 'warning' | 'blocked';
  issues?: string[];
}

interface MarketComplianceProps {
  compliance: ComplianceMarket[];
  businessMetrics: {
    complianceScore: number;
  };
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
}

export function MarketCompliance({
  compliance,
  businessMetrics,
  expandedSections,
  toggleSection
}: MarketComplianceProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer flex" >
        <div className="flex items-center justify-between relative">
          <CardTitle className="text-base flex items-center gap-2 ">
            Market Compliance
          </CardTitle>
          {expandedSections.has('marketCompliance') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        <CardDescription className="text-xs text-gray-500">
          Regulatory compliance status across target markets
        </CardDescription>
        <span className='absolute right-20 text-[1.5rem] font-bold text-gray-400 no-select'> 🔜 COMING SOON</span>
      </CardHeader>
      <AnimatePresence>
        {expandedSections.has('marketCompliance') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='border-t pt-2'
          >
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    Target Markets
                  </h4>
                  <div className="space-y-2">
                    {compliance.map((market, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getComplianceIcon(market.status)}
                          <span className="font-medium">{market.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={["text-xs", getRiskColor(market.status === 'compliant' ? 'Low' : market.status === 'warning' ? 'Medium' : 'High')].filter(Boolean).join(" ")}>
                            {market.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Compliance Issues
                  </h4>
                  <div className="space-y-2">
                    {compliance.filter(m => m.issues && m.issues.length > 0).map((market, index) => (
                      <div key={index} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="font-medium text-orange-800 mb-2">{market.name}</div>
                        <div className="space-y-1">
                          {market.issues?.map((issue, issueIndex) => (
                            <div key={issueIndex} className="text-sm text-orange-700">
                              • {issue}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {compliance.filter(m => m.issues && m.issues.length > 0).length === 0 && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-800 font-medium">No compliance issues detected</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">All target markets show compliant status</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Certification Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-blue-700 mb-2">Required Testing Labs:</h5>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• GLI (Gaming Laboratories International)</li>
                      <li>• BMM Testlabs (Australia/Europe)</li>
                      <li>• iTech Labs (Asia-Pacific)</li>
                      <li>• Gaming Associates (North America)</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-blue-700 mb-2">Compliance Score:</h5>
                    <div className="flex items-center gap-2">
                      <Progress value={businessMetrics.complianceScore} className="flex-1 h-3" />
                      <span className="font-bold text-blue-800">{businessMetrics.complianceScore}/100</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {businessMetrics.complianceScore >= 90 ? 'Excellent compliance rating' :
                       businessMetrics.complianceScore >= 80 ? 'Good compliance rating' :
                       businessMetrics.complianceScore >= 70 ? 'Acceptable compliance rating' :
                       'Compliance improvements needed'}
                    </p>
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
