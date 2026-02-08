import React, { useState } from 'react';
import { Search, CheckCircle, Shield, Database, LayoutGrid, Clock, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const Inspector: React.FC = () => {
    const [roundId, setRoundId] = useState('');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // History Mode State
    const [games, setGames] = useState<any[]>([]);
    const [selectedGameId, setSelectedGameId] = useState('');
    const [history, setHistory] = useState<any[]>([]);

    // Fetch Games on Mount
    React.useEffect(() => {
        fetch('/api/rgs/catalog').then(res => res.json()).then(setGames).catch(console.error);
    }, []);

    // Fetch History when Game Selected
    React.useEffect(() => {
        if (!selectedGameId) return;
        fetch(`/api/rgs/history?gameId=${selectedGameId}`)
            .then(res => res.json())
            .then(setHistory)
            .catch(console.error);
    }, [selectedGameId]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roundId.trim()) return;

        setLoading(true);
        setError('');
        setData(null);

        try {
            const res = await fetch(`/api/rgs/inspector/${roundId}`);
            if (!res.ok) throw new Error('Round not found');
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header / Search */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="text-indigo-600" />
                    Game Inspector <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">GLI-19 Certified Mode</span>
                </h2>
                <form onSubmit={handleSearch} className="flex flex-col gap-4">
                    {/* Game Selector Filter */}
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <select
                                value={selectedGameId}
                                onChange={e => setSelectedGameId(e.target.value)}
                                className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                            >
                                <option value="">Select Game to Filter History...</option>
                                {games.map(g => (
                                    <option key={g.id} value={g.id}>{g.display_name} ({g.id})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Or Enter specific Round ID (UUID)..."
                                value={roundId}
                                onChange={(e) => setRoundId(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
                            {loading ? 'Searching...' : 'Inspect Round'}
                        </button>
                    </div>
                </form>
                {error && <p className="text-red-500 mt-2 text-sm font-bold">{error}</p>}
            </div>

            {/* History Grid (Only if Game Selected and No specific Round Data shown yet) */}
            {!data && selectedGameId && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-4">Recent Rounds ({history.length})</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Round ID</th>
                                    <th className="px-4 py-3">Bet</th>
                                    <th className="px-4 py-3">Win</th>
                                    <th className="px-4 py-3">RTP</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((h: any) => (
                                    <tr key={h.roundId} className="border-b hover:bg-slate-50">
                                        <td className="px-4 py-3">{new Date(h.timestamp).toLocaleTimeString()}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{h.roundId.substring(0, 12)}...</td>
                                        <td className="px-4 py-3">${h.bet.toFixed(2)}</td>
                                        <td className={`px-4 py-3 font-bold ${h.win > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            ${h.win.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3">{h.bet > 0 ? (h.win / h.bet).toFixed(2) : '0.00'}x</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => { setRoundId(h.roundId);  /* Auto-trigger search is cleaner */ }}
                                                className="text-indigo-600 hover:text-indigo-900 font-bold text-xs"
                                            >
                                                Inspect
                                            </button>
                                            <span className="text-slate-300 mx-2">|</span>
                                            {/* Clicking copy just copies ID */}
                                            <button onClick={() => { navigator.clipboard.writeText(h.roundId); setRoundId(h.roundId); }} className="text-slate-500 hover:text-slate-700 text-xs">Copy ID</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Results */}
            {data && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                    {/* Top Row: Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full -mr-10 -mt-10"></div>
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Financial</h3>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-3xl font-black text-slate-800">${data.win.toFixed(2)}</div>
                                    <div className="text-sm font-bold text-emerald-600">WIN</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-slate-400">${data.bet.toFixed(2)}</div>
                                    <div className="text-xs text-slate-400">BET</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Session Info</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-slate-50 pb-1">
                                    <span className="text-slate-400 text-sm">Game ID</span>
                                    <span className="font-mono text-sm font-bold">{data.game_id}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-1">
                                    <span className="text-slate-400 text-sm">Player ID</span>
                                    <span className="font-mono text-sm">{data.player_id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Time</span>
                                    <span className="text-sm">{new Date(data.timestamp).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Fairness Proof</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-slate-50 pb-1">
                                    <span className="text-slate-400 text-sm">Type</span>
                                    <span className="font-bold text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                        {data.details.deckInfo === 'RNG' ? 'PROBABILISTIC (RNG)' : 'FINITE (DECK)'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-xs block mb-1">Server Seed (Hashed)</span>
                                    <code className="block bg-slate-50 p-1.5 rounded text-[10px] break-all text-slate-600 border border-slate-200">
                                        {data.details.serverSeed || 'N/A'}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Row: Visual Trace */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Visuals */}
                        <div className="bg-slate-900 rounded-xl p-6 shadow-lg text-white">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <LayoutGrid size={18} /> Visual Outcome Trace
                            </h3>

                            {data.details?.outcome?.revealMap ? (
                                <div className="grid grid-cols-3 gap-2 max-w-[300px] mx-auto">
                                    {data.details.outcome.revealMap.map((cell: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className={`aspect-square flex items-center justify-center rounded-lg border-2 ${cell.isWin ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-800 border-slate-700'
                                                }`}
                                        >
                                            <div className="text-center">
                                                <div className="text-xs opacity-50 mb-1">#{idx}</div>
                                                <div className="font-bold text-lg">{cell.value ? `$${cell.value}` : cell.symbol}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-500">
                                    No Visual Trace Available
                                </div>
                            )}
                        </div>

                        {/* JSON Dump */}
                        <div className="bg-white rounded-xl p-0 overflow-hidden border border-slate-200 flex flex-col">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-600 flex items-center gap-2">
                                <Database size={16} /> Raw Log Data
                            </div>
                            <div className="flex-1 overflow-auto max-h-[400px] p-4 bg-slate-50/50 custom-scrollbar">
                                <pre className="text-xs text-slate-600 font-mono">
                                    {JSON.stringify(data, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>

                </motion.div>
            )}
        </div>
    );
};

export default Inspector;
