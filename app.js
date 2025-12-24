// --- THEME MANAGEMENT ---
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');

// Apply theme immediately on load to prevent flickering
if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeToggle) themeToggle.checked = true;
}

// --- GLOBAL TIMER LOGIC ---
let globalCountdown; 

function initializeTimer() {
    clearInterval(globalCountdown);
    const timerState = JSON.parse(localStorage.getItem('timerState'));
    if (!timerState || timerState.status !== 'running') {
        return;
    }
    const endTime = timerState.endTime;
    let timeLeft = Math.round((endTime - Date.now()) / 1000);

    const runGlobalTimer = () => {
        if (timeLeft <= 0) {
            clearInterval(globalCountdown);
            handleTimerCompletion(timerState);
            return;
        }
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
        timeLeft--;
    };
    runGlobalTimer();
    globalCountdown = setInterval(runGlobalTimer, 1000);
}

function handleTimerCompletion(timerState) {
    const data = getStudyData();
    if (timerState.isSession) {
        data.stats.totalMinutes += timerState.sessionLength;
        const today = new Date().toISOString().split('T')[0];
        const lastSession = data.stats.lastSessionDate;
        if (lastSession !== today) {
            const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];
            data.stats.streak = (lastSession === yesterday) ? data.stats.streak + 1 : 1;
            data.stats.lastSessionDate = today;
        }
        data.studySessions.push({ date: new Date().toISOString(), duration: timerState.sessionLength });
        saveStudyData(data);
    }
    const isNowSession = !timerState.isSession;
    const nextDuration = isNowSession ? timerState.sessionLength : timerState.breakLength;
    const newEndTime = Date.now() + (nextDuration * 60 * 1000);
    localStorage.setItem('timerState', JSON.stringify({
        ...timerState,
        status: 'running',
        endTime: newEndTime,
        isSession: isNowSession
    }));
    alert(isNowSession ? 'Break over! Time for a new session.' : 'Session complete! Time for a break.');
    initializeTimer();
}

// --- DATA PERSISTENCE ---
function getStudyData() {
    const defaultData = { 
        tasks: [], 
        studySessions: [], 
        calendarEvents: {}, 
        stats: { totalMinutes: 0, streak: 0, lastSessionDate: null } 
    };
    const data = JSON.parse(localStorage.getItem('studyFlowData'));
    if (data && !data.calendarEvents) data.calendarEvents = {};
    return data || defaultData;
}

function saveStudyData(data) {
    localStorage.setItem('studyFlowData', JSON.stringify(data));
}

// Initialize timer state on any page load
initializeTimer();

