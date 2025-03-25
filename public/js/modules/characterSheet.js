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
  
  // Add additional error handling
  window.addEventListener('error', function(e) {
    console.log('Caught global error:', e.message);
    if (e.message.includes('DataCloneError') || e.message.includes('HTMLInputElement')) {
      e.preventDefault();
      console.warn('Prevented DataCloneError from propagating');
    }
  });
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
    
    // Save field on blur with direct value extraction
    field.addEventListener('blur', () => {
      if (field.classList.contains('autosave')) {
        const fieldName = field.dataset.field;
        const fieldValue = field.value;
        
        if (fieldName) {
          // Use direct values to avoid DOM cloning issues
          handleFieldSave(fieldName, fieldValue, characterId);
        }
      }
    });
    
    // Handle Enter key
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && field.tagName !== 'TEXTAREA') {
        e.preventDefault();
        field.blur();
      }
    });
  });
}

/**
 * Handle saving a field
 * @param {string} fieldName - Field name
 * @param {*} fieldValue - Field value
 * @param {string} characterId - Character ID
 */
function handleFieldSave(fieldName, fieldValue, characterId) {
  try {
    // Update save status
    updateSaveStatus('saving');
    
    // Notice we pass primitive values, not DOM elements
    saveField(characterId, fieldName, fieldValue)
      .then(() => {
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