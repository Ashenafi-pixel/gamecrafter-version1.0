import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store';
import { Settings, Dna, Bomb, Coins, Eye } from 'lucide-react';
import PlinkoPreview from './preview/PlinkoPreview';

const Step3_InstantMechanics: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const gameType = config.instantGameType || 'plinko';

    // Local State for Instant Game Configs
    const [plinkoConfig, setPlinkoConfig] = useState(() => {
        const saved: any = config.instantGameConfig?.plinko || {};
        const defaults = {
            rows: 16,
            risk: 'medium',
            gravity: 1.2,
            ballSize: 6,
            holeSize: 14,
            visuals: {
                threeDBall: true,
                showHole: true,
                ballColor: '#ff0055',
                pegColor: '#ffffff',
                pegGlow: true,
                bucketColor: '#3b82f6',
                bucketTheme: 'classic',
                bucketShape: 'standard',
                backgroundColor: '#0f172a',
                ...saved.visuals
            }
        };
        return { ...defaults, ...saved, visuals: { ...defaults.visuals, ...(saved.visuals || {}) } };
    });

    const [minesConfig, setMinesConfig] = useState(() => {
        const saved: any = config.instantGameConfig?.mines || {};
        const defaults = { gridSize: 5, mineCount: 3 };
        return { ...defaults, ...saved };
    });

    const [coinConfig, setCoinConfig] = useState(() => {
        const saved: any = config.instantGameConfig?.coin || {};
        const defaults = { theme: 'gold', side: 'heads' };
        // Type assertion to fix 'string' vs union type issue if saved.side comes as string
        return { ...defaults, ...saved } as { theme: string; side: 'heads' | 'tails' };
    });

    // --- GAME LOGIC STATE ---
    const [balance, setBalance] = useState(1000);
    const [lastWin, setLastWin] = useState(0);

    // Mines State
    const [minesGameState, setMinesGameState] = useState<'idle' | 'playing' | 'cashed_out' | 'exploded'>('idle');
    const [minesGrid, setMinesGrid] = useState<{ revealed: boolean, isMine: boolean }[]>([]);

    // Coin State
    const [coinFlipping, setCoinFlipping] = useState(false);
    const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);

    // Sync to global config on change
    useEffect(() => {
        updateConfig({
            ...config,
            instantGameConfig: {
                plinko: plinkoConfig,
                mines: minesConfig,
                coin: coinConfig
            }
        });
    }, [plinkoConfig, minesConfig, coinConfig, gameType]);

    // --- PLINKO PHYSICS SETUP (Moved to PlinkoPreview) ---
    // We keep state synchronisation here if needed, but the physics engine is now self-contained.

    // --- RENDERERS ---

    const renderPlinko = () => {
        return (
            <div className="grid grid-cols-2 h-full">
                {/* Controls */}
                <div className="space-y-8 pr-4">
                    <div className="bg-transparent p-6 h-[700px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-pink-500" /> Game Settings
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Rows ({plinkoConfig.rows})</label>
                                <input
                                    type="range"
                                    min="8" max="16"
                                    value={plinkoConfig.rows}
                                    onChange={(e) => setPlinkoConfig({ ...plinkoConfig, rows: parseInt(e.target.value) })}
                                    className="w-full accent-pink-500"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>8 (Low Risk)</span>
                                    <span>16 (High Volatility)</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gravity ({plinkoConfig.gravity.toFixed(1)})</label>
                                <input
                                    type="range"
                                    min="0.5" max="2.0" step="0.1"
                                    value={plinkoConfig.gravity}
                                    onChange={(e) => setPlinkoConfig({ ...plinkoConfig, gravity: parseFloat(e.target.value) })}
                                    className="w-full accent-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ball Size ({plinkoConfig.ballSize}px)</label>
                                <input
                                    type="range"
                                    min="4" max="10" step="0.5"
                                    value={plinkoConfig.ballSize}
                                    onChange={(e) => setPlinkoConfig({ ...plinkoConfig, ballSize: parseFloat(e.target.value) })}
                                    className="w-full accent-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hole Size ({plinkoConfig.holeSize}px)</label>
                                <input
                                    type="range"
                                    min="10" max="30" step="1"
                                    value={plinkoConfig.holeSize}
                                    onChange={(e) => setPlinkoConfig({ ...plinkoConfig, holeSize: parseFloat(e.target.value) })}
                                    className="w-full accent-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                                <div className="flex p-1 bg-gray-100 rounded-lg">
                                    {['low', 'medium', 'high'].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setPlinkoConfig({ ...plinkoConfig, risk: r })}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all ${plinkoConfig.risk === r ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Visual Toggles */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> Visual Options
                                </label>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={plinkoConfig.visuals?.threeDBall ?? true}
                                            onChange={(e) => setPlinkoConfig({ ...plinkoConfig, visuals: { ...plinkoConfig.visuals, threeDBall: e.target.checked } })}
                                            className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                        />
                                        <span className="text-sm text-gray-700">3D Ball</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={plinkoConfig.visuals?.showHole ?? true}
                                            onChange={(e) => setPlinkoConfig({ ...plinkoConfig, visuals: { ...plinkoConfig.visuals, showHole: e.target.checked } })}
                                            className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                        />
                                        <span className="text-sm text-gray-700">Hole</span>
                                    </label>
                                </div>
                            </div>


                        </div>
                    </div>
                </div>

                {/* Physics Preview */}
                <div className="h-full min-w-0 relative">
                    <PlinkoPreview
                        rows={plinkoConfig.rows}
                        risk={plinkoConfig.risk}
                        gravity={plinkoConfig.gravity}
                        ballSize={plinkoConfig.ballSize}
                        holeSize={plinkoConfig.holeSize}
                        visuals={plinkoConfig.visuals}
                        interactive={true}
                        balance={balance}
                        onBet={(amount) => {
                            if (balance >= amount) {
                                setBalance(prev => prev - amount);
                            }
                        }}
                        onWin={(multiplier) => {
                            // Calculate win based on LAST bet? 
                            // For simplicity in preview, use a fixed $10 reference or manage bet state in parent?
                            // Actually the preview uses internal bet Amount for display but doesn't pass it back onWin.
                            // onWin just passes multiplier.
                            // We should track the "current active bet" in parent if we want accurate win calc,
                            // but for previewing, assuming the $10 or the specific amount is tricky if multiple balls.
                            // Let's assume the win amount logic needs to be robust or just visual.
                            // Simplified: Just multiply multiplier by 10 for now to match prior logic, or we can improve this later.
                            const win = 10 * multiplier;
                            setBalance(prev => prev + win);
                            if (win > 10) setLastWin(win);
                        }}
                    />
                </div>
            </div>
        )
    };

    // --- MINES LOGIC ---
    const startMines = () => {
        if (balance < 10) return;
        setBalance(prev => prev - 10);
        setMinesGameState('playing');

        const size = minesConfig.gridSize * minesConfig.gridSize;
        const newGrid = Array(size).fill(null).map(() => ({ revealed: false, isMine: false }));

        let minesPlaced = 0;
        while (minesPlaced < minesConfig.mineCount) {
            const idx = Math.floor(Math.random() * size);
            if (!newGrid[idx].isMine) {
                newGrid[idx].isMine = true;
                minesPlaced++;
            }
        }
        setMinesGrid(newGrid);
    };

    const handleTileClick = (index: number) => {
        if (minesGameState !== 'playing') return;
        if (minesGrid[index].revealed) return;

        const newGrid = [...minesGrid];
        newGrid[index].revealed = true;
        setMinesGrid(newGrid);

        if (newGrid[index].isMine) {
            setMinesGameState('exploded');
            setMinesGrid(prev => prev.map(t => ({ ...t, revealed: true })));
        } else {
            // Safe
        }
    };

    const cashoutMines = () => {
        if (minesGameState !== 'playing') return;
        const revealedSafe = minesGrid.filter(t => t.revealed && !t.isMine).length;
        const win = 10 * (1 + (revealedSafe * 0.2));
        setBalance(prev => prev + win);
        setMinesGameState('cashed_out');
        setLastWin(win);
        setMinesGrid(prev => prev.map(t => ({ ...t, revealed: true })));
    };

    const renderMines = () => (
        <div className="grid grid-cols-2 h-full">
            <div className="space-y-8 pr-4">
                <div className="bg-transparent p-6 h-[700px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Bomb className="w-5 h-5 text-slate-500" /> Logic Config
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Grid Dimension</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[3, 5, 7, 9].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setMinesConfig({ ...minesConfig, gridSize: size })}
                                        disabled={minesGameState === 'playing'}
                                        className={`py-2 border rounded-lg font-mono text-sm disabled:opacity-50 ${minesConfig.gridSize === size ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300'}`}
                                    >
                                        {size}x{size}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mines Count: {minesConfig.mineCount}</label>
                            <input
                                type="range"
                                min="1" max={Math.floor(minesConfig.gridSize * minesConfig.gridSize * 0.8)}
                                value={minesConfig.mineCount}
                                disabled={minesGameState === 'playing'}
                                onChange={(e) => setMinesConfig({ ...minesConfig, mineCount: parseInt(e.target.value) })}
                                className="w-full accent-slate-600"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">Balance</span>
                                <span className="font-mono font-bold">${balance.toFixed(2)}</span>
                            </div>

                            {minesGameState === 'playing' ? (
                                <button
                                    onClick={cashoutMines}
                                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg"
                                >
                                    Cashout
                                </button>
                            ) : (
                                <button
                                    onClick={startMines}
                                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg"
                                >
                                    Start Game ($10)
                                </button>
                            )}

                            {minesGameState === 'exploded' && (
                                <div className="text-center mt-2 text-red-600 font-bold">Boom! Game Over</div>
                            )}
                            {minesGameState === 'cashed_out' && (
                                <div className="text-center mt-2 text-green-600 font-bold">+${lastWin.toFixed(2)}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-100 rounded-2xl p-8 flex items-center justify-center border-2 border-slate-200 border-dashed">
                <div
                    className="grid gap-2 relative"
                    style={{ gridTemplateColumns: `repeat(${minesConfig.gridSize}, minmax(0, 1fr))` }}
                >
                    {minesGameState !== 'idle' ? minesGrid.map((tile, i) => (
                        <div
                            key={i}
                            onClick={() => handleTileClick(i)}
                            className={`
                                w-12 h-12 rounded-lg transition-all duration-300 shadow-sm cursor-pointer flex items-center justify-center text-xl
                                ${tile.revealed
                                    ? (tile.isMine ? 'bg-red-500 scale-90' : 'bg-green-100 border-2 border-green-400')
                                    : 'bg-slate-300 hover:bg-slate-400'}
                            `}
                        >
                            {tile.revealed && (tile.isMine ? '💣' : '💎')}
                        </div>
                    )) : (
                        Array.from({ length: minesConfig.gridSize * minesConfig.gridSize }).map((_, i) => (
                            <div key={i} className="w-12 h-12 bg-slate-200 rounded-lg opacity-50" />
                        ))
                    )}

                    {minesGameState === 'idle' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-slate-500 font-medium bg-white/80 px-4 py-2 rounded-lg backdrop-blur-sm">Press Start to Play</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // --- COIN FLIP LOGIC ---
    const flipCoin = () => {
        if (coinFlipping || balance < 10) return;
        setBalance(prev => prev - 10);
        setCoinFlipping(true);
        setCoinResult(null);

        // Simple Random Result
        const result = Math.random() > 0.5 ? 'heads' : 'tails';

        setTimeout(() => {
            setCoinResult(result);
            setCoinFlipping(false);

            if (result === coinConfig.side) {
                const win = 10 * 1.96;
                setBalance(prev => prev + win);
                setLastWin(win);
            }
        }, 2000); // 2s animation
    };

    const getCoinColor = () => {
        switch (coinConfig.theme) {
            case 'silver': return 'from-gray-300 to-gray-500 border-gray-400 text-gray-800';
            case 'bronze': return 'from-orange-300 to-orange-600 border-orange-500 text-orange-900';
            case 'holographic': return 'from-blue-400 via-purple-400 to-pink-400 border-white text-white';
            default: return 'from-yellow-300 to-yellow-600 border-yellow-500 text-yellow-900'; // Gold
        }
    }

    const renderCoinFlip = () => (
        <div className="grid grid-cols-2 h-full">
            <div className="space-y-8 pr-4">
                <div className="bg-transparent p-6 h-[700px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-600" /> Bet Logic
                    </h3>

                    <div className="space-y-4 mb-6">
                        <label className="block text-sm font-medium text-gray-700">Choose Side</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setCoinConfig({ ...coinConfig, side: 'heads' })}
                                className={`flex-1 py-4 border-2 rounded-xl flex flex-col items-center gap-2 ${coinConfig.side === 'heads' ? 'border-yellow-500 bg-yellow-50 text-yellow-900' : 'border-gray-200 text-gray-500'}`}
                            >
                                <span className="text-2xl">♕</span> Heads
                            </button>
                            <button
                                onClick={() => setCoinConfig({ ...coinConfig, side: 'tails' })}
                                className={`flex-1 py-4 border-2 rounded-xl flex flex-col items-center gap-2 ${coinConfig.side === 'tails' ? 'border-yellow-500 bg-yellow-50 text-yellow-900' : 'border-gray-200 text-gray-500'}`}
                            >
                                <span className="text-2xl">1</span> Tails
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Coin Theme</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['gold', 'silver', 'bronze', 'holographic'].map(theme => (
                                <div
                                    key={theme}
                                    onClick={() => setCoinConfig({ ...coinConfig, theme })}
                                    className={`
                                    p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-all text-sm
                                    ${coinConfig.theme === theme ? 'border-yellow-500 bg-yellow-50' : 'border-transparent bg-gray-50 hover:bg-gray-100'}
                                `}
                                >
                                    <div className={`w-4 h-4 rounded-full ${theme === 'gold' ? 'bg-yellow-400' : theme === 'silver' ? 'bg-gray-300' : theme === 'bronze' ? 'bg-orange-300' : 'bg-gradient-to-r from-blue-400 to-purple-400'}`} />
                                    <span className="capitalize text-gray-700">{theme}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-600">Balance</span>
                            <span className="font-mono font-bold">${balance.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={flipCoin}
                            disabled={coinFlipping}
                            className="w-full py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors shadow-lg disabled:opacity-50"
                        >
                            {coinFlipping ? 'Flipping...' : 'Flip ($10)'}
                        </button>
                        {coinResult && !coinFlipping && (
                            <div className={`text-center mt-2 font-bold ${coinResult === coinConfig.side ? 'text-green-600' : 'text-gray-400'}`}>
                                Result: {coinResult.toUpperCase()} {coinResult === coinConfig.side && `(+$${lastWin.toFixed(2)})`}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden" style={{ perspective: '1000px' }}>
                <div
                    className={`
                    w-48 h-48 rounded-full border-4 flex items-center justify-center 
                    bg-gradient-to-b shadow-[0_0_50px_rgba(255,255,255,0.2)]
                    transition-all duration-[2000ms]
                    ${getCoinColor()}
                `}
                    style={{
                        transform: coinFlipping ? 'rotateX(1800deg)' : 'rotateX(0deg)',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    <span className="text-6xl font-black opacity-80" style={{ backfaceVisibility: 'hidden' }}>
                        {coinResult === 'heads' ? '♕' : coinResult === 'tails' ? '1' : '$'}
                    </span>
                    {/* Backface for more realism if needed, but omitted for now as it's just spinning fast */}
                </div>
                <p className="mt-8 text-white/30 text-xs font-mono tracking-widest uppercase">
                    PROBABILITY: 50% | PAYOUT: 1.96x
                </p>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col">
            <div className="mb-4 px-6 pt-6 flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 capitalize flex items-center gap-3">
                        {gameType === 'plinko' && <Dna className="text-pink-500" />}
                        {gameType === 'mines' && <Bomb className="text-slate-600" />}
                        {gameType === 'coin_flip' && <Coins className="text-yellow-500" />}
                        {gameType.replace('_', ' ')} Configuration
                        <span className="text-gray-400 font-light mx-2">-</span>
                    </h2>
                    <p className="text-gray-500 pt-2">Fine-tune the mechanics and visuals for your instant game.</p>
                </div>

            </div>

            <div className="flex-1 min-h-[700px]">
                {gameType === 'plinko' && renderPlinko()}
                {gameType === 'mines' && renderMines()}
                {gameType === 'coin_flip' && renderCoinFlip()}
            </div>
        </div>
    );
};

export default Step3_InstantMechanics;
