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

// Modal Elements
const modalOverlay = document.getElementById('task-modal-overlay');
const modalCloseBtn = document.getElementById('modal-close');
const modalCancelBtn = document.getElementById('modal-cancel');
const modalSaveBtn = document.getElementById('modal-save');
const modalTaskTitle = document.getElementById('modal-task-title');
const modalDueDate = document.getElementById('modal-due-date');
const modalNotes = document.getElementById('modal-notes');
const subtaskList = document.getElementById('subtask-list');
const subtaskInput = document.getElementById('subtask-input');
const subtaskAddBtn = document.getElementById('subtask-add-btn');

// State
let currentPriority = 'medium';
let currentFilter = 'all';
let currentEditingTaskId = null;
let tempSubtasks = [];

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    migrateData();
    loadTodos();
    updateStats();
    updateEmptyState();
    initModalListeners();
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
function addTodoItem(text, completed = false, priority = 'medium', id = null, notes = '', dueDate = null, subtasks = []) {
    const taskId = id || generateId();
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.priority = priority;
    li.dataset.id = taskId;
    if (completed) {
        li.classList.add('completed');
    }

    // Staggered animation delay for loaded items
    const existingItems = todoList.querySelectorAll('.todo-item').length;
    li.style.animationDelay = `${existingItems * 0.05}s`;

    // Check for indicators
    const hasNotes = notes && notes.length > 0;
    const hasDueDate = dueDate !== null && dueDate !== '';
    const hasSubtasks = subtasks.length > 0;
    const completedSubtasks = subtasks.filter(s => s.completed).length;
    const isOverdue = hasDueDate && new Date(dueDate) < new Date() && !completed;

    li.innerHTML = `
        <label class="checkbox-wrapper">
            <input type="checkbox" ${completed ? 'checked' : ''}>
            <span class="checkbox-custom"></span>
        </label>
        <div class="priority-indicator ${priority}"></div>
        <div class="task-content">
            <span class="task-text">${escapeHtml(text)}</span>
        </div>
        <div class="task-indicators">
            <span class="indicator indicator-due ${hasDueDate ? '' : 'hidden'} ${isOverdue ? 'overdue' : ''}" title="${hasDueDate ? formatDate(dueDate) : ''}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </span>
            <span class="indicator indicator-subtasks ${hasSubtasks ? '' : 'hidden'}" title="Subtasks">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                <span class="subtask-count">${completedSubtasks}/${subtasks.length}</span>
            </span>
            <span class="indicator indicator-notes ${hasNotes ? '' : 'hidden'}" title="Has notes">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
            </span>
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

    // Click on task content to open modal
    const taskContent = li.querySelector('.task-content');
    taskContent.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(taskId);
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
    const existingTodos = JSON.parse(localStorage.getItem('taskflow-todos') || '[]');

    items.forEach(item => {
        const taskId = item.dataset.id;
        const existingTodo = existingTodos.find(t => t.id === taskId);

        todos.push({
            id: taskId,
            text: item.querySelector('.task-text').textContent,
            completed: item.classList.contains('completed'),
            priority: item.dataset.priority || 'medium',
            notes: existingTodo?.notes || '',
            dueDate: existingTodo?.dueDate || null,
            subtasks: existingTodo?.subtasks || [],
            createdAt: existingTodo?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    });

    localStorage.setItem('taskflow-todos', JSON.stringify(todos));
}

function loadTodos() {
    const saved = localStorage.getItem('taskflow-todos');

    if (saved) {
        const todos = JSON.parse(saved);
        todos.forEach(todo => {
            addTodoItem(
                todo.text,
                todo.completed,
                todo.priority || 'medium',
                todo.id,
                todo.notes || '',
                todo.dueDate || null,
                todo.subtasks || []
            );
        });
    }
}

// Migrate existing data to new format
function migrateData() {
    const saved = localStorage.getItem('taskflow-todos');
    if (!saved) return;

    let todos = JSON.parse(saved);
    let needsMigration = false;

    todos = todos.map(todo => {
        if (!todo.id) {
            needsMigration = true;
            return {
                ...todo,
                id: generateId(),
                notes: '',
                dueDate: null,
                subtasks: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
        return todo;
    });

    if (needsMigration) {
        localStorage.setItem('taskflow-todos', JSON.stringify(todos));
    }
}

// Get task by ID from localStorage
function getTaskById(id) {
    const todos = JSON.parse(localStorage.getItem('taskflow-todos') || '[]');
    return todos.find(t => t.id === id);
}

// Update task by ID
function updateTaskById(id, updates) {
    const todos = JSON.parse(localStorage.getItem('taskflow-todos') || '[]');
    const index = todos.findIndex(t => t.id === id);

    if (index !== -1) {
        todos[index] = { ...todos[index], ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem('taskflow-todos', JSON.stringify(todos));
        return true;
    }
    return false;
}

// ============================================
// UTILITIES
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function openModal(taskId) {
    currentEditingTaskId = taskId;
    const task = getTaskById(taskId);

    if (!task) return;

    // Populate modal fields
    modalTaskTitle.textContent = task.text;
    modalDueDate.value = task.dueDate || '';
    modalNotes.value = task.notes || '';

    // Render subtasks
    tempSubtasks = [...(task.subtasks || [])];
    renderSubtasks();

    // Show modal with animation
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus the close button for accessibility
    modalCloseBtn.focus();
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    currentEditingTaskId = null;

    // Clear form
    modalDueDate.value = '';
    modalNotes.value = '';
    subtaskList.innerHTML = '';
    subtaskInput.value = '';
    tempSubtasks = [];
}

function saveModalChanges() {
    if (!currentEditingTaskId) return;

    const updates = {
        notes: modalNotes.value.trim(),
        dueDate: modalDueDate.value || null,
        subtasks: tempSubtasks
    };

    if (updateTaskById(currentEditingTaskId, updates)) {
        // Refresh the task list to show indicators
        refreshTaskList();
        closeModal();
    }
}

function refreshTaskList() {
    todoList.innerHTML = '';
    loadTodos();
    updateStats();
    updateEmptyState();
}

// ============================================
// SUBTASK FUNCTIONS
// ============================================
function renderSubtasks() {
    subtaskList.innerHTML = '';

    tempSubtasks.forEach((subtask) => {
        const li = document.createElement('li');
        li.className = `subtask-item ${subtask.completed ? 'completed' : ''}`;
        li.dataset.id = subtask.id;

        li.innerHTML = `
            <label class="checkbox-wrapper checkbox-wrapper-sm">
                <input type="checkbox" ${subtask.completed ? 'checked' : ''}>
                <span class="checkbox-custom"></span>
            </label>
            <span class="subtask-text">${escapeHtml(subtask.text)}</span>
            <button class="subtask-delete" aria-label="Delete subtask">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        // Toggle subtask completion
        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            toggleSubtask(subtask.id);
        });

        // Delete subtask
        const deleteBtn = li.querySelector('.subtask-delete');
        deleteBtn.addEventListener('click', () => {
            deleteSubtask(subtask.id);
        });

        subtaskList.appendChild(li);
    });
}

function addSubtask(text) {
    if (!text.trim()) return;

    const newSubtask = {
        id: generateId(),
        text: text.trim(),
        completed: false
    };

    tempSubtasks.push(newSubtask);
    renderSubtasks();
    subtaskInput.value = '';
    subtaskInput.focus();
}

function toggleSubtask(subtaskId) {
    tempSubtasks = tempSubtasks.map(s =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    renderSubtasks();
}

function deleteSubtask(subtaskId) {
    tempSubtasks = tempSubtasks.filter(s => s.id !== subtaskId);
    renderSubtasks();
}

// ============================================
// MODAL EVENT LISTENERS
// ============================================
function initModalListeners() {
    // Close button
    modalCloseBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);

    // Save button
    modalSaveBtn.addEventListener('click', saveModalChanges);

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    // Add subtask on Enter key
    subtaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSubtask(subtaskInput.value);
        }
    });

    // Add subtask on button click
    subtaskAddBtn.addEventListener('click', () => {
        addSubtask(subtaskInput.value);
    });
}
