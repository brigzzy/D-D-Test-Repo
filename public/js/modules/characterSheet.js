/**
 * Main character sheet initialization
 * This file initializes all character sheet functionality
 */
document.addEventListener('DOMContentLoaded', function() {
  // Import all necessary modules
  Promise.all([
    import('./modules/hitPoints.js'),
    import('./modules/mana.js'),
    import('./modules/rest.js')
  ]).then(([hitPointsModule, manaModule, restModule]) => {
    // Extract classes from modules
    const { HitPointManager } = hitPointsModule;
    const { ManaManager } = manaModule;
    const { RestManager } = restModule;
    
    // Initialize character sheet with all modules
    initializeCharacterSheet(HitPointManager, ManaManager, RestManager);
  }).catch(error => {
    console.error('Error loading modules:', error);
  });
});

/**
 * Initialize all character sheet functionality
 * @param {Class} HitPointManager - Hit Points manager class
 * @param {Class} ManaManager - Mana manager class
 * @param {Class} RestManager - Rest manager class
 */
function initializeCharacterSheet(HitPointManager, ManaManager, RestManager) {
  const characterId = getCharacterId();
  
  // Initialize editable fields
  initializeEditableFields();
  
  // Set up save field function
  const saveFieldCallback = (fieldName, fieldValue) => saveField(characterId, fieldName, fieldValue);
  
  // Initialize HP, mana, and rest systems
  HitPointManager.initializeHitPoints(saveFieldCallback);
  ManaManager.initializeMana(saveFieldCallback);
  RestManager.initializeRestButtons(saveFieldCallback);
}

/**
 * Get character ID from URL
 * @returns {string} Character ID
 */
function getCharacterId() {
  return window.location.pathname.split('/').pop();
}

/**
 * Initialize all editable fields
 */
function initializeEditableFields() {
  const editableFields = document.querySelectorAll('.editable-field');
  
  editableFields.forEach(field => {
    // Make field editable on click
    field.addEventListener('click', function(e) {
      // Don't make HP/Mana fields editable on click as they use popups
      if ((field.id === 'currentHitPoints' || field.id === 'currentMana') && field.readOnly) {
        return; // Let the popup handler handle this
      }
      
      if (field.readOnly) {
        field.readOnly = false;
        field.focus();
      }
    });
    
    // Save field on blur
    field.addEventListener('blur', function() {
      if (!field.readOnly) {
        const fieldName = field.dataset.field;
        const fieldValue = field.value;
        
        if (fieldName) {
          saveField(getCharacterId(), fieldName, fieldValue);
        }
        
        field.readOnly = true;
        
        // Update ability modifiers if this is an ability score
        if (field.classList.contains('ability-score')) {
          updateAbilityModifier(field);
        }
      }
    });
    
    // Save on Enter key for text inputs (not for textareas)
    if (field.tagName !== 'TEXTAREA') {
      field.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault(); // Prevent form submission
          field.blur();
        }
      });
    }
  });
}

/**
 * Save field to server
 * @param {string} characterId - Character ID
 * @param {string} fieldName - Field name
 * @param {*} fieldValue - Field value
 */
function saveField(characterId, fieldName, fieldValue) {
  // Update save status
  updateSaveStatus('saving');
  
  fetch(`/characters/${characterId}?_method=PUT`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      field: fieldName,
      value: fieldValue
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    updateSaveStatus('saved');
  })
  .catch(error => {
    console.error('Error updating field:', error);
    updateSaveStatus('error');
  });
}

/**
 * Update the ability modifier when ability score changes
 * @param {HTMLElement} abilityInput - The ability input element
 */
function updateAbilityModifier(abilityInput) {
  const abilityCard = abilityInput.closest('.ability-card');
  if (!abilityCard) return;
  
  const abilityScore = parseInt(abilityInput.value) || 10;
  const modifier = Math.floor((abilityScore - 10) / 2);
  
  const modifierEl = abilityCard.querySelector('.ability-modifier');
  if (modifierEl) {
    modifierEl.textContent = `${modifier >= 0 ? '+' : ''}${modifier}`;
  }
}

/**
 * Update save status
 * @param {string} status - 'saving', 'saved', or 'error'
 */
function updateSaveStatus(status) {
  const saveStatus = document.getElementById('saveStatus');
  if (!saveStatus) return;
  
  if (status === 'saving') {
    saveStatus.textContent = 'Saving...';
    saveStatus.className = 'save-status saving';
  } else if (status === 'saved') {
    saveStatus.textContent = 'All changes saved';
    saveStatus.className = 'save-status saved';
  } else if (status === 'error') {
    saveStatus.textContent = 'Error saving changes';
    saveStatus.className = 'save-status error';
  }
}