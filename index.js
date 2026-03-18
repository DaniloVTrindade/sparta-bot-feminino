const express = require('express');
const app = express();

app.get("/", (req, res) => {
    res.send("Bot Sparta rodando!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer');

process.env.PUPPETEER_EXECUTABLE_PATH = puppeteer.executablePath();

const BOT_START_TIME = Math.floor(Date.now() / 1000);
const prefix = "!";

const raidControl = {};
const flood = {};

process.on("unhandledRejection", (reason) => {
    console.log("⚠️ ERRO NÃO TRATADO:", reason);
});

process.on("uncaughtException", (error) => {
    console.log("⚠️ EXCEÇÃO:", error);
});

console.clear();
console.log("⚙️ Iniciando BOT SPARTA...");

// =========================
// CLIENTE WHATSAPP
// =========================
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
});

client.on('qr', (qr) => {
    const qrBase64 = Buffer.from(qr).toString('base64');

    console.log('ABRA ESSE LINK NO NAVEGADOR:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qr}`);
});

client.on('ready', () => {
    console.log("⚔️ BOT SPARTA ONLINE");
});

// =========================
// BOAS-VINDAS + ANTI RAID
// =========================
client.on('group_join', async (notification) => {
    const chat = await notification.getChat();
    const user = notification.id.participant;
    const agora = Date.now();

    if(!raidControl[chat.id._serialized]){
        raidControl[chat.id._serialized] = [];
    }

    raidControl[chat.id._serialized].push(agora);
    raidControl[chat.id._serialized] =
        raidControl[chat.id._serialized].filter(t => agora - t < 10000);

    if(raidControl[chat.id._serialized].length >= 5){
        await chat.sendMessage(
`🚨 *ALERTA DE RAID*

Muitos usuários entraram em pouco tempo.

Administradoras verifiquem o grupo.`
        );
        console.log("🚨 POSSÍVEL RAID DETECTADO");
        return;
    }

    await chat.sendMessage(
`👋 @${user.split("@")[0]}

⚔️ *BEM-VINDA À COMUNIDADE SPARTA*

📜 Digite *!regras*
📋 Digite *!menu*

Respeito e disciplina acima de tudo.`,
        { mentions:[user] }
    );

    console.log("👋 Nova membro:",user);
});

// =========================
// SISTEMA DE MENSAGENS
// =========================
client.on('message_create', async (msg) => {
    if(msg.timestamp < BOT_START_TIME) return;
    if(msg.fromMe) return;

    const chat = await msg.getChat();
    const sender = msg.author || msg.from;
    const hora = new Date().toLocaleTimeString();

    console.log(`📩 ${sender} | ${hora} | ${msg.body}`);

    // =========================
    // ANTI FLOOD
    // =========================
    if(chat.isGroup){
        if(!flood[sender]){
            flood[sender]={msg:1,time:Date.now()};
        } else {
            flood[sender].msg++;
            if(flood[sender].msg >=5 && Date.now()-flood[sender].time < 5000){
                await msg.reply("⚠️ Evite flood.");
                console.log("🚫 FLOOD:",sender);
                flood[sender]={msg:0,time:Date.now()};
                return;
            }
        }
        setTimeout(()=>{
            if(flood[sender]) flood[sender].msg=0;
        },6000);
    }

    // =========================
    // ANTI LINK
    // =========================
    if(chat.isGroup && msg.body.includes("http")){
        const participants = chat.participants;
        const author = participants.find(p => p.id._serialized===msg.author);
        if(!author || !author.isAdmin){
            try{
                await msg.delete(true);
                await chat.sendMessage(
`🚫 *LINK REMOVIDO*

Links não são permitidos neste grupo.`
                );
                console.log("🚫 LINK REMOVIDO:",sender);
            }catch(e){}
        }
    }

    // =========================
    // COMANDOS
    // =========================
    if(!msg.body.startsWith(prefix)) return;

    const args = msg.body.slice(prefix.length).trim().split(/ +/);
    const comando = args.shift().toLowerCase();
    console.log(`⚡ COMANDO: ${comando}`);

    // =========================
    // !OI
    // =========================
    if(comando === "oi"){
        await msg.reply(
`👋 Olá!

⚔️ *BOT OFICIAL DA COMUNIDADE SPARTA*

Use *!menu* para ver os comandos.

Disciplina • Respeito • Honra`
        );
    }

    // =========================
    // !MENU
    // =========================
    if(comando === "menu"){
        await msg.reply(
`⚔️ *MENU SPARTA*

👋 !oi
📜 !regras
🔨 !ban @usuario
🔒 !privar
🔓 !desprivar

Use os comandos com responsabilidade.`
        );
    }

    // =========================
    // !REGRAS
    // =========================
    if(comando === "regras"){
        await msg.reply(
`📜 *REGRAS DA COMUNIDADE SPARTA*

1️⃣ Proibido pornografia
2️⃣ Proibido flood
3️⃣ Proibido mensagens inadequadas
4️⃣ Proibido figurinhas violentas
5️⃣ Proibido desrespeito
6️⃣ Proibido conteúdo ilegal

⚠️ Descumprimento resulta em remoção.`
        );
    }

    // =========================
    // !BAN
    // =========================
    if(comando === "ban"){
        if(!chat.isGroup)
            return msg.reply("❌ Apenas em grupos.");

        const participants = chat.participants;
        const admin = participants.find(p => p.id._serialized===msg.author);

        if(!admin || !admin.isAdmin)
            return msg.reply("❌ Apenas administradoras podem banir usuários.");

        const alvo = msg.mentionedIds[0];
        if(!alvo)
            return msg.reply("⚠️ Marque a usuária que deseja remover.");

        const alvoAdmin = participants.find(p => p.id._serialized === alvo && p.isAdmin);
        if(alvoAdmin)
            return msg.reply("❌ Não é possível banir outra administradora.");

        try{
            await chat.removeParticipants([alvo]);
            await msg.reply(
`🔨 *MODERAÇÃO SPARTA*

Usuária removida do grupo.`
            );
            console.log("🔨 BAN:",alvo);
        }catch(e){
            console.log("❌ ERRO BAN:",e);
        }
    }

    // =========================
    // !PRIVAR / !DESPRIVAR
    // =========================
    if(comando === "privar"){
        if(!chat.isGroup)
            return msg.reply("❌ Apenas em grupos.");
        const admin = chat.participants.find(p => p.id._serialized===msg.author && p.isAdmin);
        if(!admin)
            return msg.reply("❌ Apenas administradoras podem usar este comando.");
        await chat.setMessagesAdminsOnly(true);
        await msg.reply("🔒 O grupo foi privado, apenas administradoras podem enviar mensagens.");
    }

    if(comando === "desprivar"){
        if(!chat.isGroup)
            return msg.reply("❌ Apenas em grupos.");
        const admin = chat.participants.find(p => p.id._serialized===msg.author && p.isAdmin);
        if(!admin)
            return msg.reply("❌ Apenas administradoras podem usar este comando.");
        await chat.setMessagesAdminsOnly(false);
        await msg.reply("🔓 O grupo foi desprivado, todas podem enviar mensagens novamente.");
    }

});

client.initialize();