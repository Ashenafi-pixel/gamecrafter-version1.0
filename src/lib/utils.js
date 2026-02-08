import crypto from "crypto";

export function uuid() {
    return crypto.randomUUID();
}

export function nowIso() {
    return new Date().toISOString();
}

// currency cents handling
export function toCents(amount) {
    // expects number like 2.0; handle safely
    return Math.round(Number(amount) * 100);
}

export function fromCents(cents) {
    return Number(cents) / 100;
}

export function randomSeedB64() {
    return crypto.randomBytes(32).toString("base64");
}

export function hmacSha256Base64(secret, data) {
    return crypto.createHmac("sha256", secret).update(data).digest("base64");
}
