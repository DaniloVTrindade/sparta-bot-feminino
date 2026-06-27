// src/config.js
// Configurações globais do bot

export const PREFIX = "!";
export const BOT_START_TIME = Math.floor(Date.now() / 1000);

// Anti-raid: máximo de entradas em 10s antes de alertar
export const RAID_LIMIT = 5;
export const RAID_WINDOW_MS = 10000;

// Anti-flood: máximo de mensagens em 5s
export const FLOOD_LIMIT = 5;
export const FLOOD_WINDOW_MS = 5000;
export const FLOOD_RESET_MS = 6000;

// Anti-sticker-flood: max stickers em N segundos
export const STICKER_FLOOD_LIMIT = 3;
export const STICKER_FLOOD_WINDOW_MS = 5000;

// Storage em memória para config por grupo
// Em produção, usar banco de dados
export const groupConfig = new Map();

export function getGroupConfig(groupId) {
    if (!groupConfig.has(groupId)) {
        groupConfig.set(groupId, {
            prefix: PREFIX,
            welcomeMessage: null, // null = mensagem padrão
        });
    }
    return groupConfig.get(groupId);
}