// --- PAGE LOAD EVENT ---
document.addEventListener('DOMContentLoaded', () => {

    // 1. MOBILE MENU TOGGLE
    const menuToggle = document.getElementById('mobile-menu');
    const navList = document.getElementById('nav-list');
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('show');
        });
    }

    // 2. DARK MODE TOGGLE (Restored Logic)
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }

    // 3. NAVIGATION HIGHLIGHTER
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav ul a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active-link');
        }
    });
    
    // 4. DASHBOARD LOGIC (Tasks & Timer Controls)
    if (document.body.contains(document.getElementById('task-form'))) {
        const taskForm = document.getElementById('task-form');
        const taskList = document.getElementById('task-list');
        const timerDisplay = document.getElementById('timer-display');
        const sessionLengthDisplay = document.getElementById('session-length');
        const breakLengthDisplay = document.getElementById('break-length');
        
        let data = getStudyData();

        const renderTasks = () => {
            taskList.innerHTML = '';
            if (data.tasks.length === 0) {
                taskList.innerHTML = '<p>No tasks yet. Add one above!</p>';
                return;
            }
            data.tasks.forEach((task, index) => {
                const taskItem = document.createElement('div');
                taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
                taskItem.innerHTML = `
                    <span><strong>${task.title}</strong><br><small>Due: ${task.dueDate} | Subject: ${task.subject}</small></span>
                    <div class="actions">
                        <button class="complete-btn" data-index="${index}">${task.completed ? 'Undo' : 'Complete'}</button>
                        <button class="delete-btn" data-index="${index}">Delete</button>
                    </div>`;
                taskList.appendChild(taskItem);
            });
        };

        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            data.tasks.push({ 
                title: document.getElementById('task-title').value, 
                dueDate: document.getElementById('task-due-date').value, 
                subject: document.getElementById('task-subject').value, 
                completed: false 
            });
            saveStudyData(data);
            renderTasks();
            taskForm.reset();
        });

        taskList.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            if (e.target.classList.contains('complete-btn')) data.tasks[index].completed = !data.tasks[index].completed;
            if (e.target.classList.contains('delete-btn')) data.tasks.splice(index, 1);
            saveStudyData(data);
            renderTasks();
        });

        // Timer Controls
        document.getElementById('start-btn').addEventListener('click', () => {
            let timerState = JSON.parse(localStorage.getItem('timerState')) || {};
            const timeLeft = (timerState.status === 'paused' && timerState.timeLeft) ? timerState.timeLeft : (timerState.sessionLength || 25) * 60;
            localStorage.setItem('timerState', JSON.stringify({
                status: 'running',
                endTime: Date.now() + (timeLeft * 1000),
                isSession: timerState.isSession ?? true,
                sessionLength: timerState.sessionLength || 25,
                breakLength: timerState.breakLength || 5,
            }));
            initializeTimer();
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            const timerState = JSON.parse(localStorage.getItem('timerState'));
            if (!timerState || timerState.status !== 'running') return;
            localStorage.setItem('timerState', JSON.stringify({
                ...timerState,
                status: 'paused',
                timeLeft: Math.round((timerState.endTime - Date.now()) / 1000),
            }));
            clearInterval(globalCountdown);
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            clearInterval(globalCountdown);
            localStorage.removeItem('timerState');
            timerDisplay.textContent = "25:00";
        });

        renderTasks();
    }

    // 5. PROGRESS PAGE LOGIC
    if (document.body.contains(document.getElementById('total-hours'))) {
        const data = getStudyData();
        document.getElementById('total-hours').textContent = `${(data.stats.totalMinutes / 60).toFixed(1)}h`;
        document.getElementById('study-streak').textContent = `${data.stats.streak} days`;
        document.getElementById('completed-tasks').textContent = data.tasks.filter(t => t.completed).length;
    }

    // 6. CALENDAR LOGIC (With Today Circle & Today Button)
    if (document.body.contains(document.querySelector('.calendar-grid'))) {
        let data = getStudyData();
        const calendarGrid = document.querySelector('.calendar-grid');
        const monthYearDisplay = document.getElementById('month-year-display');
        let currentDate = new Date();
        const todayStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

        const renderCalendar = () => {
            calendarGrid.innerHTML = '';
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            monthYearDisplay.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
            
            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => {
                calendarGrid.insertAdjacentHTML('beforeend', `<div class="day-name">${d}</div>`);
            });

            const firstDay = new Date(year, month, 1).getDay();
            for (let i = 0; i < firstDay; i++) calendarGrid.insertAdjacentHTML('beforeend', '<div class="day other-month"></div>');

            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const dayDate = new Date(year, month, i).toISOString().split('T')[0];
                const isToday = (dayDate === todayStr) ? 'today' : ''; // IDENTIFY TODAY
                const eventText = data.calendarEvents[dayDate] ? 'event-day' : '';
                calendarGrid.insertAdjacentHTML('beforeend', `<div class="day ${isToday} ${eventText}" data-date="${dayDate}">${i}</div>`);
            }
        };

        document.getElementById('prev-month-btn').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
        document.getElementById('next-month-btn').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
        
        const todayBtn = document.getElementById('today-btn');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                currentDate = new Date(); // Reset to system date
                renderCalendar();
            });
        }
        renderCalendar();
    }

    // 7. SETTINGS LOGIC (Red Clear Button)
    const clearBtn = document.getElementById('clear-data-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete ALL data?')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
});
