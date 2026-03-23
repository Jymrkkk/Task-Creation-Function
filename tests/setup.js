/**
 * Vitest setup file — exposes classes from index.html and fast-check as globals
 * so that test files can use them without imports (matching the browser environment).
 */

import * as fastCheck from 'fast-check';

// Expose fast-check as global `fc`
global.fc = fastCheck;

// Default configuration values
global.DEFAULTS = { WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbzqhjMmprgaNMdR8ZgFS91wwRqsl65jpDXvs2HQZ1uNIhYim4wY0745CdJBdPmtrRBPrw/exec' };

// ============================================
// TaskHistoryManager Class
// ============================================
global.TaskHistoryManager = class TaskHistoryManager {
  constructor() {
    this.storageKey = 'taskHistory';
  }

  _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  _getStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return { tasks: [] };
      return JSON.parse(data);
    } catch (error) {
      return { tasks: [] };
    }
  }

  _saveStorage(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('LocalStorage quota exceeded. Please delete old tasks.');
      }
      throw error;
    }
  }

  addTask(taskData, messageId) {
    const storage = this._getStorage();
    const now = new Date().toISOString();
    const taskRecord = {
      id: this._generateUUID(),
      taskName: taskData.taskName,
      description: taskData.description,
      priority: taskData.priority,
      assignedTo: taskData.assignedTo,
      user: taskData.user,
      messageId: messageId,
      timestamp: now,
      lastModified: now,
    };
    storage.tasks.push(taskRecord);
    this._saveStorage(storage);
    return taskRecord.id;
  }

  updateTask(taskId, taskData, newMessageId = null) {
    const storage = this._getStorage();
    const taskIndex = storage.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    const existingTask = storage.tasks[taskIndex];
    storage.tasks[taskIndex] = {
      ...existingTask,
      taskName: taskData.taskName,
      description: taskData.description,
      priority: taskData.priority,
      assignedTo: taskData.assignedTo,
      user: taskData.user,
      messageId: newMessageId !== null ? newMessageId : existingTask.messageId,
      lastModified: new Date().toISOString(),
    };
    this._saveStorage(storage);
    return storage.tasks[taskIndex];
  }

  deleteTask(taskId) {
    const storage = this._getStorage();
    const taskIndex = storage.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    storage.tasks.splice(taskIndex, 1);
    this._saveStorage(storage);
  }

  getAllTasks() {
    const storage = this._getStorage();
    return storage.tasks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getTask(taskId) {
    const storage = this._getStorage();
    return storage.tasks.find((t) => t.id === taskId) || null;
  }
};

// ============================================
// ConfigStore Class
// ============================================
global.ConfigStore = class ConfigStore {
  static KEYS = {
    WEB_APP_URL: 'adminConfig.webAppUrl',
    SPREADSHEET_ID: 'adminConfig.spreadsheetId',
    WEBHOOK_PREFIX: 'adminConfig.webhook.',
  };

  static TEAMS = [
    'Marketing Team',
    'Creatives Team',
    'Development Team',
    'Operations Team',
    'Everyone',
  ];

  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Fall back silently on SecurityError or QuotaExceededError
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Fall back silently
    }
  }

  getAll() {
    const webAppUrl = this.get(ConfigStore.KEYS.WEB_APP_URL) || '';
    const spreadsheetId = this.get(ConfigStore.KEYS.SPREADSHEET_ID) || '';
    const webhooks = {};
    for (const team of ConfigStore.TEAMS) {
      webhooks[team] = this.get(ConfigStore.KEYS.WEBHOOK_PREFIX + team) || '';
    }
    return { webAppUrl, spreadsheetId, webhooks };
  }

  saveAll(settings) {
    this.set(ConfigStore.KEYS.WEB_APP_URL, settings.webAppUrl || '');
    this.set(ConfigStore.KEYS.SPREADSHEET_ID, settings.spreadsheetId || '');
    if (settings.webhooks) {
      for (const team of ConfigStore.TEAMS) {
        this.set(ConfigStore.KEYS.WEBHOOK_PREFIX + team, settings.webhooks[team] || '');
      }
    }
  }

  clear() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('adminConfig.')) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      // Fall back silently
    }
  }

  static extractSpreadsheetId(input) {
    if (!input) return input;
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : input;
  }
};

