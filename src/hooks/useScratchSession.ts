import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { ResolvedOutcome } from '../utils/math-engine/types';
import { LatamApiClient, extractSessionFromUrl, LatamSession } from '../utils/latam-api/scratchApiClient';

interface ScratchSessionOptions {
    onRoundComplete?: (outcome: ResolvedOutcome) => void;
}

export const useScratchSession = (options: ScratchSessionOptions = {}) => {
    const { config } = useGameStore();

    // --- State ---
    const [balance, setBalance] = useState(0); // Start at 0, fetch from API
    const [bet, setBet] = useState(config.scratch?.math?.ticketPrice || 1.0);
    const [win, setWin] = useState(0);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'revealed' | 'won'>('idle');
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [currentOutcome, setCurrentOutcome] = useState<ResolvedOutcome | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('');

    // --- API Refs ---
    const apiClient = useRef<LatamApiClient | null>(null);
    const currentRoundId = useRef<string | null>(null);

    // 1. Initialize API & Session
    useEffect(() => {
        const session = extractSessionFromUrl();
        if (session) {
            console.log("Latam Session Found:", session);
            apiClient.current = new LatamApiClient(session);

            // Initial Balance Check
            apiClient.current.getBalance().then(res => {
                if (res.balance !== undefined) setBalance(res.balance);
            }).catch(e => {
                console.error("Failed to fetch initial balance", e);
                setStatusMessage('Connection Failed');
            });

        } else {
            console.log("Running in DEMO mode (No Session)");
            setBalance(1000); // Demo balance
        }
    }, []);

    // 2. Generate Round (Math Logic)
    const generateRound = useCallback(async (isDemo = false) => {
        const payload = { config };
        try {
            // In a real RGS, checking the outcome would happen SERVER SIDE. 
            // Here we rely on the local/preview server to generate the math.
            const response = await fetch('http://localhost:3500/api/rgs/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Preview API Failed');
            const data = await response.json();

            if (data.success && data.outcome) {
                const outcome: ResolvedOutcome = data.outcome;
                setCurrentOutcome(outcome);
                if (options.onRoundComplete) {
                    options.onRoundComplete(outcome);
                }
                return outcome;
            }
        } catch (error) {
            console.error('Server Preview Failed', error);
            setStatusMessage('Game Logic Error');
            return null;
        }
    }, [config, options.onRoundComplete]);

    // 3. Buy Ticket (Async)
    const buyTicket = useCallback(async () => {
        // Prevent double buy
        if (gameState === 'playing') return false;

        // Generate Round ID for this play
        const roundId = `rnd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        currentRoundId.current = roundId;

        if (apiClient.current) {
            // --- REAL MODE ---
            try {
                const res = await apiClient.current.debit(bet, roundId);
                if (res.code === 0 || res.status === 'Success') {
                    // Debit Success
                    setBalance(res.balance || (balance - bet)); // Use server balance if available
                    setWin(0);
                    setGameState('playing');
                    await generateRound();
                    return true;
                } else {
                    setStatusMessage('Debit Failed: ' + (res.message || 'Unknown'));
                    return false;
                }
            } catch (e) {
                console.error("Debit Exception", e);
                setStatusMessage('Network Error');
                return false;
            }
        } else {
            // --- DEMO MODE ---
            if (balance >= bet) {
                setBalance(prev => prev - bet);
                setWin(0);
                setGameState('playing');
                await generateRound();
                return true;
            }
            return false; // Insufficient funds
        }
    }, [balance, bet, generateRound, gameState]);

    // 4. Resolve Outcome (Credit Win)
    const resolveRound = useCallback(async (isRevealed: boolean) => {
        if (isRevealed && gameState !== 'won' && gameState !== 'revealed') {
            if (currentOutcome?.isWin) {
                const winAmount = currentOutcome.finalPrize * bet;
                setWin(winAmount);
                setGameState('won');

                if (apiClient.current && currentRoundId.current) {
                    try {
                        // Send Credit to API
                        const res = await apiClient.current.credit(winAmount, currentRoundId.current, true);
                        if (res.balance !== undefined) {
                            setBalance(res.balance);
                        } else {
                            // Fallback optimistic update
                            setBalance(prev => prev + winAmount);
                        }
                    } catch (e) {
                        console.error("Credit Failed", e);
                        // Still show win state, but maybe warn?
                    }
                } else {
                    // Demo Mode
                    setBalance(prev => prev + winAmount);
                }

            } else {
                setGameState('revealed');
                // Optional: Send 0 win credit to close round if API requires it? 
                // Docs say: "Use win_amount = 0 for a loss" with status=completed.
                if (apiClient.current && currentRoundId.current) {
                    apiClient.current.credit(0, currentRoundId.current, true).catch(err => console.error("Close round failed", err));
                }
            }
        }
    }, [gameState, currentOutcome, bet]);

    return {
        balance,
        bet,
        setBet,
        win,
        gameState,
        setGameState,
        isAutoPlaying,
        setIsAutoPlaying,
        currentOutcome,
        buyTicket,
        generateRound,
        resolveRound,
        statusMessage
    };
};
