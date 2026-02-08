
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import Sidebar from './components/Sidebar';
import Workshop from './pages/Workshop';
import Inspector from './pages/Inspector';
import StudioManager from './pages/StudioManager';
import { DollarSign, Activity, Users, Gamepad2, TrendingUp, AlertCircle } from 'lucide-react';

const BackofficeDashboard: React.FC = () => {
    const [activePage, setActivePage] = useState('dashboard');
    const [stats, setStats] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [playerStats, setPlayerStats] = useState<any[]>([]);
    const [gameStats, setGameStats] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        fetchOverview();
    }, []);

    // Fetch effect based on page
    useEffect(() => {
        if (activePage === 'dashboard') fetchOverview();
        if (activePage === 'players') fetchPlayers();
        if (activePage === 'games') fetchGames();
        if (activePage === 'audit') fetchAudit();
    }, [activePage]);

    const fetchOverview = async () => {
        try {
            const [finRes, anaRes] = await Promise.all([
                fetch('/api/rgs/financials'),
                fetch('/api/rgs/analytics/overview')
            ]);
            setStats(await finRes.json());
            setAnalytics(await anaRes.json());
        } catch (e) { console.error(e); }
    };

    const fetchPlayers = async () => {
        try {
            const res = await fetch('/api/rgs/analytics/players');
            setPlayerStats(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchGames = async () => {
        try {
            const res = await fetch('/api/rgs/analytics/games');
            setGameStats(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchAudit = async () => {
        try {
            const res = await fetch('/api/rgs/audit');
            setAuditLogs(await res.json());
        } catch (e) { console.error(e); }
    }

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <Sidebar activePage={activePage} onNavigate={setActivePage} />

            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 capitalize">{activePage.replace('-', ' ')}</h1>
                        <p className="text-slate-500">Real-time Operator Insights</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Environment</div>
                            <div className="text-sm font-bold text-slate-800">Production (GLI)</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
                        </div>
                    </div>
                </header>

                {/* --- DASHBOARD VIEW --- */}
                {activePage === 'dashboard' && stats && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <KPI value={`$${stats.totalBet.toFixed(2)}`} label="Total Handle (GGR)" icon={<DollarSign />} color="blue" />
                            <KPI value={`$${stats.netGamingRevenue.toFixed(2)}`} label="NGR" icon={<TrendingUp />} color="emerald" />
                            <KPI value={`${(stats.rtp * 100).toFixed(1)}%`} label="RTP (Actual)" icon={<Activity />} color={stats.rtp > 1 ? 'red' : 'purple'} />
                            <KPI value={stats.rounds} label="Total Rounds" icon={<Gamepad2 />} color="slate" />
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-6">Hourly Activity (Bets vs Wins)</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analytics?.chartData || []}>
                                            <defs>
                                                <linearGradient id="colorBets" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorWins" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                            <Area type="monotone" dataKey="Bets" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBets)" strokeWidth={3} />
                                            <Area type="monotone" dataKey="GGR" stroke="#10b981" fillOpacity={1} fill="url(#colorWins)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-4">Live Activity Feed</h3>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                P{i}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-slate-700">Player_{100 + i}</div>
                                                <div className="text-xs text-slate-400">Just won $10.00</div>
                                            </div>
                                            <span className="text-xs font-mono text-emerald-600">+$10.00</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* --- INSPECTOR VIEW --- */}
                {activePage === 'inspector' && <Inspector />}

                {/* --- STUDIOS VIEW --- */}
                {activePage === 'studios' && <StudioManager />}

                {/* --- WORKSHOP VIEW --- */}
                {activePage === 'workshop' && <Workshop />}

                {/* --- GAMES VIEW --- */}
                {activePage === 'games' && (
                    <div className="grid grid-cols-1 gap-4">
                        {gameStats.map((game, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4 min-w-[300px]">
                                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${game.rounds > 0 ? 'bg-blue-50' : 'bg-slate-100'}`}>
                                        <Gamepad2 className={game.rounds > 0 ? 'text-blue-500' : 'text-slate-400'} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{game.name || game.id}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wide ${game.rounds > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {game.status || (game.rounds > 0 ? 'LIVE' : 'READY')}
                                            </span>
                                            <span className="text-xs text-slate-400 py-0.5">{game.publishedAt ? new Date(game.publishedAt).toLocaleDateString() : 'Unknown Date'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-8 text-right">
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase">Volume</div>
                                        <div className="font-mono text-lg text-slate-800">${game.totalBet?.toFixed(2) || '0.00'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase">RTP</div>
                                        <div className={`font-mono text-lg ${game.rtp > 1 ? 'text-red-500' : 'text-emerald-600'}`}>{(game.rtp * 100).toFixed(2)}%</div>
                                    </div>
                                    <div className="w-24">
                                        <div className="text-xs font-bold text-slate-400 uppercase">Hit Rate</div>
                                        <div className="font-mono text-lg text-slate-800">{(game.hitRate * 100).toFixed(1)}%</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* --- PLAYERS VIEW --- */}
                {activePage === 'players' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-4 font-bold text-xs uppercase text-slate-400">Player ID</th>
                                    <th className="p-4 font-bold text-xs uppercase text-slate-400 text-right">Volume</th>
                                    <th className="p-4 font-bold text-xs uppercase text-slate-400 text-right">GGR</th>
                                    <th className="p-4 font-bold text-xs uppercase text-slate-400 text-center">Rounds</th>
                                    <th className="p-4 font-bold text-xs uppercase text-slate-400">Last Active</th>
                                    <th className="p-4 font-bold text-xs uppercase text-slate-400 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {playerStats.map((p, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-700 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200" />
                                            {p.id}
                                        </td>
                                        <td className="p-4 text-right font-mono text-slate-600">${p.totalBet.toFixed(2)}</td>
                                        <td className={`p-4 text-right font-mono font-bold ${p.ngr > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            ${p.ngr.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center text-slate-600">{p.rounds}</td>
                                        <td className="p-4 text-slate-500 text-sm">{new Date(p.lastActive).toLocaleTimeString()}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${p.ngr > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {p.ngr > 0 ? 'CONTRIBUTOR' : 'WINNER'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- AUDIT VIEW --- */}
                {activePage === 'audit' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-4 font-bold text-xs uppercase text-slate-400">Time</th>
                                    <th className="p-4 font-bold text-xs uppercase text-slate-400">Action</th>
                                    <th className="p-4 font-bold text-xs uppercase text-slate-400">User</th>
                                    <th className="p-4 font-bold text-xs uppercase text-slate-400">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {auditLogs.map((log: any, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 text-gray-500 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-3 font-bold text-gray-800 text-sm">{log.action}</td>
                                        <td className="px-6 py-3 text-gray-600 text-sm">{log.user}</td>
                                        <td className="px-6 py-3 font-mono text-xs text-gray-500 truncate max-w-xs" title={JSON.stringify(log.details)}>
                                            {JSON.stringify(log.details)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </main>
        </div>
    );
};

const KPI = ({ label, value, icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between group hover:shadow-md transition-shadow">
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
            <h3 className="text-2xl font-black text-slate-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform`}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
    </div>
);

export default BackofficeDashboard;
