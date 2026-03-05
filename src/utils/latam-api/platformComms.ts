
export interface PlatformBalance {
    [currency: string]: number;
}

export interface PlatformResponse {
    type: "PLATFORM_API_RESPONSE";
    requestId: string;
    success: boolean;
    payload: PlatformBalance;
}

export interface PlatformUpdate {
    type: "PLATFORM_BALANCE_UPDATED";
    payload: PlatformBalance;
}

type PlatformMessage = PlatformResponse | PlatformUpdate;

export class PlatformComms {
    private currency: string;
    private onBalanceUpdate: (balance: number) => void;

    constructor(currency: string = 'USD', onBalanceUpdate: (balance: number) => void) {
        this.currency = currency;
        this.onBalanceUpdate = onBalanceUpdate;
        this.init();
    }

    private init() {
        window.addEventListener("message", this.handleMessage.bind(this));
    }

    private handleMessage(event: MessageEvent) {
        const data = event.data as PlatformMessage;

        if (data.type === "PLATFORM_BALANCE_UPDATED" || data.type === "PLATFORM_API_RESPONSE") {
            const balances = data.payload;
            if (balances && balances[this.currency] !== undefined) {
                console.log(`[PlatformComms] Received balance for ${this.currency}:`, balances[this.currency]);
                this.onBalanceUpdate(balances[this.currency]);
            }
        }
    }

    /**
     * Request a fresh balance from the parent platform
     */
    public requestBalance() {
        console.log("[PlatformComms] Requesting balance from parent...");
        window.parent.postMessage({
            type: "PLATFORM_API_REQUEST",
            action: "GET_BALANCE",
            requestId: `req-${Date.now()}`
        }, "*");

        // Also send the alternative trigger for BalanceContext.tsx
        window.parent.postMessage({
            type: "RGS_BALANCE_UPDATED"
        }, "*");
    }

    public destroy() {
        window.removeEventListener("message", this.handleMessage.bind(this));
    }
}
