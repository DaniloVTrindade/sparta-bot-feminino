// index.js
// ===================================================
// Tratamento de erros globais
process.on("unhandledRejection", (err) => console.log("⚠️ ERRO:", err));
process.on("uncaughtException", (err) => console.log("⚠️ EXCEÇÃO:", err));

// Importações ESM
import fs from "fs";
import pino from "pino";
import QRCode from "qrcode";

const BOT_START_TIME = Math.floor(Date.now() / 1000);
const prefix = "!";

const raidControl = {};
const flood = {};

async function initBot() {
    // Dynamic import do Baileys v7
    const baileys = await import("@whiskeysockets/baileys");
    const {
        default: makeWASocket,
        useMultiFileAuthState,
        DisconnectReason,
        fetchLatestBaileysVersion,
    } = baileys;

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
            browser: ["SPARTA BOT", "Chrome", "1.0"],
        });

        sock.ev.on("creds.update", saveCreds);

        // =========================
        // Conexão
        // =========================
        sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log("📲 Gerando QR code...");
                QRCode.toFile("./qrcode.png", qr, { type: "png" })
                    .then(() =>
                        console.log(
                            "✅ QR code gerado em qrcode.png. Baixe pelo painel do Railway e escaneie no WhatsApp."
                        )
                    )
                    .catch(err => console.error("Erro QR:", err));
            }

            if (connection === "open") console.log("⚔️ BOT SPARTA ONLINE");

            if (connection === "close") {
                console.log("❌ Conexão fechada.");
                if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
                    console.log("⚠️ Sessão expirada. Apague a pasta /auth e rode novamente.");
                } else {
                    console.log("🔄 Reconexão automática será feita pelo Baileys...");
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
                        text: `🚨 Amores, cuidado! Muitas entradas em pouco tempo 😳\nPode ser raid, fiquem atentas 💖`,
                    });
                    console.log("🚨 POSSÍVEL RAID");
                    return;
                }

                // Boas-vindas (Mita)
                await sock.sendMessage(id, {
                    text: `👋 Olá @${user.split("@")[0]} 💖\n\nSeja muito bem-vinda ao grupo 😊\n\nEu sou a *Mita* e estou aqui para ajudar a manter tudo organizado ✨\n\n📜 Digite *!regras*\n📋 Digite *!menu*\n\nQualquer dúvida, pode me chamar 🙂`,
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

        // =========================
        // Mensagens
        // =========================
        sock.ev.on("messages.upsert", async (msg) => {
            const m = msg.messages[0];
            if (!m.message || m.key.fromMe) return;

            const from = m.key.remoteJid;
            const sender = m.key.participant || from;
            const isGroup = from.endsWith("@g.us");

            const getText = (msg) => msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || "";
            let text = getText(m.message);
            if (!text) return;

            const hora = new Date().toLocaleTimeString();
            console.log(`📩 MSG | ${sender} | ${hora}`);
            console.log(`➡️ ${text}`);

            // =========================
            // Anti-link
            // =========================
            if (isGroup && text.includes("http")) {
                try {
                    await sock.sendMessage(from, { delete: m.key });
                    await sock.sendMessage(from, {
                        text: `🚫 Amore, links não são permitidos aqui viu? 😌\n\nRemovi pra manter o grupo organizado 💖`,
                    });
                    console.log("🚫 LINK REMOVIDO:", sender);
                } catch {}
                return;
            }

            // =========================
            // Anti-flood
            // =========================
            if (isGroup) {
                if (!flood[sender]) flood[sender] = { msg: 1, time: Date.now() };
                else {
                    flood[sender].msg++;
                    if (flood[sender].msg >= 5 && Date.now() - flood[sender].time < 5000) {
                        await sock.sendMessage(from, {
                            text: `⚠️ Calmaaa 😅\n\nTá mandando mensagem rápido demais 😳\n\nVai com calma aí 💖`,
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

            // =========================
            // TODOS os comandos originais da Mita
            // =========================
            if (comando === "oi") {
                await sock.sendMessage(from, {
                    text: `👋 Olá 😊\n\nEu sou a *Mita* 💖\n\nEstou aqui para ajudar e manter o grupo organizado ✨\n\nDigite *!menu* para ver os comandos disponíveis 🙂`,
                });
            }

            if (comando === "menu") {
                await sock.sendMessage(from, {
                    text: `💖 *MENU DA MITA*\n\n👋 !oi → falar comigo\n📜 !regras → ver as regras\n🔨 !ban @usuária → remover alguém\n🔒 !privar → só admins falam\n🔓 !desprivar → liberar geral\n\nUse com responsabilidade, viu? 😌✨`,
                });
            }

            if (comando === "regras") {
                await sock.sendMessage(from, {
                    text: `📜 *REGRINHAS DA MITA* 💖\n\n1️⃣ Nada de conteúdo +18 🚫\n2️⃣ Sem flood, por favor 🙏\n3️⃣ Respeito sempre 💅\n4️⃣ Nada de violência 🚫\n5️⃣ Sem brigas 😤\n6️⃣ Nada ilegal ⚠️\n\nQuem não seguir... eu vou agir 😌🔨`,
                });
            }

            if (comando === "ban") {
                if (!isGroup) return;
                if (!(await isAdmin(sock, from, sender))) return sock.sendMessage(from, { text: "❌ Apenas administradoras podem usar isso." });
                const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid;
                const alvo = mentioned?.[0];
                if (!alvo) return sock.sendMessage(from, { text: "⚠️ Marque a usuária para remover." });

                try {
                    await sock.groupParticipantsUpdate(from, [alvo], "remove");
                    await sock.sendMessage(from, { text: `🔨 Prontinho 💅\n\nO usuário foi removido do grupo com sucesso.\n\nAqui a gente mantém a ordem 😌✨` });
                } catch (e) { console.log("ERRO BAN:", e); }
            }

            if (comando === "privar") {
                if (!isGroup) return;
                if (!(await isAdmin(sock, from, sender))) return sock.sendMessage(from, { text: "❌ Apenas administradoras." });
                await sock.groupSettingUpdate(from, "announcement");
                await sock.sendMessage(from, { text: "🔒 Grupo fechado. Só administradoras podem falar agora." });
            }

            if (comando === "desprivar") {
                if (!isGroup) return;
                if (!(await isAdmin(sock, from, sender))) return sock.sendMessage(from, { text: "❌ Apenas administradoras." });
                await sock.groupSettingUpdate(from, "not_announcement");
                await sock.sendMessage(from, { text: "🔓 Grupo aberto novamente 💖" });
            }
        });
    }

    startBot();
}
// teste deploy Railway
initBot();