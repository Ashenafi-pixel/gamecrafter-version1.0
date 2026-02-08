import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedGameCrafterDashboard from './EnhancedGameCrafterDashboard';
import ConfigModal from './ConfigModal';
import { Sparkles } from 'lucide-react';
import { useGameStore } from '../store';

/**
 * Dashboard Component
 * 
 * This component always renders the Game Crafter Dashboard
 * regardless of the game state.
 */
const Dashboard: React.FC = () => {
  // UI States
  const [showConfig, setShowConfig] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  // Game store access (just for passing to the dashboard)
  const { setGameType, setStep } = useGameStore();
  
  // Auto-hide intro animation on mount
  useEffect(() => {
    // Auto-hide intro animation after 2.5 seconds
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  // Reset any game type when the dashboard loads to ensure we're showing the dashboard
  useEffect(() => {
    // Clear the game type to ensure we're in dashboard mode
    setGameType(null);
    setStep(0);
  }, [setGameType, setStep]);

  return (
    <>
      {/* Intro animation */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.1, 1],
                opacity: [0, 1, 1]
              }}
              exit={{ 
                scale: 0.9,
                opacity: 0
              }}
              transition={{ 
                duration: 2.5,
                times: [0, 0.6, 1]
              }}
              className="text-center"
            >
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotateZ: [0, 5, 0, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Sparkles className="w-24 h-24 uw:w-48 uw:h-48 text-red-500 mx-auto" />
              </motion.div>
              <motion.h1
                className="text-4xl uw:text-6xl font-bold text-white mt-6 tracking-tight"
                animate={{
                  letterSpacing: ["0.05em", "0.03em", "0.05em"]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                SlotAI Game Crafter
              </motion.h1>
              <motion.p
                className="text-xl uw:text-3xl text-blue-300 mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                Create amazing slot games with AI
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    
      <div className={showIntro ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
        <EnhancedGameCrafterDashboard 
          setGameType={setGameType} 
          setStep={setStep} 
          setShowConfig={setShowConfig}
        />
      </div>
      
      {showConfig && (
        <ConfigModal 
          isOpen={showConfig}
          onClose={() => setShowConfig(false)}
        />
      )}
    </>
  );
};

export default Dashboard;