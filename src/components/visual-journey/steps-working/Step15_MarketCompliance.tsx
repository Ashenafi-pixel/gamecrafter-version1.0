import React from 'react';
import { useGameStore } from '../../../store';
import { Shield, Globe, Check, CheckCircle2, AlertTriangle, Award, ChevronLeft, ChevronRight, FileText, Download, Tag } from 'lucide-react';

// Outer wrapper component to match app structure
const MarketComplianceWrapper: React.FC<{onNavigate?: (direction: 'next' | 'prev') => void}> = ({ onNavigate }) => {
  // Function to navigate to previous step
  const handlePrevious = () => {
    console.log("MarketComplianceWrapper: Navigating to previous step");
    if (onNavigate) {
      onNavigate('prev');
    } else {
      // Direct navigation as fallback
      console.log("MarketComplianceWrapper: Using direct navigation to step 7");
      window.location.href = '/?step=7&visual=true';
    }
  };
  
  // Function to navigate to next step
  const handleNext = () => {
    console.log("MarketComplianceWrapper: Navigating to next step");
    if (onNavigate) {
      onNavigate('next');
    } else {
      // Direct navigation as fallback
      console.log("MarketComplianceWrapper: Using direct navigation to step 9");
      window.location.href = '/?step=9&visual=true';
    }
  };
  
  return (
    <div className="animate-fade-in">
    
      
      <MarketComplianceContent />
      
      {/* Step Navigation */}
      {/* <div className="mt-8 pt-8 border-t border-gray-200 flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous Step
        </button>
        
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          Next Step
          <ChevronRight className="w-5 h-5" />
        </button>
      </div> */}
    </div>
  );
};

