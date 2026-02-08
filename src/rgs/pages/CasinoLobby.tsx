
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Filter, Dice1 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Layout Components
import CasinoLayout from '../components/casino/CasinoLayout';
import HeroCarousel from '../components/casino/HeroCarousel';
import LiveTicker from '../components/casino/LiveTicker';

interface Game {
    id: string;
    display_name: string;
    studio_id?: string;
    config: any;
    status: string;
}

interface Studio {
    id: string;
    name: string;
    logo_url: string;
}

const CasinoLobby: React.FC = () => {
    const navigate = useNavigate();
    const [games, setGames] = useState<Game[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gamesRes, studiosRes] = await Promise.all([
                    fetch('/api/rgs/catalog'),
                    fetch('/api/rgs/studios')
                ]);

                if (gamesRes.ok) setGames(await gamesRes.json());
                if (studiosRes.ok) setStudios(await studiosRes.json());
            } catch (error) {
                console.error('Error fetching lobby data', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <CasinoLayout>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 p-6 max-w-[1920px] mx-auto">

                {/* Main Content Column */}
                <div className="xl:col-span-3 flex flex-col gap-8">

                    {/* Hero Section */}
                    <HeroCarousel />

                    {/* Quick Filters */}
                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
                        {['Lobby', 'Slots', 'Live Casino', 'New Releases', 'Bonus Buy', 'Table Games'].map((cat, i) => (
                            <button
                                key={cat}
                                className={`
                                    px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2
                                    ${i === 0 ? 'bg-white text-[#0f121b]' : 'bg-[#1a1d29] text-slate-400 hover:text-white hover:bg-[#2a2e3e]'}
                                `}
                            >
                                {i === 0 && <Dice1 size={16} />}
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Game Grid - New Releases */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <TrendingUp className="text-green-500" /> New Releases
                            </h2>
                            <button className="text-slate-400 text-sm font-bold hover:text-white transition-colors">View All</button>
                        </div>

                        {isLoading ? (
                            <div className="h-60 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {games.map((game, i) => (
                                    <motion.div
                                        key={game.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group relative aspect-[3/4] bg-[#1a1d29] rounded-xl overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-xl cursor-pointer"
                                        onClick={() => navigate(`/play/demo/${game.id}`)}
                                    >
                                        {/* Image */}
                                        {game.config?.marketing?.posterUrl ? (
                                            <img
                                                src={game.config.marketing.posterUrl}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                                alt={game.display_name}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2e3e] to-[#1a1d29] text-slate-600 font-black text-4xl">
                                                {game.display_name.charAt(0)}
                                            </div>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform">
                                            <h3 className="font-bold text-white text-sm truncate">{game.display_name}</h3>
                                            <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{studios.find(s => s.id === game.studio_id)?.name || 'SlotAI'}</span>
                                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-[#0f121b]">
                                                    <Play size={14} fill="currentColor" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* RTP Badge */}
                                        <div className="absolute top-2 right-2 bg-[#0f121b]/80 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-300">
                                            96.5%
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar / Ticker (Desktop Only) */}
                <div className="hidden xl:block xl:col-span-1 h-[calc(100vh-120px)] sticky top-6">
                    <LiveTicker />
                </div>

            </div>
        </CasinoLayout>
    );
};

export default CasinoLobby;
