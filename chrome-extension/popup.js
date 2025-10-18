class NotesManager {
  constructor() {
    this.apiBase = 'https://notes.leanderziehm.com/api/files';
    this.notes = [];
    this.openTabs = [];
    this.activeTab = null;
    this.autoSaveTimeout = null;
    this.autoSaveDelay = 1000; // 1 second
    this.initializeElements();
    this.bindEvents();
    this.loadNotes();
    this.loadLastOpenedFile();
  }

  initializeElements() {
    this.listView = document.getElementById('listView');
    this.editorView = document.getElementById('editorView');
    this.notesList = document.getElementById('notesList');
    this.searchBox = document.getElementById('searchBox');
    this.newNoteBtn = document.getElementById('newNoteBtn');
    this.noteEditor = document.getElementById('noteEditor');
    this.editorTitle = document.getElementById('editorTitle');
    this.saveStatus = document.getElementById('saveStatus');
    this.message = document.getElementById('message');
    this.newNoteModal = document.getElementById('newNoteModal');
    this.newNoteInput = document.getElementById('newNoteInput');
    this.createBtn = document.getElementById('createBtn');
    this.cancelBtn = document.getElementById('cancelBtn');
    this.filesBtn = document.getElementById('filesBtn');
    this.newFileBtn = document.getElementById('newFileBtn');
    this.tabsContainer = document.getElementById('tabs');
  }

  bindEvents() {
    this.newNoteBtn.addEventListener('click', () => this.showNewNoteModal());
    this.newFileBtn.addEventListener('click', () => this.showNewNoteModal());
    this.filesBtn.addEventListener('click', () => this.showListView());
    this.searchBox.addEventListener('input', (e) => this.filterNotes(e.target.value));
    this.createBtn.addEventListener('click', () => this.createNewNote());
    this.cancelBtn.addEventListener('click', () => this.hideNewNoteModal());
    this.newNoteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.createNewNote();
    });
    
    // Auto-save on text change
    this.noteEditor.addEventListener('input', () => this.scheduleAutoSave());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.saveCurrentNote();
      }
    });
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async loadNotes() {
    try {
      const response = await this.makeRequest(this.apiBase);
      this.notes = response || [];
      this.renderNotes();
    } catch (error) {
      this.showMessage('Failed to load notes. Please try again.', 'error');
      console.error('Load notes error:', error);
    }
  }

  async loadLastOpenedFile() {
    try {
      const result = await chrome.storage.local.get(['lastOpenedFile', 'openTabs']);
      
      if (result.openTabs && result.openTabs.length > 0) {
        this.openTabs = result.openTabs;
        this.activeTab = result.lastOpenedFile || this.openTabs[0];
        this.renderTabs();
        
        if (this.activeTab) {
          await this.loadTabContent(this.activeTab);
        }
      }
    } catch (error) {
      console.error('Error loading last opened file:', error);
    }
  }

  async saveState() {
    try {
      await chrome.storage.local.set({
        lastOpenedFile: this.activeTab,
        openTabs: this.openTabs
      });
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  renderNotes(filteredNotes = null) {
    const notesToRender = filteredNotes || this.notes;
    
    if (notesToRender.length === 0) {
      this.notesList.innerHTML = '<div class="loading">No notes found</div>';
      return;
    }

    this.notesList.innerHTML = notesToRender.map(note => `
      <div class="note-item" data-filename="${note.name}">
        <div class="note-name">${note.displayName || note.name}</div>
        <div class="note-actions">
          <button class="delete-btn" data-filename="${note.name}">Delete</button>
        </div>
      </div>
    `).join('');

    this.notesList.querySelectorAll('.note-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-btn')) {
          this.openNoteInTab(item.dataset.filename);
          this.showEditorView();
        }
      });
    });

    this.notesList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteNote(btn.dataset.filename);
      });
    });
  }

  renderTabs() {
    this.tabsContainer.innerHTML = this.openTabs.map(filename => `
      <div class="tab ${filename === this.activeTab ? 'active' : ''}" data-filename="${filename}">
        <span class="tab-title">${filename}</span>
        <button class="tab-close" data-filename="${filename}">×</button>
      </div>
    `).join('');

    this.tabsContainer.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) {
          this.switchToTab(tab.dataset.filename);
        }
      });
    });

    this.tabsContainer.querySelectorAll('.tab-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTab(btn.dataset.filename);
      });
    });
  }

  async openNoteInTab(filename) {
    if (!this.openTabs.includes(filename)) {
      this.openTabs.push(filename);
      this.renderTabs();
    }
    
    this.activeTab = filename;
    this.renderTabs();
    await this.loadTabContent(filename);
    this.saveState();
  }

  async loadTabContent(filename) {
    try {
      this.setSaveStatus('Loading...');
      const response = await this.makeRequest(`${this.apiBase}/${filename}`);
      this.noteEditor.value = response.content;
      this.editorTitle.textContent = filename;
      this.setSaveStatus('');
    } catch (error) {
      this.setSaveStatus('Error loading file', 'error');
      console.error('Load tab content error:', error);
    }
  }

  switchToTab(filename) {
    if (this.activeTab === filename) return;
    
    this.activeTab = filename;
    this.renderTabs();
    this.loadTabContent(filename);
    this.saveState();
  }

  closeTab(filename) {
    const index = this.openTabs.indexOf(filename);
    if (index === -1) return;

    this.openTabs.splice(index, 1);
    
    if (this.activeTab === filename) {
      if (this.openTabs.length > 0) {
        // Switch to the next tab, or the previous one if this was the last
        const newIndex = index >= this.openTabs.length ? this.openTabs.length - 1 : index;
        this.activeTab = this.openTabs[newIndex];
        this.loadTabContent(this.activeTab);
      } else {
        this.activeTab = null;
        this.noteEditor.value = '';
        this.editorTitle.textContent = 'Select a note to edit';
        this.setSaveStatus('');
      }
    }
    
    this.renderTabs();
    this.saveState();
  }

  scheduleAutoSave() {
    if (!this.activeTab) return;
    
    this.setSaveStatus('Unsaved changes...', 'saving');
    
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.autoSaveTimeout = setTimeout(() => {
      this.saveCurrentNote(true);
    }, this.autoSaveDelay);
  }

  async saveCurrentNote(isAutoSave = false) {
    if (!this.activeTab) return;

    try {
      if (!isAutoSave) {
        this.setSaveStatus('Saving...', 'saving');
      }
      
      const content = this.noteEditor.value;
      
      await this.makeRequest(`${this.apiBase}/${this.activeTab}`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });

      this.setSaveStatus('Saved', 'saved');
      
      if (!isAutoSave) {
        setTimeout(() => this.setSaveStatus(''), 2000);
      }
    } catch (error) {
      this.setSaveStatus('Save failed', 'error');
      console.error('Save note error:', error);
    }
  }

  setSaveStatus(text, type = '') {
    this.saveStatus.textContent = text;
    this.saveStatus.className = `save-status ${type}`;
  }

  filterNotes(query) {
    if (!query.trim()) {
      this.renderNotes();
      return;
    }

    const filtered = this.notes.filter(note => 
      note.name.toLowerCase().includes(query.toLowerCase()) ||
      (note.displayName && note.displayName.toLowerCase().includes(query.toLowerCase()))
    );
    
    this.renderNotes(filtered);
  }

  async deleteNote(filename) {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

    try {
      await this.makeRequest(`${this.apiBase}/${filename}`, {
        method: 'DELETE'
      });

      this.notes = this.notes.filter(note => note.name !== filename);
      this.renderNotes();
      
      // Close the tab if it's open
      if (this.openTabs.includes(filename)) {
        this.closeTab(filename);
      }
      
      this.showMessage('Note deleted successfully!', 'success');
      setTimeout(() => this.hideMessage(), 2000);
    } catch (error) {
      this.showMessage('Failed to delete note. Please try again.', 'error');
      console.error('Delete note error:', error);
    }
  }

  showNewNoteModal() {
    this.newNoteModal.style.display = 'block';
    this.newNoteInput.value = '';
    this.newNoteInput.focus();
  }

  hideNewNoteModal() {
    this.newNoteModal.style.display = 'none';
  }

  async createNewNote() {
    const filename = this.newNoteInput.value.trim();
    
    if (!filename) {
      alert('Please enter a note name');
      return;
    }

    try {
      const response = await this.makeRequest(this.apiBase, {
        method: 'POST',
        body: JSON.stringify({ filename, content: '' })
      });

      this.hideNewNoteModal();
      await this.loadNotes();
      this.openNoteInTab(response.filename);
      this.showEditorView();
    } catch (error) {
      if (error.message.includes('409')) {
        alert('A note with this name already exists.');
      } else {
        alert('Failed to create note. Please try again.');
      }
      console.error('Create note error:', error);
    }
  }

  showListView() {
    this.listView.classList.remove('hidden');
    this.editorView.classList.remove('visible');
    this.editorView.classList.add('hidden');
  }

  showEditorView() {
    this.listView.classList.add('hidden');
    this.editorView.classList.remove('hidden');
    this.editorView.classList.add('visible');
  }

  showMessage(text, type = 'info') {
    this.message.textContent = text;
    this.message.className = type;
    this.message.style.display = 'block';
  }

  hideMessage() {
    this.message.style.display = 'none';
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new NotesManager();
});