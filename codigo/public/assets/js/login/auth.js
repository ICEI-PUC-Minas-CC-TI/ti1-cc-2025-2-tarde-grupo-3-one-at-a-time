// auth.js
const API_URL_BASE = 'http://localhost:3000';

function getUsuarioLogado() {
    const userStr = sessionStorage.getItem('usuario_logado');
    return userStr ? JSON.parse(userStr) : null;
}

async function login(email, senha) {
    const response = await fetch(`${API_URL_BASE}/usuarios?email=${email}`);
    const users = await response.json();

    if (users.length > 0) {
        const user = users[0];
        if (user.senha === senha) {
            delete user.senha;
            sessionStorage.setItem('usuario_logado', JSON.stringify(user));
            return { success: true };
        }
    }
    return { success: false, message: "E-mail ou senha inválidos." };
}

function logout() {
    sessionStorage.removeItem('usuario_logado');
    window.location.href = 'index.html';
}

function verificarPermissaoAdmin() {
    const user = getUsuarioLogado();
    if (!user || !user.admin) {
        alert("Acesso negado. Apenas administradores podem acessar esta página.");
        window.location.href = 'index.html';
        return false;
    }
    return true;
}