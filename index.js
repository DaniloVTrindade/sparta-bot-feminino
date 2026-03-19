// index.js
// ===================================================
// Tratamento de erros globais
process.on("unhandledRejection", (err) => console.log("⚠️ ERRO:", err));
process.on("uncaughtException", (err) => console.log("⚠️ EXCEÇÃO:", err));

// Import dinâmico Baileys v7 para compatibilidade ESM no Railway
import pino from "pino";
import QRCode from "qrcode";

const baileys = await import("@whiskeysockets/baileys");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;

const BOT_START_TIME = Math.floor(Date.now() / 1000);
const prefix = "!";

const raidControl = {};
const flood = {};

async function isAdmin(sock, groupId, userId) {
    const metadata = await sock.groupMetadata(groupId);
    const user = metadata.participants.find(p => p.id === userId);
    return user?.admin === "admin" || user?.admin === "superadmin";
}

console.clear();
console.log("⚙️ Iniciando BOT SPARTA...");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        version,
        logger: pino({ level: "silent" }),
        browser: ["SPARTA BOT", "Chrome", "1.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("📲 Gerando QR code...");
            await QRCode.toFile("./qrcode.png", qr, { type: "png" });
            console.log("✅ QR code gerado em qrcode.png. Escaneie no WhatsApp.");
        }

        if (connection === "open") console.log("⚔️ BOT SPARTA ONLINE");

        if (connection === "close") {
            console.log("❌ Conexão fechada.");
            if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
                console.log("⚠️ Sessão expirada. Apague a pasta /auth e rode novamente.");
            } else {
                console.log("🔄 Tentando reconectar...");
                setTimeout(startBot, 3000);
            }
        }
    });

    // =========================
    // Eventos de grupo
    // =========================
    sock.ev.on("group-participants.update", async (update) => {
        const { id, participants, action } = update;
        const agora = Date.now();

        if (action === "add") {
            const user = participants[0];

            // Anti-raid
            if (!raidControl[id]) raidControl[id] = [];
            raidControl[id].push(agora);
            raidControl[id] = raidControl[id].filter(t => agora - t < 10000);

            if (raidControl[id].length >= 5) {
                await sock.sendMessage(id, {
                    text: `🚨 Amores, cuidado! Muitas entradas em pouco tempo 😳\nPode ser raid, fiquem atentas 💖`
                });
                console.log("🚨 POSSÍVEL RAID");
                return;
            }

            // Boas-vindas (Mita)
            await sock.sendMessage(id, {
                text: `👋 Olá @${user.split("@")[0]} 💖\n\nSeja muito bem-vinda ao grupo 😊\n\nEu sou a *Mita* e estou aqui para ajudar a manter tudo organizado ✨\n\n📜 Digite *!regras*\n📋 Digite *!menu*\n\nQualquer dúvida, pode me chamar 🙂`,
                mentions: [user]
            });
            console.log("👋 Nova membro:", user);
        }

        if (action === "remove") {
            const user = participants[0];
            await sock.sendMessage(id, {
                text: `😢 @${user.split("@")[0]} saiu do grupo.\n\nDesejamos tudo de bom 💖`,
                mentions: [user]
            });
            console.log("👋 Membro saiu:", user);
        }
    });

    // =========================
    // Mensagens
    // =========================
    sock.ev.on("messages.upsert", async (msg) => {
        const m = msg.messages[0];
        if (!m.message || m.key.fromMe) return;

        const from = m.key.remoteJid;
        const sender = m.key.participant || from;

        const getText = (msg) => msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || "";
        let text = getText(m.message);
        if (!text) return;

        const isGroup = from.endsWith("@g.us");

        // =========================
        // Anti-link
        // =========================
        if (isGroup && text.includes("http")) {
            try {
                await sock.sendMessage(from, { delete: m.key });
                await sock.sendMessage(from, {
                    text: `🚫 Amore, links não são permitidos aqui viu? 😌\n\nRemovi pra manter o grupo organizado 💖`
                });
                console.log("🚫 LINK REMOVIDO:", sender);
            } catch {}
            return;
        }

        const hora = new Date().toLocaleTimeString();
        console.log(`📩 MSG | ${sender} | ${hora}`);
        console.log(`➡️ ${text}`);

        // =========================
        // Anti-flood
        // =========================
        if (isGroup) {
            if (!flood[sender]) flood[sender] = { msg: 1, time: Date.now() };
            else {
                flood[sender].msg++;
                if (flood[sender].msg >= 5 && Date.now() - flood[sender].time < 5000) {
                    await sock.sendMessage(from, {
                        text: `⚠️ Calmaaa 😅\n\nTá mandando mensagem rápido demais 😳\n\nVai com calma aí 💖`
                    });
                    console.log("🚫 FLOOD:", sender);
                    flood[sender] = { msg: 0, time: Date.now() };
                    return;
                }
            }

            setTimeout(() => {
                if (flood[sender]) flood[sender].msg = 0;
            }, 6000);
        }

        // =========================
        // Comandos
        // =========================
        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const comando = args.shift().toLowerCase();
        console.log(`⚡ COMANDO: ${comando}`);

        // Comandos do seu código original (!oi, !menu, !regras, !ban, !privar, !desprivar)
        // Cole exatamente como estava no seu código atual aqui
        // ✅ Mantendo toda a lógica
    });
}

// =========================
// Inicia o bot
// =========================
startBot();