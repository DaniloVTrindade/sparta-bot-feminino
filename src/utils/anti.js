// src/utils/anti.js
// Sistemas anti-abuso: link, flood, sticker flood, raid

import {
    FLOOD_LIMIT,
    FLOOD_WINDOW_MS,
    FLOOD_RESET_MS,
    STICKER_FLOOD_LIMIT,
    STICKER_FLOOD_WINDOW_MS,
} from "../config.js";

// ========== ANTI-FLOOD ==========

const flood = {};

/**
 * Verifica se o usuário está em flood de mensagens de texto
 * Retorna true se excedeu o limite
 */
export function checkFlood(sender) {
    const now = Date.now();

    if (!flood[sender]) {
        flood[sender] = { count: 1, time: now };
        return false;
    }

    const entry = flood[sender];
    entry.count++;

    if (entry.count >= FLOOD_LIMIT && now - entry.time < FLOOD_WINDOW_MS) {
        flood[sender] = { count: 0, time: now };
        return true;
    }

    // Reseta contagem após o tempo
    setTimeout(() => {
        if (flood[sender]) flood[sender].count = 0;
    }, FLOOD_RESET_MS);

    return false;
}

// ========== ANTI-STICKER-FLOOD ==========

const stickerFlood = {};

/**
 * Verifica se o usuário está enviando stickers em excesso
 * Retorna true se excedeu o limite
 */
export function checkStickerFlood(sender) {
    const now = Date.now();

    if (!stickerFlood[sender]) {
        stickerFlood[sender] = { count: 1, time: now };
        return false;
    }

    const entry = stickerFlood[sender];
    entry.count++;

    if (entry.count >= STICKER_FLOOD_LIMIT && now - entry.time < STICKER_FLOOD_WINDOW_MS) {
        stickerFlood[sender] = { count: 0, time: now };
        return true;
    }

    // Reseta contagem após o tempo
    setTimeout(() => {
        if (stickerFlood[sender]) stickerFlood[sender].count = 0;
    }, FLOOD_RESET_MS);

    return false;
}

// ========== ANTI-RAID ==========

const raidControl = {};

/**
 * Verifica se há um raid (muitas entradas em pouco tempo) no grupo
 * Retorna true se detectou raid
 */
export function checkRaid(groupId) {
    const now = Date.now();

    if (!raidControl[groupId]) raidControl[groupId] = [];
    raidControl[groupId].push(now);
    raidControl[groupId] = raidControl[groupId].filter(t => now - t < 10000);

    return raidControl[groupId].length >= 5;
}

/**
 * Verifica se a mensagem contém link
 */
export function containsLink(text) {
    return /https?:\/\/[^\s]+/.test(text);
}
