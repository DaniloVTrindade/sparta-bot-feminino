// server.js
// Servidor HTTP mínimo para keep-alive (Railway, Render, etc.)
// Usa http nativo — sem dependências externas

import http from "http";

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><title>Bot Sparta</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:40px;">
            <h1>🌸 Bot Sparta — Mita Online</h1>
            <p>O bot está funcionando normalmente.</p>
        </body>
        </html>
    `);
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor HTTP rodando na porta ${PORT}`);
});
