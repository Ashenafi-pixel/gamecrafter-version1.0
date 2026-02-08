import React from 'react';
import { Search, Bell, User, Menu, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface CasinoHeaderProps {
    toggleSidebar: () => void;
    balance?: number;
}

const CasinoHeader: React.FC<CasinoHeaderProps> = ({ toggleSidebar, balance = 5000.00 }) => {
    return (
        <header className="h-16 bg-[#1a1d29] border-b border-[#2a2e3e] flex items-center justify-between px-4 sticky top-0 z-[200]">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <Menu size={20} />
                </button>

                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center font-black text-slate-900 text-xl">
                        V
                    </div>
                    <span className="text-xl font-bold text-white hidden md:block tracking-tight">VEGAS<span className="text-green-500">PRIME</span></span>
                </div>
            </div>

            {/* Center Search - Hidden on mobile, visible on tablet+ */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search your game..."
                        className="w-full bg-[#0f121b] border border-[#2a2e3e] rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">

                {/* Wallet Display */}
                <div className="hidden md:flex items-center bg-[#0f121b] rounded-lg border border-[#2a2e3e] p-1 pr-4 gap-3">
                    <button className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-md transition-colors shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                        Wallet
                    </button>
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <span>$ {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Icons */}
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1a1d29]" />
                </button>

                <button className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700">
                    <User size={18} />
                </button>
            </div>
        </header>
    );
};

export default CasinoHeader;
