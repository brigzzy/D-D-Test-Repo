// modules/utils.js

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Format a modifier with plus/minus sign
 * @param {number} modifier - The modifier value
 * @returns {string} Formatted modifier
 */
export function formatModifier(modifier) {
  return `${modifier >= 0 ? '+' : ''}${modifier}`;
}

/**
 * Calculate ability modifier from score
 * @param {number} score - Ability score
 * @returns {number} Calculated modifier
 */
export function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Safe stringify function that handles DOM elements
 * @param {any} value - Value to stringify
 * @returns {string} JSON string
 */
export function safeStringify(value) {
  return JSON.stringify(value, (key, val) => {
    if (val instanceof Element || val instanceof Node) {
      return undefined; // Skip DOM elements
    }
    return val;
  });
}

/**
 * Save a field value to the server
 * @param {string} characterId - ID of the character
 * @param {string} field - Field to update
 * @param {*} value - New value for the field
 * @returns {Promise} Fetch promise
 */
export async function saveField(characterId, field, value) {
  try {
    // Extract primitive value if needed
    let primitiveValue = value;
    
    // If it's an HTML element, extract its value
    if (value instanceof Element) {
      if ('value' in value) {
        primitiveValue = value.value;
      } else {
        primitiveValue = value.textContent || '';
      }
    }
    
    // Update save status to "saving"
    updateSaveStatus('saving');
    
    // Send request to server
    const response = await fetch(`/characters/${characterId}?_method=PUT`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: safeStringify({
        field: field,
        value: primitiveValue
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    // Update save status to "saved"
    updateSaveStatus('saved');
    
    return await response.json();
  } catch (error) {
    console.error('Save field error:', error);
    updateSaveStatus('error');
    throw error;
  }
}

/**
 * Update the save status display
 * @param {string} status - Status type (saving, saved, error)
 */
export function updateSaveStatus(status) {
  const saveStatus = document.getElementById('saveStatus');
  if (!saveStatus) return;

  const statusMessages = {
    saving: { text: 'Saving...', className: 'save-status saving' },
    saved: { text: 'All changes saved', className: 'save-status saved' },
    error: { text: 'Error saving changes', className: 'save-status error' }
  };

  const { text, className } = statusMessages[status] || statusMessages.error;
  saveStatus.textContent = text;
  saveStatus.className = className;
}

/**
 * Make an input field editable
 * @param {HTMLElement} field - The input field to make editable
 */
export function makeFieldEditable(field) {
  if (field.readOnly) {
    field.readOnly = false;
    field.focus();
    
    // For text inputs, select all text for easy replacement
    if (field.type === 'text' || field.type === 'number') {
      field.select();
    }
  }
}

/**
 * Get character ID from URL
 * @returns {string|null} Character ID or null
 */
export function getCharacterIdFromUrl() {
  const path = window.location.pathname;
  const match = path.match(/\/characters\/([^\/]+)$/);
  return match ? match[1] : null;
}