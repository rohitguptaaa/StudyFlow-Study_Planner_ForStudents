// --- YOUR ORIGINAL THEME LOGIC ---
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeToggle) themeToggle.checked = true;
}

// --- YOUR ORIGINAL TIMER LOGIC ---
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
    
    // India Schedule Fix: Local Date String
    const now = new Date();
    const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    if (timerState.isSession) {
        data.stats.totalMinutes += timerState.sessionLength;
        const lastSession = data.stats.lastSessionDate;
        if (lastSession !== today) {
            const yesterdayDate = new Date();
            yesterdayDate.setDate(now.getDate() - 1);
            const yesterday = yesterdayDate.getFullYear() + '-' + String(yesterdayDate.getMonth() + 1).padStart(2, '0') + '-' + String(yesterdayDate.getDate()).padStart(2, '0');
            data.stats.streak = (lastSession === yesterday) ? data.stats.streak + 1 : 1;
            data.stats.lastSessionDate = today;
        }
        data.studySessions.push({ date: today, duration: timerState.sessionLength });
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

// --- YOUR ORIGINAL DATA LOGIC ---
const getStudyData = () => {
    const defaultData = { tasks: [], studySessions: [], calendarEvents: {}, stats: { totalMinutes: 0, streak: 0, lastSessionDate: null } };
    const data = JSON.parse(localStorage.getItem('studyFlowData'));
    if (data && !data.calendarEvents) data.calendarEvents = {};
    return data || defaultData;
};

const saveStudyData = (data) => {
    localStorage.setItem('studyFlowData', JSON.stringify(data));
};

initializeTimer();

document.addEventListener('DOMContentLoaded', () => {

    // --- UPDATED MOBILE MENU LOGIC ---
    const menuToggle = document.getElementById('mobile-menu');
    const navList = document.querySelector('nav ul');
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            // This now toggles the 'show' class which matches your updated CSS overlay
            navList.classList.toggle('show');
        });
    }

    // YOUR ORIGINAL NAVIGATION HIGHLIGHTER
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav ul a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active-link');
        }
    });
    
    // --- DASHBOARD PAGE LOGIC ---
    if (document.body.contains(document.getElementById('task-form'))) {
        const taskForm = document.getElementById('task-form');
        const taskTitleInput = document.getElementById('task-title');
        const taskDueDateInput = document.getElementById('task-due-date');
        const taskSubjectInput = document.getElementById('task-subject');
        const taskList = document.getElementById('task-list');
        const timerDisplay = document.getElementById('timer-display');
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        const sessionLengthDisplay = document.getElementById('session-length');
        const breakLengthDisplay = document.getElementById('break-length');
        const sessionIncrementBtn = document.getElementById('session-increment');
        const sessionDecrementBtn = document.getElementById('session-decrement');
        const breakIncrementBtn = document.getElementById('break-increment');
        const breakDecrementBtn = document.getElementById('break-decrement');
        
        let data = getStudyData();

        // --- UPDATED: "Add more..." category logic ---
        taskSubjectInput.addEventListener('change', function() {
            if (this.value === 'add-more') {
                const newCategory = prompt("Enter new category name:");
                if (newCategory && newCategory.trim() !== "") {
                    const option = document.createElement('option');
                    // Standardize value (lowercase, no spaces)
                    option.value = newCategory.toLowerCase().replace(/\s+/g, '-');
                    option.text = newCategory;
                    // Add new option before the last "Add more" option
                    this.add(option, this.options[this.length - 1]);
                    this.value = option.value;
                } else {
                    this.value = 'general';
                }
            }
        });

        const renderTasks = () => {
            taskList.innerHTML = '';
            if (data.tasks.length === 0) {
                taskList.innerHTML = '<p>No tasks yet. Add one above!</p>';
                return;
            }
            data.tasks.forEach((task, index) => {
                const taskItem = document.createElement('div');
                taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
                taskItem.innerHTML = `<span><strong>${task.title}</strong><br><small>Due: ${task.dueDate} | Subject: ${task.subject}</small></span><div class="actions"><button class="complete-btn" data-index="${index}">${task.completed ? 'Undo' : 'Complete'}</button><button class="delete-btn" data-index="${index}">Delete</button></div>`;
                taskList.appendChild(taskItem);
            });
        };

        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            data.tasks.push({ title: taskTitleInput.value, dueDate: taskDueDateInput.value, subject: taskSubjectInput.value, completed: false });
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

        const startTimer = () => {
            let timerState = JSON.parse(localStorage.getItem('timerState')) || {};
            const timeLeftToStart = (timerState.status === 'paused' && timerState.timeLeft) ? timerState.timeLeft : (timerState.sessionLength || 25) * 60;
            const endTime = Date.now() + (timeLeftToStart * 1000);
            localStorage.setItem('timerState', JSON.stringify({
                status: 'running',
                endTime: endTime,
                isSession: timerState.isSession !== undefined ? timerState.isSession : true,
                sessionLength: timerState.sessionLength || 25,
                breakLength: timerState.breakLength || 5,
            }));
            initializeTimer();
        };

        const pauseTimer = () => {
            const timerState = JSON.parse(localStorage.getItem('timerState'));
            if (!timerState || timerState.status !== 'running') return;
            const timeLeft = Math.round((timerState.endTime - Date.now()) / 1000);
            localStorage.setItem('timerState', JSON.stringify({
                ...timerState,
                status: 'paused',
                timeLeft: timeLeft > 0 ? timeLeft : 0,
            }));
            clearInterval(globalCountdown);
        };

        const initialTimerSetup = () => {
            const timerState = JSON.parse(localStorage.getItem('timerState'));
            const sessionLength = timerState?.sessionLength || 25;
            const breakLength = timerState?.breakLength || 5;
            sessionLengthDisplay.textContent = sessionLength;
            breakLengthDisplay.textContent = breakLength;

            let displayTime;
            if (timerState && timerState.status === 'paused') {
                displayTime = timerState.timeLeft;
            } else if (timerState && timerState.status === 'running') {
                displayTime = Math.round((timerState.endTime - Date.now()) / 1000);
            } else {
                displayTime = sessionLength * 60;
            }
            const minutes = Math.floor(displayTime / 60);
            const seconds = displayTime % 60;
            timerDisplay.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        };
        
        const resetTimer = () => {
            clearInterval(globalCountdown);
            const timerState = JSON.parse(localStorage.getItem('timerState')) || {};
            const sessionLength = timerState.sessionLength || 25; 
            localStorage.removeItem('timerState');
            timerDisplay.textContent = `${sessionLength < 10 ? '0' : ''}${sessionLength}:00`;
        };
        
        const adjustTimerLength = (type, amount) => {
            let timerState = JSON.parse(localStorage.getItem('timerState')) || { status: 'stopped', sessionLength: 25, breakLength: 5, isSession: true };
            if (timerState.status === 'running') return; 

            if (type === 'session') {
                timerState.sessionLength += amount;
                if (timerState.sessionLength < 1) timerState.sessionLength = 1;
                sessionLengthDisplay.textContent = timerState.sessionLength;
                if (timerState.status !== 'paused') {
                    timerDisplay.textContent = `${timerState.sessionLength < 10 ? '0' : ''}${timerState.sessionLength}:00`;
                }
            } else { 
                timerState.breakLength += amount;
                if (timerState.breakLength < 1) timerState.breakLength = 1;
                breakLengthDisplay.textContent = timerState.breakLength;
            }
            localStorage.setItem('timerState', JSON.stringify(timerState));
        };
        
        sessionIncrementBtn.addEventListener('click', () => adjustTimerLength('session', 1));
        sessionDecrementBtn.addEventListener('click', () => adjustTimerLength('session', -1));
        breakIncrementBtn.addEventListener('click', () => adjustTimerLength('break', 1));
        breakDecrementBtn.addEventListener('click', () => adjustTimerLength('break', -1));
        startBtn.addEventListener('click', startTimer);
        pauseBtn.addEventListener('click', pauseTimer);
        resetBtn.addEventListener('click', resetTimer);

        renderTasks();
        initialTimerSetup();
    }

    // --- PROGRESS LOGIC ---
    if (document.body.contains(document.getElementById('total-hours'))) {
        const data = getStudyData();
        const totalHours = (data.stats.totalMinutes / 60).toFixed(1);
        document.getElementById('total-hours').textContent = `${totalHours}h`;
        document.getElementById('study-streak').textContent = `${data.stats.streak} days`;
        document.getElementById('completed-tasks').textContent = data.tasks.filter(task => task.completed).length;
        const subjectStatsEl = document.getElementById('subject-stats');
        const subjectCounts = data.tasks.reduce((acc, task) => { acc[task.subject] = (acc[task.subject] || 0) + 1; return acc; }, {});
        subjectStatsEl.innerHTML = '';
        if (Object.keys(subjectCounts).length > 0) {
            for (const subject in subjectCounts) subjectStatsEl.innerHTML += `<p><strong>${subject}:</strong> ${subjectCounts[subject]} tasks</p>`;
        } else {
            subjectStatsEl.innerHTML = '<p>No tasks to analyze.</p>';
        }
    }
    
    // --- SETTINGS LOGIC ---
    if (document.body.contains(document.getElementById('clear-data-btn'))) {
        document.getElementById('clear-data-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all your data?')) {
                localStorage.clear();
                location.reload();
            }
        });
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', () => {
                document.body.classList.toggle('dark-mode');
                localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
            });
        }
    }

    // --- CALENDAR LOGIC WITH FIXES ---
    if (document.body.contains(document.querySelector('.calendar-grid'))) {
        let data = getStudyData();
        const studyDays = new Set(data.studySessions.map(session => session.date));
        const monthYearDisplay = document.getElementById('month-year-display');
        const calendarGrid = document.querySelector('.calendar-grid');
        let currentDate = new Date();

        const renderCalendar = () => {
            calendarGrid.innerHTML = '';
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            monthYearDisplay.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
            
            const now = new Date();
            const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dayNames.forEach(day => calendarGrid.insertAdjacentHTML('beforeend', `<div class="day-name">${day}</div>`));
            
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            for (let i = 0; i < firstDayOfMonth; i++) calendarGrid.insertAdjacentHTML('beforeend', '<div class="day other-month"></div>');
            
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            for (let i = 1; i <= daysInMonth; i++) {
                const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(i).padStart(2, '0');
                const isStudyDay = studyDays.has(dateStr) ? 'study-day' : '';
                const isToday = (dateStr === todayStr) ? 'today' : '';
                const eventText = data.calendarEvents[dateStr];
                const isEventDay = eventText ? 'event-day' : '';
                const titleAttr = eventText ? `title="${eventText}"` : '';
                
                calendarGrid.insertAdjacentHTML('beforeend', `<div class="day ${isStudyDay} ${isEventDay} ${isToday}" data-date="${dateStr}" ${titleAttr}>${i}</div>`);
            }

            // CALENDAR SIZE FIX: 42 slots
            const currentSlotsUsed = firstDayOfMonth + daysInMonth;
            for (let i = currentSlotsUsed; i < 42; i++) {
                calendarGrid.insertAdjacentHTML('beforeend', '<div class="day other-month"></div>');
            }
        };

        const todayBtn = document.getElementById('today-btn');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                currentDate = new Date();
                renderCalendar();
            });
        }

        calendarGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('day') && !e.target.classList.contains('other-month')) {
                const date = e.target.dataset.date;
                const existingEvent = data.calendarEvents[date] || '';
                const newEvent = prompt(`Enter event for ${date}:`, existingEvent);
                if (newEvent !== null) {
                    if (newEvent.trim() === '') delete data.calendarEvents[date];
                    else data.calendarEvents[date] = newEvent.trim();
                    saveStudyData(data);
                    renderCalendar();
                }
            }
        });
        
        document.getElementById('prev-month-btn').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
        document.getElementById('next-month-btn').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
        renderCalendar();
    }
});
