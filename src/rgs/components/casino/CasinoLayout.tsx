import React, { useState } from 'react';
import CasinoSidebar from './CasinoSidebar';
import CasinoHeader from './CasinoHeader';

interface CasinoLayoutProps {
    children: React.ReactNode;
}

const CasinoLayout: React.FC<CasinoLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-[#0f121b] text-white font-sans flex text-sm">

            {/* Left Sidebar */}
            <CasinoSidebar
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* Main Column */}
            <div className="flex-1 flex flex-col min-w-0">
                <CasinoHeader
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />

                {/* Content Scroll Area */}
                <main className="flex-1 overflow-y-auto p-0 relative">
                    {children}
                </main>
            </div>

        </div>
    );
};

export default CasinoLayout;
