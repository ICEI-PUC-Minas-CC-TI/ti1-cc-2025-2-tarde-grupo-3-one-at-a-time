const API_URL = 'http://localhost:3000/tarefas';
let tasks = [];
const tasksContainer = document.getElementById('tasksContainer');

// Função para buscar as tarefas da API
async function fetchTasks() {
    tasksContainer.innerHTML = '<p>Buscando tarefas...</p>';
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status}`);
        }
        
        tasks = await response.json();
        
        // Ordena as tarefas por ID
        tasks.sort((a, b) => (a.id > b.id) ? 1 : -1);
        
        renderCards();

    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        tasksContainer.innerHTML = `
            <p style="color: red;">
                Erro ao carregar tarefas: ${error.message}. 
                Verifique se o json-server está rodando em ${API_URL}.
            </p>`;
    }
}

// Função para renderizar os cards de tarefas
function renderCards() {
    tasksContainer.innerHTML = '';
    
    if (tasks.length === 0) {
        tasksContainer.innerHTML = '<p>Nenhuma tarefa encontrada.</p>';
        return;
    }

    tasks.forEach(task => {
        const card = document.createElement('div');
        // Define a classe de cor baseada na prioridade
        card.className = `task-card ${task.prioridade}`;
        card.setAttribute('data-id', task.id);

        // Adiciona a classe 'completed' se a tarefa estiver feita
        if (task.feito) {
            card.classList.add('completed');
        }

        // Formata a data de vencimento (assume formato D/M/A)
        let formattedDate = task.vencimento;
        try {
            // Tenta formatar a data se estiver no formato YYYY-MM-DD (input type="date")
            const dateParts = task.vencimento.split('-');
            if (dateParts.length === 3) {
                formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            }
        } catch (e) {
            // Se falhar, usa a string original
        }

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

async function toggleTaskStatus(id, event) {
    event.stopPropagation();

    const taskCard = document.querySelector(`.task-card[data-id="${id}"]`);
    const isChecked = event.target.checked;
    const taskIndex = tasks.findIndex(t => t.id === id);

    if (taskIndex === -1) {
        alert('Tarefa não encontrada localmente!');
        return;
    }

    const updatedTaskData = { ...tasks[taskIndex], feito: isChecked };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feito: isChecked }) 
        });

        if (!response.ok) {
            throw new Error(`Falha ao atualizar status da tarefa ${id}! status: ${response.status}`);
        }

        tasks[taskIndex].feito = isChecked;
        if (isChecked) {
            taskCard.classList.add('completed');
        } else {
            taskCard.classList.remove('completed');
        }
        
        alert(`Status da Tarefa ${id} alterado para: ${isChecked ? 'Feito' : 'Pendente'}`);
    } catch (error) {
        console.error('Erro ao atualizar status da tarefa:', error);
        alert(`Erro ao atualizar status: ${error.message}`);
        event.target.checked = !isChecked; 
    }
}

document.addEventListener('DOMContentLoaded', fetchTasks);