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

const timerDisplay = document.getElementById('timer');
const timerInput = document.querySelector('.timer');
const beginBtn = document.querySelector('#begin');
const pauseBtn = document.querySelector('#pause');
const cancelBtn = document.querySelector('#cancel');
const radioButtons = document.querySelectorAll('input[name="pomodoro-mode"]');
const taskInput = document.getElementById('taskinput');
const addTaskBtn = document.getElementById('speciallittlefuck');
const taskContainer = document.querySelector('.tarefas');

function initTimer() {
    seconds = TIMER_MODES[timerMode];
    if (timerInput) {
        const mins = Math.floor(seconds / 60);
        timerInput.placeholder = mins.toString();
        timerInput.value = '';
    }
    updateTimerDisplay();
}

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(seconds);
}

function startTimer() {
    if (isRunning) return;
    
    if (initialSeconds === 0) {
        initialSeconds = seconds;
    }
    
    isRunning = true;
    timerInput.style.display = 'none';
    timerDisplay.style.display = 'block';
    beginBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
    
    interval = setInterval(() => {
        if (seconds > 0) {
            seconds--;
            updateTimerDisplay();
        } else {
            const durationInMinutes = Math.floor(initialSeconds / 60);
            saveTimerHistory(timerMode, durationInMinutes);
            stopTimer();
            playNotificationSound();
            alert('Timer finished!');
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning) return;
    
    isRunning = false;
    clearInterval(interval);
    interval = null;
    beginBtn.textContent = 'Continuar';
    beginBtn.classList.add('small');
    beginBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
}

function stopTimer() {
    isRunning = false;
    clearInterval(interval);
    interval = null;
    initialSeconds = 0;
    
    timerInput.style.display = 'block';
    timerDisplay.style.display = 'none';
    beginBtn.style.display = 'inline-block';
    beginBtn.textContent = 'Comece';
    beginBtn.classList.remove('small');
    pauseBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    
    initTimer();
}

function playNotificationSound() {
    console.log('Timer terminado!');
}

function changeMode(mode) {
    if (isRunning) {
        if (!confirm('Você deseja parar o timer atual para mudar de modo?')) {
            return;
        }
        stopTimer();
    }
    
    timerMode = mode;
    initTimer();
}

beginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isRunning && timerInput.style.display !== 'none') {
        const customMinutes = parseInt(timerInput.value);
        if (customMinutes && customMinutes > 0 && customMinutes <= 60) {
            seconds = customMinutes * 60;
        } else {
            seconds = TIMER_MODES[timerMode];
        }
        updateTimerDisplay();
    }
    startTimer();
});

pauseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    pauseTimer();
});

cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    stopTimer();
});

radioButtons[0].addEventListener('change', () => changeMode('pomodoro'));
radioButtons[1].addEventListener('change', () => changeMode('shortBreak'));
radioButtons[2].addEventListener('change', () => changeMode('longBreak'));

radioButtons[0].checked = true;

initTimer();

function saveTimerHistory(mode, duration) {
    fetch(TIMER_URL)
    .then(response => response.json())
    .then(timers => {
        let maxId = 0;
        timers.forEach(timer => {
            const id = parseInt(timer.id);
            if (!isNaN(id) && id > maxId) {
                maxId = id;
            }
        });
        
        const newId = maxId + 1;
        const now = new Date();
        
        return fetch(TIMER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: newId,
                mode: mode,
                duration: duration,
                timestamp: now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            })
        });
    })
    .then(response => {
        if (!response.ok) {
            console.log('Erro ao salvar o histórico do timer.');
            return;
        }
        console.log('Histórico do timer salvo com sucesso.');
        setTimeout(() => {
            location.reload();
        }, 2000);
    })
    .catch(error => {
        console.error('Erro na requisição:', error);
    });
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

function displayTimerHistory() {
    fetch(TIMER_URL)
    .then(response => response.json())
    .then(timers => {
        const recentTimers = timers.slice(-3).reverse();
        
        if (recentTimers[0]) {
            const timer = recentTimers[0];
            history1El.innerHTML = `
                <span class="timer-length">${timer.duration} min</span>
                <span class="timer-type">${timer.mode}</span>
                <button class="deletar btn btn-danger" data-id="${timer.id}">
                    <i class="bi bi-trash"></i>
                </button>
            `;
        }
        
        if (recentTimers[1]) {
            const timer = recentTimers[1];
            history2El.innerHTML = `
                <span class="timer-length">${timer.duration} min</span>
                <span class="timer-type">${timer.mode}</span>
                <button class="deletar btn btn-danger" data-id="${timer.id}">
                    <i class="bi bi-trash"></i>
                </button>
            `;
        } else {
            history2El.style.display = 'none';
        }
        
        if (recentTimers[2]) {
            const timer = recentTimers[2];
            history3El.innerHTML = `
                <span class="timer-length">${timer.duration} min</span>
                <span class="timer-type">${timer.mode}</span>
                <button class="deletar btn btn-danger" data-id="${timer.id}">
                    <i class="bi bi-trash"></i>
                </button>
            `;
        } else {
            history3El.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error loading timer history:', error);
    });
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.deletar');
    if (!btn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rawId = btn.getAttribute('data-id');
    console.log('delete click, raw data-id:', rawId);
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
        console.warn('invalid id for delete:', rawId);
        return;
    }
    deleteTimer(id);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayTimerHistory);
} else {
    displayTimerHistory();
}

function addTask(mode, description, duration, timestamp) {
    const taskEl = document.createElement('div');
    taskEl.classList.add('tarefa');

    const span = (cls, text) => {
        const s = document.createElement('span');
        s.className = cls;
        s.textContent = text;
        return s;
    };

    taskEl.appendChild(span('task-mode', mode));
    taskEl.appendChild(span('task-desc', description));
    taskEl.appendChild(span('task-duration', `${duration} min`));
    taskEl.appendChild(span('task-timestamp', timestamp));

    if (taskContainer && taskContainer.appendChild) {
        taskContainer.appendChild(taskEl);
    }
}

