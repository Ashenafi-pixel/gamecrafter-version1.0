
import { v4 as uuidv4 } from 'uuid';

export interface LatamSession {
    sessionId: string;
    playerId: string;
    operatorEndpoint: string;
    partnerId: string;
    currency: string;
    gameCode: string;
}

export interface TransactionResponse {
    code: number;
    status: string;
    balance: number;
    internal_tx_id?: string;
    message?: string;
}

export class LatamApiClient {
    private session: LatamSession;

    constructor(session: LatamSession) {
        this.session = session;
    }

    /**
     * Helper to append query params and fetch
     */
    private async getRequest(action: string, params: Record<string, string | number>): Promise<TransactionResponse> {
        const url = new URL(this.session.operatorEndpoint);

        // Append standard params
        url.searchParams.append('action', action);
        url.searchParams.append('player_id', this.session.playerId);
        url.searchParams.append('session_id', this.session.sessionId);
        url.searchParams.append('game_code', this.session.gameCode);
        url.searchParams.append('device_type', 'desktop'); // TODO: Detect device
        url.searchParams.append('api_version', '1.0');

        // Append specific params
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data as TransactionResponse;
        } catch (error) {
            console.error(`LatamApi ${action} failed:`, error);
            throw error;
        }
    }

    /**
     * Debit (Place Bet)
     */
    async debit(amount: number, roundId: string): Promise<TransactionResponse> {
        const txId = `tx-${uuidv4()}`; // Unique ID for this transaction
        return this.getRequest('debit', {
            bet_amount: amount.toFixed(2),
            round_id: roundId,
            tx_id: txId
        });
    }

    /**
     * Credit (Win)
     */
    async credit(amount: number, roundId: string, isCompleted = true): Promise<TransactionResponse> {
        const txId = `tx-${uuidv4()}`;
        return this.getRequest('credit', {
            win_amount: amount.toFixed(2),
            round_id: roundId,
            tx_id: txId,
            round_status: isCompleted ? 'completed' : 'pending'
        });
    }

    /**
     * Refund (Rollback)
     */
    async refund(amount: number, roundId: string): Promise<TransactionResponse> {
        const txId = `tx-${uuidv4()}`;
        return this.getRequest('refund', {
            refund_amount: amount.toFixed(2),
            round_id: roundId,
            tx_id: txId
        });
    }

    /**
     * Get Balance
     */
    async getBalance(): Promise<TransactionResponse> {
        // Assuming 'balance' action exists or we use 'account'
        return this.getRequest('balance', {});
    }
}

/**
 * URL Parser helper
 */
export const extractSessionFromUrl = (): LatamSession | null => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const playerId = params.get('player_id');
    const operatorEndpoint = params.get('operator_endpoint') || params.get('rgs_base_url'); // Fallback
    const gameCode = params.get('game_code');

    if (!sessionId || !playerId || !operatorEndpoint) {
        console.warn("LatamAPI: Missing session parameters in URL");
        return null;
    }

    return {
        sessionId,
        playerId,
        operatorEndpoint,
        partnerId: params.get('partner_id') || '',
        currency: params.get('currency') || 'USD',
        gameCode: gameCode || 'scratch-demo'
    };
};
