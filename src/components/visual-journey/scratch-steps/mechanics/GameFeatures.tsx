import React from 'react';
import { useGameStore } from '../../../../store';
import { ScratchConfig, ScratchFeatureKey } from '../../../../types';
import { motion } from 'framer-motion';
import { Zap, Repeat, Gift, LucideIcon } from 'lucide-react';

const FEATURE_CARDS: Array<{
    id: ScratchFeatureKey;
    title: string;
    icon: LucideIcon;
    description: string;
    color: string;
    gradient: string;
    shadow: string;
}> = [
        {
            id: 'multipliers',
            title: 'Multipliers',
            icon: Zap,
            description: 'Randomly boost wins by 2x, 5x, or 10x.',
            color: 'text-amber-600',
            gradient: 'from-amber-50 to-amber-100',
            shadow: 'shadow-amber-200'
        },

        {
            id: 'secondChance',
            title: 'Second Chance',
            icon: Repeat,
            description: 'Reshuffle or extra reveal on close calls.',
            color: 'text-emerald-600',
            gradient: 'from-emerald-50 to-emerald-100',
            shadow: 'shadow-emerald-200'
        },
        {
            id: 'nearMiss',
            title: 'Near Miss',
            icon: Gift,
            description: 'Tease the player with close calls to drive engagement.',
            color: 'text-blue-600',
            gradient: 'from-blue-50 to-blue-100',
            shadow: 'shadow-blue-200'
        }
    ];

const Step4_ScratchMechanics: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const currentFeatures = config.scratch?.features || {};

    const toggleFeature = (featureId: ScratchFeatureKey) => {
        const feature = currentFeatures[featureId];
        const isEnabled = feature?.enabled ?? false;

        updateConfig({
            scratch: {
                ...config.scratch,
                features: {
                    ...currentFeatures,
                    [featureId]: {
                        ...feature,
                        enabled: !isEnabled,
                        // Set default values if enabling for first time
                        ...(!isEnabled && featureId === 'multipliers' ? { values: [2, 5, 10] } : {})
                    }
                }
            } as ScratchConfig
        });
    };

    return (
        <div className="flex flex-col items-center justify-start p-2 w-full max-w-4xl mx-auto h-full overflow-y-auto">

            {/* Header */}
            <div className="text-center py-2 z-10 w-full mb-2">
                <h2 className="text-base font-black text-slate-800 tracking-tight">
                    Bonus Features
                </h2>
                <p className="text-slate-500 font-medium max-w-lg mx-auto text-xs">
                    Enhance gameplay with special modifiers.
                </p>
            </div>

            <div className="w-full flex flex-col gap-2 pb-10">
                {FEATURE_CARDS.map((feature, index) => {
                    const isEnabled = currentFeatures[feature.id]?.enabled ?? false;
                    const Icon = feature.icon;

                    return (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`
                                relative w-full rounded-xl transition-all duration-300 overflow-hidden
                                ${isEnabled
                                    ? `bg-gradient-to-r ${feature.gradient} shadow-sm border-transparent ring-1 ring-black/5`
                                    : 'bg-white border border-gray-100 hover:border-gray-200'
                                }
                            `}
                        >
                            <div className="flex items-center p-2 gap-3 h-full min-h-[50px]">
                                {/* Icon */}
                                <div className={`
                                    flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                    ${isEnabled ? 'bg-white shadow-sm' : 'bg-gray-50 text-gray-300'}
                                `}>
                                    <Icon size={16} className={isEnabled ? feature.color : ''} />
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h3 className={`text-sm font-bold truncate ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {feature.title}
                                    </h3>
                                    <p className={`text-[10px] truncate ${isEnabled ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {feature.description}
                                    </p>
                                </div>

                                {/* Toggle Switch */}
                                <div
                                    onClick={() => toggleFeature(feature.id)}
                                    className={`
                                        flex-shrink-0 w-10 h-6 rounded-full p-1 transition-colors duration-300 cursor-pointer flex items-center
                                        ${isEnabled ? 'bg-green-500' : 'bg-gray-200 hover:bg-gray-300'}
                                    `}
                                >
                                    <motion.div
                                        className="w-4 h-4 rounded-full bg-white shadow-sm"
                                        animate={{ x: isEnabled ? 16 : 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                </div>
                            </div>

                            {/* MULTIPLIER CONTROLS - Moved Below Main Row */}
                            {isEnabled && feature.id === 'multipliers' && (
                                <div className="px-3 pb-3 pt-0 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex flex-wrap gap-1.5 ml-11">
                                        {[2, 3, 5, 10, 20, 50].map(val => {
                                            const isActive = (currentFeatures.multipliers?.values || []).includes(val);
                                            return (
                                                <button
                                                    key={val}
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent toggling parent
                                                        const currentVals = currentFeatures.multipliers?.values || [];
                                                        const newVals = isActive ? currentVals.filter(v => v !== val) : [...currentVals, val];
                                                        updateConfig({
                                                            scratch: {
                                                                ...config.scratch,
                                                                features: {
                                                                    ...currentFeatures,
                                                                    multipliers: { ...currentFeatures.multipliers, values: newVals }
                                                                }
                                                            } as ScratchConfig
                                                        });
                                                    }}
                                                    className={`
                                                        px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center justify-center
                                                        ${isActive
                                                            ? 'bg-amber-500 text-white shadow-sm scale-105'
                                                            : 'bg-white/60 text-gray-500 hover:bg-white border border-transparent hover:border-amber-200'
                                                        }
                                                    `}
                                                >
                                                    {val}x
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Step4_ScratchMechanics;