// Inner content component with ultra-simple implementation
const MarketComplianceContent: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  
  // Market type definition for TypeScript
  interface Market {
    id: string;
    name: string;
    code: string;
    flag: string;
    minRTP: number;
    recommended: number;
    selected: boolean;
    details?: string;
  }
  
  // Markets - expanded list with regulatory details
  const [markets, setMarkets] = React.useState<Market[]>([
    { id: 'uk', name: 'United Kingdom', code: 'GB', flag: '🇬🇧', minRTP: 84, recommended: 94, selected: true, 
      details: "UKGC requires detailed game rules, 2.5s minimum spin duration, no auto-play in some cases" },
    { id: 'malta', name: 'Malta', code: 'MT', flag: '🇲🇹', minRTP: 85, recommended: 95, selected: true,
      details: "MGA requires detailed RNG certification and full game test reports" },
    { id: 'sweden', name: 'Sweden', code: 'SE', flag: '🇸🇪', minRTP: 87, recommended: 96, selected: false,
      details: "Swedish regulations require pause feature, strict session limits" },
    { id: 'germany', name: 'Germany', code: 'DE', flag: '🇩🇪', minRTP: 90, recommended: 95, selected: false,
      details: "€1 max bet limit, 5-second spin duration, no autoplay, strict verification" },
    { id: 'australia', name: 'Australia', code: 'AU', flag: '🇦🇺', minRTP: 85, recommended: 92, selected: true,
      details: "State-specific regulations, strict compliance with AU standards" },
    { id: 'spain', name: 'Spain', code: 'ES', flag: '🇪🇸', minRTP: 85, recommended: 95, selected: false,
      details: "DGOJ requires detailed certification, specific player protection measures" },
    { id: 'italy', name: 'Italy', code: 'IT', flag: '🇮🇹', minRTP: 90, recommended: 94, selected: false,
      details: "ADM requires extensive certification, specific game rules and mechanics" },
    { id: 'denmark', name: 'Denmark', code: 'DK', flag: '🇩🇰', minRTP: 84, recommended: 93, selected: false,
      details: "Danish Gaming Authority requires specific RTP verification and audit" },
    { id: 'romania', name: 'Romania', code: 'RO', flag: '🇷🇴', minRTP: 85, recommended: 94, selected: false,
      details: "ONJN requires specific technical standards and certification" },
    { id: 'us-nj', name: 'USA (New Jersey)', code: 'US-NJ', flag: '🇺🇸', minRTP: 83, recommended: 90, selected: false,
      details: "DGE has specific technical requirements, server location within state" },
    { id: 'us-pa', name: 'USA (Pennsylvania)', code: 'US-PA', flag: '🇺🇸', minRTP: 83, recommended: 90, selected: false,
      details: "PGCB requires specific certifications and technical standards" },
    { id: 'gibraltar', name: 'Gibraltar', code: 'GI', flag: '🇬🇮', minRTP: 85, recommended: 94, selected: false,
      details: "Gibraltar Gambling Commissioner has specific technical standards" },
  ]);
  
  // RTP - use config or default
  const rtp = config?.rtp?.targetRTP || 96;
  
  // State to track selected certification lab
  const [selectedLab, setSelectedLab] = React.useState<string | null>(
    config?.certification?.selectedLab || null
  );
  
  // State for document generation
  const [generatingDoc, setGeneratingDoc] = React.useState<string | null>(null);

  // Function to toggle market selection
  const toggleMarket = (id: string): void => {
    setMarkets(prevMarkets => {
      const updatedMarkets = prevMarkets.map(market => 
        market.id === id ? { ...market, selected: !market.selected } : market
      );
      
      // Update config directly
      updateConfig({
        certification: {
          ...config.certification,
          targetMarkets: updatedMarkets
            .filter(m => m.selected)
            .map(m => m.code.toLowerCase())
        }
      });
      
      return updatedMarkets;
    });
  };
  
  // Function to select a certification lab
  const selectLab = (id: string): void => {
    setSelectedLab(id);
    
    // Update config
    updateConfig({
      certification: {
        ...config.certification,
        selectedLab: id
      }
    });
  };
  
  // Generate documentation function
  const generateDocument = (docType: string): void => {
    // Show generating feedback
    setGeneratingDoc(docType);
    
    // In a real implementation, this would trigger an API call to generate the document
    setTimeout(() => {
      setGeneratingDoc(null);
      alert(`${docType} document has been generated for selected markets!`);
    }, 1500);
  };
  
  // Define certification labs
  const certificationLabs = [
    {
      id: 'gli',
      name: 'Gaming Laboratories International (GLI)',
      logo: '🔍',
      description: 'World\'s leading testing and certification provider',
      cost: '$15,000 - $25,000',
      timeline: '4-6 weeks',
      markets: ['UK', 'Malta', 'Australia', 'US', 'Canada', 'South Africa'],
      details: 'GLI-11 and GLI-19 standards for RNG and game fairness certification'
    },
    {
      id: 'bmm',
      name: 'BMM Testlabs',
      logo: '🧪',
      description: 'Global testing, certification and professional services',
      cost: '$12,500 - $20,000',
      timeline: '3-5 weeks',
      markets: ['UK', 'Malta', 'Australia', 'US', 'Spain', 'Italy'],
      details: 'Comprehensive testing protocols across multiple jurisdictions'
    },
    {
      id: 'ntg',
      name: 'NMi Gaming',
      logo: '🔎',
      description: 'European leader in gaming certification',
      cost: '$14,000 - $22,000',
      timeline: '4-5 weeks',
      markets: ['UK', 'Malta', 'Spain', 'Italy', 'Denmark', 'Netherlands'],
      details: 'Specialized in European market certification and compliance'
    },
    {
      id: 'ecogra',
      name: 'eCOGRA',
      logo: '✅',
      description: 'Specialized in online gaming certification',
      cost: '$10,000 - $18,000',
      timeline: '3-4 weeks',
      markets: ['UK', 'Malta', 'Isle of Man', 'Gibraltar'],
      details: 'Focus on player protection standards and fair gaming certification'
    },
    {
      id: 'siq',
      name: 'SIQ',
      logo: '🧮',
      description: 'European certification body for gaming',
      cost: '$11,000 - $16,000',
      timeline: '3-5 weeks',
      markets: ['Italy', 'Slovenia', 'Spain', 'Romania', 'Croatia'],
      details: 'Specialized in European market requirements and compliance'
    }
  ];

  // Define document types
  const documentTypes = [
    {
      id: 'math',
      name: 'Math Certification',
      icon: <Shield className="w-4 h-4 text-blue-600" />,
      description: 'Detailed RTP verification, volatility analysis, win distribution, and mathematical model verification.',
      required: 'Required for all markets'
    },
    {
      id: 'rules',
      name: 'Game Rules',
      icon: <Globe className="w-4 h-4 text-blue-600" />,
      description: 'Complete player-facing documentation of all game rules, paytables, and feature descriptions.',
      required: 'Required for all markets'
    },
    {
      id: 'rng',
      name: 'RNG Certification',
      icon: <Award className="w-4 h-4 text-blue-600" />,
      description: 'Technical certification of random number generation processes and implementation.',
      required: 'Required for all markets'
    },
    {
      id: 'compliance',
      name: 'Compliance Checklists',
      icon: <Shield className="w-4 h-4 text-blue-600" />,
      description: 'Market-specific compliance verification for each jurisdiction\'s unique requirements.',
      required: 'Varies by market'
    }
  ];

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors mb-3"
            >
              <div className="flex items-center">
                <h3 className="text-lg uw:text-3xl font-semibold text-gray-900">Market Compliance</h3>
              </div>
            </div>
      
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col items-center">
          <div className="w-14 h-14 uw:w-16 uw:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-6 h-6 uw:w-12 uw:h-12 text-blue-600" />
          </div>
          <h3 className="text-xl uw:text-3xl font-bold text-gray-800">{markets.filter(m => m.selected).length}</h3>
          <p className="text-xs uw:text-2xl text-gray-500 mt-1">Selected Markets</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col items-center">
          <div className="w-14 h-14 uw:w-18 uw:h-18 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 uw:w-12 uw:h-12 text-blue-600" />
          </div>
          <h3 className="text-xl uw:text-3xl font-bold text-gray-800">{rtp}%</h3>
          <p className="text-xs uw:text-2xl text-gray-500 mt-1">Target RTP</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col items-center">
          <div className="w-14 h-14 uw:w-18 uw:h-18 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Globe className="w-6 h-6 uw:w-10 uw:h-10 text-blue-600" />
          </div>
          <h3 className="text-xl uw:text-3xl font-bold text-gray-800">{markets.length}</h3>
          <p className="text-xs uw:text-2xl text-gray-500 mt-1">Total Available Markets</p>
        </div>
      </div>
      
      <div className="mb-8">
        {/* Feature Locked - Coming Soon Pattern */}
        <div className='bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6 relative'>
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              Coming Soon
            </div>
          </div>
          
          <div className="opacity-30 pointer-events-none">
            <div className="w-full bg-gray-100 border-l-4 border-l-gray-400 p-3 flex items-center justify-between text-left mb-3">
              <div className="flex items-center">
                <h3 className="text-lg uw:text-3xl font-semibold text-gray-600">Target Markets</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {markets.map(market => (
                <div
                  key={market.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm uw:text-2xl border border-gray-200 bg-gray-100 text-gray-500"
                >
                  <span>{market.flag}</span>
                  <span>{market.name}</span>
                  {market.selected && (
                    <Check className="w-4 h-4 uw:w-8 uw:h-8 ml-auto text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Compliance Check - Feature Locked */}
        <div className='bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6 relative'>
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              Coming Soon
            </div>
          </div>
          
          <div className="opacity-30 pointer-events-none">
            <h2 className="text-lg uw:text-3xl font-bold mb-4 text-gray-600">Compliance Check</h2>
            <div className="space-y-3">
              {markets.filter(m => m.selected).map(market => {
                const isCompliant = rtp >= market.minRTP;
                
                return (
                  <div 
                    key={market.id}
                    className="p-4 rounded-lg border shadow-sm bg-gray-100 border-gray-200"
                  >
                    <div className="flex flex-wrap items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-gray-500">{market.flag}</span>
                        <span className="font-medium text-gray-500">{market.name}</span>
                      </div>
                      <div className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-500">
                        Status Check
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-500">
                      Compliance verification details
                    </div>
                    
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="bg-gray-200 p-2 rounded border border-gray-300">
                        <div className="text-xs text-gray-500">Min RTP</div>
                        <div className="font-medium text-gray-500">---%</div>
                      </div>
                      <div className="bg-gray-200 p-2 rounded border border-gray-300">
                        <div className="text-xs text-gray-500">Recommended</div>
                        <div className="font-medium text-gray-500">---%</div>
                      </div>
                      <div className="bg-gray-200 p-2 rounded border border-gray-300">
                        <div className="text-xs text-gray-500">Your RTP</div>
                        <div className="font-medium text-gray-500">---%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Certification Labs - Feature Locked */}
      <div className="mb-8">
        <div className='bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 relative'>
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              Coming Soon
            </div>
          </div>
          
          <div className="opacity-30 pointer-events-none">
            <h2 className="text-lg uw:text-3xl font-bold mb-4 text-gray-600">Certification Labs</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {certificationLabs.map(lab => (
                <div 
                  key={lab.id} 
                  className="bg-gray-100 rounded-lg border border-gray-300 shadow-sm overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="w-10 h-10 uw:w-16 uw:h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-lg uw:text-4xl text-gray-400">{lab.logo}</span>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h4 className="font-medium text-gray-500 text-sm uw:text-3xl mb-1">{lab.name.split(' ')[0]}</h4>
                    <div className="text-xs uw:text-2xl text-gray-400">Lab Details</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Regulatory Documentation with Generate buttons */}
      <div className=" p-4 rounded-lg border mb-8 bg-gray-50 border border-gray-200">
        <h2 className="text-lg uw:text-3xl font-bold mb-4 text-gray-800">Regulatory Documentation</h2>
        <p className="text-sm uw:text-2xl text-gray-600 mb-4">
          The following documentation will be required for certification with your selected markets:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentTypes.map(doc => (
            <div key={doc.id} className="bg-white p-4  rounded border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 uw:w-16 uw:h-16 bg-blue-100 rounded flex items-center justify-center">
                  {doc.icon}
                </div>
                <h3 className="font-medium uw:text-2xl text-gray-800">{doc.name}</h3>
              </div>
              
              <p className="text-xs uw:text-xl text-gray-600 mb-3">
                {doc.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs uw:text-2xl rounded">
                  {doc.required}
                </span>
                
                <button 
                  onClick={() => generateDocument(doc.name)}
                  disabled={generatingDoc === doc.name}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs uw:text-2xl rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingDoc === doc.name ? (
                    <>
                      <div className="w-3 h-3 uw:w-8 uw:h-8 uw:text-2xl border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3 uw:w-8 uw:h-8" />
                      Generate Document
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Export the wrapper as the default component
export default MarketComplianceWrapper;