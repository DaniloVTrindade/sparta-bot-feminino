// src/handlers/connection.js
// Eventos de conexão do WhatsApp

import qrcodeTerminal from "qrcode-terminal";
import { DisconnectReason } from "@whiskeysockets/baileys";

export function setupConnectionHandler(sock) {
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("📲 Escaneie este QR code no WhatsApp:");
            qrcodeTerminal.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("⚔️ BOT SPARTA ONLINE");
        }

        if (connection === "close") {
            console.log("❌ Conexão fechada.");
            if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
                console.log("⚠️ Sessão expirada. Apague a pasta /auth e rode novamente.");
            } else {
                console.log("🔄 Tentando reconectar em 3s...");
                setTimeout(() => sock?.ws?.close(), 3000);
            }
        }
    });
}
