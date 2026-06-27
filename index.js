// index.js
// ===================================================
// BOT SPARTA — MITA
// WhatsApp Group Manager Bot
// ===================================================

// Tratamento de erros globais
process.on("unhandledRejection", (err) => console.log("⚠️ ERRO:", err));
process.on("uncaughtException", (err) => console.log("⚠️ EXCEÇÃO:", err));

import pino from "pino";
import { setupConnectionHandler } from "./src/handlers/connection.js";
import { setupGroupHandler } from "./src/handlers/groups.js";
import { setupMessageHandler } from "./src/handlers/messages.js";

async function initBot() {
    const baileys = await import("@whiskeysockets/baileys");
    const {
        default: makeWASocket,
        useMultiFileAuthState,
        fetchLatestBaileysVersion,
    } = baileys;

    console.clear();
    console.log("⚙️ Iniciando BOT SPARTA...");

    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        version,
        logger: pino({ level: "silent" }),
        browser: ["SPARTA BOT", "Chrome", "1.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    // Configura handlers
    setupConnectionHandler(sock);
    setupGroupHandler(sock);
    setupMessageHandler(sock);
}

initBot();
