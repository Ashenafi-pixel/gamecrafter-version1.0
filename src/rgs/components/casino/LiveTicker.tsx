import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Bet {
    id: string;
    game: string;
    user: string;
    bet: number;
    multiplier: number;
    payout: number;
    isHighRoller?: boolean;
}

const GAMES = ["Sugar Rush", "Gates of Olympus", "Sweet Bonanza", "Plinko", "Wanted Dead or A Wild"];
const USERS = ["Felix", "Hidden", "CryptoKing", "Alice", "Bob", "ElonM", "Satoshi"];

const LiveTicker: React.FC = () => {
    const [bets, setBets] = useState<Bet[]>([]);

    // Simulate incoming bets
    useEffect(() => {
        const addBet = () => {
            const isHigh = Math.random() > 0.9;
            const betAmt = isHigh ? Math.random() * 500 : Math.random() * 50;
            const mult = Math.random() > 0.8 ? (Math.random() * 10) + 2 : (Math.random() * 2);

            const newBet: Bet = {
                id: Math.random().toString(36).substr(2, 9),
                game: GAMES[Math.floor(Math.random() * GAMES.length)],
                user: USERS[Math.floor(Math.random() * USERS.length)],
                bet: betAmt,
                multiplier: mult,
                payout: betAmt * mult,
                isHighRoller: isHigh
            };

            setBets(prev => [newBet, ...prev].slice(0, 8)); // Keep last 8
        };

        const interval = setInterval(addBet, 2500); // New bet every 2.5s
        addBet(); // Initial
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full bg-[#1a1d29] rounded-xl border border-[#2a2e3e] overflow-hidden flex flex-col h-full">
            <div className="p-3 border-b border-[#2a2e3e] flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Bets</span>
            </div>

            <div className="flex-1 overflow-hidden relative p-2">
                <div className="flex flex-col gap-1">
                    <AnimatePresence initial={false}>
                        {bets.map((bet) => (
                            <motion.div
                                key={bet.id}
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                className={`flex items-center justify-between p-2 rounded text-xs border border-transparent ${bet.isHighRoller ? 'bg-yellow-500/10 border-yellow-500/20' : 'hover:bg-[#212431]'}`}
                            >
                                <div className="flex flex-col">
                                    <span className={`font-bold ${bet.isHighRoller ? 'text-yellow-500' : 'text-slate-300'}`}>{bet.game}</span>
                                    <span className="text-slate-500">{bet.user}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`font-mono font-bold ${bet.payout > bet.bet ? 'text-green-400' : 'text-slate-400'}`}>
                                        {bet.payout > 0 ? '+' : ''}{bet.payout.toFixed(2)}
                                    </span>
                                    <span className="text-[10px] bg-[#2a2e3e] px-1 rounded text-slate-400">
                                        {bet.multiplier.toFixed(2)}x
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default LiveTicker;
