import { get, run } from "../db/sqlite.js";
import { hmacSha256Base64 } from "../lib/utils.js";

/**
 * Headers expected:
 * x-operator-id
 * x-timestamp (ms)
 * x-nonce
 * x-signature (base64 hmac sha256)
 *
 * signature = HMAC(secret, `${timestamp}.${nonce}.${method}.${path}.${rawBody}`)
 *
 * In dev you can disable by setting HMAC_REQUIRED=false
 */
export function hmacAuth({ db, requiredEnvKey = "HMAC_REQUIRED" }) {
    return async function (req, res, next) {
        const required = String(process.env[requiredEnvKey] || "false").toLowerCase() === "true";
        if (!required) return next();

        const operatorId = req.header("x-operator-id");
        const timestamp = req.header("x-timestamp");
        const nonce = req.header("x-nonce");
        const signature = req.header("x-signature");

        if (!operatorId || !timestamp || !nonce || !signature) {
            return res.status(401).json({ error: "Missing HMAC headers" });
        }

        const ts = Number(timestamp);
        if (!Number.isFinite(ts)) return res.status(401).json({ error: "Invalid timestamp" });

        // 5 min window
        const now = Date.now();
        if (Math.abs(now - ts) > 5 * 60 * 1000) {
            return res.status(401).json({ error: "Timestamp out of range" });
        }

        const op = await get(db, "SELECT operator_id, hmac_secret, is_active FROM operators WHERE operator_id = ?;", [operatorId]);
        if (!op || op.is_active !== 1 || !op.hmac_secret) {
            return res.status(401).json({ error: "Invalid operator" });
        }

        // prevent replay
        const existing = await get(db, "SELECT operator_id FROM request_nonces WHERE operator_id = ? AND nonce = ?;", [operatorId, nonce]);
        if (existing) return res.status(401).json({ error: "Replay detected" });

        const rawBody = req.rawBody || "";
        const signed = `${timestamp}.${nonce}.${req.method.toUpperCase()}.${req.originalUrl}.${rawBody}`;
        const expected = hmacSha256Base64(op.hmac_secret, signed);

        if (expected !== signature) return res.status(401).json({ error: "Bad signature" });

        await run(db, "INSERT INTO request_nonces (operator_id, nonce) VALUES (?, ?);", [operatorId, nonce]);

        req.operatorId = operatorId;
        next();
    };
}
