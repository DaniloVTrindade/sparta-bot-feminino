// src/commands/menu.js
// Comandos de menu e informação

export function menuCommands(register) {
    register("oi", async (sock, from, sender, args, m, isGroup) => {
        await sock.sendMessage(from, {
            text: `👋 Olá 😊\n\nEu sou a *Mita* 💖\n\nEstou aqui para ajudar e manter o grupo organizado ✨\n\nDigite *!menu* para ver os comandos disponíveis 🙂`,
        });
    });

    register("menu", async (sock, from, sender, args, m, isGroup) => {
        await sock.sendMessage(from, {
            text: `💖 *MENU DA MITA*\n\n👋 !oi → falar comigo\n📜 !regras → ver as regras\n🔨 !ban @usuária → remover alguém\n🔒 !privar → só admins falam\n🔓 !desprivar → liberar geral\n👑 !admins → lista de administradoras\n🎯 !frase → frase motivacional\n⏰ !hora → horário atual\n⚙️ !prefix <símbolo> → mudar prefixo (só admin)\n💬 !setwelcome <msg> → mudar boas-vindas (só admin)\n\nUse com responsabilidade, viu? 😌✨`,
        });
    });

    register("regras", async (sock, from, sender, args, m, isGroup) => {
        await sock.sendMessage(from, {
            text: `📜 *REGRINHAS DA MITA* 💖\n\n1️⃣ Nada de conteúdo +18 🚫\n2️⃣ Sem flood, por favor 🙏\n3️⃣ Respeito sempre 💅\n4️⃣ Nada de violência 🚫\n5️⃣ Sem brigas 😤\n6️⃣ Nada ilegal ⚠️\n\nQuem não seguir... eu vou agir 😌🔨`,
        });
    });
}
