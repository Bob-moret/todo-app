// ============================================
// TASKFLOW - Enhanced Todo Application
// ============================================

// DOM Elements
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const priorityButtons = document.querySelectorAll('.priority-btn');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const filterButtons = document.querySelectorAll('.filter-btn');
const statTotal = document.querySelector('#stat-total .stat-value');
const statDone = document.querySelector('#stat-done .stat-value');

// State
let currentPriority = 'medium';
let currentFilter = 'all';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    updateStats();
    updateEmptyState();
});

// ============================================
// EVENT LISTENERS
// ============================================

// Form submission
form.addEventListener('submit', (event) => {
    event.preventDefault();
    const taskText = input.value.trim();

    if (taskText) {
        addTodoItem(taskText, false, currentPriority);
        saveTodos();
        updateStats();
        updateEmptyState();
        input.value = '';
        input.focus();
    }
});

// Priority button selection
priorityButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        priorityButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPriority = btn.dataset.value;
    });
});

// Filter buttons
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        applyFilter();
    });
});

// ============================================
// TODO ITEM CREATION
// ============================================
function addTodoItem(text, completed = false, priority = 'medium') {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.priority = priority;
    if (completed) {
        li.classList.add('completed');
    }

    // Staggered animation delay for loaded items
    const existingItems = todoList.querySelectorAll('.todo-item').length;
    li.style.animationDelay = `${existingItems * 0.05}s`;

    li.innerHTML = `
        <label class="checkbox-wrapper">
            <input type="checkbox" ${completed ? 'checked' : ''}>
            <span class="checkbox-custom"></span>
        </label>
        <div class="priority-indicator ${priority}"></div>
        <div class="task-content">
            <span class="task-text">${escapeHtml(text)}</span>
        </div>
        <button class="delete-btn" aria-label="Delete task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
        </button>
    `;

    // Checkbox event
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
        li.classList.toggle('completed');
        saveTodos();
        updateStats();
        applyFilter();
    });

    // Delete button event
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        li.style.transform = 'translateX(20px)';
        li.style.opacity = '0';
        setTimeout(() => {
            li.remove();
            saveTodos();
            updateStats();
            updateEmptyState();
        }, 200);
    });

    todoList.appendChild(li);
    applyFilter();
}

// ============================================
// FILTERS
// ============================================
function applyFilter() {
    const items = todoList.querySelectorAll('.todo-item');

    items.forEach(item => {
        const isCompleted = item.classList.contains('completed');
        let shouldShow = false;

        switch (currentFilter) {
            case 'all':
                shouldShow = true;
                break;
            case 'active':
                shouldShow = !isCompleted;
                break;
            case 'completed':
                shouldShow = isCompleted;
                break;
        }

        item.style.display = shouldShow ? 'flex' : 'none';
    });

    updateEmptyState();
}

// ============================================
// STATS
// ============================================
function updateStats() {
    const items = todoList.querySelectorAll('.todo-item');
    const completedItems = todoList.querySelectorAll('.todo-item.completed');

    statTotal.textContent = items.length;
    statDone.textContent = completedItems.length;
}

// ============================================
// EMPTY STATE
// ============================================
function updateEmptyState() {
    const visibleItems = todoList.querySelectorAll('.todo-item[style*="display: flex"], .todo-item:not([style*="display"])');
    const hasVisibleItems = Array.from(visibleItems).some(item => {
        const style = window.getComputedStyle(item);
        return style.display !== 'none';
    });

    if (todoList.children.length === 0 || !hasVisibleItems) {
        emptyState.classList.add('visible');
    } else {
        emptyState.classList.remove('visible');
    }
}

// ============================================
// LOCAL STORAGE
// ============================================
function saveTodos() {
    const todos = [];
    const items = todoList.querySelectorAll('.todo-item');

    items.forEach(item => {
        todos.push({
            text: item.querySelector('.task-text').textContent,
            completed: item.classList.contains('completed'),
            priority: item.dataset.priority || 'medium'
        });
    });

    localStorage.setItem('taskflow-todos', JSON.stringify(todos));
}

function loadTodos() {
    const saved = localStorage.getItem('taskflow-todos');

    if (saved) {
        const todos = JSON.parse(saved);
        todos.forEach(todo => {
            addTodoItem(todo.text, todo.completed, todo.priority || 'medium');
        });
    }
}

// ============================================
// UTILITIES
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
