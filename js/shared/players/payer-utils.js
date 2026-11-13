
export function normalizePlayerName(name) {
    if (typeof name !== "string") {
        return "";
    }

    const trimmedName = name.trim().normalize("NFC");

    if (!trimmedName) {
        return "";
    }

    return trimmedName.charAt(0).toLocaleUpperCase("nl-NL")
        + trimmedName.slice(1);
}

export function getPlayerNameKey(name) {
    if (typeof name !== "string") {
        return "";
    }

    return name.trim()
        .normalize("NFC")
        .toLocaleLowerCase("nl-NL");
}

export function createPlayerId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        const bytes = crypto.getRandomValues(new Uint8Array(16));

        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(bytes, byte =>
            byte.toString(16).padStart(2, "0")
        );

        return [
            hex.slice(0, 4).join(""),
            hex.slice(4, 6).join(""),
            hex.slice(6, 8).join(""),
            hex.slice(8, 10).join(""),
            hex.slice(10, 16).join("")
        ].join("-");
    }

    throw new Error("Geen geschikte methode beschikbaar om een speler-ID te genereren.");
}


function normalizeHandicapIndex(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const normalizedValue = typeof value === "string"
        ? value.trim().replace(",", ".")
        : value;

    if (
        typeof normalizedValue === "string"
        && !/^-?\d+(\.\d+)?$/.test(normalizedValue)
    ) {
        return null;
    }

    const handicapIndex = Number(normalizedValue);

    return Number.isFinite(handicapIndex)
        ? handicapIndex
        : null;
}

function normalizeTimestamp(value, fallback) {
    if (!value) {
        return fallback;
    }

    const timestamp = new Date(value);

    return Number.isNaN(timestamp.getTime())
        ? fallback
        : timestamp.toISOString();
}

export function createPlayer(playerData = {}) {
    const name = normalizePlayerName(playerData.name);

    if (!name) {
        throw new Error("Een spelersnaam is verplicht.");
    }

    const now = new Date().toISOString();

    return {
        id: createPlayerId(),
        name,
        handicapIndex: normalizeHandicapIndex(
            playerData.handicapIndex
        ),
        photo: typeof playerData.photo === "string"
            ? playerData.photo
            : "",
        createdAt: now,
        updatedAt: now
    };
}

export function normalizePlayer(player = {}) {
    const now = new Date().toISOString();

    return {
        id: player.id !== null && player.id !== undefined
            && String(player.id).trim() !== ""
            ? String(player.id)
            : createPlayerId(),
        name: normalizePlayerName(player.name),
        handicapIndex: normalizeHandicapIndex(
            player.handicapIndex
        ),
        photo: typeof player.photo === "string"
            ? player.photo
            : "",
        createdAt: normalizeTimestamp(player.createdAt, now),
        updatedAt: normalizeTimestamp(player.updatedAt, now)
    };
}

export function isDuplicatePlayer(
    players,
    name,
    excludePlayerId = null
) {
    const nameKey = getPlayerNameKey(name);

    if (!nameKey || !Array.isArray(players)) {
        return false;
    }

    return players.some(player => {
        if (
            excludePlayerId !== null
            && String(player.id) === String(excludePlayerId)
        ) {
            return false;
        }

        return getPlayerNameKey(player.name) === nameKey;
    });
}
