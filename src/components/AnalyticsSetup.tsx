import React, { useState } from 'react';
import { useGameStore } from '../store';
import { safeNavigate } from './visual-journey/VisualJourney';

// Import useVisualJourney directly from the store to avoid duplicate declaration
const useVisualJourneyFromStore = () => useGameStore(state => state.useVisualJourney);
import { 
  BarChart3, 
  Play, 
  Pause, 
  Clock, 
  BadgeDollarSign, 
  ChevronDown, 
  ChevronUp,
  BarChart2,
  LineChart,
  PieChart,
  Dices,
  Trophy,
  DollarSign,
  Percent,
  Timer,
  BarChart,
  Shield,
  Check,
  X,
  Info,
  ExternalLink,
  Globe,
  Flag,
  AlertTriangle,
  Filter,
  MapPin,
  ArrowRight
} from 'lucide-react';

// Simulation result type
interface SimulationResult {
  spins: number;
  rtp: number;
  hitFrequency: number;
  maxWin: {
    amount: number;
    multiplier: number;
    spin: number;
  };
  volatility: number;
  averageWin: number;
  bigWinFrequency: number;
  featureTriggerRate: number;
  timeElapsed: number;
  balance: number[];
  winDistribution: Record<string, number>;
  featureStats: {
    name: string;
    triggers: number;
    averageReturn: number;
  }[];
}

// Import the Certification types if needed from a local file
interface CertificationProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  price: number;
  basePrice: number;
  pricePerMarket: number;
  estimatedTime: string;
  markets: string[];
  requirements: string[];
  specialties: string[];
}

interface Regulator {
  id: string;
  name: string;
  country: string;
  region: string;
  logo: string;
  requirements: {
    rtp: {
      min: number;
      recommended: number;
    };
    rtpTolerance: number;
    maxWin?: number;
    reportingRequirements: string[];
    specialRequirements?: string[];
  };
  processingTime: string;
  annualFee?: number;
  initialFee?: number;
  currencies: string[];
  recommendedCertifiers: string[];
}

interface Market {
  id: string;
  name: string;
  country: string;
  region: string;
  regulator: string;
  flag: string;
  marketSize: 'small' | 'medium' | 'large';
  difficulty: 'easy' | 'moderate' | 'complex';
  popularity: number; // 1-10 scale
  requirements: {
    rtp: {
      min: number;
      recommended: number;
    };
    languageRequirements: string[];
    currencyRequirements: string[];
  };
  status: 'open' | 'restricted' | 'closing' | 'emerging';
}

