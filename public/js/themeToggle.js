// themeToggle.js - Fixed version with proper server communication
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
    
    // If logged in, save preference to server
    if (window.userLoggedIn) {
      saveThemePreference(themeName);
    }
  }
  
  // Function to save theme to server
  function saveThemePreference(theme) {
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
  
  // Initialize
  loadTheme();
  
  // Add to window for external access
  window.setTheme = setTheme;
});

// For external setting of user logged in state
function markUserLoggedIn(value) {
  window.userLoggedIn = value;
}