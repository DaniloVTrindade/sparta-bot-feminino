// src/handlers/groups.js
// Eventos de entrada e saída de membros

import { checkRaid } from "../utils/anti.js";
import { getGroupConfig } from "../config.js";

export function setupGroupHandler(sock) {
    sock.ev.on("group-participants.update", async (update) => {
        const { id, participants, action } = update;

        if (action === "add") {
            const user = participants[0];

            // Anti-raid
            if (checkRaid(id)) {
                await sock.sendMessage(id, {
                    text: `🚨 Amores, cuidado! Muitas entradas em pouco tempo 😳\nPode ser raid, fiquem atentas 💖`,
                });
                console.log("🚨 POSSÍVEL RAID");
                return;
            }

            // Busca mensagem de boas-vindas personalizada ou padrão
            const config = getGroupConfig(id);
            const welcomeMsg = config.welcomeMessage ||
                `👋 Olá @${user.split("@")[0]} 💖\n\nSeja muito bem-vinda ao grupo 😊\n\nEu sou a *Mita* e estou aqui para ajudar a manter tudo organizado ✨\n\n📜 Digite *${config.prefix}regras*\n📋 Digite *${config.prefix}menu*\n\nQualquer dúvida, pode me chamar 🙂`;

            await sock.sendMessage(id, {
                text: welcomeMsg,
                mentions: [user],
            });
            console.log("👋 Nova membro:", user);
        }

        if (action === "remove") {
            const user = participants[0];
            await sock.sendMessage(id, {
                text: `😢 @${user.split("@")[0]} saiu do grupo.\n\nDesejamos tudo de bom 💖`,
                mentions: [user],
            });
            console.log("👋 Membro saiu:", user);
        }
    });
}
