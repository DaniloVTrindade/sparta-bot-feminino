const { Client, LocalAuth } = require('whatsapp-web.js'); 
const qrcode = require('qrcode-terminal');

const BOT_START_TIME = Math.floor(Date.now() / 1000);
const prefix = "!";

const raidControl = {};
const flood = {};
const groupMuted = {}; // para controlar grupos "privados"

process.on("unhandledRejection", (reason) => {
    console.log("⚠️ ERRO NÃO TRATADO:", reason);
});

process.on("uncaughtException", (error) => {
    console.log("⚠️ EXCEÇÃO:", error);
});

console.clear();
console.log("⚙️ Iniciando BOT SPARTA...");

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "feminino" }),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox","--disable-setuid-sandbox"],
        executablePath: "/usr/bin/chromium"
    }
});

client.on('qr', (qr) => {
    console.log("📱 Escaneie o QR Code");
    qrcode.generate(qr,{small:true});
});

client.on('ready', () => {
    console.log("⚔️ BOT SPARTA ONLINE");
});

// =========================
// BOAS VINDAS + ANTI RAID
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
`🚨 *ALERTA DE RAID DETECTADO*  

Muitos usuários entraram rapidamente.  
Administradores, por favor, verifiquem o grupo.`
        );
        console.log("🚨 POSSÍVEL RAID DETECTADO");
        return;
    }

    await chat.sendMessage(
`🌸 Olá, @${user.split("@")[0]}!  

Seja muito bem-vindo(a) à *COMUNIDADE SPARTA*! 💖  

📜 Digite *!regras* para conhecer nossas regras  
📋 Digite *!menu* para explorar os comandos  

Lembre-se: respeito e gentileza acima de tudo 💕`,
        { mentions:[user] }
    );

    console.log("👋 Novo membro:",user);
});

// =========================
// SISTEMA DE MENSAGENS
// =========================

client.on('message_create', async (msg) => {

    if(msg.timestamp < BOT_START_TIME) return;
    if(msg.fromMe) return;

    const chat = await msg.getChat();
    if(!chat.isGroup) return; // ignora PV

    const sender = msg.author || msg.from;
    const hora = new Date().toLocaleTimeString();
    console.log(`📩 ${sender} | ${hora} | ${msg.body}`);

    // =========================
    // ANTI FLOOD
    // =========================

    if(!flood[sender]){
        flood[sender] = {msg:1, time:Date.now()};
    }else{
        flood[sender].msg++;
        if(flood[sender].msg >=5 && Date.now() - flood[sender].time < 5000){
            await msg.reply("⚠️ Por favor, evite enviar muitas mensagens seguidas.");
            console.log("🚫 FLOOD:", sender);
            flood[sender] = {msg:0, time:Date.now()};
            return;
        }
    }

    setTimeout(()=>{
        if(flood[sender]) flood[sender].msg=0;
    }, 6000);

    // =========================
    // ANTI LINK
    // =========================

    if(msg.body.includes("http")){
        const participants = chat.participants;
        const author = participants.find(p => p.id._serialized === msg.author);
        if(!author || !author.isAdmin){
            try{
                await msg.delete(true);
                await chat.sendMessage(
`🚫 *LINK REMOVIDO*  

Links não são permitidos neste grupo 💖`);
                console.log("🚫 LINK REMOVIDO:", sender);
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
    // BLOQUEIO DE MENSAGENS PARA GRUPO PRIVADO
    // =========================
    if(groupMuted[chat.id._serialized] && comando !== "desprivar"){
        const participants = chat.participants;
        const author = participants.find(p => p.id._serialized === msg.author);
        if(!author.isAdmin){
            await msg.delete(true).catch(()=>{});
            return;
        }
    }

    // =========================
    // !OI
    // =========================
    if(comando === "oi"){
        await msg.reply(
`🌸 Olá!  

Eu sou o *BOT OFICIAL DA COMUNIDADE SPARTA* 💖  
Use *!menu* para conhecer todos os comandos.  
Amor, respeito e alegria sempre! 🌷`
        );
    }

    // =========================
    // !MENU
    // =========================
    if(comando === "menu"){
        await msg.reply(
`🌸 *MENU SPARTA* 💕  

👋 !oi  
📜 !regras  
🔨 !ban @usuario  
🔒 !privar  
🔓 !desprivar  

Use os comandos com gentileza e responsabilidade. 💖`
        );
    }

    // =========================
    // !REGRAS
    // =========================
    if(comando === "regras"){
        await msg.reply(
`📜 *REGRAS DA COMUNIDADE SPARTA* 💕  

1️⃣ Proibido conteúdo pornográfico  
2️⃣ Proibido flood  
3️⃣ Proibido mensagens ofensivas  
4️⃣ Proibido figurinhas violentas  
5️⃣ Proibido desrespeito  
6️⃣ Proibido conteúdo ilegal  

⚠️ Quem descumprir será removido(a) do grupo com amor 💖`
        );
    }

    // =========================
    // !BAN
    // =========================
    if(comando === "ban"){

        const participants = chat.participants;
        const admin = participants.find(p => p.id._serialized === msg.author);

        if(!admin || !admin.isAdmin){
            return msg.reply("❌ Apenas administradores do grupo podem banir usuários.");
        }

        const alvo = msg.mentionedIds[0];
        if(!alvo) return msg.reply("⚠️ Por favor, marque o usuário que deseja remover.");

        const target = participants.find(p => p.id._serialized === alvo);
        if(target && target.isAdmin){
            return msg.reply("❌ Não é possível banir outro administrador. 💖");
        }

        try{
            await chat.removeParticipants([alvo]);
            await msg.reply(
`🔨 *MODERAÇÃO SPARTA* 💕  

Usuário removido com sucesso.`);
            console.log("🔨 BAN:", alvo);
        }catch(e){
            console.log("❌ ERRO BAN:", e);
        }
    }

    // =========================
    // !PRIVAR - só admins falam
    // =========================
    if(comando === "privar"){
        const participants = chat.participants;
        const admin = participants.find(p => p.id._serialized === msg.author);

        if(!admin || !admin.isAdmin){
            return msg.reply("❌ Apenas administradores podem privar o grupo.");
        }

        groupMuted[chat.id._serialized] = true;
        await chat.sendMessage("🔒 O grupo agora está *privado*. Apenas administradores podem enviar mensagens 💖");
    }

    // =========================
    // !DESPRIVAR - todos falam
    // =========================
    if(comando === "desprivar"){
        const participants = chat.participants;
        const admin = participants.find(p => p.id._serialized === msg.author);

        if(!admin || !admin.isAdmin){
            return msg.reply("❌ Apenas administradores podem liberar o grupo.");
        }

        groupMuted[chat.id._serialized] = false;
        await chat.sendMessage("🔓 O grupo voltou a ser *público*. Todos podem enviar mensagens 🌸");
    }

});

client.initialize();