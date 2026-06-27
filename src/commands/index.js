// src/commands/index.js
// Registro e dispatch de comandos

import { getGroupConfig } from "../config.js";
import { menuCommands } from "./menu.js";
import { adminCommands } from "./admin.js";
import { funCommands } from "./fun.js";
import { configCommands } from "./config.js";

// Registro central de comandos
const commands = new Map();

function register(cmd, handler, { onlyGroup = true, onlyAdmin = false } = {}) {
    commands.set(cmd, { handler, onlyGroup, onlyAdmin });
}

// Registrar todos os comandos
menuCommands(register);
adminCommands(register);
funCommands(register);
configCommands(register);

/**
 * Processa e executa um comando se aplicável
 * Retorna true se um comando foi executado, false caso contrário
 */
export async function handleCommand(sock, from, sender, text, m, isGroup) {
    // Descobre o prefixo do grupo
    const config = getGroupConfig(from);
    const prefix = config.prefix;

    if (!text.startsWith(prefix)) return false;

    const args = text.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (!commands.has(cmd)) return false;

    const entry = commands.get(cmd);

    // Se o comando é apenas para grupo, rejeita em DM
    if (entry.onlyGroup && !isGroup) return false;

    // Se o comando é apenas admin, a verificação é feita dentro do handler
    // (porque precisa do sock para buscar metadata)

    await entry.handler(sock, from, sender, args, m, isGroup);
    return true;
}
