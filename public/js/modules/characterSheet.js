// public/js/modules/characterSheet.js

import { debounce, saveField, makeFieldEditable, updateSaveStatus } from './utils.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeCharacterSheet();
});

/**
 * Initialize the character sheet functionality
 */
function initializeCharacterSheet() {
  // Get character ID from URL
  const characterId = window.location.pathname.split('/').pop();
  
  // Initialize editable fields
  initializeEditableFields(characterId);
}

/**
 * Initialize all editable fields
 * @param {string} characterId - Character ID
 */
function initializeEditableFields(characterId) {
  const editableFields = document.querySelectorAll('.editable-field');
  
  editableFields.forEach(field => {
    // Make field editable on click
    field.addEventListener('click', () => {
      if (field.readOnly) {
        field.readOnly = false;
        field.focus();
      }
    });
    
    // Save field on blur
    field.addEventListener('blur', () => {
      if (field.classList.contains('autosave')) {
        handleFieldSave(field, characterId);
      }
    });
    
    // Handle Enter key
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && field.tagName !== 'TEXTAREA') {
        field.blur();
      }
    });
  });
}

/**
 * Handle saving a field
 * @param {HTMLElement} field - Field element
 * @param {string} characterId - Character ID
 */
function handleFieldSave(field, characterId) {
  try {
    const fieldName = field.dataset.field;
    const fieldValue = field.value;
    
    // Update save status
    updateSaveStatus('saving');
    
    // Save the field
    saveField(characterId, fieldName, fieldValue)
      .then(() => {
        field.readOnly = true;
        updateSaveStatus('saved');
      })
      .catch(error => {
        console.error('Error saving field:', error);
        updateSaveStatus('error');
      });
  } catch (error) {
    console.error('Error in handleFieldSave:', error);
    updateSaveStatus('error');
  }
}