const AnalyticsSetup: React.FC = () => {
  const { config, currentStep, setStep, updateConfig } = useGameStore();
  
  // Simplified navigation approach to avoid React errors
  const goToNextStep = () => {
    try {
      console.log("Analytics: saving state before navigation");
      
      // Save any pending state changes first
      const safeUpdateConfig = {
        analytics: {
          ...config.analytics,
          lastUpdated: new Date().toISOString()
        }
      };
      updateConfig(safeUpdateConfig);
      
      // First check if we're already in Visual Journey
      const isVisualJourney = useVisualJourneyFromStore() || useGameStore.getState().useVisualJourney;
      
      // Save current game configuration to localStorage for restoration
      try {
        const currentConfig = useGameStore.getState().config;
        if (currentConfig) {
          localStorage.setItem('slotai_preserved_config', JSON.stringify({
            timestamp: Date.now(),
            config: currentConfig
          }));
          console.log("Analytics: Preserved game configuration for navigation");
        }
      } catch (e) {
        console.error("Failed to preserve configuration:", e);
      }
      
      // Market Compliance is temporarily disabled for stability
      const wantMarketCompliance = false;
      
      // Create parameters for direct navigation
      const targetStep = wantMarketCompliance ? '4' : '8';
      console.log(`Analytics: Navigating to step ${targetStep}`);
      
      // Force a clean reload to bypass all React state issues
      // First preserve our configuration
      localStorage.setItem('slotai_preserved_config', JSON.stringify({
        timestamp: Date.now(),
        config: config
      }));
      
      // Create navigation parameters
      const urlParams = new URLSearchParams();
      urlParams.set('step', targetStep);
      urlParams.set('t', Date.now().toString());
      
      // Add Visual Journey flag if we're in that mode
      if (isVisualJourney) {
        urlParams.set('visual', 'true');
      }
      
      // Use special parameters for stability
      urlParams.set('clean', 'true');
      urlParams.set('reset', 'true');
      
      // Use document.location for a complete page reload
      document.location.href = '/?' + urlParams.toString();
    } catch (error) {
      console.error("Navigation error:", error);
      // Failsafe direct navigation with minimal parameters
      window.location.href = "/?step=8&emergency=true";
    }
  };
  
  const goToPreviousStep = () => {
    try {
      console.log("Analytics: saving state before going back");
      
      // Save any pending state changes first
      const safeUpdateConfig = {
        analytics: {
          ...config.analytics,
          lastUpdated: new Date().toISOString()
        }
      };
      updateConfig(safeUpdateConfig);
      
      // Calculate the previous step
      const prevStepIndex = Math.max(0, currentStep - 1);
      
      // Check if we're in Visual Journey mode
      const isVisualJourney = useVisualJourneyFromStore() || useGameStore.getState().useVisualJourney;
      
      // Use the enhanced navigation bridge
      console.log("Analytics: Using navigation bridge to safely transition to previous step");
      window.location.href = `/navigation-helper.html?step=${prevStepIndex}&from=7${isVisualJourney ? '&visual=true' : ''}`;
    } catch (error) {
      console.error("Previous step navigation error:", error);
      // Failsafe direct navigation
      const prevStepIndex = Math.max(0, currentStep - 1);
      window.location.href = `/navigation-helper.html?step=${prevStepIndex}&from=7`;
    }
  };
  
  // Tab management
  const [activeTab, setActiveTab] = useState<'analytics' | 'certification'>('analytics');
  
  // Analytics state
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [spinOption, setSpinOption] = useState<number>(10000);
  const [showFeatureDetails, setShowFeatureDetails] = useState(false);
  const [showSymbolDetails, setShowSymbolDetails] = useState(false);
  const [showWinDistribution, setShowWinDistribution] = useState(false);
  
  // Certification state (from Certification component)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [activeRegion, setActiveRegion] = useState<string>('All Regions');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRequirements, setShowRequirements] = useState(false);
  const [showRTPInfo, setShowRTPInfo] = useState(false);
  const [selectedRegulator, setSelectedRegulator] = useState<string | null>(null);
  const [showRegulatorInfo, setShowRegulatorInfo] = useState(false);
  const [marketFilter, setMarketFilter] = useState<'all' | 'popular' | 'emerging'>('all');
  const [requirementFilter, setRequirementFilter] = useState<'all' | 'strict' | 'standard'>('all');
  const [expandedMarketGroup, setExpandedMarketGroup] = useState<string | null>('europe');
  const [certificationEstimate, setCertificationEstimate] = useState({
    price: 0,
    timeframe: '',
    markets: 0
  });
  
  // State to store simulation results
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  
  // Sample data for charts (would be populated from actual results)
  const balanceData = simulationResult?.balance || Array(100).fill(0).map((_, i) => 10000 - i * 50 + Math.random() * 2000 - 1000);
  
  // Function to run simulation
  const runSimulation = (spins: number) => {
    setIsSimulating(true);
    setProgress(0);
    setSimulationResult(null);
    
    // Show progress updates
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (1 / (spins / 100));
        if (newProgress >= 100) {
          clearInterval(interval);
          // Done simulating
          setIsSimulating(false);
          
          // Generate simulation results based on game config
          const rtp = config.rtp?.targetRTP || 96;
          const volatility = config.rtp?.volatilityScale || 5;
          const hasFreeSpins = config.bonus?.freeSpins?.enabled || false;
          const hasMultipliers = config.bonus?.multipliers?.enabled || false;
          
          // Calculate simulation results
          const result: SimulationResult = {
            spins: spins,
            rtp: rtp + (Math.random() * 0.8 - 0.4), // Small variation around target RTP
            hitFrequency: volatility < 5 ? 25 + Math.random() * 5 : 18 + Math.random() * 7,
            maxWin: {
              amount: Math.floor(1000 * volatility * (1 + Math.random())),
              multiplier: Math.floor(volatility * 50 * (1 + Math.random() * 0.5)),
              spin: Math.floor(Math.random() * spins)
            },
            volatility: volatility + (Math.random() - 0.5),
            averageWin: (rtp / 100) * 1 / (25 + Math.random() * 5) * 100,
            bigWinFrequency: 1 / (200 + volatility * 50 * (1 + Math.random() * 0.2)),
            featureTriggerRate: hasFreeSpins ? 1 / (120 + Math.random() * 50) : 0,
            timeElapsed: spins * 0.05, // Approx seconds per spin
            balance: generateBalanceData(spins, rtp, volatility),
            winDistribution: generateWinDistribution(volatility),
            featureStats: generateFeatureStats(hasFreeSpins, hasMultipliers, spins, rtp)
          };
          
          setSimulationResult(result);
          return 100;
        }
        return newProgress;
      });
    }, 50);
    
    return () => clearInterval(interval);
  };
  
  // Generate mock balance data for simulation
  const generateBalanceData = (spins: number, rtp: number, volatility: number) => {
    const samples = Math.min(spins, 1000); // Cap the data points to prevent UI slowdown
    const step = spins / samples;
    
    let balance = 10000; // Starting balance
    const data = [balance];
    
    for (let i = 1; i < samples; i++) {
      // RTP effect - long term trend
      const rtpEffect = (rtp - 100) / 100 * step;
      
      // Volatility effect - short term variance
      const volatilityEffect = (Math.random() * 2 - 1) * volatility * Math.sqrt(step) * 20;
      
      // Occasional big wins based on volatility
      const bigWinChance = 1 / (200 + volatility * 50);
      const bigWin = Math.random() < bigWinChance * step ? volatility * 200 * (1 + Math.random()) : 0;
      
      // Update balance
      balance += rtpEffect + volatilityEffect + bigWin;
      balance = Math.max(0, balance); // Prevent negative balance
      
      data.push(balance);
    }
    
    return data;
  };
  
  // Generate mock win distribution data
  const generateWinDistribution = (volatility: number) => {
    const winDistribution: Record<string, number> = {
      '0x': 70 - volatility * 2, // Losses
      '0-1x': 10 + volatility * 0.5,
      '1-2x': 7 + volatility * 0.3,
      '2-5x': 5 + volatility * 0.1,
      '5-10x': 3 + volatility * 0.5,
      '10-25x': 2 + volatility * 0.7,
      '25-50x': 1 + volatility * 0.5,
      '50-100x': 0.5 + volatility * 0.3,
      '100-250x': 0.2 + volatility * 0.2,
      '250-500x': 0.1 + volatility * 0.1,
      '500x+': 0.05 + volatility * 0.05
    };
    
    // Normalize to 100%
    const sum = Object.values(winDistribution).reduce((a, b) => a + b, 0);
    Object.keys(winDistribution).forEach(key => {
      winDistribution[key] = Math.round((winDistribution[key] / sum) * 1000) / 10;
    });
    
    return winDistribution;
  };
  
  // Generate mock feature statistics
  const generateFeatureStats = (hasFreeSpins: boolean, hasMultipliers: boolean, spins: number, rtp: number) => {
    const featureStats = [];
    
    if (hasFreeSpins) {
      const freeSpinContribution = rtp * 0.3; // 30% of RTP comes from free spins
      featureStats.push({
        name: 'Free Spins',
        triggers: Math.round(spins / (120 + Math.random() * 50)),
        averageReturn: freeSpinContribution / (rtp - freeSpinContribution) * 100
      });
    }
    
    if (hasMultipliers) {
      const multiplierContribution = rtp * 0.15; // 15% of RTP comes from multipliers
      featureStats.push({
        name: 'Win Multipliers',
        triggers: Math.round(spins / (30 + Math.random() * 15)),
        averageReturn: multiplierContribution / (rtp - multiplierContribution) * 40
      });
    }
    
    // Add base game stats
    const baseGameContribution = rtp * (hasMultipliers || hasFreeSpins ? 0.6 : 1);
    featureStats.push({
      name: 'Base Game',
      triggers: spins,
      averageReturn: baseGameContribution / rtp * 100
    });
    
    return featureStats;
  };
  
  // Add the certification providers data from the Certification component
  const certificationProviders: CertificationProvider[] = [
    {
      id: 'gli',
      name: 'GLI (Gaming Laboratories International)',
      logo: '/certification/gli-logo.png',
      description: 'Leading testing and certification provider with over 30 years of experience and global recognition',
      basePrice: 12000,
      pricePerMarket: 1500,
      price: 15000,
      estimatedTime: '4-6 weeks',
      markets: [
        'United States (Multiple States)', 'Ontario (Canada)', 'British Columbia (Canada)', 
        'United Kingdom', 'Spain', 'Italy', 'Denmark', 'Sweden', 'Romania', 
        'Colombia', 'Mexico', 'Argentina', 'Peru', 'Chile',
        'Australia', 'New Zealand', 'South Africa'
      ],
      requirements: [
        'Complete game documentation (functional and technical)',
        'Source code access or executable',
        'RNG certification and seed documentation',
        'Math model validation',
        'Game logic verification',
        'Detailed paytable and feature explanations',
        'PAR sheets (Probability Accounting Reports)'
      ],
      specialties: [
        'Multi-jurisdiction certifications',
        'RNG certification',
        'US market expertise',
        'LATAM market knowledge',
        'Comprehensive testing methodology'
      ]
    },
    {
      id: 'bmm',
      name: 'BMM Testlabs',
      logo: '/certification/bmm-logo.png',
      description: 'Global gaming testing laboratory with expertise in product certifications and regulatory compliance',
      basePrice: 10000,
      pricePerMarket: 1250,
      price: 12500,
      estimatedTime: '3-5 weeks',
      markets: [
        'United States (Multiple States)', 'Ontario (Canada)', 'Isle of Man',
        'United Kingdom', 'Malta', 'Gibraltar', 'Sweden', 'Spain', 
        'Colombia', 'Argentina', 'Peru', 'Mexico',
        'South Africa', 'Australia', 'Philippines', 'Macau'
      ],
      requirements: [
        'Game implementation documentation',
        'RNG verification and documentation',
        'Payout verification',
        'Feature and bonus testing',
        'Compliance with jurisdictional requirements',
        'Game client and server interface documentation'
      ],
      specialties: [
        'Fast verification process',
        'Asian market expertise',
        'Land-based casino integration',
        'Technical compliance testing',
        'Game optimization recommendations'
      ]
    },
    // Add more providers as needed
  ];

  // Markets by region with detailed properties from the Certification component
  const markets: Record<string, Market[]> = {
    'europe': [
      {
        id: 'uk',
        name: 'United Kingdom',
        country: 'United Kingdom',
        region: 'Europe',
        regulator: 'ukgc',
        flag: '🇬🇧',
        marketSize: 'large',
        difficulty: 'moderate',
        popularity: 9,
        requirements: {
          rtp: {
            min: 80,
            recommended: 92
          },
          languageRequirements: ['English'],
          currencyRequirements: ['GBP']
        },
        status: 'open'
      },
      {
        id: 'malta',
        name: 'Malta',
        country: 'Malta',
        region: 'Europe',
        regulator: 'mga',
        flag: '🇲🇹',
        marketSize: 'medium',
        difficulty: 'easy',
        popularity: 8,
        requirements: {
          rtp: {
            min: 84,
            recommended: 94
          },
          languageRequirements: ['English'],
          currencyRequirements: ['EUR']
        },
        status: 'open'
      },
      // Add more markets as needed
    ],
    'north-america': [
      {
        id: 'ontario',
        name: 'Ontario',
        country: 'Canada',
        region: 'North America',
        regulator: 'agco',
        flag: '🇨🇦',
        marketSize: 'medium',
        difficulty: 'moderate',
        popularity: 8,
        requirements: {
          rtp: {
            min: 85,
            recommended: 92
          },
          languageRequirements: ['English', 'French'],
          currencyRequirements: ['CAD']
        },
        status: 'open'
      },
      // Add more markets as needed
    ],
    // Add more regions as needed
  };

  // Gaming Regulators by Region
  const regulators: Regulator[] = [
    {
      id: 'ukgc',
      name: 'UK Gambling Commission',
      country: 'United Kingdom',
      region: 'Europe',
      logo: '/regulators/ukgc-logo.png',
      requirements: {
        rtp: {
          min: 80,
          recommended: 92
        },
        rtpTolerance: 2,
        reportingRequirements: [
          'Game testing reports',
          'RNG certification',
          'Game rules',
          'Game mathematics documentation'
        ],
        specialRequirements: [
          'Game speed limitations',
          'Responsible gambling features',
          'Autoplay restrictions',
          'Reality checks'
        ]
      },
      processingTime: '6-8 weeks',
      annualFee: 2500,
      initialFee: 5000,
      currencies: ['GBP', 'EUR'],
      recommendedCertifiers: ['gli', 'ecogra', 'nmi']
    },
    // Add more regulators as needed
  ];

  // All markets flattened
  const allMarkets = Object.values(markets).flat();
  
  // Filtered markets based on search, filter, and region
  const filteredMarkets = allMarkets.filter(market => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      market.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      market.country.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Region filter
    const matchesRegion = activeRegion === 'All Regions' || market.region.includes(activeRegion);
    
    // Market status filter
    const matchesMarketFilter = 
      marketFilter === 'all' || 
      (marketFilter === 'popular' && market.popularity >= 7) ||
      (marketFilter === 'emerging' && market.status === 'emerging');
    
    // Requirements filter
    const matchesRequirementFilter =
      requirementFilter === 'all' ||
      (requirementFilter === 'strict' && market.difficulty === 'complex') ||
      (requirementFilter === 'standard' && market.difficulty !== 'complex');
    
    return matchesSearch && matchesRegion && matchesMarketFilter && matchesRequirementFilter;
  });

  // Group markets by region for display
  const marketsByRegion: Record<string, Market[]> = {
    'europe': filteredMarkets.filter(m => m.region === 'Europe'),
    'north-america': filteredMarkets.filter(m => m.region === 'North America'),
    'latin-america': filteredMarkets.filter(m => m.region === 'Latin America'),
    'asia-pacific': filteredMarkets.filter(m => m.region === 'Asia Pacific'),
    'africa': filteredMarkets.filter(m => m.region === 'Africa'),
  };

  // Certification functions from the Certification component
  const handleMarketSelect = (marketId: string) => {
    if (selectedMarkets.includes(marketId)) {
      setSelectedMarkets(selectedMarkets.filter(id => id !== marketId));
    } else {
      setSelectedMarkets([...selectedMarkets, marketId]);
    }
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    
    // Update the config store with the selected certification provider
    updateConfig({
      certification: {
        ...config.certification,
        provider: providerId,
        status: 'pending',
        requestDate: new Date().toISOString()
      }
    });

    // Calculate estimates
    calculateEstimates(providerId, selectedMarkets);
  };

  const handleRegulatorSelect = (regulatorId: string) => {
    setSelectedRegulator(regulatorId === selectedRegulator ? null : regulatorId);
    setShowRegulatorInfo(regulatorId !== selectedRegulator);
  };

  const calculateEstimates = (providerId: string, marketIds: string[]) => {
    const provider = certificationProviders.find(p => p.id === providerId);
    if (!provider) return;

    // Calculate price based on base price + per market price
    const basePrice = provider.basePrice;
    const perMarketPrice = provider.pricePerMarket;
    const totalPrice = basePrice + (perMarketPrice * marketIds.length);

    // Calculate timeframe based on number of markets
    let timeframe = provider.estimatedTime;
    if (marketIds.length > 10) {
      timeframe = '8-12 weeks';
    } else if (marketIds.length > 5) {
      timeframe = '6-8 weeks';
    }

    setCertificationEstimate({
      price: totalPrice,
      timeframe,
      markets: marketIds.length
    });
  };

  const handleSubmitCertification = () => {
    if (!selectedProvider) return;
    
    // Here we would implement the actual API call to the certification provider
    console.log(`Submitting certification request to ${selectedProvider} for markets:`, selectedMarkets);
    
    // Update the certification status in the store
    updateConfig({
      certification: {
        ...config.certification,
        provider: selectedProvider,
        markets: selectedMarkets,
        status: 'submitted',
        submissionDate: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }
    });

    // Show success message (in a real implementation)
    alert(`Certification request submitted successfully for ${selectedMarkets.length} markets!`);
  };

  const toggleMarketGroup = (region: string) => {
    setExpandedMarketGroup(expandedMarketGroup === region ? null : region);
  };

  // Get regulator info by its ID
  const getRegulatorInfo = (regulatorId: string) => {
    return regulators.find(r => r.id === regulatorId);
  };

  // Market regions for filtering
  const marketRegions = [
    'All Regions', 'Europe', 'North America', 'Latin America', 'Asia Pacific', 'Africa'
  ];

  // Check if game's current RTP meets market requirements
  const meetsRtpRequirements = (market: Market) => {
    const gameRtp = config.rtp?.targetRTP || 96;
    return gameRtp >= market.requirements.rtp.min;
  };

  // Helper functions for certification styling
  const getRtpColorClass = (value: number) => {
    if (value >= 95) return 'text-green-600';
    if (value >= 90) return 'text-blue-600';
    if (value >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColorClass = (difficulty: string) => {
    if (difficulty === 'easy') return 'bg-green-100 text-green-800';
    if (difficulty === 'moderate') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getMarketSizeClass = (size: string) => {
    if (size === 'large') return 'bg-blue-100 text-blue-800';
    if (size === 'medium') return 'bg-indigo-100 text-indigo-800';
    return 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'analytics' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('analytics')}
        >
          <div className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics & Simulation
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'certification' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('certification')}
        >
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Certification & Compliance
          </div>
        </button>
      </div>

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <>
          {/* Simulation Controls */}
          <section className="bg-white/50 p-6 rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
              <BarChart3 className="mr-2 w-6 h-6 text-blue-600" />
              Simulation & Analysis
            </h2>
            <p className="text-gray-600 mb-6">
              Run mathematical simulations on your slot game to analyze RTP, volatility, and other key metrics.
            </p>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${spinOption === 100 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setSpinOption(100)}
          >
            100 Spins
          </button>
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${spinOption === 1000 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setSpinOption(1000)}
          >
            1,000 Spins
          </button>
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${spinOption === 10000 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setSpinOption(10000)}
          >
            10,000 Spins
          </button>
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${spinOption === 100000 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setSpinOption(100000)}
          >
            100,000 Spins
          </button>
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${spinOption === 1000000 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setSpinOption(1000000)}
          >
            1,000,000 Spins
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => runSimulation(spinOption)}
            disabled={isSimulating}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium ${
              isSimulating 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSimulating ? (
              <>
                <Pause className="w-5 h-5" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Simulation
              </>
            )}
          </button>
          
          <div className="text-sm text-gray-500">
            Estimated time: {(spinOption * 0.05 / 60).toFixed(1)} minutes
          </div>
        </div>
        
        {isSimulating && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600">
              Processing {Math.floor(progress)}% complete ({Math.floor(spinOption * progress / 100).toLocaleString()} spins)
            </div>
          </div>
        )}
      </section>
      
      {/* Simulation Results */}
      {simulationResult && (
        <section className="bg-white/50 p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <BarChart2 className="mr-2 w-6 h-6 text-blue-600" />
            Simulation Results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* RTP */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Return to Player (RTP)</div>
                <div className="text-2xl font-bold text-gray-800">{simulationResult.rtp.toFixed(2)}%</div>
              </div>
            </div>
            
            {/* Hit Frequency */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <BarChart className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Hit Frequency</div>
                <div className="text-2xl font-bold text-gray-800">{simulationResult.hitFrequency.toFixed(2)}%</div>
              </div>
            </div>
            
            {/* Max Win */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Max Win</div>
                <div className="text-2xl font-bold text-gray-800">{simulationResult.maxWin.multiplier}x</div>
              </div>
            </div>
          </div>
          
          {/* Key Statistics */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Key Statistics</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Dices className="w-4 h-4 text-blue-600" />
                  <div className="text-sm font-medium text-gray-700">Total Spins</div>
                </div>
                <div className="text-xl font-bold text-gray-800">{simulationResult.spins.toLocaleString()}</div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <div className="text-sm font-medium text-gray-700">Average Win</div>
                </div>
                <div className="text-xl font-bold text-gray-800">{simulationResult.averageWin.toFixed(2)}x</div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <div className="text-sm font-medium text-gray-700">Volatility</div>
                </div>
                <div className="text-xl font-bold text-gray-800">{simulationResult.volatility.toFixed(2)}</div>
                <div className="text-xs text-gray-500">
                  {simulationResult.volatility < 3 ? 'Low' : 
                   simulationResult.volatility < 7 ? 'Medium' : 'High'}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <div className="text-sm font-medium text-gray-700">Time Elapsed</div>
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {Math.floor(simulationResult.timeElapsed / 60)} min {Math.floor(simulationResult.timeElapsed % 60)} sec
                </div>
              </div>
            </div>
          </div>
          
          {/* Balance Chart */}
          <div className="p-6 rounded-lg border border-gray-200 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Balance Over Time</h3>
            
            <div className="h-64 bg-white p-4 rounded-lg border border-gray-100">
              {/* In a real implementation, this would be an actual chart */}
              <div className="h-full relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <LineChart className="w-16 h-16 opacity-20" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500">Interactive balance chart would be displayed here</p>
                    <p className="text-sm text-gray-400">Starting: 10,000 | Final: {simulationResult.balance[simulationResult.balance.length - 1].toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Statistics */}
          <div className="mb-8">
            <div 
              className="flex items-center justify-between cursor-pointer" 
              onClick={() => setShowFeatureDetails(!showFeatureDetails)}
            >
              <h3 className="text-lg font-bold text-gray-800">Feature Statistics</h3>
              <button className="text-gray-500 p-1 hover:bg-gray-100 rounded">
                {showFeatureDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
            
            {showFeatureDetails && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {simulationResult.featureStats.map((feature, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-100">
                      <h4 className="font-medium text-gray-800 mb-1">{feature.name}</h4>
                      <div className="text-sm text-gray-600 mb-1">
                        Triggers: {feature.triggers.toLocaleString()} 
                        {feature.name !== 'Base Game' && ` (1 in ${Math.round(simulationResult.spins / feature.triggers)})`}
                      </div>
                      <div className="text-sm text-gray-600">
                        Average Return: {feature.averageReturn.toFixed(2)}x bet
                      </div>
                      <div className="mt-2 h-2 w-full bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-blue-600 rounded-full" 
                          style={{ width: `${feature.averageReturn / simulationResult.rtp * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(feature.averageReturn / simulationResult.rtp * 100).toFixed(1)}% of RTP
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Win Distribution */}
          <div className="mb-8">
            <div 
              className="flex items-center justify-between cursor-pointer" 
              onClick={() => setShowWinDistribution(!showWinDistribution)}
            >
              <h3 className="text-lg font-bold text-gray-800">Win Distribution</h3>
              <button className="text-gray-500 p-1 hover:bg-gray-100 rounded">
                {showWinDistribution ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
            
            {showWinDistribution && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left text-gray-700">Win Size</th>
                          <th className="px-4 py-2 text-right text-gray-700">Frequency (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(simulationResult.winDistribution).map(([range, frequency], index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-gray-700">{range}</td>
                            <td className="px-4 py-2 text-right text-gray-700">{frequency.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="h-64 bg-white p-4 rounded-lg border border-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="w-16 h-16 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-500">Win distribution chart would be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Export Options */}
          <div className="flex flex-wrap gap-4 mt-6">
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Export CSV
            </button>
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Detailed Report
            </button>
          </div>
        </section>
      )}
      
      {/* Advanced Analytics Options */}
      <section className="bg-white/50 p-6 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <BarChart3 className="mr-2 w-6 h-6 text-blue-600" />
          Advanced Analytics Options
        </h2>
        <p className="text-gray-600 mb-6">
          Fine-tune your game's analytics and performance metrics. 
          <span className="text-blue-600 ml-1">Primary configuration has been moved to Settings ⚙️</span>
        </p>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium text-gray-800 mb-2">Balance Simulation</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  defaultChecked
                />
                <span className="text-gray-700">Realistic Variance</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">Apply realistic high/low patterns to the balance chart</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="font-medium text-gray-800 mb-2">Feature Analysis</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  defaultChecked
                />
                <span className="text-gray-700">Detailed Feature Breakdown</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">Show detailed contribution of each feature to the total RTP</p>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="font-medium text-gray-800 mb-2">Simulation Engine Options</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calculation Method
                </label>
                <select
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1 text-gray-700 text-sm"
                  defaultValue="monte-carlo"
                >
                  <option value="monte-carlo">Monte Carlo</option>
                  <option value="exhaustive">Exhaustive</option>
                  <option value="hybrid">Hybrid Method</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Random Seed
                </label>
                <input
                  type="number"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1 text-gray-700 text-sm"
                  placeholder="1234"
                  defaultValue={1234}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              onClick={() => {
                alert('Settings saved! Visit the Configuration menu for additional analytics settings.');
              }}
            >
              Save Advanced Options
            </button>
          </div>
        </div>
      </section>
      
      {/* Navigation buttons - these should be outside both tabs */}
      <div className="flex justify-between mt-8">
        <button
          onClick={goToPreviousStep}
          className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={goToNextStep}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Next
        </button>
      </div>
        </>
      )}

      {/* Certification Tab Content */}
      {activeTab === 'certification' && (
        <>
          {/* Introduction Section */}
          <section className="bg-white/50 p-6 rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
              <Shield className="mr-2 w-6 h-6 text-blue-600" />
              Certification & Compliance
            </h2>
            <p className="text-gray-600 mb-6">
              Ensure your game meets regulatory requirements by obtaining certification from recognized testing laboratories.
              Proper certification is essential for access to regulated markets and provides assurance of game fairness and integrity.
            </p>

            {/* RTP Compliance Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Your Game's RTP Setting</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Your game's current target RTP is <span className="font-medium">{config.rtp?.targetRTP || 96}%</span></p>
                    <button 
                      onClick={() => setShowRTPInfo(!showRTPInfo)}
                      className="mt-1 flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <span className="underline mr-1">Show RTP compliance by market</span>
                      {showRTPInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    
                    {showRTPInfo && (
                      <div className="mt-3 border-t border-blue-200 pt-3">
                        <h4 className="font-medium mb-2">Market RTP Requirements:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.values(markets).flat().slice(0, 9).map(market => (
                            <div key={market.id} className="flex items-center space-x-2">
                              <span className="text-sm">{market.flag} {market.name}:</span>
                              <span className={`text-sm font-medium ${getRtpColorClass(market.requirements.rtp.min)}`}>
                                Min {market.requirements.rtp.min}%
                              </span>
                              <span className={meetsRtpRequirements(market) ? "text-green-500" : "text-red-500"}>
                                {meetsRtpRequirements(market) ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-blue-600">
                          Note: Actual requirements may vary by individual jurisdiction. Always consult with your certification provider.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Market Selection with Search and Filtering */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">Select Target Markets</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Markets selected: {selectedMarkets.length}</span>
                  <button 
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                    onClick={() => setSelectedMarkets([])}
                  >
                    Clear all
                  </button>
                </div>
              </div>
              
              {/* Search and Filter Bar */}
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search markets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={activeRegion}
                    onChange={(e) => setActiveRegion(e.target.value)}
                  >
                    {marketRegions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Markets by Region */}
              <div className="space-y-4 mt-4">
                {Object.entries(marketsByRegion).map(([region, regionMarkets]) => regionMarkets.length > 0 && (
                  <div key={region} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                      onClick={() => toggleMarketGroup(region)}
                    >
                      <div className="flex items-center">
                        <Globe className="h-5 w-5 text-blue-600 mr-2" />
                        <h4 className="font-medium text-gray-800 capitalize">
                          {region.replace('-', ' ')} 
                          <span className="text-sm text-gray-500 ml-2">({regionMarkets.length} markets)</span>
                        </h4>
                      </div>
                      {expandedMarketGroup === region ? 
                        <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      }
                    </div>
                    
                    {expandedMarketGroup === region && (
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {regionMarkets.map(market => (
                            <div 
                              key={market.id}
                              className={`bg-white p-3 rounded-lg border transition-all ${
                                selectedMarkets.includes(market.id) 
                                  ? 'border-blue-500 shadow-sm' 
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                  <span className="text-xl mr-2">{market.flag}</span>
                                  <div>
                                    <h5 className="font-medium text-gray-800">{market.name}</h5>
                                    <p className="text-xs text-gray-500">{market.country}</p>
                                  </div>
                                </div>
                                <label className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    className="form-checkbox h-5 w-5 text-blue-600 transition duration-150 ease-in-out"
                                    checked={selectedMarkets.includes(market.id)}
                                    onChange={() => handleMarketSelect(market.id)}
                                  />
                                </label>
                              </div>
                              
                              <div className="mt-2 flex items-center text-xs space-x-1">
                                <span 
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full ${getDifficultyColorClass(market.difficulty)}`}
                                >
                                  {market.difficulty}
                                </span>
                                <span 
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full ${getMarketSizeClass(market.marketSize)}`}
                                >
                                  {market.marketSize}
                                </span>
                                {market.status === 'emerging' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                                    emerging
                                  </span>
                                )}
                              </div>
                              
                              <div className="mt-2 text-xs">
                                <div className="flex justify-between text-gray-600">
                                  <span>Min RTP: <span className={getRtpColorClass(market.requirements.rtp.min)}>{market.requirements.rtp.min}%</span></span>
                                  <span>Recommended: <span className={getRtpColorClass(market.requirements.rtp.recommended)}>{market.requirements.rtp.recommended}%</span></span>
                                </div>
                                <div className="flex justify-between text-gray-600 mt-1">
                                  <div>
                                    <span>Languages: </span>
                                    <span className="text-gray-800">{market.requirements.languageRequirements.join(', ')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Markets Summary */}
            {selectedMarkets.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-md font-medium text-gray-800 mb-2">Selected Markets ({selectedMarkets.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMarkets.map(marketId => {
                    const market = allMarkets.find(m => m.id === marketId);
                    return market && (
                      <div key={marketId} className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-blue-800">
                        <span className="mr-1">{market.flag}</span>
                        <span>{market.name}</span>
                        <button
                          onClick={() => handleMarketSelect(marketId)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {/* RTP Alert for Selected Markets */}
                {selectedMarkets.some(marketId => {
                  const market = allMarkets.find(m => m.id === marketId);
                  return market && !meetsRtpRequirements(market);
                }) && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">RTP Adjustment Needed</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Some selected markets require higher RTP than your current setting ({config.rtp?.targetRTP || 96}%).</p>
                          <ul className="mt-1 space-y-1 list-disc list-inside">
                            {selectedMarkets.map(marketId => {
                              const market = allMarkets.find(m => m.id === marketId);
                              if (market && !meetsRtpRequirements(market)) {
                                return (
                                  <li key={marketId}>
                                    {market.flag} {market.name}: Minimum {market.requirements.rtp.min}% required
                                  </li>
                                );
                              }
                              return null;
                            }).filter(Boolean)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Certification Options */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Select Certification Provider</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {certificationProviders.map(provider => (
                  <div 
                    key={provider.id}
                    className={`p-4 rounded-lg border transition-all ${
                      selectedProvider === provider.id 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-800">{provider.name}</h4>
                        <p className="text-gray-600 text-sm mt-1">{provider.description}</p>
                      </div>
                      <button
                        onClick={() => handleProviderSelect(provider.id)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedProvider === provider.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {selectedProvider === provider.id ? 'Selected' : 'Select'}
                      </button>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                        <div>
                          <span className="text-gray-500">Base fee</span>
                          <span className="text-gray-700 font-medium block">${provider.basePrice.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-blue-600 mr-1" />
                        <div>
                          <span className="text-gray-500">Per market</span>
                          <span className="text-gray-700 font-medium block">+${provider.pricePerMarket.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {provider.specialties.slice(0, 3).map((specialty, idx) => (
                        <span key={idx} className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Certification Quote Section */}
          {selectedProvider && selectedMarkets.length > 0 && (
            <section className="bg-white/50 p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Certification Quote</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Markets: {selectedMarkets.length}</span>
                  <span className="h-4 w-0.5 bg-gray-300"></span>
                  <span className="text-sm text-gray-500">Provider: {certificationProviders.find(p => p.id === selectedProvider)?.name}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col justify-center items-center text-center">
                  <DollarSign className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-gray-500 text-sm">Estimated Cost</p>
                  <p className="text-2xl font-bold text-gray-800">${certificationEstimate.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Base fee + per market pricing</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col justify-center items-center text-center">
                  <Clock className="h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-gray-500 text-sm">Estimated Time</p>
                  <p className="text-2xl font-bold text-gray-800">{certificationEstimate.timeframe}</p>
                  <p className="text-xs text-gray-500 mt-1">After submission of all materials</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col justify-center items-center text-center">
                  <Shield className="h-8 w-8 text-purple-500 mb-2" />
                  <p className="text-gray-500 text-sm">Estimated Approval</p>
                  <p className="text-2xl font-bold text-gray-800">89%</p>
                  <p className="text-xs text-gray-500 mt-1">Based on your game parameters</p>
                </div>
              </div>
              
              {/* Materials Checklist */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Required Materials</h4>
                <div className="space-y-2">
                  {certificationProviders.find(p => p.id === selectedProvider)?.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-gray-400">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-2 text-gray-700">{req}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Our certification process includes comprehensive testing to ensure your game meets the requirements
                    of each selected market. You'll need to provide the materials listed above.
                  </p>
                </div>
              </div>
              
              {/* Submit Actions */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setSelectedMarkets([])}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Reset Selections
                </button>
                
                <button
                  onClick={handleSubmitCertification}
                  disabled={selectedMarkets.length === 0 || !selectedProvider}
                  className={`px-6 py-3 rounded-lg flex items-center ${
                    selectedMarkets.length === 0 || !selectedProvider
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Submit for Certification
                </button>
              </div>
            </section>
          )}
          
          {/* Navigation buttons - for the certification tab */}
          <div className="flex justify-between mt-8">
            <button
              onClick={goToPreviousStep}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={goToNextStep}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsSetup;