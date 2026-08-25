/**
 * TaskFlow - Interactive To-Do List Application
 * Features: Complete CRUD, Drag-and-Drop, LocalStorage, Search & Filtering,
 * Priority & Categories, Progress Analytics, Theme Switching, Data Export.
 */

// ==========================================
// 1. State Management
// ==========================================
let tasks = [];
let currentFilter = 'all';
let currentCategory = 'all';
let searchQuery = '';
let draggedItemIndex = null;

// DOM Elements
const taskListEl = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title-input');
const taskCategorySelect = document.getElementById('task-category-select');
const taskPrioritySelect = document.getElementById('task-priority-select');
const taskDueDateInput = document.getElementById('task-due-date-input');

// Search & Filter Elements
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const filterCategorySelect = document.getElementById('filter-category-select');

// Stats & Progress Elements
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const taskSummaryText = document.getElementById('task-summary-text');
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const countAll = document.getElementById('count-all');
const countPending = document.getElementById('count-pending');
const countCompleted = document.getElementById('count-completed');
const emptyState = document.getElementById('empty-state');

// Buttons & Actions
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const exportDropdownBtn = document.getElementById('export-dropdown-btn');
const exportMenu = document.getElementById('export-menu');
const exportJsonBtn = document.getElementById('export-json-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const toastContainer = document.getElementById('toast-container');
const currentDateEl = document.getElementById('current-date');

// Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editTaskId = document.getElementById('edit-task-id');
const editTaskTitle = document.getElementById('edit-task-title');
const editTaskCategory = document.getElementById('edit-task-category');
const editTaskPriority = document.getElementById('edit-task-priority');
const editTaskDueDate = document.getElementById('edit-task-due-date');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// ==========================================
// 2. Initialization & LocalStorage
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadTasks();
    displayCurrentDate();
    setupEventListeners();
    render();
});

function displayCurrentDate() {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString(undefined, options);
}

function loadTasks() {
    const saved = localStorage.getItem('taskflow_tasks');
    if (saved) {
        try {
            tasks = JSON.parse(saved);
        } catch (e) {
            tasks = [];
        }
    } else {
        // Default starter tasks for first-time users
        tasks = [
            {
                id: 'task-1',
                title: 'Welcome to TaskFlow! Try completing this task',
                completed: false,
                category: 'Personal',
                priority: 'high',
                dueDate: new Date().toISOString().split('T')[0],
                createdAt: Date.now()
            },
            {
                id: 'task-2',
                title: 'Drag and drop tasks to reorder them',
                completed: true,
                category: 'Work',
                priority: 'medium',
                dueDate: '',
                createdAt: Date.now() - 1000
            }
        ];
        saveTasks();
    }
}

function saveTasks() {
    localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

// ==========================================
// 3. Render Engine
// ==========================================
function render() {
    // Filter logic
    const filteredTasks = tasks.filter(task => {
        // Status filter
        if (currentFilter === 'pending' && task.completed) return false;
        if (currentFilter === 'completed' && !task.completed) return false;

        // Category filter
        if (currentCategory !== 'all' && task.category !== currentCategory) return false;

        // Search query filter
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const matchTitle = task.title.toLowerCase().includes(q);
            const matchCategory = task.category.toLowerCase().includes(q);
            if (!matchTitle && !matchCategory) return false;
        }

        return true;
    });

    // Clear list
    taskListEl.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filteredTasks.forEach((task, index) => {
            taskListEl.appendChild(createTaskElement(task, index));
        });
    }

    updateStats();
}

function createTaskElement(task, index) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.draggable = true;
    li.dataset.id = task.id;
    li.dataset.index = index;

    // Due Date label logic
    let dueDateHtml = '';
    if (task.dueDate) {
        const isOverdue = !task.completed && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
        dueDateHtml = `
      <span class="due-date-badge ${isOverdue ? 'overdue' : ''}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        ${formatDueDate(task.dueDate)}
      </span>
    `;
    }

    li.innerHTML = `
    <div class="drag-handle" title="Drag to reorder">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
        <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
      </svg>
    </div>

    <label class="checkbox-custom">
      <input type="checkbox" ${task.completed ? 'checked' : ''} data-action="toggle">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </label>

    <div class="task-details">
      <span class="task-title">${escapeHTML(task.title)}</span>
      <div class="task-meta">
        <span class="tag-badge priority-badge priority-${task.priority}">${task.priority}</span>
        <span class="tag-badge category-badge">${task.category}</span>
        ${dueDateHtml}
      </div>
    </div>

    <div class="task-actions">
      <button class="action-btn edit-btn" data-action="edit" title="Edit Task">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="action-btn delete-btn" data-action="delete" title="Delete Task">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  `;

    // Attach drag events
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);

    return li;
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update Counters
    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;

    countAll.textContent = total;
    countPending.textContent = pending;
    countCompleted.textContent = completed;

    // Update Progress Bar
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    taskSummaryText.textContent = `${completed} of ${total} completed`;
}

