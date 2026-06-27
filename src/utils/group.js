// src/utils/group.js
// Funções utilitárias para grupos

/**
 * Verifica se um usuário é administrador do grupo
 */
export async function isAdmin(sock, groupId, userId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const user = metadata.participants.find(p => p.id === userId);
        if (!user) return false;
        return user.admin === "admin" || user.admin === "superadmin";
    } catch (e) {
        console.log("⚠️ Erro isAdmin:", e);
        return false;
    }
}

/**
 * Retorna lista de admins do grupo
 */
export async function listAdmins(sock, groupId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        return metadata.participants
            .filter(p => p.admin === "admin" || p.admin === "superadmin")
            .map(p => p.id);
    } catch (e) {
        console.log("⚠️ Erro listAdmins:", e);
        return [];
    }
}

/**
 * Verifica se é uma mensagem de grupo
 */
export function isGroupMessage(jid) {
    return jid.endsWith("@g.us");
}
