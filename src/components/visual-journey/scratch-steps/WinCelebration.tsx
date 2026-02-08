import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WinCelebrationProps {
    amount: number;
    bet: number;
    currency?: string;
}

export const WinCelebration: React.FC<WinCelebrationProps> = ({ amount, bet, currency = '€' }) => {
    const [displayAmount, setDisplayAmount] = useState(0);

    const multiplier = bet > 0 ? amount / bet : 0;

    // Determine Label & Style based on multiplier (Hacksaw Logic)
    let label = "WIN";
    let gradient = "from-yellow-300 via-yellow-500 to-yellow-700";
    let scaleAnim = [0.5, 1.2, 1];

    if (multiplier >= 100) {
        label = "MEGA WIN";
        gradient = "from-red-500 via-purple-500 to-yellow-500";
        scaleAnim = [0.2, 1.5, 1]; // More dramatic pop
    } else if (multiplier >= 10) {
        label = "BIG WIN";
        gradient = "from-yellow-200 via-orange-400 to-yellow-600";
        scaleAnim = [0.4, 1.3, 1];
    }

    // Count Up Effect
    useEffect(() => {
        let start = 0;
        const end = amount;
        if (start === end) return;

        // Duration based on amount size, but capped for UX
        const duration = multiplier > 10 ? 3000 : 1500; // Longer for big wins
        const startTime = Date.now();

        const timer = setInterval(() => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const current = start + (end - start) * ease;
            setDisplayAmount(current);

            if (progress >= 1) clearInterval(timer);
        }, 16);

        return () => clearInterval(timer);
    }, [amount, multiplier]);

    return (
        <AnimatePresence>
            {amount > 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{
                            scale: scaleAnim,
                            opacity: 1,
                            transition: {
                                duration: 0.6,
                                ease: "backOut"
                            }
                        }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        className="flex flex-col items-center drop-shadow-2xl"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                textShadow: [
                                    "0px 0px 20px rgba(255,215,0,0.5)",
                                    "0px 0px 40px rgba(255,215,0,0.8)",
                                    "0px 0px 20px rgba(255,215,0,0.5)"
                                ]
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="relative"
                        >
                            {/* Stroke/Outline Text Effect */}
                            <h1 className="text-[80px] md:text-[100px] font-black italic tracking-tighter text-transparent whitespace-nowrap"
                                style={{
                                    WebkitTextStroke: '3px white', // White stroke
                                    fontFamily: 'Impact, sans-serif' // Or generic bold font
                                }}
                            >
                                {label}
                            </h1>
                            <div className={`absolute top-0 left-0 w-full h-full text-[80px] md:text-[100px] font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${gradient} whitespace-nowrap`}
                                style={{ fontFamily: 'Impact, sans-serif' }}
                            >
                                {label}
                            </div>
                        </motion.div>

                        <motion.div
                            className="bg-black/50 backdrop-blur-md px-12 py-4 rounded-full border-2 border-yellow-500/50 shadow-2xl mt-[-10px]"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className="text-4xl md:text-7xl font-bold text-white font-mono tracking-wide drop-shadow-md">
                                {currency}{displayAmount.toFixed(2)}
                            </span>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
