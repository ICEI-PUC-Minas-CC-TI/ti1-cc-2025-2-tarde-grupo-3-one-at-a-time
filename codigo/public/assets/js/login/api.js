// api.js

// const API_URL_BASE = 'http://localhost:3000'; 

function getAuthHeader() {
    const user = getUsuarioLogado(); 

    if (!user) {
        window.location.href = 'login.html';
        throw new Error('Usuário não logado.');
    }
    return {
        'Content-Type': 'application/json',
        'X-User-ID': user.id 
    };
}

async function getItensDoUsuario(entidade) {
    const user = getUsuarioLogado(); 

    if (!user) {
        window.location.href = 'login.html';
        throw new Error('Usuário não logado.');
    }

    // Filtra pela propriedade 'usuarioID' do usuário logado
    const response = await fetch(`${API_URL_BASE}/${entidade}?usuarioID=${user.id}`);
    
    if (!response.ok) {
        throw new Error(`Erro ao buscar ${entidade}. Status: ${response.status}`);
    }
    return response.json();
}

async function criarItemParaUsuario(entidade, novoItem) {
    const user = getUsuarioLogado();

    if (!user) {
        window.location.href = 'login.html';
        throw new Error('Usuário não logado.');
    }

    // Adiciona o ID do usuário ao objeto antes de enviar
    const itemComUsuario = { 
        ...novoItem, 
        usuarioID: user.id 
    };

    const response = await fetch(`${API_URL_BASE}/${entidade}`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(itemComUsuario)
    });

    if (!response.ok) {
        throw new Error(`Erro ao criar ${entidade}. Status: ${response.statusText}`);
    }

    return response.json();
}

async function apiRequest(method, entidade, id, data = null) {
    if (!getUsuarioLogado()) {
        window.location.href = 'login.html';
        throw new Error('Usuário não logado.');
    }

    const headers = getAuthHeader();
    let url = `${API_URL_BASE}/${entidade}/${id}`;
    let config = {
        method: method,
        headers: headers,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, config);

    if (!response.ok) {
        if (response.status === 404) {
             throw new Error(`Item ${entidade} ID ${id} não encontrado ou acesso negado.`);
        }
        throw new Error(`Falha na operação ${method} em ${entidade}. Status: ${response.status}`);
    }
    
    return response;
}