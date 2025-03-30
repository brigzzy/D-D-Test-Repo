// Improved theme toggle script
document.addEventListener('DOMContentLoaded', function() {
    console.log('Theme toggle script loaded');
    
    // Get the toggle element
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) {
      console.error('Theme toggle not found');
      return;
    }
    
    // Function to set theme with enhanced logging
    function setTheme(themeName) {
      console.log('Setting theme to:', themeName);
      
      // Apply theme to HTML element
      document.documentElement.setAttribute('data-theme', themeName);
      
      // Store theme in localStorage
      localStorage.setItem('theme', themeName);
      
      // Update toggle state
      themeToggle.checked = themeName === 'dark';
      
      // Debug the current state
      console.log('Current data-theme attribute:', document.documentElement.getAttribute('data-theme'));
      console.log('Toggle checked state:', themeToggle.checked);
      
      // If logged in, save preference to server
      if (window.userLoggedIn) {
        saveThemePreference(themeName);
      }
    }
    
    // Function to save theme to server
    function saveThemePreference(theme) {
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
      .then(response => response.json())
      .then(data => console.log('Theme saved to server', data))
      .catch(err => console.error('Error saving theme', err));
    }
    
    // Load initial theme
    function loadTheme() {
      console.log('Loading initial theme');
      
      // First try user preference from server
      const userTheme = document.documentElement.getAttribute('data-user-theme');
      console.log('User theme from server:', userTheme);
      
      if (userTheme) {
        return setTheme(userTheme);
      }
      
      // Then try localStorage
      const savedTheme = localStorage.getItem('theme');
      console.log('Theme from localStorage:', savedTheme);
      
      if (savedTheme) {
        return setTheme(savedTheme);
      }
      
      // Finally try system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        console.log('Using system preference: dark');
        return setTheme('dark');
      }
      
      // Default to light
      console.log('Defaulting to light theme');
      setTheme('light');
    }
    
    // Handle toggle changes
    themeToggle.addEventListener('change', function() {
      const newTheme = this.checked ? 'dark' : 'light';
      console.log('Toggle changed to:', newTheme);
      setTheme(newTheme);
    });
    
    // Force light mode if toggle is not checked
    document.addEventListener('click', function(e) {
      if (e.target === themeToggle || e.target.closest('.theme-switch')) {
        // Skip this check if we're clicking the toggle itself
        return;
      }
      
      // Make sure toggle and theme are in sync
      const currentTheme = document.documentElement.getAttribute('data-theme');
      if (currentTheme === 'dark' && !themeToggle.checked) {
        console.log('Fixing inconsistency: theme is dark but toggle is off');
        themeToggle.checked = true;
      } else if (currentTheme === 'light' && themeToggle.checked) {
        console.log('Fixing inconsistency: theme is light but toggle is on');
        themeToggle.checked = false;
      }
    });
    
    // Initialize
    loadTheme();
    
    // Add to window for external access
    window.setTheme = setTheme;
  });
  
  // For external setting of user logged in state
  function markUserLoggedIn(value) {
    window.userLoggedIn = value;
  }