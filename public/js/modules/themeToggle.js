// modules/themeToggle.js

// Private state
let _userLoggedIn = false;

export class ThemeToggleManager {
  /**
   * Initialize the theme toggle functionality
   */
  static initialize() {
    console.log('Theme toggle initializing');
    
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Theme toggle DOM ready');
      
      // Get the toggle element
      const themeToggle = document.getElementById('theme-toggle');
      if (!themeToggle) {
        console.error('Theme toggle not found');
        return;
      }
      
      // Handle toggle changes
      themeToggle.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        console.log('Toggle changed to:', newTheme);
        this.setTheme(newTheme);
      });
      
      // Initialize theme
      this.loadTheme();
      
      console.log('Theme toggle initialization complete');
    });
  }
  
  /**
   * Set the active theme
   * @param {string} themeName - 'light' or 'dark'
   */
  static setTheme(themeName) {
    console.log('Setting theme to:', themeName);
    
    // Apply theme to HTML element
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Store theme in localStorage
    localStorage.setItem('theme', themeName);
    
    // Update toggle state
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.checked = themeName === 'dark';
    }
    
    // If logged in, save preference to server
    if (_userLoggedIn) {
      this.saveThemePreference(themeName);
    }
  }
  
  /**
   * Save theme preference to server
   * @param {string} theme - The theme name to save
   */
  static saveThemePreference(theme) {
    console.log('Saving theme preference to server:', theme);
    
    fetch('/user/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        preference: 'theme',
        value: theme
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Theme successfully saved to server:', data);
    })
    .catch(err => {
      console.error('Error saving theme to server:', err);
    });
  }
  
  /**
   * Load the initial theme
   */
  static loadTheme() {
    console.log('Loading initial theme');
    
    // First try user preference from server
    const userTheme = document.documentElement.getAttribute('data-user-theme');
    console.log('User theme from server:', userTheme);
    
    if (userTheme) {
      return this.setTheme(userTheme);
    }
    
    // Then try localStorage
    const savedTheme = localStorage.getItem('theme');
    console.log('Theme from localStorage:', savedTheme);
    
    if (savedTheme) {
      return this.setTheme(savedTheme);
    }
    
    // Finally try system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      console.log('Using system preference: dark');
      return this.setTheme('dark');
    }
    
    // Default to light
    console.log('Defaulting to light theme');
    this.setTheme('light');
  }
  
  /**
   * Set login state
   * @param {boolean} value - Login state
   */
  static setUserLoggedIn(value) {
    _userLoggedIn = value;
    console.log('User logged in state set to:', value);
  }
}

// Export the login state setter for backward compatibility
export function markUserLoggedIn(value) {
  ThemeToggleManager.setUserLoggedIn(value);
}

// Auto-initialize when imported
ThemeToggleManager.initialize();