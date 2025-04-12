// modules/characterTheme.js
import { updateSaveStatus } from './utils.js';

// Private functions (not exported)
function getCharacterIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/characters\/([^\/]+)$/);
    return match ? match[1] : null;
}


export class CharacterThemeManager {
  static initialize() {
    // Only initialize if we're on a character page
    const characterId = getCharacterIdFromUrl();
    if (!characterId) {
      console.log('Not on a character page, skipping theme initialization');
      return;
    }
    
    console.log('Initializing character theme for ID:', characterId);
    
    // Create theme picker - moved to header
    this.createThemePickerInHeader();


    const htmlTheme = document.documentElement.getAttribute('data-character-theme');
    console.log('Direct HTML theme attribute:', htmlTheme);

    const savedTheme = htmlTheme || 'default';
    console.log('Using theme:', savedTheme);
    
    // Apply the theme
    this.applyCharacterTheme(savedTheme);
    this.updateActiveThemeButton(savedTheme);
  }
  
  // This function creates the theme picker in the header
  static createThemePickerInHeader() {
    console.log('Creating theme picker in header');
    
    // Find the theme-switch-wrapper in the header
    const themeWrapper = document.querySelector('.theme-switch-wrapper');
    if (!themeWrapper) {
      console.error('Theme switch wrapper not found in header');
      return;
    }
    
    // Check if the picker already exists
    if (themeWrapper.querySelector('#character-theme-select')) {
      return;
    }
    
    // Create theme picker container
    const themePickerContainer = document.createElement('div');
    themePickerContainer.className = 'character-theme-picker';
    themePickerContainer.style.display = 'flex';
    themePickerContainer.style.alignItems = 'center';
    themePickerContainer.style.marginLeft = '15px';
    
    // Create theme picker content
    themePickerContainer.innerHTML = `
      <label for="character-theme-select" style="margin-right: 5px; font-size: 14px; color: var(--header-text-color);">Sheet:</label>
      <select id="character-theme-select" style="padding: 2px 5px; border-radius: 4px; border: 1px solid var(--border-color); background-color: var(--content-bg-color); color: var(--text-color);">
        <option value="default">Default</option>
        <option value="red">Red</option>
        <option value="green">Green</option>
        <option value="blue">Blue</option>
      </select>
    `;
    
    // Add after the theme toggle
    themeWrapper.appendChild(themePickerContainer);
    
    // Add event listener to select element
    const themeSelect = themePickerContainer.querySelector('#character-theme-select');
    if (themeSelect) {
      const characterId = getCharacterIdFromUrl();
      themeSelect.addEventListener('change', (e) => {
        const themeValue = e.target.value;
        console.log('Theme changed to:', themeValue);
        this.applyCharacterTheme(themeValue);
        
        if (characterId) {
          this.saveCharacterTheme(characterId, themeValue);
        }
      });
    }
    
    console.log('Theme picker created in header');
  }
  
  // For backwards compatibility - this should NOT be called anymore
  static createThemePicker() {
    console.warn('Old createThemePicker called - use createThemePickerInHeader instead');
    this.createThemePickerInHeader();
  }
  
  static applyCharacterTheme(theme) {
    console.log('Applying character theme:', theme);
    
    // Don't remove existing attribute before checking it
    const currentTheme = document.documentElement.getAttribute('data-character-theme');
    console.log('Current data-character-theme:', currentTheme);
    
    // Only change if needed
    if (currentTheme !== theme) {
      // Remove existing attribute
      document.documentElement.removeAttribute('data-character-theme');
      
      // Add new theme if not default
      if (theme && theme !== 'default') {
        document.documentElement.setAttribute('data-character-theme', theme);
        console.log('Set data-character-theme to:', theme);
      } else {
        console.log('Using default theme (no data-character-theme attribute)');
      }
    } else {
      console.log('Theme already set correctly, no change needed');
    }
  }
  
  static saveCharacterTheme(characterId, theme) {
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
  
  static updateActiveThemeButton(theme) {
    const themeSelect = document.getElementById('character-theme-select');
    if (themeSelect) {
      console.log('Updating theme select to:', theme || 'default');
      themeSelect.value = theme || 'default';
    } else {
      console.log('Theme select not found, cannot update');
    }
  }
}

// Automatically initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const characterId = getCharacterIdFromUrl();
  if (characterId) {
    CharacterThemeManager.initialize();
  }
});

let initialized = false;

// Export a standalone setup function for explicit initialization
export function setupCharacterTheme() {
    if (!initialized) {
      CharacterThemeManager.initialize();
      initialized = true;
    } else {
      console.log('Character theme already initialized, skipping');
    }
  }
  
  // Auto-initialize with DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    setupCharacterTheme();
  });