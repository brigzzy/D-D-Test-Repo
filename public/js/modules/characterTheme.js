// characterTheme.js - Simplified version
document.addEventListener('DOMContentLoaded', function() {
    console.log('Character theme script loaded');
    
    // Only proceed if we're on a character page
    const characterId = getCharacterIdFromUrl();
    if (!characterId) {
      console.log('Not on a character page, skipping theme initialization');
      return;
    }
    
    console.log('Initializing character theme for ID:', characterId);
    
    // Create and add theme picker
    createThemePicker();
    
    // Load saved theme if available
    const savedTheme = window.characterData?.theme || 'default';
    applyCharacterTheme(savedTheme);
    updateActiveThemeButton(savedTheme);
    
    /**
     * Create and insert the theme picker UI
     */
    function createThemePicker() {
      console.log('Creating theme picker');
      
      const characterHeader = document.querySelector('.character-sheet-header');
      if (!characterHeader) {
        console.error('Character header not found, cannot add theme picker');
        return;
      }
      
      // Create theme picker container
      const themePickerContainer = document.createElement('div');
      themePickerContainer.className = 'theme-picker-container';
      themePickerContainer.style.display = 'flex';
      themePickerContainer.style.alignItems = 'center';
      themePickerContainer.style.marginRight = '1rem';
      
      // Create theme picker content
      themePickerContainer.innerHTML = `
        <label for="character-theme-select" style="margin-right: 0.5rem; font-size: 0.875rem; color: var(--muted-text-color);">Sheet Theme:</label>
        <select id="character-theme-select" style="padding: 0.25rem; border-radius: 4px; border: 1px solid var(--border-color);">
          <option value="default">Default</option>
          <option value="red">Red</option>
          <option value="green">Green</option>
          <option value="blue">Blue</option>
        </select>
      `;
      
      // Insert the theme picker after the title
      const title = characterHeader.querySelector('h2');
      if (title && title.nextSibling) {
        characterHeader.insertBefore(themePickerContainer, title.nextSibling);
      } else {
        characterHeader.appendChild(themePickerContainer);
      }
      
      // Add event listener to select element
      const themeSelect = document.getElementById('character-theme-select');
      if (themeSelect) {
        themeSelect.addEventListener('change', function() {
          const themeValue = this.value;
          console.log('Theme changed to:', themeValue);
          applyCharacterTheme(themeValue);
          saveCharacterTheme(characterId, themeValue);
        });
      }
      
      console.log('Theme picker created successfully');
    }
    
    /**
     * Apply a character theme
     * @param {string} theme - Theme name
     */
    function applyCharacterTheme(theme) {
      console.log('Applying theme:', theme);
      
      // Remove any existing character theme
      document.documentElement.removeAttribute('data-character-theme');
      
      // Add new theme if not default
      if (theme && theme !== 'default') {
        document.documentElement.setAttribute('data-character-theme', theme);
      }
    }
    
    /**
     * Save character theme preference
     * @param {string} characterId - Character ID
     * @param {string} theme - Theme value
     */
    function saveCharacterTheme(characterId, theme) {
      console.log('Saving theme for character:', characterId, theme);
      
      fetch('/characters/' + characterId + '?_method=PUT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          field: 'theme',
          value: theme === 'default' ? null : theme
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to save character theme');
        }
        return response.json();
      })
      .then(data => {
        console.log('Theme saved successfully:', data);
        updateSaveStatus('saved');
      })
      .catch(error => {
        console.error('Error saving theme:', error);
        updateSaveStatus('error');
      });
    }
    
    /**
     * Update the select element to match the current theme
     * @param {string} theme - Current theme
     */
    function updateActiveThemeButton(theme) {
      const themeSelect = document.getElementById('character-theme-select');
      if (themeSelect) {
        themeSelect.value = theme || 'default';
      }
    }
    
    /**
     * Get character ID from URL
     * @returns {string|null} Character ID or null
     */
    function getCharacterIdFromUrl() {
      const path = window.location.pathname;
      const match = path.match(/\/characters\/([^\/]+)$/);
      return match ? match[1] : null;
    }
    
    /**
     * Update save status indicator
     * @param {string} status - 'saving', 'saved', or 'error'
     */
    function updateSaveStatus(status) {
      const saveStatus = document.getElementById('saveStatus');
      if (!saveStatus) return;
      
      const statusMessages = {
        saving: { text: 'Saving...', className: 'save-status saving' },
        saved: { text: 'All changes saved', className: 'save-status saved' },
        error: { text: 'Error saving changes', className: 'save-status error' }
      };
      
      const config = statusMessages[status] || statusMessages.error;
      saveStatus.textContent = config.text;
      saveStatus.className = config.className;
    }
  });