document.addEventListener('DOMContentLoaded', () => {

    // --- CLOCK & GREETING ---
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    const usernameEl = document.getElementById('username');

    if (localStorage.getItem('dashboard-name')) {
        usernameEl.textContent = localStorage.getItem('dashboard-name');
    }

    usernameEl.addEventListener('blur', () => {
        localStorage.setItem('dashboard-name', usernameEl.textContent.trim() || 'Guest');
    });

    usernameEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); usernameEl.blur(); }
    });

    function updateClockAndGreeting() {
        const now = new Date();
        const hours = now.getHours();
        clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
        dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        let greeting = hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening';
        document.getElementById('greeting-text').firstChild.textContent = `${greeting}, `;
    }
    setInterval(updateClockAndGreeting, 1000);
    updateClockAndGreeting();


    // --- FOCUS TIMER ---
    let timerInterval = null;
    const timerDisplay = document.getElementById('timer-display');
    const timerDurationInput = document.getElementById('timer-duration');

    let currentSettingsMins = parseInt(localStorage.getItem('timer-custom-duration')) || 25;
    timerDurationInput.value = currentSettingsMins;
    let timeRemaining = currentSettingsMins * 60;

    function updateTimerDisplay() {
        const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const s = (timeRemaining % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
    }
    updateTimerDisplay();

    timerDurationInput.addEventListener('change', () => {
        if (timerInterval !== null) return;
        let val = Math.min(60, Math.max(1, parseInt(timerDurationInput.value) || 1));
        timerDurationInput.value = val;
        currentSettingsMins = val;
        timeRemaining = val * 60;
        localStorage.setItem('timer-custom-duration', val);
        updateTimerDisplay();
    });

    document.getElementById('timer-start').addEventListener('click', () => {
        if (timerInterval !== null) return;
        timerInterval = setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                alert("Focus time is up! Take a break.");
            }
        }, 1000);
    });

    document.getElementById('timer-stop').addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
    });

    document.getElementById('timer-reset').addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        timeRemaining = currentSettingsMins * 60;
        updateTimerDisplay();
    });


    // --- TO-DO LIST ---
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoSortSelect = document.getElementById('todo-sort');

    let todos = JSON.parse(localStorage.getItem('dashboard-todos')) || [];
    let currentSortMethod = localStorage.getItem('dashboard-todo-sort') || 'default';
    todoSortSelect.value = currentSortMethod;

    function saveTodos() {
        localStorage.setItem('dashboard-todos', JSON.stringify(todos));
    }

    function renderTodos() {
        todoList.innerHTML = '';
        let displayTodos = [...todos];

        if (currentSortMethod === 'alpha') {
            displayTodos.sort((a, b) => a.text.localeCompare(b.text));
        } else if (currentSortMethod === 'status') {
            displayTodos.sort((a, b) => a.done - b.done);
        }

        displayTodos.forEach((todo) => {
            const li = document.createElement('li');
            if (todo.done) li.classList.add('done');
            li.innerHTML = `
                <div>
                    <input type="checkbox" ${todo.done ? 'checked' : ''} data-id="${todo.id}">
                    <span>${todo.text}</span>
                </div>
                <button class="btn btn-delete" data-id="${todo.id}">Delete</button>
            `;
            todoList.appendChild(li);
        });
    }

    document.getElementById('todo-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = todoInput.value.trim();
        if (todos.some(t => t.text.toLowerCase() === taskText.toLowerCase())) {
            alert('This task already exists!');
            return;
        }
        todos.push({ id: Date.now(), text: taskText, done: false });
        saveTodos();
        renderTodos();
        todoInput.value = '';
    });

    todoList.addEventListener('click', (e) => {
        const targetId = parseInt(e.target.dataset.id);
        if (isNaN(targetId)) return;

        if (e.target.type === 'checkbox') {
            const t = todos.find(t => t.id === targetId);
            if (t) t.done = e.target.checked;
        } else if (e.target.classList.contains('btn-delete')) {
            todos = todos.filter(t => t.id !== targetId);
        }
        saveTodos();
        renderTodos();
    });

    todoSortSelect.addEventListener('change', () => {
        currentSortMethod = todoSortSelect.value;
        localStorage.setItem('dashboard-todo-sort', currentSortMethod);
        renderTodos();
    });

    renderTodos();


    // --- QUICK LINKS ---
    const linkNameInput = document.getElementById('link-name');
    const linkUrlInput = document.getElementById('link-url');
    const linksContainer = document.getElementById('links-container');

    let links = JSON.parse(localStorage.getItem('dashboard-links')) || [
        { name: 'Google', url: 'https://google.com' },
        { name: 'Gmail', url: 'https://gmail.com' }
    ];

    function saveLinks() {
        localStorage.setItem('dashboard-links', JSON.stringify(links));
    }

    function renderLinks() {
        linksContainer.innerHTML = '';
        links.forEach((link, index) => {
            const item = document.createElement('div');
            item.className = 'link-item';

            const anchor = document.createElement('a');
            anchor.href = link.url;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.textContent = link.name;

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'btn btn-remove-link';
            removeButton.dataset.index = index;
            removeButton.textContent = '×';

            item.appendChild(anchor);
            item.appendChild(removeButton);
            linksContainer.appendChild(item);
        });
    }

    document.getElementById('link-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = linkNameInput.value.trim();
        const url = linkUrlInput.value.trim();

        if (links.some(l => l.url === url || l.name.toLowerCase() === name.toLowerCase())) {
            alert('This link already exists.');
            return;
        }

        links.push({ name, url });
        saveLinks();
        renderLinks();
        e.target.reset();
        linkNameInput.focus();
    });

    linksContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-link')) {
            const index = parseInt(e.target.dataset.index, 10);
            if (!Number.isNaN(index)) {
                links.splice(index, 1);
                saveLinks();
                renderLinks();
            }
        }
    });

    renderLinks();


    // --- THEME TOGGLE ---
    const themeToggleBtn = document.getElementById('theme-toggle');

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
        themeToggleBtn.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
        localStorage.setItem('dashboard-theme', theme);
    }

    applyTheme(localStorage.getItem('dashboard-theme') || 'light');

    themeToggleBtn.addEventListener('click', () => {
        applyTheme(document.body.hasAttribute('data-theme') ? 'light' : 'dark');
    });

});
