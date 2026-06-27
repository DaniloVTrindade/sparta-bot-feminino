// src/commands/fun.js
// Comandos divertidos

const frases = [
    "💪 Acredite em você mesma! Você é mais forte do que imagina.",
    "✨ O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
    "🌸 Seja a mudança que você quer ver no mundo.",
    "🌟 Não espere por oportunidades, crie-as.",
    "💖 Você é única e especial do seu próprio jeito.",
    "🎯 O segredo do sucesso é começar antes de estar pronto.",
    "🌺 A vida é curta demais para não ser feliz.",
    "👑 Seja sua própria prioridade.",
    "🌈 Depois da tempestade sempre vem o arco-íris.",
    "🔥 Você não falhou. Você aprendeu como não fazer.",
    "💫 O impossível é só questão de opinião.",
    "⭐ Pequenas atitudes fazem grandes diferenças.",
];

export function funCommands(register) {
    register("frase", async (sock, from, sender, args, m, isGroup) => {
        const frase = frases[Math.floor(Math.random() * frases.length)];
        await sock.sendMessage(from, { text: frase });
    });

    register("hora", async (sock, from, sender, args, m, isGroup) => {
        const agora = new Date();
        const data = agora.toLocaleDateString("pt-BR");
        const hora = agora.toLocaleTimeString("pt-BR");
        await sock.sendMessage(from, {
            text: `⏰ *Horário atual:* ${hora}\n📅 *Data:* ${data}`,
        });
    });
}