// ==========================================
// 4. CRUD Operations
// ==========================================
function addTask(e) {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    if (!title) return;

    const newTask = {
        id: 'task-' + Date.now(),
        title: title,
        completed: false,
        category: taskCategorySelect.value,
        priority: taskPrioritySelect.value,
        dueDate: taskDueDateInput.value,
        createdAt: Date.now()
    };

    tasks.unshift(newTask);
    saveTasks();
    render();

    // Reset form inputs
    taskTitleInput.value = '';
    taskDueDateInput.value = '';
    taskTitleInput.focus();

    showToast('Task added successfully', 'success');
}

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            const updatedStatus = !task.completed;
            if (updatedStatus) {
                showToast('Task marked as completed! 🎉', 'info');
            }
            return { ...task, completed: updatedStatus };
        }
        return task;
    });
    saveTasks();
    render();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    render();
    showToast('Task deleted', 'danger');
}

function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editTaskId.value = task.id;
    editTaskTitle.value = task.title;
    editTaskCategory.value = task.category;
    editTaskPriority.value = task.priority;
    editTaskDueDate.value = task.dueDate || '';

    editModal.classList.remove('hidden');
    editTaskTitle.focus();
}

function saveTaskEdit(e) {
    e.preventDefault();
    const id = editTaskId.value;
    const newTitle = editTaskTitle.value.trim();

    if (!newTitle) return;

    tasks = tasks.map(task => {
        if (task.id === id) {
            return {
                ...task,
                title: newTitle,
                category: editTaskCategory.value,
                priority: editTaskPriority.value,
                dueDate: editTaskDueDate.value
            };
        }
        return task;
    });

    saveTasks();
    render();
    closeEditModal();
    showToast('Task updated successfully', 'success');
}

function closeEditModal() {
    editModal.classList.add('hidden');
}

function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
        showToast('No completed tasks to clear', 'info');
        return;
    }

    if (confirm(`Are you sure you want to remove all ${completedCount} completed task(s)?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        render();
        showToast('Completed tasks cleared', 'danger');
    }
}

// ==========================================
// 5. Drag & Drop Task Reordering
// ==========================================
function handleDragStart(e) {
    draggedItemIndex = tasks.findIndex(t => t.id === this.dataset.id);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    const targetId = this.dataset.id;
    const targetIndex = tasks.findIndex(t => t.id === targetId);

    if (draggedItemIndex !== null && targetIndex !== -1 && draggedItemIndex !== targetIndex) {
        const movedTask = tasks.splice(draggedItemIndex, 1)[0];
        tasks.splice(targetIndex, 0, movedTask);
        saveTasks();
        render();
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItemIndex = null;
}

// ==========================================
// 6. Export Functions
// ==========================================
function exportAsJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    downloadFile(dataStr, `tasks-${new Date().toISOString().slice(0, 10)}.json`);
    exportMenu.classList.remove('show');
}

function exportAsCSV() {
    if (tasks.length === 0) {
        showToast('No tasks to export', 'info');
        return;
    }

    const headers = ['ID', 'Title', 'Completed', 'Category', 'Priority', 'DueDate'];
    const rows = tasks.map(t => [
        `"${t.id}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        t.completed,
        `"${t.category}"`,
        `"${t.priority}"`,
        `"${t.dueDate || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    downloadFile(csvContent, `tasks-${new Date().toISOString().slice(0, 10)}.csv`);
    exportMenu.classList.remove('show');
}

function downloadFile(content, fileName) {
    const link = document.createElement('a');
    link.setAttribute('href', content);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('File exported successfully', 'success');
}

// ==========================================
// 7. Theme Toggle & UI Helpers
// ==========================================
function loadTheme() {
    const savedTheme = localStorage.getItem('taskflow_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('taskflow_theme', target);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.25s ease-in forwards';
        setTimeout(() => toast.remove(), 250);
    }, 2400);
}

function formatDueDate(dateStr) {
    if (!dateStr) return '';
    const due = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

// ==========================================
// 8. Event Listeners Setup
// ==========================================
function setupEventListeners() {
    // Form submission
    taskForm.addEventListener('submit', addTask);

    // Delegated Task Actions (Complete, Edit, Delete)
    taskListEl.addEventListener('click', (e) => {
        const item = e.target.closest('.task-item');
        if (!item) return;
        const id = item.dataset.id;

        if (e.target.closest('[data-action="toggle"]')) {
            toggleTask(id);
        } else if (e.target.closest('[data-action="edit"]')) {
            openEditModal(id);
        } else if (e.target.closest('[data-action="delete"]')) {
            deleteTask(id);
        }
    });

    // Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            render();
        });
    });

    // Category Filter
    filterCategorySelect.addEventListener('change', (e) => {
        currentCategory = e.target.value;
        render();
    });

    // Search input with real-time filtering
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        clearSearchBtn.classList.toggle('hidden', searchQuery === '');
        render();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        searchInput.focus();
        render();
    });

    // Clear completed button
    clearCompletedBtn.addEventListener('click', clearCompleted);

    // Theme button
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Export dropdown
    exportDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        exportMenu.classList.remove('show');
    });

    exportJsonBtn.addEventListener('click', exportAsJSON);
    exportCsvBtn.addEventListener('click', exportAsCSV);

    // Edit Modal events
    editForm.addEventListener('submit', saveTaskEdit);
    closeModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });

    // Keyboard shortcut: Press "/" to focus search, "Escape" to dismiss modal
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== taskTitleInput) {
            e.preventDefault();
            searchInput.focus();
        } else if (e.key === 'Escape' && !editModal.classList.contains('hidden')) {
            closeEditModal();
        }
    });
}