// ============================================
// BackendClient Class
// ============================================
global.BackendClient = class BackendClient {
  constructor(webAppUrl) {
    this.webAppUrl = webAppUrl;
  }

  async createTask(taskData) {
    const response = await fetch(this.webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Unknown error occurred');
    return result;
  }

  async updateTask(taskData, messageId) {
    const payload = { ...taskData, messageId };
    const response = await fetch(this.webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Unknown error occurred');
    return result;
  }
};

// ============================================
// DashboardClient Class
// ============================================
global.DashboardClient = class DashboardClient {
  constructor(webAppUrl) {
    this.webAppUrl = webAppUrl;
  }

  async fetchDashboardData() {
    const url = `${this.webAppUrl}?action=getDashboard`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Unknown error occurred');
    return result.data;
  }
};

// ============================================
// TaskFormManager Class
// ============================================
global.TaskFormManager = class TaskFormManager {
  constructor() {
    this.fields = {
      taskName: document.getElementById('taskName'),
      description: document.getElementById('description'),
      priority: document.getElementById('priority'),
      assignedTo: document.getElementById('assignedTo'),
      user: document.getElementById('user'),
    };
  }

  getFormData() {
    return {
      taskName: this.fields.taskName.value.trim(),
      description: this.fields.description.value.trim(),
      priority: this.fields.priority.value,
      assignedTo: this.fields.assignedTo.value,
      user: this.fields.user.value.trim(),
    };
  }

  validateForm() {
    const data = this.getFormData();
    if (!data.taskName) throw new Error('Task name is required');
    if (!data.description) throw new Error('Description is required');
    if (!data.user) throw new Error('User name is required');
    return true;
  }

  clearForm() {
    this.fields.taskName.value = '';
    this.fields.description.value = '';
    this.fields.priority.value = 'Low';
    this.fields.assignedTo.value = 'Marketing Team';
    this.fields.user.value = '';
  }

  populateForm(taskData) {
    this.fields.taskName.value = taskData.taskName || '';
    this.fields.description.value = taskData.description || '';
    this.fields.priority.value = taskData.priority || 'Low';
    this.fields.assignedTo.value = taskData.assignedTo || 'Marketing Team';
    this.fields.user.value = taskData.user || '';
  }
};

// ============================================
// HistoryRenderer Class
// ============================================
global.HistoryRenderer = class HistoryRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  renderTasks(tasks) {
    if (!tasks || tasks.length === 0) {
      this.renderEmpty();
      return;
    }
    const html = tasks.map((task) => this.renderTaskCard(task)).join('');
    this.container.innerHTML = html;
  }

  renderTaskCard(task) {
    const priorityClass = `p-${task.priority.toLowerCase()}`;
    const date = new Date(task.timestamp).toLocaleString();
    return `
      <div class="task-card">
        <div class="tc-top">
          <div class="tc-name">${this.escapeHtml(task.taskName)}</div>
          <div class="p-badge ${priorityClass}">${task.priority}</div>
        </div>
        <div class="tc-desc">${this.escapeHtml(task.description)}</div>
        <div class="tc-meta">
          <div class="tc-meta-row"><strong>Assigned:</strong> ${this.escapeHtml(task.assignedTo)}</div>
          <div class="tc-meta-row"><strong>Created by:</strong> ${this.escapeHtml(task.user)}</div>
        </div>
        <div class="tc-date">📅 ${date}</div>
        <div class="tc-actions">
          <button class="btn-edit-card" onclick="handleTaskEdit('${task.id}')">✏️ Edit</button>
          <button class="btn-del-card" onclick="handleTaskDelete('${task.id}')">🗑️ Delete</button>
        </div>
      </div>
    `;
  }

  renderEmpty() {
    this.container.innerHTML = `
      <div class="empty-state">
        <div class="ei">📋</div>
        <h3>No tasks yet</h3>
        <p>Create your first task to get started</p>
      </div>
    `;
  }

  renderLoading() {
    this.container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading tasks...</p>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// ModalManager Class
// ============================================
global.ModalManager = class ModalManager {
  constructor() {
    this.overlay = document.getElementById('overlay');
    this.modalHead = document.getElementById('mHead');
    this.modalIcon = document.getElementById('mIcon');
    this.modalTitle = document.getElementById('mTitle');
    this.modalSub = document.getElementById('mSub');
    this.saveButton = document.getElementById('mSave');
    this.isEditMode = false;
    this.currentTaskId = null;
  }

  open(mode = 'create', taskData = null) {
    this.isEditMode = mode === 'edit';
    this.currentTaskId = taskData ? taskData.id : null;
    this.overlay && this.overlay.classList.add('open');
  }

  close() {
    this.overlay && this.overlay.classList.remove('open');
    this.isEditMode = false;
    this.currentTaskId = null;
  }

  getMode() {
    return this.isEditMode ? 'edit' : 'create';
  }

  getCurrentTaskId() {
    return this.currentTaskId;
  }
};

// ============================================
// ConfigLoader Class
// ============================================
global.ConfigLoader = class ConfigLoader {
  constructor(configStore, backendClient, dashboardClient) {
    this.configStore = configStore;
    this.backendClient = backendClient;
    this.dashboardClient = dashboardClient;
  }

  init() {
    const settings = this.configStore.getAll();
    if (settings.webAppUrl) {
      this.applyUrl(settings.webAppUrl);
    } else {
      this.applyDefaults();
    }
  }

  applyUrl(url) {
    this.backendClient.webAppUrl = url;
    this.dashboardClient.webAppUrl = url;
  }

  applyDefaults() {
    this.backendClient.webAppUrl = 'https://script.google.com/macros/s/AKfycbzqhjMmprgaNMdR8ZgFS91wwRqsl65jpDXvs2HQZ1uNIhYim4wY0745CdJBdPmtrRBPrw/exec';
    this.dashboardClient.webAppUrl = 'https://script.google.com/macros/s/AKfycbzqhjMmprgaNMdR8ZgFS91wwRqsl65jpDXvs2HQZ1uNIhYim4wY0745CdJBdPmtrRBPrw/exec';
  }
};

// ============================================
// Validator
// ============================================
global.Validator = {
  requireNonEmpty(value) {
    if (!value || value.trim() === '') {
      return { valid: false, error: 'Required' };
    }
    return { valid: true };
  },

  validateWebAppUrl(value) {
    if (!value || value.trim() === '') {
      return { valid: true };
    }
    if (!value.startsWith('https://script.google.com/macros/s/')) {
      return { valid: true, warning: 'URL may not be a valid Google Apps Script Web App URL' };
    }
    return { valid: true };
  },

  validateDiscordWebhook(value) {
    if (!value || value.trim() === '') {
      return { valid: true };
    }
    const pattern = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    if (!pattern.test(value)) {
      return { valid: true, warning: 'URL may not be a valid Discord webhook URL' };
    }
    return { valid: true };
  }
};

// ============================================
// AdminDashboard Class
// ============================================
global.AdminDashboard = class AdminDashboard {
  constructor(configStore, configLoader, validator) {
    this.configStore = configStore;
    this.configLoader = configLoader;
    this.validator = validator;
  }

  open() {
    const settings = this.configStore.getAll();

    document.getElementById('adminWebAppUrl').value = settings.webAppUrl || '';
    document.getElementById('adminSpreadsheetId').value = settings.spreadsheetId || '';

    const teamInputIds = {
      'Marketing Team':   'adminWebhook_Marketing_Team',
      'Creatives Team':   'adminWebhook_Creatives_Team',
      'Development Team': 'adminWebhook_Development_Team',
      'Operations Team':  'adminWebhook_Operations_Team',
      'Everyone':         'adminWebhook_Everyone',
    };

    for (const team of ConfigStore.TEAMS) {
      const inputId = teamInputIds[team];
      if (inputId) {
        document.getElementById(inputId).value = (settings.webhooks && settings.webhooks[team]) || '';
      }
    }

    this._updateStatusSummary(settings);
    document.getElementById('adminOverlay').classList.add('open');
  }

  close() {
    document.getElementById('adminOverlay').classList.remove('open');
  }

  _updateStatusSummary(settings) {
    const list = document.getElementById('adminStatusList');
    if (!list) return;

    const items = ConfigStore.TEAMS.map(team => {
      const webhook = (settings.webhooks && settings.webhooks[team]) || '';
      const isConfigured = webhook.trim() !== '';
      const dotClass = isConfigured ? 'status-dot configured' : 'status-dot unconfigured';
      const statusText = isConfigured ? 'Configured' : 'Not configured';
      return `<li class="admin-status-item"><span class="${dotClass}"></span>${team} — ${statusText}</li>`;
    });

    list.innerHTML = items.join('');
  }
};
