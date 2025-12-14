// Constante para a URL da API, conforme solicitado
const API_URL = 'http://localhost:3000/tarefas';
// Variável para armazenar as tarefas localmente
let tasks = [];

// Referências aos elementos do DOM
const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const idInput = document.getElementById('id');
const nomeInput = document.getElementById('nome');
const vencimentoInput = document.getElementById('vencimento');
const saveButton = document.getElementById('saveButton');

// Campos adicionais
const descricaoInput = document.getElementById('descricao');
const usuarioIDInput = document.getElementById('usuarioID');
const prioridadeInput = document.getElementById('prioridade');
const feitoInput = document.getElementById('feito');


// ----------------------------------------------------
// READ (LER) - Função para buscar e exibir todas as tarefas
// ----------------------------------------------------
async function fetchTasks() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status}`);
        }
        
        tasks = await response.json();
        
        // Ordena as tarefas pelo ID (do json-server normalmente já vem assim)
        tasks.sort((a, b) => (a.id > b.id) ? 1 : -1);
        
        renderTasks(); // Chama a função para exibir no HTML

    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        taskList.innerHTML = `<li>Erro ao carregar tarefas: ${error.message}. Verifique se o json-server está rodando em ${API_URL}.</li>`;
    }
}

// Função para renderizar as tarefas na lista HTML
function renderTasks() {
    taskList.innerHTML = ''; // Limpa a lista
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<li>Nenhuma tarefa encontrada.</li>';
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="task-details">
                <strong>ID ${task.id}: ${task.nome}</strong> - Vencimento: ${task.vencimento}
                <br><small>Prioridade: ${task.prioridade} | Feito: ${task.feito ? 'Sim' : 'Não'}</small>
            </div>
            <div class="task-actions">
                <button onclick="loadTaskForUpdate('${task.id}')">Editar</button>
                <button onclick="deleteTask('${task.id}')">Deletar</button>
            </div>
        `;
        taskList.appendChild(li);
    });
}


// ----------------------------------------------------
// CREATE (CRIAR) / UPDATE (ATUALIZAR) - Manipulação do Formulário
// ----------------------------------------------------
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const taskID = idInput.value.trim();
    const taskName = nomeInput.value.trim();
    const taskVencimento = vencimentoInput.value;
    
    if (!taskID || !taskName || !taskVencimento) {
        alert('ID, Nome e Vencimento são obrigatórios!');
        return;
    }

    // Cria o objeto de tarefa com todos os campos necessários para um POST completo
    const newTask = {
        id: taskID, // Usamos o ID do input, é responsabilidade do usuário garantir que seja único na criação
        usuarioID: parseInt(usuarioIDInput.value) || 1, 
        nome: taskName,
        descricao: descricaoInput.value || "Descrição não informada.",
        prioridade: prioridadeInput.value,
        vencimento: taskVencimento,
        feito: feitoInput.checked
    };

    // Verifica se a tarefa já existe para decidir entre POST (criar) ou PUT (atualizar)
    const existingTask = tasks.find(t => t.id === taskID);

    if (existingTask) {
        // Se a tarefa existe, é uma ATUALIZAÇÃO (PUT)
        await updateTask(taskID, newTask);
    } else {
        // Se a tarefa não existe, é uma CRIAÇÃO (POST)
        await createTask(newTask);
    }

    resetForm(); // Limpa o formulário após a operação
});

// CREATE (CRIAR)
async function createTask(task) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });

        if (!response.ok) {
            throw new Error(`Falha ao criar tarefa! status: ${response.status}`);
        }

        alert(`Tarefa ${task.id} criada com sucesso!`);
        await fetchTasks(); // Recarrega a lista
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        alert(`Erro ao criar tarefa: ${error.message}`);
    }
}

// UPDATE (ATUALIZAR)
async function updateTask(id, updatedTask) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT', // PUT para substituição total
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTask)
        });

        if (!response.ok) {
            throw new Error(`Falha ao atualizar tarefa ${id}! status: ${response.status}`);
        }

        alert(`Tarefa ${id} atualizada com sucesso!`);
        await fetchTasks(); // Recarrega a lista
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        alert(`Erro ao atualizar tarefa: ${error.message}`);
    }
}


// Função auxiliar para carregar dados no formulário para edição
function loadTaskForUpdate(id) {
    const taskToEdit = tasks.find(t => t.id === id);

    if (taskToEdit) {
        idInput.value = taskToEdit.id;
        nomeInput.value = taskToEdit.nome;
        vencimentoInput.value = taskToEdit.vencimento; // Formato YYYY-MM-DD
        descricaoInput.value = taskToEdit.descricao;
        usuarioIDInput.value = taskToEdit.usuarioID;
        prioridadeInput.value = taskToEdit.prioridade;
        feitoInput.checked = taskToEdit.feito;

        idInput.disabled = false; // Permite alterar o ID (se o servidor permitir)
        saveButton.textContent = 'Atualizar Tarefa';
        alert(`Carregando tarefa ID ${id} para edição.`);
    } else {
        alert(`Tarefa com ID ${id} não encontrada!`);
    }
}

// Função para limpar e resetar o formulário
function resetForm() {
    taskForm.reset();
    saveButton.textContent = 'Criar Tarefa';
    document.getElementById('taskID').value = '';
    idInput.disabled = false; 
}


// ----------------------------------------------------
// DELETE (DELETAR)
// ----------------------------------------------------
async function deleteTask(id) {
    if (!confirm(`Tem certeza que deseja deletar a tarefa ID ${id}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Falha ao deletar tarefa ${id}! status: ${response.status}`);
        }

        alert(`Tarefa ID ${id} deletada com sucesso!`);
        await fetchTasks(); // Recarrega a lista
    } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        alert(`Erro ao deletar tarefa: ${error.message}`);
    }
}

// Função para deletar pelo ID digitado no campo específico
function deleteTaskById() {
    const idToDelete = document.getElementById('deleteID').value.trim();
    if (idToDelete) {
        deleteTask(idToDelete);
        document.getElementById('deleteID').value = ''; // Limpa o campo
    } else {
        alert('Por favor, digite o ID da tarefa a ser deletada.');
    }
}


// Inicializa a aplicação carregando as tarefas ao abrir a página
document.addEventListener('DOMContentLoaded', fetchTasks);