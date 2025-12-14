// inf.js
// Depende de auth.js e api.js

const radioButtonsType = document.querySelectorAll('input[name="type-mode"]');
const radioButtonsSort = document.querySelectorAll('input[name="sort-mode"]');
const taskContainer = document.querySelector('.tarefas');
const loadingMsg = document.getElementById('loading-msg');

/**
 * Função global para deletar um timer. Chamada pelo botão HTML.
 */
window.deleteTimer = async function(id) {
    if (!confirm(`Tem certeza que deseja deletar o Timer ID ${id}?`)) {
        return;
    }
    
    try {
        // Usa apiRequest para DELETE
        await apiRequest('DELETE', 'timer', id);
        alert(`Timer ID ${id} deletado.`);
        displayTimerHistory(); // Recarrega a lista
    } catch (error) {
        console.error('Erro ao deletar timer:', error);
        alert(`Erro ao deletar timer: ${error.message}`);
    }
}

/**
 * Busca, filtra, ordena e exibe o histórico de timers do usuário logado.
 */
async function displayTimerHistory() {
    
    taskContainer.innerHTML = '<p>Carregando histórico...</p>';
    
    const selectedTypeRadio = document.querySelector('input[name="type-mode"]:checked');
    const currentFilter = selectedTypeRadio ? selectedTypeRadio.value : 'all';
    
    const selectedSortRadio = document.querySelector('input[name="sort-mode"]:checked');
    const currentSort = selectedSortRadio ? selectedSortRadio.value : 'recent';
    
    try {
        // *** MUDANÇA: Usa getItensDoUsuario para filtrar por usuarioID ***
        let timers = await getItensDoUsuario('timer');

        // Mapeamento e adaptação dos campos para consistência (duracao vs duration, tipo vs mode)
        timers = timers.map(timer => ({
            ...timer,
            mode: timer.tipo || timer.mode,
            duration: timer.duracao || timer.duration,
            timestamp: timer.nome.includes(' - ') ? timer.nome.split(' - ')[1] : 'N/A' // Simplesmente extrai data/hora se nome for 'mode - timestamp'
        }));


        let filteredTimers = timers;
        
        // 1. Filtragem por Tipo
        if (currentFilter && currentFilter !== 'all') {
            filteredTimers = timers.filter(timer => timer.mode === currentFilter);
        }
        
        // 2. Ordenação
        if (currentSort === 'duration') {
            filteredTimers = [...filteredTimers].sort((a, b) => b.duration - a.duration);
        } else if (currentSort === 'type') {
            filteredTimers = [...filteredTimers].sort((a, b) => a.mode.localeCompare(b.mode));
        } else {
            // Recente: ordenação por ID descendente (se não tiver timestamp real no DB)
            filteredTimers = [...filteredTimers].sort((a, b) => b.id - a.id);
        }
        
        
        taskContainer.innerHTML = '';
        
        if (filteredTimers.length === 0) {
            taskContainer.innerHTML = `<p class="alert alert-info">Nenhum timer encontrado para o filtro selecionado (${currentFilter}).</p>`;
            return;
        }

        // 3. Renderização
        filteredTimers.forEach(timer => {
            const taskEl = document.createElement('label');
            taskEl.className = 'task list-group-item d-flex justify-content-between align-items-center';
            
            taskEl.innerHTML = `
                <div>
                    <span class="badge bg-primary me-2">${timer.mode}</span>
                    <span class="timer-length">${timer.duration} min</span>
                </div>
                <div>
                    <small class="text-muted timer-date">${timer.timestamp}</small>
                    <button class="deletar btn btn-sm btn-danger ms-2" data-id="${timer.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            taskContainer.appendChild(taskEl);
        });
        
        // Adicionar listener de deleção
        document.querySelectorAll('.deletar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                window.deleteTimer(id); // Chama a função global de deleção
            });
        });
    } catch (error) {
        console.error('Error loading timer history:', error);
        if (error.message.includes('não logado')) return;
        taskContainer.innerHTML = `<p class="alert alert-danger">Erro ao carregar histórico: ${error.message}</p>`;
    }
}

// Event Listeners para Filtros e Ordenação
radioButtonsType.forEach(radio => {
    radio.addEventListener('change', displayTimerHistory);
});

radioButtonsSort.forEach(radio => {
    radio.addEventListener('change', displayTimerHistory);
});

// Inicialização
document.addEventListener('DOMContentLoaded', displayTimerHistory);