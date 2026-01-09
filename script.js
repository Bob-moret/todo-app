// Get references to HTML elements
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const prioritySelect = document.getElementById('priority-select');
const todoList = document.getElementById('todo-list');

// Load saved todos when page loads
document.addEventListener('DOMContentLoaded', loadTodos);

// Handle form submission
form.addEventListener('submit', function(event) {
    // Prevent the form from refreshing the page
    event.preventDefault();

    // Get the input value and remove extra spaces
    const taskText = input.value.trim();
    const priority = prioritySelect.value;

    // Only add if there's text
    if (taskText) {
        addTodoItem(taskText, false, priority);
        saveTodos();
        input.value = ''; // Clear the input
        prioritySelect.value = 'medium'; // Reset to default
    }
});

// Create and add a todo item to the list
function addTodoItem(text, completed = false, priority = 'medium') {
    // Create the list item
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.priority = priority; // Store priority in data attribute
    if (completed) {
        li.classList.add('completed');
    }

    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = completed;
    checkbox.addEventListener('change', function() {
        li.classList.toggle('completed');
        saveTodos();
    });

    // Create priority badge
    const badge = document.createElement('span');
    badge.className = 'priority-badge ' + priority;
    badge.textContent = priority;

    // Create text span
    const span = document.createElement('span');
    span.textContent = text;

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', function() {
        li.remove();
        saveTodos();
    });

    // Add elements to the list item
    li.appendChild(checkbox);
    li.appendChild(badge);
    li.appendChild(span);
    li.appendChild(deleteBtn);

    // Add to the list
    todoList.appendChild(li);
}

// Save todos to browser storage
function saveTodos() {
    const todos = [];
    const items = todoList.querySelectorAll('.todo-item');

    items.forEach(function(item) {
        todos.push({
            text: item.querySelector('span:not(.priority-badge)').textContent,
            completed: item.classList.contains('completed'),
            priority: item.dataset.priority || 'medium'
        });
    });

    localStorage.setItem('todos', JSON.stringify(todos));
}

// Load todos from browser storage
function loadTodos() {
    const saved = localStorage.getItem('todos');

    if (saved) {
        const todos = JSON.parse(saved);
        todos.forEach(function(todo) {
            addTodoItem(todo.text, todo.completed, todo.priority || 'medium');
        });
    }
}
