// src/handlers/messages.js
// Handler principal de mensagens
// Processa toda mensagem recebida: anti-link, anti-flood, anti-sticker-flood e comandos

import { isGroupMessage } from "../utils/group.js";
import { checkFlood, checkStickerFlood, containsLink } from "../utils/anti.js";
import { handleCommand } from "../commands/index.js";

export function setupMessageHandler(sock) {
    sock.ev.on("messages.upsert", async (msg) => {
        const m = msg.messages[0];
        if (!m.message || m.key.fromMe) return;

        const from = m.key.remoteJid;
        const sender = m.key.participant || from;
        const isGroup = isGroupMessage(from);

        // Bot só age em grupos — DMs são ignoradas
        if (!isGroup) return;

        // Extrair texto
        const getText = (msg) =>
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            "";
        const text = getText(m.message);

        const hora = new Date().toLocaleTimeString();
        console.log(`📩 MSG | ${sender} | ${hora}`);
        if (text) console.log(`➡️ ${text}`);

        // Verificar tipo de mensagem
        const isSticker = !!m.message?.stickerMessage;

        // ========== ANTI-STICKER-FLOOD ==========
        if (isSticker) {
            if (checkStickerFlood(sender)) {
                try {
                    await sock.sendMessage(from, { delete: m.key });
                } catch {}
                await sock.sendMessage(from, {
                    text: `🚫 Calma com as figurinhas, amore 😅\n\nTá mandando muitas de uma vez, para um pouco 💖`,
                });
                console.log("🚫 STICKER FLOOD:", sender);
                return;
            }
        }

        // Se não tem texto, para aqui
        if (!text) return;

        // ========== ANTI-FLOOD (texto) ==========
        if (checkFlood(sender)) {
            await sock.sendMessage(from, {
                text: `⚠️ Calmaaa 😅\n\nTá mandando mensagem rápido demais 😳\n\nVai com calma aí 💖`,
            });
            console.log("🚫 FLOOD:", sender);
            return;
        }

        // ========== ANTI-LINK ==========
        if (containsLink(text)) {
            try {
                await sock.sendMessage(from, { delete: m.key });
            } catch {}
            await sock.sendMessage(from, {
                text: `🚫 Amore, links não são permitidos aqui viu? 😌\n\nRemovi pra manter o grupo organizado 💖`,
            });
            console.log("🚫 LINK REMOVIDO:", sender);
            return;
        }

        // ========== COMANDOS ==========
        const handled = await handleCommand(sock, from, sender, text, m, isGroup);
        if (handled) {
            console.log(`⚡ COMANDO EXECUTADO`);
        }
    });
}
