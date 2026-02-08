import React from 'react';
import { Languages, Globe, Check } from 'lucide-react';
import { useGameStore } from '../store';

const Localization: React.FC = () => {
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
  const localizationConfig = config.localization || {
    supportedLanguages: ['en'],
    defaultLanguage: 'en',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    defaultCurrency: 'USD',
    regionalRestrictions: []
  };

  const handleLocalizationChange = (key: string, value: any) => {
    updateConfig({
      localization: {
        ...localizationConfig,
        [key]: value
      }
    });
  };

  // Common languages with codes and names
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' }
  ];

  // Common currencies with symbols and names
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' }
  ];

  // Common market regions
  const marketRegions = [
    { code: 'global', name: 'Global' },
    { code: 'europe', name: 'Europe' },
    { code: 'northAmerica', name: 'North America' },
    { code: 'latam', name: 'Latin America' },
    { code: 'asia', name: 'Asia' },
    { code: 'africa', name: 'Africa' },
    { code: 'oceania', name: 'Oceania' }
  ];

  // Countries with restrictions
  const restrictedCountries = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷' }
  ];

  return (
    <div className="space-y-8">
      <section className="bg-white/50 p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-[#172B4D] mb-2 flex items-center">
          <Languages className="mr-2 w-6 h-6 text-[#0052CC]" />
          Localization & Market Settings
        </h2>
        <p className="text-[#5E6C84] mb-6">Configure languages, currencies, and regional settings</p>
        
        {/* Language Selection */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Supported Languages</h3>
          <p className="text-sm text-[#5E6C84] mb-4">
            Select which languages your slot game will support
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {languages.map((language) => {
              const isSelected = localizationConfig.supportedLanguages.includes(language.code);
              
              return (
                <div
                  key={language.code}
                  onClick={() => {
                    if (isSelected) {
                      // Don't allow deselecting the default language
                      if (language.code === localizationConfig.defaultLanguage) {
                        return;
                      }
                      
                      // Remove from selection
                      handleLocalizationChange(
                        'supportedLanguages',
                        localizationConfig.supportedLanguages.filter(code => code !== language.code)
                      );
                    } else {
                      // Add to selection
                      handleLocalizationChange(
                        'supportedLanguages',
                        [...localizationConfig.supportedLanguages, language.code]
                      );
                    }
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer flex items-center relative ${
                    isSelected
                      ? 'border-[#0052CC] bg-[#DEEBFF]'
                      : 'border-[#DFE1E6] hover:border-[#B3BAC5]'
                  }`}
                >
                  <span className="text-lg mr-3">{language.flag}</span>
                  <span className="font-medium">{language.name}</span>
                  
                  {isSelected && (
                    <div className="absolute right-2">
                      <Check className="w-4 h-4 text-[#0052CC]" />
                    </div>
                  )}
                  
                  {language.code === localizationConfig.defaultLanguage && (
                    <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-[#0052CC] text-white text-xs px-1.5 py-0.5 rounded-full">
                      Default
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <h4 className="font-medium text-[#172B4D] mb-2">Default Language</h4>
          <p className="text-sm text-[#5E6C84] mb-3">
            Select which language will be shown by default
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {localizationConfig.supportedLanguages.map((code) => {
              const language = languages.find(lang => lang.code === code);
              if (!language) return null;
              
              return (
                <button
                  key={code}
                  onClick={() => handleLocalizationChange('defaultLanguage', code)}
                  className={`px-3 py-2 rounded-lg flex items-center justify-center ${
                    localizationConfig.defaultLanguage === code
                      ? 'bg-[#0052CC] text-white'
                      : 'bg-[#F4F5F7] text-[#172B4D] hover:bg-[#DFE1E6]'
                  }`}
                >
                  <span className="mr-2">{language.flag}</span>
                  <span>{language.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Currency Selection */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Supported Currencies</h3>
          <p className="text-sm text-[#5E6C84] mb-4">
            Select which currencies your slot game will support
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {currencies.map((currency) => {
              const isSelected = localizationConfig.supportedCurrencies.includes(currency.code);
              
              return (
                <div
                  key={currency.code}
                  onClick={() => {
                    if (isSelected) {
                      // Don't allow deselecting the default currency
                      if (currency.code === localizationConfig.defaultCurrency) {
                        return;
                      }
                      
                      // Remove from selection
                      handleLocalizationChange(
                        'supportedCurrencies',
                        localizationConfig.supportedCurrencies.filter(code => code !== currency.code)
                      );
                    } else {
                      // Add to selection
                      handleLocalizationChange(
                        'supportedCurrencies',
                        [...localizationConfig.supportedCurrencies, currency.code]
                      );
                    }
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer flex items-center relative ${
                    isSelected
                      ? 'border-[#0052CC] bg-[#DEEBFF]'
                      : 'border-[#DFE1E6] hover:border-[#B3BAC5]'
                  }`}
                >
                  <span className="font-bold mr-3">{currency.symbol}</span>
                  <span className="font-medium">{currency.name}</span>
                  <span className="text-[#5E6C84] text-xs ml-1">({currency.code})</span>
                  
                  {isSelected && (
                    <div className="absolute right-2">
                      <Check className="w-4 h-4 text-[#0052CC]" />
                    </div>
                  )}
                  
                  {currency.code === localizationConfig.defaultCurrency && (
                    <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-[#0052CC] text-white text-xs px-1.5 py-0.5 rounded-full">
                      Default
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <h4 className="font-medium text-[#172B4D] mb-2">Default Currency</h4>
          <p className="text-sm text-[#5E6C84] mb-3">
            Select which currency will be shown by default
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {localizationConfig.supportedCurrencies.map((code) => {
              const currency = currencies.find(curr => curr.code === code);
              if (!currency) return null;
              
              return (
                <button
                  key={code}
                  onClick={() => handleLocalizationChange('defaultCurrency', code)}
                  className={`px-3 py-2 rounded-lg flex items-center justify-center ${
                    localizationConfig.defaultCurrency === code
                      ? 'bg-[#0052CC] text-white'
                      : 'bg-[#F4F5F7] text-[#172B4D] hover:bg-[#DFE1E6]'
                  }`}
                >
                  <span className="mr-2">{currency.symbol}</span>
                  <span>{currency.code}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Regional Restrictions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Regional Restrictions</h3>
          <p className="text-sm text-[#5E6C84] mb-4">
            Select countries where your slot game should not be available
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {restrictedCountries.map((country) => {
              const isRestricted = localizationConfig.regionalRestrictions.includes(country.code);
              
              return (
                <div
                  key={country.code}
                  onClick={() => {
                    if (isRestricted) {
                      // Remove restriction
                      handleLocalizationChange(
                        'regionalRestrictions',
                        localizationConfig.regionalRestrictions.filter(code => code !== country.code)
                      );
                    } else {
                      // Add restriction
                      handleLocalizationChange(
                        'regionalRestrictions',
                        [...localizationConfig.regionalRestrictions, country.code]
                      );
                    }
                  }}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center ${
                    isRestricted
                      ? 'border-red-300 bg-red-50 text-red-600'
                      : 'border-[#DFE1E6] hover:border-[#B3BAC5]'
                  }`}
                >
                  <span className="text-lg mr-3">{country.flag}</span>
                  <span className="font-medium">{country.name}</span>
                  
                  {isRestricted && (
                    <div className="ml-auto px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
                      Restricted
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Target Markets */}
        <div>
          <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Target Markets</h3>
          <p className="text-sm text-[#5E6C84] mb-4">
            Select primary target markets for your slot game
          </p>
          
          <div className="flex flex-wrap gap-3">
            {marketRegions.map((region) => (
              <button
                key={region.code}
                onClick={() => {
                  // This would later be integrated with certification.targetMarkets
                  console.log(`Selected market: ${region.name}`);
                }}
                className="px-4 py-2 rounded-lg bg-[#F4F5F7] text-[#172B4D] hover:bg-[#DFE1E6] flex items-center"
              >
                <Globe className="w-4 h-4 mr-2" />
                <span>{region.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Navigation buttons */}
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
    </div>
  );
};

export default Localization;