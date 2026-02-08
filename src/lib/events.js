import { uuid } from "./utils.js";
import { run } from "../db/sqlite.js";

export async function logEvent(db, { operatorId, playerId, roundId, gameId, eventType, payload }) {
    const eventId = uuid();
    await run(
        db,
        `INSERT INTO rgs_events (event_id, operator_id, player_id, round_id, game_id, event_type, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
            eventId,
            operatorId,
            playerId || null,
            roundId || null,
            gameId || null,
            eventType,
            payload ? JSON.stringify(payload) : null,
        ]
    );
    return eventId;
}
