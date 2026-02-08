
import React from 'react';
import {
    LayoutDashboard, Users, Gamepad2,
    PieChart, Settings, LogOut, Shield, PenTool
} from 'lucide-react';

interface SidebarProps {
    activePage: string;
    onNavigate: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'inspector', label: 'Inspector', icon: <Shield size={20} /> }, // Phase 1: Inspector
        { id: 'studios', label: 'Studios', icon: <Users size={20} /> }, // New Studio Manager
        { id: 'workshop', label: 'Workshop', icon: <PenTool size={20} /> }, // New Item
        { id: 'games', label: 'Game Analysis', icon: <Gamepad2 size={20} /> },
        { id: 'players', label: 'Player Manager', icon: <Users size={20} /> },
        { id: 'reports', label: 'Financial Reports', icon: <PieChart size={20} /> },
        { id: 'audit', label: 'Audit Logs', icon: <Shield size={20} /> },
        // { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    ];

    return (
        <div className="w-64 bg-slate-900 text-white flex flex-col min-h-screen shadow-xl z-[190]">
            {/* Brand */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">R</div>
                <div>
                    <h2 className="font-bold text-lg">RGS Portal</h2>
                    <p className="text-xs text-slate-400">Operator Admin</p>
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${activePage === item.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors">
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
