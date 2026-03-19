process.on("unhandledRejection", (err) => {
    console.log("⚠️ ERRO:", err)
})

process.on("uncaughtException", (err) => {
    console.log("⚠️ EXCEÇÃO:", err)
})

// Dynamic import para compatibilidade ESM no Railway
async function initBaileys() {
    const baileys = await import('@whiskeysockets/baileys')
    const makeWASocket = baileys.default
    const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys
    const pino = require('pino')
    const QRCode = require('qrcode')

    const BOT_START_TIME = Math.floor(Date.now() / 1000)
    const prefix = "!"

    const raidControl = {}
    const flood = {}
    async function isAdmin(sock, groupId, userId) {
        const metadata = await sock.groupMetadata(groupId)
        const user = metadata.participants.find(p => p.id === userId)
        return user?.admin === "admin" || user?.admin === "superadmin"
    }

    console.clear()
    console.log("⚙️ Iniciando BOT SPARTA...")

    async function startBot() {
        const { state, saveCreds } = await useMultiFileAuthState('./auth')
        const { version } = await fetchLatestBaileysVersion()

        const sock = makeWASocket({
            auth: state,
            version,
            logger: pino({ level: 'silent' }),
            browser: ["SPARTA BOT", "Chrome", "1.0"]
        })

        sock.ev.on('creds.update', saveCreds)

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update
            const fs = require('fs')

            if (qr) {
                console.log("📲 Gerando QR code...")
                const qrPath = './qrcode.png'
                QRCode.toFile(qrPath, qr, { type: 'png' }, function (err) {
                    if (err) console.error("Erro gerando QR:", err)
                    else console.log("✅ QR code gerado em qrcode.png. Baixe pelo painel do Railway e escaneie no WhatsApp.")
                })
            }

            if (connection === 'open') console.log("⚔️ BOT SPARTA ONLINE")

            if (connection === 'close') {
                console.log("❌ Conexão fechada.")
                if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
                    console.log("⚠️ Sessão expirada. Apague a pasta /auth e rode novamente.")
                } else {
                    console.log("🔄 Tentando reconectar...")
                    setTimeout(startBot, 3000)
                }
            }
        })

        // =========================
        // EVENTOS COMPLETOS DO BOT
        // =========================

        // Participantes
        sock.ev.on('group-participants.update', async (update) => {
            const { id, participants, action } = update
            const agora = Date.now()

            if (action === "add") {
                const user = participants[0]
                if (!raidControl[id]) raidControl[id] = []
                raidControl[id].push(agora)
                raidControl[id] = raidControl[id].filter(t => agora - t < 10000)

                if (raidControl[id].length >= 5) {
                    await sock.sendMessage(id, { text: `🚨 Muitas entradas em pouco tempo 😳 Pode ser raid!` })
                    console.log("🚨 POSSÍVEL RAID")
                    return
                }

                await sock.sendMessage(id, {
                    text: `👋 Olá @${user.split("@")[0]} 💖\nSeja bem-vinda! Digite *!regras* ou *!menu*`,
                    mentions: [user]
                })
                console.log("👋 Nova membro:", user)
            }

            if (action === "remove") {
                const user = participants[0]
                await sock.sendMessage(id, { text: `😢 @${user.split("@")[0]} saiu do grupo 💖`, mentions: [user] })
                console.log("👋 Membro saiu:", user)
            }
        })

        // Mensagens
        sock.ev.on('messages.upsert', async (msg) => {
            const m = msg.messages[0]
            if (!m.message || m.key.fromMe) return

            const from = m.key.remoteJid
            const sender = m.key.participant || from

            const getText = (msg) => msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || ""
            let text = getText(m.message)
            if (!text) return

            const isGroup = from.endsWith("@g.us")

            // Anti-link
            if (isGroup && text.includes("http")) {
                try { await sock.sendMessage(from, { delete: m.key }) } catch {}
                await sock.sendMessage(from, { text: `🚫 Links não são permitidos aqui 💖` })
                console.log("🚫 LINK REMOVIDO:", sender)
                return
            }

            // Anti-flood
            if (isGroup) {
                if (!flood[sender]) flood[sender] = { msg: 1, time: Date.now() }
                else {
                    flood[sender].msg++
                    if (flood[sender].msg >= 5 && Date.now() - flood[sender].time < 5000) {
                        await sock.sendMessage(from, { text: `⚠️ Calmaaa 😅 Mandando rápido demais!` })
                        console.log("🚫 FLOOD:", sender)
                        flood[sender] = { msg: 0, time: Date.now() }
                        return
                    }
                }
                setTimeout(() => { if (flood[sender]) flood[sender].msg = 0 }, 6000)
            }

            // Comandos
            if (!text.startsWith(prefix)) return
            const args = text.slice(prefix.length).trim().split(/ +/)
            const comando = args.shift().toLowerCase()
            console.log(`⚡ COMANDO: ${comando}`)

            if (comando === "oi") await sock.sendMessage(from, { text: `👋 Olá! Eu sou a *Mita* 💖\nDigite *!menu* para ver os comandos.` })
            if (comando === "menu") await sock.sendMessage(from, { text: `💖 MENU: !oi, !regras, !ban @usuária, !privar, !desprivar` })
            if (comando === "regras") await sock.sendMessage(from, { text: `📜 REGRAS: 1️⃣ Nada +18 2️⃣ Sem flood 3️⃣ Respeito 4️⃣ Sem violência 5️⃣ Sem brigas 6️⃣ Nada ilegal` })

            if (comando === "ban" && isGroup) {
                if (!(await isAdmin(sock, from, sender))) return sock.sendMessage(from, { text: "❌ Apenas admins." })
                const alvo = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                if (!alvo) return sock.sendMessage(from, { text: "⚠️ Marque a usuária para remover." })
                try {
                    await sock.groupParticipantsUpdate(from, [alvo], "remove")
                    await sock.sendMessage(from, { text: "🔨 Usuário removido com sucesso 💖" })
                } catch (e) { console.log("ERRO BAN:", e) }
            }

            if (comando === "privar" && isGroup) {
                if (!(await isAdmin(sock, from, sender))) return sock.sendMessage(from, { text: "❌ Apenas admins." })
                await sock.groupSettingUpdate(from, "announcement")
                await sock.sendMessage(from, { text: "🔒 Grupo fechado. Só admins podem falar." })
            }

            if (comando === "desprivar" && isGroup) {
                if (!(await isAdmin(sock, from, sender))) return sock.sendMessage(from, { text: "❌ Apenas admins." })
                await sock.groupSettingUpdate(from, "not_announcement")
                await sock.sendMessage(from, { text: "🔓 Grupo aberto novamente 💖" })
            }
        })
    }

    setTimeout(startBot, 5000)
}

// Inicia o bot
initBaileys()