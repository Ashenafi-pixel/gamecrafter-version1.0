import React from 'react';
import { useGameStore } from '../../../store';
import { Users, MessageSquare, Trophy, MessageCircle } from 'lucide-react';

const Step3_CrashSocial: React.FC = () => {
    const { config, updateCrashConfig } = useGameStore();

    const socialConfig = config.crash?.social || {
        liveFeedEnabled: true,
        chatEnabled: true,
        leaderboardEnabled: true,
        fakePlayers: 50 // Number of simulated players
    };

    const updateSocial = (key: string, value: any) => {
        updateCrashConfig({
            social: {
                ...socialConfig,
                [key]: value
            }
        });
    };

    // Simulated Data for Preview
    const FAKE_BETS = [
        { user: 'CryptoKing', amount: 500, multiplier: 2.1, win: 1050 },
        { user: 'MoonWalker', amount: 100, multiplier: 1.5, win: 150 },
        { user: 'HODL_2024', amount: 50, multiplier: 0, win: 0 },
        { user: 'WhaleWatch', amount: 2500, multiplier: 3.5, win: 8750 },
    ];

    const FAKE_CHAT = [
        { user: 'Alice', msg: 'To the moon! 🚀' },
        { user: 'Bob', msg: 'Cashed out too early...' },
        { user: 'Charlie', msg: 'Who is holding for 10x?' },
    ];

    const economyConfig = config.crash?.economy || {
        rainEnabled: false,
        rainfrequency: 30, // minutes
        tournamentActive: false,
        tournamentTitle: 'Daily Race'
    };

    const updateEconomy = (key: string, value: any) => {
        updateCrashConfig({
            economy: {
                ...economyConfig,
                [key]: value
            }
        });
    };

    return (
        <div className="flex h-[calc(100vh-140px)]">
            {/* Left Panel: Configuration */}
            <div className="w-[400px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-6 scrollbar-thin">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Community & Economy</h2>
                        <p className="text-sm text-gray-500">Configure social engagement and retention tools.</p>
                    </div>

                    {/* Social Section */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Users size={16} className="text-blue-500" />
                            Engagement Settings
                        </h3>

                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <div>
                                <div className="text-sm font-medium text-gray-700">Live Bets Feed</div>
                                <div className="text-xs text-gray-500">Show real-time wagers</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={socialConfig.liveFeedEnabled}
                                onChange={(e) => updateSocial('liveFeedEnabled', e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                        </label>

                        {socialConfig.liveFeedEnabled && (
                            <div className="px-3">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Simulated Players ({socialConfig.fakePlayers})</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="500"
                                    step="10"
                                    value={socialConfig.fakePlayers}
                                    onChange={(e) => updateSocial('fakePlayers', parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        )}

                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <div>
                                <div className="text-sm font-medium text-gray-700">Live Chat</div>
                                <div className="text-xs text-gray-500">Enable player room chat</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={socialConfig.chatEnabled}
                                onChange={(e) => updateSocial('chatEnabled', e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <div>
                                <div className="text-sm font-medium text-gray-700">Leaderboards</div>
                                <div className="text-xs text-gray-500">Daily/Weekly top wins</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={socialConfig.leaderboardEnabled}
                                onChange={(e) => updateSocial('leaderboardEnabled', e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                        </label>
                    </section>

                    <div className="h-px bg-gray-200" />

                    {/* Economy Section */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Trophy size={16} className="text-amber-500" />
                            Retention Events
                        </h3>

                        <label className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-amber-200 text-amber-700 rounded">
                                    <MessageSquare size={14} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Chat Rain</div>
                                    <div className="text-xs text-gray-500">Random free bets</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={economyConfig.rainEnabled}
                                onChange={(e) => updateEconomy('rainEnabled', e.target.checked)}
                                className="h-4 w-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                            />
                        </label>

                        {economyConfig.rainEnabled && (
                            <div className="pl-4 ml-4 border-l-2 border-amber-200">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Frequency (Minutes)</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="120"
                                    value={economyConfig.rainfrequency}
                                    onChange={(e) => updateEconomy('rainfrequency', Number(e.target.value))}
                                    className="w-full text-sm border-gray-300 rounded-md"
                                />
                            </div>
                        )}

                        <label className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-indigo-200 text-indigo-700 rounded">
                                    <Trophy size={14} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Tournament</div>
                                    <div className="text-xs text-gray-500">Active competition</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={economyConfig.tournamentActive}
                                onChange={(e) => updateEconomy('tournamentActive', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                        </label>

                        {economyConfig.tournamentActive && (
                            <div className="pl-4 ml-4 border-l-2 border-indigo-200">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Event Title</label>
                                <input
                                    type="text"
                                    value={economyConfig.tournamentTitle}
                                    onChange={(e) => updateEconomy('tournamentTitle', e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md"
                                    placeholder="e.g. Daily Moon Race"
                                />
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* Right Panel: Preview */}
            < div className="flex-1 bg-gray-100 p-8 flex items-center justify-center" >
                <div className="bg-white rounded-2xl shadow-xl w-[900px] h-[600px] flex overflow-hidden border border-gray-200">

                    {/* Main Game Area (Placeholder) */}
                    <div className="flex-1 bg-gray-900 relative flex flex-col items-center justify-center border-r border-gray-800">
                        <div className="text-gray-500 font-mono text-sm mb-4">Game Canvas</div>
                        <div className="w-32 h-32 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🚀</span>
                        </div>

                        {/* Live Chat & Events */}
                        {socialConfig.chatEnabled && (
                            <div className="absolute bottom-4 left-4 w-64 bg-black/40 backdrop-blur-md rounded-lg p-2 text-white border border-white/10 flex flex-col gap-2">
                                {economyConfig.tournamentActive && (
                                    <div className="p-2 bg-indigo-600/80 rounded border border-indigo-400/30 flex items-center gap-2 animate-in slide-in-from-left">
                                        <Trophy size={14} className="text-yellow-300" />
                                        <div>
                                            <div className="text-xs font-bold text-white uppercase tracking-wider">{economyConfig.tournamentTitle || 'Tournament'}</div>
                                            <div className="text-[10px] text-indigo-100">Ends in 02:45:00</div>
                                        </div>
                                    </div>
                                )}

                                <div className="h-32 overflow-hidden flex flex-col justify-end space-y-2 text-xs opacity-80">
                                    <div className="text-gray-400"><span className="text-blue-400 font-bold">User123:</span> To the moon! 🚀</div>
                                    <div className="text-gray-400"><span className="text-green-400 font-bold">Winner:</span> Just cashed 12x!</div>
                                    {economyConfig.rainEnabled && (
                                        <div className="text-amber-300 font-bold animate-pulse flex items-center gap-1">
                                            <MessageSquare size={10} />
                                            System: It's Raining! 🌧️ Free bets dropped!
                                        </div>
                                    )}
                                </div>
                                <div className="mt-1 flex gap-1">
                                    <input type="text" placeholder="Type..." className="w-full bg-white/10 rounded px-2 py-1 text-xs border-none outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                            </div>
                        )}
                        {/* Live Feed Overlay (if enabled) */}
                        {socialConfig.liveFeedEnabled && (
                            <div className="absolute top-4 right-4 w-64 bg-black/60 backdrop-blur-md rounded-lg p-2 border border-white/10">
                                <div className="flex items-center gap-2 text-xs text-green-400 font-bold mb-2 uppercase tracking-wide">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    Live Bets ({socialConfig.fakePlayers})
                                </div>
                                <div className="space-y-1">
                                    {FAKE_BETS.map((bet, i) => (
                                        <div key={i} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0">
                                            <span className="text-gray-300">{bet.user}</span>
                                            <span className={bet.win > 0 ? 'text-green-400' : 'text-gray-500'}>
                                                {bet.win > 0 ? `+${bet.win}` : `-${bet.amount}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Chat & Leaderboard */}
                    {(socialConfig.chatEnabled || socialConfig.leaderboardEnabled) && (
                        <div className="w-72 bg-gray-800 flex flex-col border-l border-gray-700">
                            {/* Tabs */}
                            <div className="flex text-xs font-bold text-gray-400 border-b border-gray-700">
                                {socialConfig.chatEnabled && (
                                    <button className="flex-1 py-3 hover:bg-gray-700 hover:text-white transition-colors bg-gray-700/50 text-white border-b-2 border-indigo-500">
                                        Chat
                                    </button>
                                )}
                                {socialConfig.leaderboardEnabled && (
                                    <button className="flex-1 py-3 hover:bg-gray-700 hover:text-white transition-colors">
                                        Top Wins
                                    </button>
                                )}
                            </div>

                            {/* Chat Content */}
                            {socialConfig.chatEnabled && (
                                <div className="flex-1 flex flex-col">
                                    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                        {FAKE_CHAT.map((msg, i) => (
                                            <div key={i} className="text-xs">
                                                <span className="font-bold text-indigo-400 mr-2">{msg.user}:</span>
                                                <span className="text-gray-300">{msg.msg}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-2 border-t border-gray-700">
                                        <div className="bg-gray-900 rounded px-3 py-2 text-xs text-gray-500 flex justify-between items-center">
                                            <span>Type a message...</span>
                                            <MessageCircle size={14} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div >
        </div >
    );
};

export default Step3_CrashSocial;
