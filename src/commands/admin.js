// src/commands/admin.js
// Comandos administrativos (apenas admins do grupo)

import { isAdmin, listAdmins } from "../utils/group.js";

export function adminCommands(register) {
    // ========== BAN ==========
    register("ban", async (sock, from, sender, args, m, isGroup) => {
        if (!isGroup) return;

        if (!(await isAdmin(sock, from, sender))) {
            return sock.sendMessage(from, { text: "❌ Apenas administradoras podem usar isso." });
        }

        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const alvo = mentioned?.[0];
        if (!alvo) {
            return sock.sendMessage(from, { text: "⚠️ Marque a usuária para remover." });
        }

        try {
            await sock.groupParticipantsUpdate(from, [alvo], "remove");
            await sock.sendMessage(from, {
                text: `🔨 Prontinho 💅\n\nO usuário foi removido do grupo com sucesso.\n\nAqui a gente mantém a ordem 😌✨`,
            });
        } catch (e) {
            console.log("ERRO BAN:", e);
        }
    });

    // ========== PRIVAR GRUPO ==========
    register("privar", async (sock, from, sender, args, m, isGroup) => {
        if (!isGroup) return;

        if (!(await isAdmin(sock, from, sender))) {
            return sock.sendMessage(from, { text: "❌ Apenas administradoras." });
        }

        await sock.groupSettingUpdate(from, "announcement");
        await sock.sendMessage(from, { text: "🔒 Grupo fechado. Só administradoras podem falar agora." });
    });

    // ========== DESPRIVAR GRUPO ==========
    register("desprivar", async (sock, from, sender, args, m, isGroup) => {
        if (!isGroup) return;

        if (!(await isAdmin(sock, from, sender))) {
            return sock.sendMessage(from, { text: "❌ Apenas administradoras." });
        }

        await sock.groupSettingUpdate(from, "not_announcement");
        await sock.sendMessage(from, { text: "🔓 Grupo aberto novamente 💖" });
    });

    // ========== LISTAR ADMINS ==========
    register("admins", async (sock, from, sender, args, m, isGroup) => {
        if (!isGroup) return;

        const admins = await listAdmins(sock, from);
        if (admins.length === 0) {
            return sock.sendMessage(from, { text: "❌ Não foi possível buscar os admins." });
        }

        const mentions = admins.map(id => id);
        const lista = admins.map(id => `👑 @${id.split("@")[0]}`).join("\n");

        await sock.sendMessage(from, {
            text: `👑 *Administradoras do grupo:*\n\n${lista}`,
            mentions,
        });
    });
}
