// app_cards.js

// const API_URL não é mais usada para o GET inicial
let tasks = [];
const tasksContainer = document.getElementById('tasksContainer');

// Função para buscar APENAS as tarefas do usuário logado
async function fetchTasks() {
    tasksContainer.innerHTML = '<p>Buscando tarefas...</p>';
    try {
        // *** MUDANÇA CRUCIAL: Usa api.js para filtrar por usuarioID ***
        tasks = await getItensDoUsuario('tarefas'); 
        
        tasks.sort((a, b) => (a.id > b.id) ? 1 : -1);
        
        renderCards();

    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        if (error.message.includes('não logado')) return; // O api.js já redireciona
        tasksContainer.innerHTML = `
            <p style="color: red;">
                Erro ao carregar tarefas: ${error.message}. 
                Verifique o servidor.
            </p>`;
    }
}

// Função para renderizar os cards de tarefas (Lógica de renderização similar)
function renderCards() {
    tasksContainer.innerHTML = '';
    
    if (tasks.length === 0) {
        tasksContainer.innerHTML = '<p>Nenhuma tarefa encontrada.</p>';
        return;
    }

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card ${task.prioridade}`;
        card.setAttribute('data-id', task.id);

        if (task.feito) {
            card.classList.add('completed');
        }

        let formattedDate = task.vencimento;
        try {
            const dateParts = task.vencimento.split('-');
            if (dateParts.length === 3) {
                formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            }
        } catch (e) {}

        card.innerHTML = `
            <div class="card-header">
                <h3>ID ${task.id}: ${task.nome}</h3>
                <input 
                    type="checkbox" 
                    id="feito-${task.id}" 
                    ${task.feito ? 'checked' : ''} 
                    onclick="toggleTaskStatus('${task.id}', event)"
                >
            </div>
            
            <div class="card-details">
                <p><strong>Descrição:</strong> ${task.descricao}</p>
                <p><strong>Vencimento:</strong> ${formattedDate}</p>
                <p><strong>Prioridade:</strong> ${task.prioridade}</p>
                <p class="small text-muted">UserID: ${task.usuarioID}</p>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                 card.classList.toggle('expanded');
            }
        });

        tasksContainer.appendChild(card);
    });
}

// Função para alternar o status da tarefa
async function toggleTaskStatus(id, event) {
    event.stopPropagation();

    const taskCard = document.querySelector(`.task-card[data-id="${id}"]`);
    const isChecked = event.target.checked;
    const taskIndex = tasks.findIndex(t => t.id == id);

    if (taskIndex === -1) {
        alert('Tarefa não encontrada localmente!');
        return;
    }

    try {
        // *** MUDANÇA: Usa apiRequest para PATCH ***
        // O apiRequest usa o ID do usuário para verificar a sessão, garantindo que a operação é segura.
        await apiRequest('PATCH', 'tarefas', id, { feito: isChecked });

        tasks[taskIndex].feito = isChecked;
        if (isChecked) {
            taskCard.classList.add('completed');
        } else {
            taskCard.classList.remove('completed');
        }
        
        console.log(`Status da Tarefa ${id} alterado para: ${isChecked ? 'Feito' : 'Pendente'}`);
    } catch (error) {
        console.error('Erro ao atualizar status da tarefa:', error);
        alert(`Erro ao atualizar status: ${error.message}`);
        event.target.checked = !isChecked; 
    }
}

document.addEventListener('DOMContentLoaded', fetchTasks);