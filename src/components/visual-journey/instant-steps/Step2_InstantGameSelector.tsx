import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store';
import { Gamepad2, Coins, Bomb, ArrowRight, Dna } from 'lucide-react';

const Step2_InstantGameSelector: React.FC = () => {
    const { nextStep, config, updateConfig } = useGameStore();
    const [selectedGame, setSelectedGame] = useState<string | null>(config?.instantGameType || null);

    const GAMES = [
        {
            id: 'plinko',
            title: 'Plinko',
            description: 'Classic pegboard game where balls drop into prize slots.',
            icon: Dna,
            color: 'from-pink-500 to-rose-500',
            bg: 'bg-pink-50 border-pink-200'
        },
        {
            id: 'coin_flip',
            title: 'Flip A Coin',
            description: 'Simple 50/50 chance game with instant results.',
            icon: Coins,
            color: 'from-yellow-400 to-orange-500',
            bg: 'bg-yellow-50 border-yellow-200'
        },
        {
            id: 'mines',
            title: 'Mines',
            description: 'Grid-based game combining risk and strategy.',
            icon: Bomb,
            color: 'from-slate-600 to-slate-800',
            bg: 'bg-slate-50 border-slate-200'
        }
    ];

    const handleSelect = (id: string) => {
        setSelectedGame(id);
        updateConfig({
            ...config,
            instantGameType: id
        });
        nextStep();
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Instant Game</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Select the mechanics for your new instant win game. Each type offers unique gameplay and engagement patterns.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {GAMES.map((game) => (
                    <motion.div
                        key={game.id}
                        whileHover={{ y: -5 }}
                        onClick={() => handleSelect(game.id)}
                        className={`
                            relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 border-2
                            ${selectedGame === game.id ? 'border-indigo-600 ring-4 ring-indigo-100 shadow-xl scale-105' : 'border-transparent shadow-md hover:shadow-lg'}
                        `}
                    >
                        {/* Background Overlay */}
                        <div className={`absolute inset-0 opacity-10 ${game.bg} z-0`} />

                        <div className="relative z-10 p-8 flex flex-col items-center text-center h-full bg-white">
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-6 shadow-lg`}>
                                <game.icon className="w-10 h-10 text-white" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-3">{game.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6">{game.description}</p>

                            <div className={`mt-auto w-full py-2 rounded-lg font-bold text-sm transition-colors ${selectedGame === game.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {selectedGame === game.id ? 'Selected' : 'Select'}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

        </div>
    );
};

export default Step2_InstantGameSelector;
