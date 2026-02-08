import React, { useState } from 'react';
import { Shield, Check, X, Info, ExternalLink, DollarSign, Clock, Search, Globe, Flag, AlertTriangle, Filter, ChevronDown, ChevronUp, MapPin, ArrowRight } from 'lucide-react';
import { useGameStore } from '../store';

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

const Certification: React.FC = () => {
  const { config, updateConfig, currentStep, setStep } = useGameStore();
  
  // Navigation helpers
  const goToNextStep = () => {
    setStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const goToPreviousStep = () => {
    setStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
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
  
  // Comprehensive certification providers with specialized details
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
    {
      id: 'ecogra',
      name: 'eCOGRA',
      logo: '/certification/ecogra-logo.png',
      description: 'Independent testing agency specializing in online gaming certification and responsible gambling standards',
      basePrice: 7000,
      pricePerMarket: 750,
      price: 8500,
      estimatedTime: '2-4 weeks',
      markets: [
        'United Kingdom', 'Malta', 'Isle of Man', 'Gibraltar', 
        'Sweden', 'Denmark', 'Spain', 'Italy', 
        'Belgium', 'Romania', 'Portugal',
        'Colombia', 'Argentina'
      ],
      requirements: [
        'RNG testing and certification',
        'Game fairness assessment',
        'Return to player verification',
        'Game rules documentation',
        'Responsible gaming features validation',
        'Player protection measures'
      ],
      specialties: [
        'European market expertise',
        'Rapid testing turnaround',
        'Responsible gambling certification',
        'Player protection standards',
        'Ongoing compliance monitoring'
      ]
    },
    {
      id: 'gaming-associates',
      name: 'Gaming Associates',
      logo: '/certification/gaming-associates-logo.png',
      description: 'Independent testing, certification and consulting for online and land-based gaming industries',
      basePrice: 8000,
      pricePerMarket: 750,
      price: 9500,
      estimatedTime: '3-4 weeks',
      markets: [
        'Australia', 'New Zealand', 'Singapore', 'Philippines',
        'United Kingdom', 'Malta', 'Gibraltar', 'Isle of Man',
        'South Africa', 'Kenya', 'Canada'
      ],
      requirements: [
        'Full technical documentation',
        'RNG certification',
        'Game logic verification',
        'Compliance with jurisdictional requirements',
        'Security audit and penetration testing',
        'Technical architecture review'
      ],
      specialties: [
        'APAC region expertise',
        'African market knowledge',
        'Security and integrity testing',
        'Technical architecture consulting',
        'Regulatory compliance advisory'
      ]
    },
    {
      id: 'nmi',
      name: 'NMi Gaming',
      logo: '/certification/nmi-logo.png',
      description: 'Leading international testing laboratory with extensive experience in gambling compliance testing',
      basePrice: 9000,
      pricePerMarket: 1100,
      price: 11000,
      estimatedTime: '3-5 weeks',
      markets: [
        'United Kingdom', 'Netherlands', 'Malta', 'Isle of Man',
        'Denmark', 'Spain', 'Italy', 'Sweden', 'Belgium',
        'Lithuania', 'Estonia', 'Latvia', 'Greece',
        'Colombia', 'Argentina'
      ],
      requirements: [
        'Complete technical documentation',
        'Source code review or compiled code',
        'Random number generation testing',
        'Mathematical model validation',
        'Game functionality testing',
        'Regulatory compliance verification',
        'System integration testing'
      ],
      specialties: [
        'European market expertise',
        'Dutch market specialists',
        'Baltic region knowledge',
        'High performance testing',
        'Continuous compliance monitoring'
      ]
    },
    {
      id: 'quinel',
      name: 'Quinel',
      logo: '/certification/quinel-logo.png',
      description: 'Specialized certification laboratory focusing on online gaming platforms and game certification',
      basePrice: 7500,
      pricePerMarket: 800,
      price: 9000,
      estimatedTime: '2-3 weeks',
      markets: [
        'Italy', 'Spain', 'Romania', 'Sweden', 'Denmark',
        'United Kingdom', 'Malta', 'Isle of Man', 'Gibraltar',
        'Colombia', 'Bulgaria', 'Switzerland', 'Serbia'
      ],
      requirements: [
        'Game implementation documentation',
        'RNG verification',
        'Payout structure validation',
        'Game rules and information',
        'Functional testing results',
        'Regulatory requirement compliance'
      ],
      specialties: [
        'Italian market experts',
        'Mediterranean region expertise',
        'Fast certification process',
        'Integration testing',
        'Regulatory change management'
      ]
    }
  ];

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
    {
      id: 'mga',
      name: 'Malta Gaming Authority',
      country: 'Malta',
      region: 'Europe',
      logo: '/regulators/mga-logo.png',
      requirements: {
        rtp: {
          min: 84,
          recommended: 94
        },
        rtpTolerance: 1,
        reportingRequirements: [
          'Game certification report',
          'RNG certification',
          'Game rules',
          'Technical compliance documentation'
        ]
      },
      processingTime: '4-6 weeks',
      annualFee: 1500,
      initialFee: 3000,
      currencies: ['EUR', 'USD'],
      recommendedCertifiers: ['ecogra', 'gli', 'quinel', 'nmi']
    },
    {
      id: 'dgoj',
      name: 'Dirección General de Ordenación del Juego',
      country: 'Spain',
      region: 'Europe',
      logo: '/regulators/dgoj-logo.png',
      requirements: {
        rtp: {
          min: 80,
          recommended: 92
        },
        rtpTolerance: 1,
        reportingRequirements: [
          'Game certification documentation',
          'RNG certification',
          'Spanish language game rules',
          'Technical compliance documentation'
        ],
        specialRequirements: [
          'Spanish localization requirements',
          'Specific technical standards',
          'Local server requirements'
        ]
      },
      processingTime: '8-12 weeks',
      annualFee: 1000,
      initialFee: 2500,
      currencies: ['EUR'],
      recommendedCertifiers: ['gli', 'quinel', 'nmi']
    },
    {
      id: 'ksa',
      name: 'Kansspelautoriteit (Netherlands Gaming Authority)',
      country: 'Netherlands',
      region: 'Europe',
      logo: '/regulators/ksa-logo.png',
      requirements: {
        rtp: {
          min: 80,
          recommended: 94
        },
        rtpTolerance: 1,
        maxWin: 100000,
        reportingRequirements: [
          'Game certification documentation',
          'RNG certification',
          'Dutch language game rules',
          'Technical compliance documentation'
        ],
        specialRequirements: [
          'Strict age verification',
          'Auto-play restrictions',
          'Cooling-off periods',
          'Detailed session information'
        ]
      },
      processingTime: '6-10 weeks',
      annualFee: 1800,
      initialFee: 4000,
      currencies: ['EUR'],
      recommendedCertifiers: ['nmi', 'gli', 'quinel']
    },
    {
      id: 'agco',
      name: 'Alcohol and Gaming Commission of Ontario',
      country: 'Canada (Ontario)',
      region: 'North America',
      logo: '/regulators/agco-logo.png',
      requirements: {
        rtp: {
          min: 85,
          recommended: 92
        },
        rtpTolerance: 2,
        reportingRequirements: [
          'Game certification from approved lab',
          'RNG certification',
          'Game rules in English and French',
          'Technical compliance documentation'
        ],
        specialRequirements: [
          'French and English language support',
          'Canadian banking integration',
          'Responsible gambling measures'
        ]
      },
      processingTime: '4-8 weeks',
      annualFee: 2000,
      initialFee: 5000,
      currencies: ['CAD'],
      recommendedCertifiers: ['gli', 'bmm', 'gaming-associates']
    },
    {
      id: 'coljuegos',
      name: 'Coljuegos',
      country: 'Colombia',
      region: 'Latin America',
      logo: '/regulators/coljuegos-logo.png',
      requirements: {
        rtp: {
          min: 83,
          recommended: 92
        },
        rtpTolerance: 2,
        reportingRequirements: [
          'Game certification from approved lab',
          'RNG certification',
          'Spanish language game rules',
          'Technical compliance documentation'
        ],
        specialRequirements: [
          'Colombian player protection measures',
          'Local currency support',
          'Spanish localization'
        ]
      },
      processingTime: '6-10 weeks',
      annualFee: 1500,
      initialFee: 3000,
      currencies: ['COP'],
      recommendedCertifiers: ['gli', 'bmm', 'ecogra']
    }
  ];

  // Markets by region with detailed properties
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
      {
        id: 'spain',
        name: 'Spain',
        country: 'Spain',
        region: 'Europe',
        regulator: 'dgoj',
        flag: '🇪🇸',
        marketSize: 'medium',
        difficulty: 'moderate',
        popularity: 7,
        requirements: {
          rtp: {
            min: 80,
            recommended: 92
          },
          languageRequirements: ['Spanish'],
          currencyRequirements: ['EUR']
        },
        status: 'open'
      },
      {
        id: 'netherlands',
        name: 'Netherlands',
        country: 'Netherlands',
        region: 'Europe',
        regulator: 'ksa',
        flag: '🇳🇱',
        marketSize: 'medium',
        difficulty: 'complex',
        popularity: 7,
        requirements: {
          rtp: {
            min: 80,
            recommended: 94
          },
          languageRequirements: ['Dutch'],
          currencyRequirements: ['EUR']
        },
        status: 'open'
      },
      {
        id: 'italy',
        name: 'Italy',
        country: 'Italy',
        region: 'Europe',
        regulator: 'adm',
        flag: '🇮🇹',
        marketSize: 'medium',
        difficulty: 'complex',
        popularity: 7,
        requirements: {
          rtp: {
            min: 85,
            recommended: 92
          },
          languageRequirements: ['Italian'],
          currencyRequirements: ['EUR']
        },
        status: 'open'
      },
      {
        id: 'sweden',
        name: 'Sweden',
        country: 'Sweden',
        region: 'Europe',
        regulator: 'spelinspektionen',
        flag: '🇸🇪',
        marketSize: 'medium',
        difficulty: 'moderate',
        popularity: 7,
        requirements: {
          rtp: {
            min: 85,
            recommended: 95
          },
          languageRequirements: ['Swedish'],
          currencyRequirements: ['SEK']
        },
        status: 'open'
      },
      {
        id: 'denmark',
        name: 'Denmark',
        country: 'Denmark',
        region: 'Europe',
        regulator: 'spillemyndigheden',
        flag: '🇩🇰',
        marketSize: 'small',
        difficulty: 'moderate',
        popularity: 6,
        requirements: {
          rtp: {
            min: 80,
            recommended: 92
          },
          languageRequirements: ['Danish'],
          currencyRequirements: ['DKK']
        },
        status: 'open'
      },
      {
        id: 'romania',
        name: 'Romania',
        country: 'Romania',
        region: 'Europe',
        regulator: 'onjn',
        flag: '🇷🇴',
        marketSize: 'small',
        difficulty: 'moderate',
        popularity: 5,
        requirements: {
          rtp: {
            min: 80,
            recommended: 92
          },
          languageRequirements: ['Romanian'],
          currencyRequirements: ['RON', 'EUR']
        },
        status: 'open'
      }
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
      {
        id: 'new-jersey',
        name: 'New Jersey',
        country: 'United States',
        region: 'North America',
        regulator: 'njdge',
        flag: '🇺🇸',
        marketSize: 'medium',
        difficulty: 'complex',
        popularity: 8,
        requirements: {
          rtp: {
            min: 83,
            recommended: 92
          },
          languageRequirements: ['English'],
          currencyRequirements: ['USD']
        },
        status: 'open'
      },
      {
        id: 'pennsylvania',
        name: 'Pennsylvania',
        country: 'United States',
        region: 'North America',
        regulator: 'pgcb',
        flag: '🇺🇸',
        marketSize: 'medium',
        difficulty: 'complex',
        popularity: 7,
        requirements: {
          rtp: {
            min: 85,
            recommended: 92
          },
          languageRequirements: ['English'],
          currencyRequirements: ['USD']
        },
        status: 'open'
      },
      {
        id: 'michigan',
        name: 'Michigan',
        country: 'United States',
        region: 'North America',
        regulator: 'mgcb',
        flag: '🇺🇸',
        marketSize: 'medium',
        difficulty: 'complex',
        popularity: 7,
        requirements: {
          rtp: {
            min: 80,
            recommended: 92
          },
          languageRequirements: ['English'],
          currencyRequirements: ['USD']
        },
        status: 'open'
      }
    ],
    'latin-america': [
      {
        id: 'colombia',
        name: 'Colombia',
        country: 'Colombia',
        region: 'Latin America',
        regulator: 'coljuegos',
        flag: '🇨🇴',
        marketSize: 'medium',
        difficulty: 'moderate',
        popularity: 7,
        requirements: {
          rtp: {
            min: 83,
            recommended: 92
          },
          languageRequirements: ['Spanish'],
          currencyRequirements: ['COP']
        },
        status: 'open'
      },
      {
        id: 'mexico',
        name: 'Mexico',
        country: 'Mexico',
        region: 'Latin America',
        regulator: 'segob',
        flag: '🇲🇽',
        marketSize: 'medium',
        difficulty: 'moderate',
        popularity: 6,
        requirements: {
          rtp: {
            min: 80,
            recommended: 90
          },
          languageRequirements: ['Spanish'],
          currencyRequirements: ['MXN']
        },
        status: 'open'
      },
      {
        id: 'brazil',
        name: 'Brazil',
        country: 'Brazil',
        region: 'Latin America',
        regulator: 'upcoming',
        flag: '🇧🇷',
        marketSize: 'large',
        difficulty: 'complex',
        popularity: 7,
        requirements: {
          rtp: {
            min: 80,
            recommended: 90
          },
          languageRequirements: ['Portuguese'],
          currencyRequirements: ['BRL']
        },
        status: 'emerging'
      },
      {
        id: 'argentina',
        name: 'Argentina',
        country: 'Argentina',
        region: 'Latin America',
        regulator: 'lotba',
        flag: '🇦🇷',
        marketSize: 'medium',
        difficulty: 'moderate',
        popularity: 5,
        requirements: {
          rtp: {
            min: 80,
            recommended: 90
          },
          languageRequirements: ['Spanish'],
          currencyRequirements: ['ARS']
        },
        status: 'open'
      },
      {
        id: 'peru',
        name: 'Peru',
        country: 'Peru',
        region: 'Latin America',
        regulator: 'mincetur',
        flag: '🇵🇪',
        marketSize: 'small',
        difficulty: 'moderate',
        popularity: 4,
        requirements: {
          rtp: {
            min: 80,
            recommended: 90
          },
          languageRequirements: ['Spanish'],
          currencyRequirements: ['PEN']
        },
        status: 'emerging'
      }
    ],
    'asia-pacific': [
      {
        id: 'australia',
        name: 'Australia',
        country: 'Australia',
        region: 'Asia Pacific',
        regulator: 'multiple-state',
        flag: '🇦🇺',
        marketSize: 'medium',
        difficulty: 'complex',
        popularity: 6,
        requirements: {
          rtp: {
            min: 87,
            recommended: 92
          },
          languageRequirements: ['English'],
          currencyRequirements: ['AUD']
        },
        status: 'restricted'
      },
      {
        id: 'philippines',
        name: 'Philippines',
        country: 'Philippines',
        region: 'Asia Pacific',
        regulator: 'pagcor',
        flag: '🇵🇭',
        marketSize: 'medium',
        difficulty: 'moderate',
        popularity: 6,
        requirements: {
          rtp: {
            min: 85,
            recommended: 92
          },
          languageRequirements: ['English', 'Filipino'],
          currencyRequirements: ['PHP']
        },
        status: 'open'
      },
      {
        id: 'japan',
        name: 'Japan',
        country: 'Japan',
        region: 'Asia Pacific',
        regulator: 'upcoming',
        flag: '🇯🇵',
        marketSize: 'large',
        difficulty: 'complex',
        popularity: 6,
        requirements: {
          rtp: {
            min: 85,
            recommended: 95
          },
          languageRequirements: ['Japanese'],
          currencyRequirements: ['JPY']
        },
        status: 'emerging'
      }
    ],
    'africa': [
      {
        id: 'south-africa',
        name: 'South Africa',
        country: 'South Africa',
        region: 'Africa',
        regulator: 'nla',
        flag: '🇿🇦',
        marketSize: 'medium',
        difficulty: 'moderate',
        popularity: 5,
        requirements: {
          rtp: {
            min: 80,
            recommended: 90
          },
          languageRequirements: ['English'],
          currencyRequirements: ['ZAR']
        },
        status: 'open'
      },
      {
        id: 'kenya',
        name: 'Kenya',
        country: 'Kenya',
        region: 'Africa',
        regulator: 'bclb',
        flag: '🇰🇪',
        marketSize: 'small',
        difficulty: 'moderate',
        popularity: 4,
        requirements: {
          rtp: {
            min: 80,
            recommended: 90
          },
          languageRequirements: ['English', 'Swahili'],
          currencyRequirements: ['KES']
        },
        status: 'open'
      },
      {
        id: 'nigeria',
        name: 'Nigeria',
        country: 'Nigeria',
        region: 'Africa',
        regulator: 'nlrc',
        flag: '🇳🇬',
        marketSize: 'small',
        difficulty: 'moderate',
        popularity: 4,
        requirements: {
          rtp: {
            min: 80,
            recommended: 90
          },
          languageRequirements: ['English'],
          currencyRequirements: ['NGN']
        },
        status: 'emerging'
      }
    ]
  };

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

  // Get certification providers that cover a specific market
  const getProvidersForMarket = (marketId: string) => {
    const market = allMarkets.find(m => m.id === marketId);
    if (!market) return [];
    
    return certificationProviders.filter(provider => 
      provider.markets.some(m => 
        m.includes(market.country) || 
        m.includes(market.region)
      )
    ).map(p => p.id);
  };

  // Get RTP color class based on value
  const getRtpColorClass = (value: number) => {
    if (value >= 95) return 'text-green-600';
    if (value >= 90) return 'text-blue-600';
    if (value >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get difficulty color class
  const getDifficultyColorClass = (difficulty: string) => {
    if (difficulty === 'easy') return 'bg-green-100 text-green-800';
    if (difficulty === 'moderate') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Get market size class
  const getMarketSizeClass = (size: string) => {
    if (size === 'large') return 'bg-blue-100 text-blue-800';
    if (size === 'medium') return 'bg-indigo-100 text-indigo-800';
    return 'bg-purple-100 text-purple-800';
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

  return (
    <div className="space-y-6">
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
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
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
              
              <div className="relative inline-block text-left">
                <div>
                  <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    onClick={() => setMarketFilter(marketFilter === 'all' ? 'popular' : marketFilter === 'popular' ? 'emerging' : 'all')}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {marketFilter === 'all' ? 'All Markets' : marketFilter === 'popular' ? 'Popular' : 'Emerging'}
                  </button>
                </div>
              </div>
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
                          
                          {selectedMarkets.includes(market.id) && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center text-xs text-blue-600">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>Regulator: </span>
                                <button
                                  onClick={() => handleRegulatorSelect(market.regulator)}
                                  className="ml-1 underline hover:text-blue-800"
                                >
                                  {getRegulatorInfo(market.regulator)?.name || market.regulator}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredMarkets.length === 0 && (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <Flag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-gray-600 font-medium">No markets found</h3>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
        
        {/* Regulator Information Modal */}
        {selectedRegulator && showRegulatorInfo && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              {regulators.filter(r => r.id === selectedRegulator).map(regulator => (
                <div key={regulator.id}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{regulator.name}</h3>
                    <button
                      onClick={() => setShowRegulatorInfo(false)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-600">{regulator.country} ({regulator.region})</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-medium text-gray-800 mb-2">RTP Requirements</h4>
                      <div className="space-y-1">
                        <p className="text-gray-600">
                          Minimum: <span className={`font-medium ${getRtpColorClass(regulator.requirements.rtp.min)}`}>{regulator.requirements.rtp.min}%</span>
                        </p>
                        <p className="text-gray-600">
                          Recommended: <span className={`font-medium ${getRtpColorClass(regulator.requirements.rtp.recommended)}`}>{regulator.requirements.rtp.recommended}%</span>
                        </p>
                        <p className="text-gray-600">
                          Tolerance: <span className="font-medium">{regulator.requirements.rtpTolerance}%</span>
                        </p>
                        {regulator.requirements.maxWin && (
                          <p className="text-gray-600">
                            Max Win Cap: <span className="font-medium">{regulator.requirements.maxWin.toLocaleString()}x</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-2">Processing Details</h4>
                      <div className="space-y-1">
                        <p className="text-gray-600">
                          Processing Time: <span className="font-medium">{regulator.processingTime}</span>
                        </p>
                        {regulator.initialFee && (
                          <p className="text-gray-600">
                            Initial Fee: <span className="font-medium">${regulator.initialFee.toLocaleString()}</span>
                          </p>
                        )}
                        {regulator.annualFee && (
                          <p className="text-gray-600">
                            Annual Fee: <span className="font-medium">${regulator.annualFee.toLocaleString()}</span>
                          </p>
                        )}
                        <p className="text-gray-600">
                          Supported Currencies: <span className="font-medium">{regulator.currencies.join(', ')}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Required Documentation</h4>
                      <ul className="space-y-1 ml-4 list-disc text-gray-600">
                        {regulator.requirements.reportingRequirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {regulator.requirements.specialRequirements && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Special Requirements</h4>
                        <ul className="space-y-1 ml-4 list-disc text-gray-600">
                          {regulator.requirements.specialRequirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Recommended Certification Providers</h4>
                      <div className="flex flex-wrap gap-2">
                        {regulator.recommendedCertifiers.map(certifierId => {
                          const provider = certificationProviders.find(p => p.id === certifierId);
                          return provider && (
                            <span key={certifierId} className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {provider.name.split(' ')[0]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  {provider.specialties.length > 3 && (
                    <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                      +{provider.specialties.length - 3} more
                    </span>
                  )}
                </div>
                
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-1">Market coverage highlights:</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.markets.slice(0, 3).map((market, idx) => (
                      <span key={idx} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {market.split(' ')[0]}
                      </span>
                    ))}
                    {provider.markets.length > 3 && (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{provider.markets.length - 3} more
                      </span>
                    )}
                  </div>
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
            
            <div className="flex space-x-3">
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
              
              <button
                onClick={goToNextStep}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </section>
      )}
      
      {/* Certification Process */}
      <section className="bg-white/50 p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Certification Process</h3>
          <button
            onClick={() => setShowRequirements(!showRequirements)}
            className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center"
          >
            {showRequirements ? "Hide Details" : "Show Details"}
            {showRequirements ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3 flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Select Markets & Certification Provider</h4>
              <p className="text-gray-600 mt-1">Choose target markets and a reputable laboratory with appropriate coverage.</p>
              {showRequirements && (
                <ul className="mt-2 text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Consider market size, popularity, and regulatory complexity</li>
                  <li>Select a provider with specialty in your target regions</li>
                  <li>Check that your game's RTP meets minimum requirements</li>
                </ul>
              )}
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3 flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Prepare Documentation</h4>
              <p className="text-gray-600 mt-1">Compile game rules, math models, RNG information, and technical specifications.</p>
              {showRequirements && (
                <ul className="mt-2 text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Detailed game rules and paytables</li>
                  <li>Mathematical model with return-to-player (RTP) calculations</li>
                  <li>Random number generation (RNG) documentation</li>
                  <li>Technical implementation details</li>
                  <li>Game functionality descriptions</li>
                  <li>Bonus feature explanations</li>
                </ul>
              )}
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3 flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Submit for Testing</h4>
              <p className="text-gray-600 mt-1">The laboratory will conduct testing against regulatory requirements for each target market.</p>
              {showRequirements && (
                <ul className="mt-2 text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>RNG testing for statistical randomness</li>
                  <li>Verification of theoretical and actual RTP</li>
                  <li>Game logic validation</li>
                  <li>Feature functionality testing</li>
                  <li>Compliance with specific jurisdictional requirements</li>
                  <li>Security and robustness checks</li>
                </ul>
              )}
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3 flex-shrink-0">
              4
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Address Testing Feedback</h4>
              <p className="text-gray-600 mt-1">Make any necessary changes based on testing results and resubmit if required.</p>
              {showRequirements && (
                <ul className="mt-2 text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Review testing laboratory's feedback</li>
                  <li>Implement required changes to ensure compliance</li>
                  <li>Address any RTP, feature, or functionality issues</li>
                  <li>Update documentation to match implementation changes</li>
                  <li>Resubmit updated materials for verification</li>
                </ul>
              )}
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3 flex-shrink-0">
              5
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Obtain Certification</h4>
              <p className="text-gray-600 mt-1">Receive certification documents for submission to regulators in each jurisdiction.</p>
              {showRequirements && (
                <ul className="mt-2 text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Certification reports for each market</li>
                  <li>RNG certificates</li>
                  <li>Game fairness verification documents</li>
                  <li>Regulatory compliance statements</li>
                  <li>Supporting documentation for license applications</li>
                </ul>
              )}
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3 flex-shrink-0">
              6
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Market Submission</h4>
              <p className="text-gray-600 mt-1">Submit certification documentation to regulatory authorities and platform providers.</p>
              {showRequirements && (
                <ul className="mt-2 text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Regulatory body submissions for each jurisdiction</li>
                  <li>Operator integration approvals</li>
                  <li>Platform certification verification</li>
                  <li>Market-specific compliance declarations</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* General Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={goToPreviousStep}
          className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={goToNextStep}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          Next
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Certification;