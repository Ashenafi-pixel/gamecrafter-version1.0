import React from 'react';
import {
    Home,
    Dices,
    Trophy,
    Gamepad2,
    Tv,
    Star,
    Gift,
    Headphones,
    ChevronLeft,
    ChevronRight,
    Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CasinoSidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const CasinoSidebar: React.FC<CasinoSidebarProps> = ({ isOpen, toggleSidebar }) => {

    const menuItems = [
        { icon: Home, label: 'Lobby', active: true },
        { icon: Star, label: 'Favorites', active: false },
        { icon: Gamepad2, label: 'Slots', active: false },
        { icon: Tv, label: 'Live Casino', active: false },
        { icon: Dices, label: 'Table Games', active: false },
        { icon: Trophy, label: 'Sports', active: false, badge: 'LIVE' },
    ];

    const promoItems = [
        { icon: Gift, label: 'Promotions' },
        { icon: Flame, label: 'Challenges' },
        { icon: Headphones, label: 'Live Support' },
    ];

    return (
        <motion.aside
            initial={false}
            animate={{ width: isOpen ? 240 : 80 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-[#0f121b] border-r border-[#2a2e3e] h-screen sticky top-0 flex flex-col z-40 hidden md:flex"
        >
            {/* Menu List */}
            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-3 no-scrollbar">

                {/* Main Nav */}
                <div className="space-y-1">
                    {menuItems.map((item, idx) => (
                        <button
                            key={idx}
                            className={`
                w-full flex items-center gap-4 p-3 rounded-lg transition-all group relative
                ${item.active
                                    ? 'bg-[#1a1d29] text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-[#1a1d29]'}
              `}
                            title={!isOpen ? item.label : ''}
                        >
                            <item.icon size={20} className={`min-w-[20px] ${item.active ? 'text-green-500' : 'group-hover:text-white'}`} />

                            {isOpen && (
                                <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>
                            )}

                            {/* Badge */}
                            {isOpen && item.badge && (
                                <span className="ml-auto text-[10px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded animate-pulse">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="h-px bg-[#2a2e3e] my-2 mx-1" />

                {/* Promo Nav */}
                <div className="space-y-1">
                    {promoItems.map((item, idx) => (
                        <button
                            key={idx}
                            className="w-full flex items-center gap-4 p-3 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1d29] transition-all group"
                            title={!isOpen ? item.label : ''}
                        >
                            <item.icon size={20} className="min-w-[20px] group-hover:text-purple-400" />
                            {isOpen && <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>}
                        </button>
                    ))}
                </div>

            </div>

            {/* Footer Toggle */}
            <div className="p-4 border-t border-[#2a2e3e]">
                <button
                    onClick={toggleSidebar}
                    className="w-full flex items-center justify-center p-2 rounded-lg bg-[#1a1d29] text-slate-400 hover:text-white transition-colors"
                >
                    {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>

        </motion.aside>
    );
};

export default CasinoSidebar;
