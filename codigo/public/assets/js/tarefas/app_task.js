// app_task.js

// const API_URL é substituída pelas funções de api.js
let tasks = [];

// Referências aos elementos do DOM
const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const idInput = document.getElementById('taskID'); // Campo hidden para UPDATE
const nomeInput = document.getElementById('nome');
const vencimentoInput = document.getElementById('vencimento');
const saveButton = document.getElementById('saveButton');

// Campos adicionais
const descricaoInput = document.getElementById('descricao');
const prioridadeInput = document.getElementById('prioridade');
const feitoInput = document.getElementById('feito');
const deleteIDInput = document.getElementById('deleteID'); // Para deletar por ID


// ----------------------------------------------------
// READ (LER) - Função para buscar e exibir APENAS as tarefas do USUÁRIO LOGADO
// ----------------------------------------------------
async function fetchTasks() {
    taskList.innerHTML = '<li>Buscando tarefas do usuário...</li>';
    try {
        // *** MUDANÇA CRUCIAL: Usa api.js para filtrar por usuarioID ***
        tasks = await getItensDoUsuario('tarefas'); 
        
        tasks.sort((a, b) => (a.id > b.id) ? 1 : -1);
        
        renderTasks();

    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        if (error.message.includes('não logado')) return; // O api.js já redireciona
        taskList.innerHTML = `<li>Erro ao carregar tarefas: ${error.message}</li>`;
    }
}

// Função para renderizar as tarefas na lista HTML (mantida similar)
function renderTasks() {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<li>Nenhuma tarefa encontrada.</li>';
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="task-details">
                <strong>ID ${task.id}: ${task.nome}</strong> - Vencimento: ${task.vencimento}
                <br><small>Prioridade: ${task.prioridade} | Feito: ${task.feito ? 'Sim' : 'Não'} | UserID: ${task.usuarioID}</small>
            </div>
            <div class="task-actions">
                <button onclick="loadTaskForUpdate('${task.id}')" class="btn btn-primary my-2">Editar</button>
                <button onclick="deleteTask('${task.id}')" class="btn btn-danger my-2-">Deletar</button>
            </div>
        `;
        taskList.appendChild(li);
    });
}


// ----------------------------------------------------
// CREATE (CRIAR) / UPDATE (ATUALIZAR)
// ----------------------------------------------------
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = idInput.value.trim();
    const isUpdate = !!id; // Se o ID hidden estiver preenchido, é um UPDATE

    if (!nomeInput.value.trim() || !vencimentoInput.value) {
        alert('Nome e Vencimento são obrigatórios!');
        return;
    }

    const taskData = {
        // usuarioID é INJETADO pelo criarItemParaUsuario ou jã existe no PUT
        nome: nomeInput.value,
        descricao: descricaoInput.value || "Descrição não informada.",
        prioridade: prioridadeInput.value,
        vencimento: vencimentoInput.value,
        feito: feitoInput.checked
    };

    try {
        saveButton.disabled = true;
        saveButton.textContent = isUpdate ? 'Atualizando...' : 'Criando...';

        if (isUpdate) {
            // *** MUDANÇA: Usa apiRequest para PUT ***
            await apiRequest('PUT', 'tarefas', id, taskData);
            alert(`Tarefa ${id} atualizada com sucesso!`);
        } else {
            // *** MUDANÇA CRUCIAL: Usa criarItemParaUsuario para injetar usuarioID ***
            await criarItemParaUsuario('tarefas', taskData);
            alert('Tarefa criada com sucesso!');
        }

        resetForm(); 
        await fetchTasks();
    } catch (error) {
        console.error('Erro ao salvar tarefa:', error);
        alert(`Erro ao salvar tarefa: ${error.message}`);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = isUpdate ? 'Atualizar Tarefa' : 'Criar Tarefa';
    }
});

// Função auxiliar para carregar dados no formulário para edição
function loadTaskForUpdate(id) {
    const taskToEdit = tasks.find(t => t.id == id); // Usa == para evitar problemas de tipo (int vs string)

    if (taskToEdit) {
        idInput.value = taskToEdit.id; // ID hidden
        nomeInput.value = taskToEdit.nome;
        vencimentoInput.value = taskToEdit.vencimento;
        descricaoInput.value = taskToEdit.descricao;
        prioridadeInput.value = taskToEdit.prioridade;
        feitoInput.checked = taskToEdit.feito;

        saveButton.textContent = 'Atualizar Tarefa';
    } else {
        alert(`Tarefa com ID ${id} não encontrada!`);
    }
}

// Função para limpar e resetar o formulário
function resetForm() {
    taskForm.reset();
    idInput.value = ''; // Limpa o ID hidden
    saveButton.textContent = 'Criar Tarefa';
}


// ----------------------------------------------------
// DELETE (DELETAR)
// ----------------------------------------------------
async function deleteTask(id) {
    if (!confirm(`Tem certeza que deseja deletar a tarefa ID ${id}?`)) {
        return;
    }
    
    try {
        // *** MUDANÇA: Usa apiRequest para DELETE ***
        await apiRequest('DELETE', 'tarefas', id);

        alert(`Tarefa ID ${id} deletada com sucesso!`);
        await fetchTasks(); // Recarrega a lista
    } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        alert(`Erro ao deletar tarefa: ${error.message}`);
    }
}

// Função para deletar pelo ID digitado no campo específico
function deleteTaskById() {
    const idToDelete = deleteIDInput.value.trim();
    if (idToDelete) {
        deleteTask(idToDelete);
        deleteIDInput.value = ''; // Limpa o campo
    } else {
        alert('Por favor, digite o ID da tarefa a ser deletada.');
    }
}


// Inicializa a aplicação
document.addEventListener('DOMContentLoaded', fetchTasks);