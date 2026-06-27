// src/commands/config.js
// Comandos de configuração do bot (apenas admin)

import { isAdmin } from "../utils/group.js";
import { getGroupConfig } from "../config.js";

export function configCommands(register) {
    // ========== MUDAR PREFIXO ==========
    register("prefix", async (sock, from, sender, args, m, isGroup) => {
        if (!isGroup) return;

        if (!(await isAdmin(sock, from, sender))) {
            return sock.sendMessage(from, { text: "❌ Apenas administradoras podem mudar o prefixo." });
        }

        const novoPrefixo = args[0];
        if (!novoPrefixo || novoPrefixo.length > 3) {
            return sock.sendMessage(from, {
                text: "⚠️ Use: !prefix <símbolo>\nExemplo: !prefix ?\n(O prefixo deve ter no máximo 3 caracteres)",
            });
        }

        const config = getGroupConfig(from);
        config.prefix = novoPrefixo;

        await sock.sendMessage(from, {
            text: `✅ Prontinho! O prefixo foi alterado para *${novoPrefixo}* 💖\n\nAgora os comandos devem começar com *${novoPrefixo}*`,
        });
    });

    // ========== MUDAR MENSAGEM DE BOAS-VINDAS ==========
    register("setwelcome", async (sock, from, sender, args, m, isGroup) => {
        if (!isGroup) return;

        if (!(await isAdmin(sock, from, sender))) {
            return sock.sendMessage(from, { text: "❌ Apenas administradoras podem configurar a mensagem de boas-vindas." });
        }

        const msg = args.join(" ");
        if (!msg) {
            return sock.sendMessage(from, {
                text: "⚠️ Use: !setwelcome <mensagem>\nUse *@user* onde quiser que o nome da nova membro apareça.\n\nPara voltar à mensagem padrão, use: !setwelcome default",
            });
        }

        const config = getGroupConfig(from);

        if (msg.toLowerCase() === "default") {
            config.welcomeMessage = null;
            return sock.sendMessage(from, { text: "✅ Mensagem de boas-vindas restaurada para o padrão 💖" });
        }

        config.welcomeMessage = msg;

        await sock.sendMessage(from, {
            text: `✅ Mensagem de boas-vindas atualizada com sucesso! 💖\n\n⚠️ Lembre-se: use *@user* para mencionar a nova membro. O nome real dela aparecerá no lugar.`,
        });
    });
}
