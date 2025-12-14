const TIMER_URL = 'http://localhost:3000/timer';

let seconds = 0;
let interval = null;
let timerMode = 'pomodoro';
let isRunning = false;
let initialSeconds = 0; 

const TIMER_MODES = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
};

const radioButtonsType = document.querySelectorAll('input[name="type-mode"]');
const radioButtonsSort = document.querySelectorAll('input[name="sort-mode"]');
const taskInput = document.getElementById('taskinput');
const taskContainer = document.querySelector('.tarefas');

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(seconds);
}

async function deleteTimer(id) {
    try {
        const res = await fetch(`${TIMER_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            console.log('Erro ao deletar o timer.');
            return;
        }
        console.log('Timer deletado com sucesso.');
        displayTimerHistory();
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

let history1El = document.getElementById('history1');
let history2El = document.getElementById('history2');
let history3El = document.getElementById('history3');
let history4El = document.getElementById('history4');
let history5El = document.getElementById('history5');
let history6El = document.getElementById('history6');
let history7El = document.getElementById('history7');
let history8El = document.getElementById('history8');

function displayTimerHistory() {
    const selectedTypeRadio = document.querySelector('input[name="type-mode"]:checked');
    const currentFilter = selectedTypeRadio ? selectedTypeRadio.value : 'all';
    
    const selectedSortRadio = document.querySelector('input[name="sort-mode"]:checked');
    const currentSort = selectedSortRadio ? selectedSortRadio.value : 'recent';
    
    fetch(TIMER_URL)
    .then(response => response.json())
    .then(timers => {
        let filteredTimers = timers;
        if (currentFilter && currentFilter !== 'all') {
            filteredTimers = timers.filter(timer => timer.mode === currentFilter);
        }
        
        if (currentSort === 'duration') {
            filteredTimers = [...filteredTimers].sort((a, b) => b.duration - a.duration);
        } else if (currentSort === 'type') {
            filteredTimers = [...filteredTimers].sort((a, b) => a.mode.localeCompare(b.mode));
        } else {
            filteredTimers = [...filteredTimers].reverse();
        }
        
        const container = document.querySelector('.tarefas');
        container.innerHTML = '';
        
        filteredTimers.forEach(timer => {
            const taskEl = document.createElement('label');
            taskEl.className = 'task';
            const timestampWithoutSeconds = timer.timestamp.substring(0, timer.timestamp.lastIndexOf(':'));
            taskEl.innerHTML = `
                <span class="timer-length">${timer.duration} min</span>
                <span class="timer-type">${timer.mode}</span>
                <span class="timer-date">${timestampWithoutSeconds}</span>
            `;
            container.appendChild(taskEl);
        });
        
        document.querySelectorAll('.deletar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                deleteTimer(id);
            });
        });
    })
    .catch(error => {
        console.error('Error loading timer history:', error);
    });
}

radioButtonsType.forEach(radio => {
    radio.addEventListener('change', displayTimerHistory);
});

radioButtonsSort.forEach(radio => {
    radio.addEventListener('change', displayTimerHistory);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayTimerHistory);
} else {
    displayTimerHistory();
}

