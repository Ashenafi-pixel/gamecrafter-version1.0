import React from 'react';
import { useGameStore } from '../../../../store';
import { PieChart, Activity, AlertTriangle, ShieldCheck, Layers } from 'lucide-react';

const Step3_Tab_Math: React.FC = () => {
    const { config } = useGameStore();
    const prizes = config.scratch?.prizes || [];
    const mathMode = config.scratch?.math?.mathMode || 'POOL';

    // Default to 1M if not set
    const deckSize = config.scratch?.math?.totalTickets || 1000000;
    const ticketPrice = config.scratch?.math?.ticketPrice || 10;

    // --- Calculations ---

    let hitFrequency = 0;
    let rtp = 0;
    let totalWinningTickets = 0;
    let totalPayoutValue = 0;

    // losingTickets removed (unused)

    let totalPoolValue = 0;
    let estimatedRevenue = 0;

    if (mathMode === 'POOL') {
        // POOL MODE: Based on Deck Size & Ticket Counts
        totalWinningTickets = prizes.reduce((sum, p) => sum + p.weight, 0);
        totalPayoutValue = prizes.reduce((sum, p) => sum + (p.weight * p.payout), 0);
        // losingTickets calc removed

        hitFrequency = deckSize > 0 ? (totalWinningTickets / deckSize) * 100 : 0;
        rtp = deckSize > 0 ? (totalPayoutValue / deckSize) * 100 : 0;

        totalPoolValue = deckSize * ticketPrice;
        estimatedRevenue = totalPoolValue * (1 - (rtp / 100)); // House Edge
    } else {
        // UNLIMITED MODE: Based on Probability %
        // Hit Freq = Sum(Probabilities)
        hitFrequency = prizes.reduce((sum, p) => sum + (p.probability || 0), 0);

        // RTP = Sum(Prob * Payout) / 100 (since Prob is in %)
        rtp = prizes.reduce((sum, p) => sum + ((p.probability || 0) * p.payout), 0);
    }

    const averageWinValue = hitFrequency > 0 ? rtp / hitFrequency : 0; // xMult on average win

    // --- Safety Checks ---
    const isRtpTooHigh = rtp > 100;
    const isRtpSuspiciouslyHigh = rtp > 98 && rtp <= 100;
    const isErrorTickets = mathMode === 'POOL' ? totalWinningTickets > deckSize : hitFrequency > 100;

    // --- Variance ---
    let variance = 0;
    if (mathMode === 'POOL') {
        const ex = rtp / 100;
        const ex2 = prizes.reduce((sum, p) => {
            const prob = p.weight / deckSize;
            return sum + (prob * Math.pow(p.payout, 2));
        }, 0);
        variance = ex2 - (ex * ex);
    } else {
        const ex = rtp / 100;
        const ex2 = prizes.reduce((sum, p) => {
            const prob = (p.probability || 0) / 100;
            return sum + (prob * Math.pow(p.payout, 2));
        }, 0);
        variance = ex2 - (ex * ex);
    }

    // Map variance to label
    let volatilityLabel = "Low";
    let volatilityColor = "text-green-600";
    if (variance > 10) { volatilityLabel = "Medium"; volatilityColor = "text-yellow-600"; }
    if (variance > 40) { volatilityLabel = "High"; volatilityColor = "text-orange-600"; }
    if (variance > 100) { volatilityLabel = "Very High"; volatilityColor = "text-red-600"; }

    return (
        <div className="flex flex-col gap-2 h-full overflow-hidden p-1 w-full max-w-5xl mx-auto">

            {/* 1. COMPACT KPI STRIP */}
            <div className="flex gap-2 shrink-0 h-24">

                {/* RTP Card (Compact) */}
                <div className={`flex-1 p-2 rounded-lg border shadow-sm flex flex-col justify-between relative overflow-hidden transition-colors
                    ${isRtpTooHigh ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}
                `}>
                    <div className="flex items-center gap-1.5 text-gray-400 z-10">
                        <PieChart size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">RTP</span>
                    </div>
                    <div className="z-10 flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${isRtpTooHigh ? 'text-red-600' : 'text-blue-600'}`}>
                            {rtp.toFixed(2)}%
                        </span>
                        {!isRtpTooHigh && isRtpSuspiciouslyHigh && (
                            <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-1 rounded border border-yellow-100">HIGH RISK</span>
                        )}
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
                        <div
                            className={`h-full ${isRtpTooHigh ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(rtp, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Volatility Card (Compact) */}
                <div className="flex-1 bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <Activity size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Volatility</span>
                    </div>
                    <div>
                        <span className={`text-xl font-black ${volatilityColor}`}>
                            {volatilityLabel}
                        </span>
                        <div className="text-[9px] text-gray-400 flex justify-between mt-0.5">
                            <span>Var: {variance.toFixed(0)}</span>
                            <span>Avg: x{averageWinValue.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                {/* Deck Card (Compact) */}
                <div className="flex-[1.5] bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between group hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <Layers size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {mathMode === 'POOL' ? 'Pool Config' : 'Hit Frequency'}
                        </span>
                    </div>

                    {mathMode === 'POOL' ? (
                        <div className="flex items-end justify-between text-[10px] gap-2">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex gap-2">
                                    <span className="text-gray-400">Tickets:</span>
                                    <span className="font-bold text-gray-700">{deckSize.toLocaleString()}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-gray-400">Price:</span>
                                    <span className="font-bold text-gray-700">€{ticketPrice.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-gray-400 text-[9px]">Est. Profit</div>
                                <div className={`font-bold ${estimatedRevenue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {estimatedRevenue >= 0 ? '+' : ''}€{estimatedRevenue.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xl font-black text-purple-600">
                            {hitFrequency.toFixed(2)}%
                        </div>
                    )}
                </div>
            </div>

            {/* ERROR BANNER (Compact) */}
            {(isErrorTickets || (isRtpTooHigh && !isErrorTickets)) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-3 animate-pulse">
                    <AlertTriangle size={16} className="text-red-600" />
                    <div>
                        <h4 className="font-bold text-red-800 text-xs">Math Error</h4>
                        <p className="text-[10px] text-red-600 leading-tight">
                            {isErrorTickets
                                ? "Winning tickets exceed deck size."
                                : `RTP ${rtp.toFixed(1)}% is > 100%. House loses.`}
                        </p>
                    </div>
                </div>
            )}

            {/* Distribution Analysis (Compact) */}
            <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-3 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2 shrink-0">
                    <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${mathMode === 'POOL' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                        {mathMode === 'POOL' ? 'Card Distribution' : 'Weights'}
                    </h3>
                    <div className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                        <ShieldCheck size={12} className={isRtpTooHigh || isErrorTickets ? "text-gray-300" : "text-green-500"} />
                        <span>Mode: <strong className="text-gray-600">{mathMode}</strong></span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                    {prizes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50">
                            <Activity size={32} className="mb-2" />
                            <p className="text-xs">No Prizes Defined</p>
                        </div>
                    ) : (
                        <>
                            {/* Visual Bar (Mini) */}
                            <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-100 mb-2 shrink-0">
                                <div className={`${mathMode === 'POOL' ? 'bg-blue-500' : 'bg-purple-500'} h-full transition-all duration-700`}
                                    style={{ width: `${Math.min(hitFrequency, 100)}%` }} />
                                <div className="bg-gray-200 h-full" style={{ width: `${Math.max(0, 100 - hitFrequency)}%` }} />
                            </div>

                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-1 text-[9px] font-bold text-gray-400 uppercase border-b border-gray-100 pb-1 mb-1 sticky top-0 bg-white z-10">
                                <div className="col-span-4 pl-1">Tier</div>
                                <div className="col-span-2 text-right">Pay</div>
                                <div className="col-span-3 text-right">{mathMode === 'POOL' ? 'Count' : 'Prob'}</div>
                                <div className="col-span-3 text-right">Odds</div>
                            </div>

                            {prizes.sort((a, b) => b.payout - a.payout).map(p => {
                                let probability = 0;
                                let displayVal = "";
                                if (mathMode === 'POOL') {
                                    probability = p.weight / deckSize;
                                    displayVal = p.weight.toLocaleString();
                                } else {
                                    probability = (p.probability || 0) / 100;
                                    displayVal = `${(p.probability || 0).toFixed(2)}%`;
                                }
                                const oneIn = probability > 0 ? 1 / probability : 0;
                                const isInvalidCount = mathMode === 'POOL' && p.weight > deckSize;

                                return (
                                    <div key={p.id} className={`grid grid-cols-12 gap-1 items-center py-1 border-b border-gray-50 text-[10px] hover:bg-gray-50 transition-colors rounded px-1 ${isInvalidCount ? 'bg-red-50' : ''}`}>
                                        <div className="col-span-4 font-bold text-gray-700 truncate" title={p.name}>
                                            {p.name}
                                        </div>
                                        <div className="col-span-2 text-right font-mono text-green-600 font-bold">
                                            x{p.payout}
                                        </div>
                                        <div className={`col-span-3 text-right font-medium ${isInvalidCount ? 'text-red-600 font-black' : 'text-gray-600'}`}>
                                            {displayVal}
                                        </div>
                                        <div className="col-span-3 text-right text-gray-400">
                                            {oneIn > 1000 ? `${(oneIn / 1000).toFixed(1)}k` : oneIn.toFixed(0)}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Step3_Tab_Math;
