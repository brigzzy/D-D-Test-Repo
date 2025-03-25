// public/js/modules/utils.js

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
 * Safe stringify function that handles DOM elements
 * @param {any} value - Value to stringify
 * @returns {string} JSON string
 */
function safeStringify(value) {
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
    
    // Send request to server
    const response = await fetch(`/characters/${characterId}`, {
      method: 'PUT',
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
  }
}

/**
 * Safely get form values
 * @param {HTMLFormElement} form - Form element
 * @returns {Object} Form values
 */
export function getFormValues(form) {
  const values = {};
  
  Array.from(form.elements).forEach(element => {
    // Skip buttons and non-input elements
    if (!element.name || element.type === 'button' || element.type === 'submit') {
      return;
    }
    
    // Handle checkboxes
    if (element.type === 'checkbox') {
      values[element.name] = element.checked;
    } 
    // Handle text, number, and other inputs
    else {
      values[element.name] = element.value;
    }
  });
  
  return values;
}