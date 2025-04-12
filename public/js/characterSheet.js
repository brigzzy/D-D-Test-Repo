/**
 * characterSheet.js - Main JavaScript file for handling character sheet interactions
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get character ID from URL
  const characterId = window.location.pathname.split('/').pop();
  
  // Create modules config with callback
  const config = {
    saveCallback: (fieldName, fieldValue) => saveField(characterId, fieldName, fieldValue)
  };

  try {
    // Initialize form fields and events
    initializeEditableFields(config.saveCallback);
    
    // Initialize modules depending on what's available in the DOM
    initializeHitPoints(config);
    initializeMana(config);
    initializeSkills(config);
    initializeAbilities(config);
    initializeRest(config);
    initializeCurrency(config);
    
    console.log('Character sheet initialization complete');
  } catch (error) {
    console.error('Error initializing character sheet:', error);
  }
});

/**
 * Initialize all editable fields
 * @param {function} saveCallback - Callback to save changes
 */
function initializeEditableFields(saveCallback) {
  const editableFields = document.querySelectorAll('.editable-field');
  console.log(`Found ${editableFields.length} editable fields`);
  
  editableFields.forEach(field => {
    // Skip fields that have special handlers (HP/Mana/Currency)
    if (field.classList.contains('currency-input') || 
        field.id === 'currentHitPoints' || 
        field.id === 'currentMana') {
      return;
    }
    
    // Make field editable on click
    field.addEventListener('click', function() {
      if (this.readOnly) {
        this.readOnly = false;
        this.focus();
        
        // For text inputs, select all text for easy replacement
        if (this.type === 'text' || this.type === 'number') {
          this.select();
        }
      }
    });
    
    // Handle field losing focus
    field.addEventListener('blur', function() {
      if (!this.readOnly) {
        const fieldName = this.dataset.field;
        if (fieldName) {
          saveCallback(fieldName, this.value);
        }
        
        this.readOnly = true;
        
        // Update ability modifiers if ability score changed
        if (this.classList.contains('ability-score')) {
          updateAbilityModifier(this);
        }
      }
    });
    
    // Handle Enter key for text inputs
    if (field.tagName !== 'TEXTAREA') {
      field.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.blur();
        }
      });
    }
  });
}

/**
 * Update ability modifier when ability score changes
 * @param {HTMLElement} abilityInput - Ability input element
 */
function updateAbilityModifier(abilityInput) {
  const abilityCard = abilityInput.closest('.ability-card');
  if (!abilityCard) return;
  
  const abilityScore = parseInt(abilityInput.value) || 10;
  const modifier = calculateModifier(abilityScore);
  
  const modifierEl = abilityCard.querySelector('.ability-modifier');
  if (modifierEl) {
    modifierEl.textContent = formatModifier(modifier);
  }
  
  // Update skills that depend on this ability
  updateSkillModifiers();
}

/**
 * Calculate ability modifier from score
 * @param {number} score - Ability score
 * @returns {number} Calculated modifier
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Format modifier with + or - sign
 * @param {number} modifier - The modifier value
 * @returns {string} Formatted modifier
 */
function formatModifier(modifier) {
  return `${modifier >= 0 ? '+' : ''}${modifier}`;
}

/**
 * Update all skill modifiers
 */
function updateSkillModifiers() {
  // This will be implemented by the skills module
  // Just a placeholder to show where it would go
  const skillsContainer = document.getElementById('skillsContainer');
  if (skillsContainer && typeof renderSkills === 'function') {
    renderSkills();
  }
}

/**
 * Save field to server
 * @param {string} characterId - Character ID
 * @param {string} fieldName - Field name
 * @param {*} fieldValue - Field value
 * @returns {Promise<Object>} Server response
 */
function saveField(characterId, fieldName, fieldValue) {
  updateSaveStatus('saving');
  
  return fetch(`/characters/${characterId}?_method=PUT`, {
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
      throw new Error(`Server responded with status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    updateSaveStatus('saved');
    return data;
  })
  .catch(error => {
    console.error('Error saving field:', error);
    updateSaveStatus('error');
    throw error;
  });
}

/**
 * Update save status indicator
 * @param {string} status - Status (saving, saved, error)
 */
function updateSaveStatus(status) {
  const saveStatus = document.getElementById('saveStatus');
  if (!saveStatus) return;
  
  const statusConfigs = {
    saving: { text: 'Saving...', className: 'save-status saving' },
    saved: { text: 'All changes saved', className: 'save-status saved' },
    error: { text: 'Error saving changes', className: 'save-status error' }
  };
  
  const config = statusConfigs[status] || statusConfigs.error;
  saveStatus.textContent = config.text;
  saveStatus.className = config.className;
}

// Hit Points Module
function initializeHitPoints(config) {
  const currentHPInput = document.getElementById('currentHitPoints');
  const maxHPInput = document.getElementById('maxHitPoints');
  
  if (!currentHPInput || !maxHPInput) return;
  
  // Force readonly to ensure click handler works
  currentHPInput.readOnly = true;
  
  // Add click event listener
  currentHPInput.addEventListener('click', () => {
    showHitPointPopup(currentHPInput, maxHPInput, config.saveCallback);
  });
}

/**
 * Show hit point modification popup
 * @param {HTMLElement} currentHPInput - Current HP input element
 * @param {HTMLElement} maxHPInput - Max HP input element
 * @param {Function} saveCallback - Callback for saving changes
 */
function showHitPointPopup(currentHPInput, maxHPInput, saveCallback) {
  // Remove any existing popups
  removeExistingPopups('hpPopupOverlay');
  
  // Current values
  const currentHP = parseInt(currentHPInput.value) || 0;
  const maxHP = parseInt(maxHPInput.value) || 0;
  
  // Create and add popup
  const popup = createPopup({
    id: 'hpPopup',
    overlayId: 'hpPopupOverlay',
    title: 'Modify Hit Points',
    currentValue: currentHP,
    maxValue: maxHP,
    valueColor: 'var(--hp-color)',
    borderColor: 'var(--hp-color)'
  });
  
  // Create buttons
  const buttons = [
    {
      id: 'hpDamageBtn',
      text: 'Damage',
      color: 'var(--hp-color)',
      action: (amount) => {
        const newHP = Math.max(0, currentHP - amount);
        currentHPInput.value = newHP;
        saveCallback('hitPoints.current', newHP);
        removePopup(popup);
      }
    },
    {
      id: 'hpHealBtn',
      text: 'Heal',
      color: 'var(--success-color)',
      action: (amount) => {
        const newHP = Math.min(maxHP, currentHP + amount);
        currentHPInput.value = newHP;
        saveCallback('hitPoints.current', newHP);
        removePopup(popup);
      }
    },
    {
      id: 'hpCloseBtn',
      text: 'Close',
      color: '#9e9e9e',
      action: () => removePopup(popup)
    }
  ];
  
  // Add buttons to popup
  addPopupButtons(popup, buttons);
  
  // Focus amount input
  const amountInput = popup.querySelector('#popupAmountInput');
  if (amountInput) {
    amountInput.focus();
    amountInput.select();
  }
}

// Mana Module
function initializeMana(config) {
  const currentManaInput = document.getElementById('currentMana');
  const maxManaInput = document.getElementById('maxMana');
  
  if (!currentManaInput || !maxManaInput) return;
  
  // Force readonly to ensure click handler works
  currentManaInput.readOnly = true;
  
  // Add click event listener
  currentManaInput.addEventListener('click', () => {
    showManaPopup(currentManaInput, maxManaInput, config.saveCallback);
  });
}

/**
 * Show mana modification popup
 * @param {HTMLElement} currentManaInput - Current mana input element
 * @param {HTMLElement} maxManaInput - Max mana input element
 * @param {Function} saveCallback - Callback for saving changes
 */
function showManaPopup(currentManaInput, maxManaInput, saveCallback) {
  // Remove any existing popups
  removeExistingPopups('manaPopupOverlay');
  
  // Current values
  const currentMana = parseInt(currentManaInput.value) || 0;
  const maxMana = parseInt(maxManaInput.value) || 0;
  
  // Create and add popup
  const popup = createPopup({
    id: 'manaPopup',
    overlayId: 'manaPopupOverlay',
    title: 'Modify Mana Points',
    currentValue: currentMana,
    maxValue: maxMana,
    valueColor: 'var(--mana-color)',
    borderColor: 'var(--mana-color)'
  });
  
  // Create buttons
  const buttons = [
    {
      id: 'manaSpendBtn',
      text: 'Spend',
      color: 'var(--mana-color)',
      action: (amount) => {
        const newMana = Math.max(0, currentMana - amount);
        currentManaInput.value = newMana;
        saveCallback('mana.current', newMana);
        removePopup(popup);
      }
    },
    {
      id: 'manaRestoreBtn',
      text: 'Restore',
      color: 'var(--primary-color)',
      action: (amount) => {
        const newMana = Math.min(maxMana, currentMana + amount);
        currentManaInput.value = newMana;
        saveCallback('mana.current', newMana);
        removePopup(popup);
      }
    },
    {
      id: 'manaCloseBtn',
      text: 'Close',
      color: '#9e9e9e',
      action: () => removePopup(popup)
    }
  ];
  
  // Add buttons to popup
  addPopupButtons(popup, buttons);
  
  // Focus amount input
  const amountInput = popup.querySelector('#popupAmountInput');
  if (amountInput) {
    amountInput.focus();
    amountInput.select();
  }
}

// Skills Module
function initializeSkills(config) {
  const skillsContainer = document.getElementById('skillsContainer');
  const skillsInput = document.getElementById('skills');
  const customSkillsInput = document.getElementById('customSkills');
  
  if (!skillsContainer || !skillsInput) return;
  
  // Initial render
  renderSkills();
  
  // Add skill proficiency toggle events
  skillsContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('skill-proficient')) {
      const isCustom = e.target.dataset.custom === 'true';
      const index = parseInt(e.target.dataset.index);
      
      let skills = JSON.parse(isCustom ? customSkillsInput.value : skillsInput.value);
      skills[index].proficient = e.target.checked;
      
      const inputToUpdate = isCustom ? customSkillsInput : skillsInput;
      inputToUpdate.value = JSON.stringify(skills);
      
      config.saveCallback(isCustom ? 'customSkills' : 'skills', inputToUpdate.value);
      
      // Update the display
      renderSkills();
    }
  });
  
  // Add custom skill button
  const addSkillBtn = document.getElementById('addSkillBtn');
  if (addSkillBtn) {
    addSkillBtn.addEventListener('click', () => {
      const customSkills = JSON.parse(customSkillsInput.value || '[]');
      const newSkill = {
        name: 'New Skill',
        ability: 'dexterity',
        proficient: false
      };
      
      customSkills.push(newSkill);
      customSkillsInput.value = JSON.stringify(customSkills);
      config.saveCallback('customSkills', customSkillsInput.value);
      
      renderSkills();
    });
  }
  
  // Make renderSkills available globally for ability score updates
  window.renderSkills = renderSkills;
  
  /**
   * Render all skills sorted alphabetically
   */
  function renderSkills() {
    if (!skillsContainer) return;
    
    const proficiencyBonus = parseInt(document.getElementById('proficiencyBonus')?.textContent.replace('+', '')) || 2;
    
    // Get abilities for modifier calculations
    const abilities = {};
    document.querySelectorAll('.ability-card').forEach(card => {
      const input = card.querySelector('input');
      if (input && input.name) {
        abilities[input.name] = parseInt(input.value) || 10;
      }
    });
    
    const skills = JSON.parse(skillsInput.value || '[]');
    const customSkills = JSON.parse(customSkillsInput.value || '[]');
    
    // Combine standard and custom skills with source info
    const allSkills = [
      ...skills.map((skill, index) => ({ ...skill, isCustom: false, index })),
      ...customSkills.map((skill, index) => ({ ...skill, isCustom: true, index }))
    ];
    
    // Sort alphabetically by name
    allSkills.sort((a, b) => a.name.localeCompare(b.name));
    
    // Clear container
    skillsContainer.innerHTML = '';
    
    // Add skills to container
    allSkills.forEach(skill => {
      const abilityMod = calculateModifier(abilities[skill.ability] || 10);
      const modifier = abilityMod + (skill.proficient ? proficiencyBonus : 0);
      
      const skillItem = document.createElement('div');
      skillItem.className = 'skill-item';
      if (skill.isCustom) skillItem.classList.add('custom-skill');
      skillItem.dataset.index = skill.index;
      skillItem.dataset.custom = skill.isCustom;
      
      // Create checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = skill.isCustom ? `custom_skill_${skill.index}` : `skill_${skill.index}`;
      checkbox.className = 'skill-proficient';
      checkbox.checked = skill.proficient;
      checkbox.dataset.index = skill.index;
      checkbox.dataset.custom = skill.isCustom;
      
      // Create modifier span
      const modSpan = document.createElement('span');
      modSpan.className = 'skill-modifier';
      modSpan.textContent = formatModifier(modifier);
      
      // Create name span
      const nameSpan = document.createElement('span');
      nameSpan.className = 'skill-name';
      nameSpan.textContent = skill.name;
      
      // Make custom skill names editable
      if (skill.isCustom) {
        nameSpan.classList.add('custom-skill-name-display');
        nameSpan.addEventListener('dblclick', () => {
          enterEditMode(skillItem, skill.index);
        });
      }
      
      // Create ability span
      const abilitySpan = document.createElement('span');
      abilitySpan.className = 'skill-ability';
      abilitySpan.textContent = `(${skill.ability.charAt(0).toUpperCase()})`;
      
      // Add elements to skill item
      skillItem.appendChild(checkbox);
      skillItem.appendChild(modSpan);
      skillItem.appendChild(nameSpan);
      skillItem.appendChild(abilitySpan);
      
      // Add delete button for custom skills
      if (skill.isCustom) {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'remove-skill-btn';
        deleteButton.textContent = '×';
        deleteButton.dataset.index = skill.index;
        
        deleteButton.addEventListener('click', () => {
          removeCustomSkill(skill.index);
        });
        
        skillItem.appendChild(deleteButton);
      }
      
      skillsContainer.appendChild(skillItem);
    });
  }
  
  /**
   * Enter edit mode for a custom skill
   * @param {HTMLElement} skillItem - Skill item element
   * @param {number} index - Skill index
   */
  function enterEditMode(skillItem, index) {
    // Already in edit mode?
    if (skillItem.classList.contains('editing')) return;
    
    // Get custom skills
    const customSkills = JSON.parse(customSkillsInput.value || '[]');
    
    // Add editing class
    skillItem.classList.add('editing');
    
    // Get existing elements
    const nameSpan = skillItem.querySelector('.skill-name');
    const abilitySpan = skillItem.querySelector('.skill-ability');
    
    // Get current values
    const currentName = nameSpan.textContent;
    const currentAbility = customSkills[index].ability || 'dexterity';
    
    // Create input for name
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'custom-skill-name-edit';
    nameInput.value = currentName;
    
    // Create select for ability
    const abilitySelect = document.createElement('select');
    abilitySelect.className = 'custom-skill-ability-edit';
    
    // Add ability options
    ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(ability => {
      const option = document.createElement('option');
      option.value = ability;
      option.textContent = ability.charAt(0).toUpperCase();
      if (ability === currentAbility) {
        option.selected = true;
      }
      abilitySelect.appendChild(option);
    });
    
    // Create container for edit controls
    const editContainer = document.createElement('div');
    editContainer.className = 'edit-container';
    editContainer.appendChild(nameInput);
    editContainer.appendChild(abilitySelect);
    
    // Replace spans with edit container
    nameSpan.replaceWith(editContainer);
    abilitySpan.style.display = 'none';
    
    // Show delete button
    const deleteBtn = skillItem.querySelector('.remove-skill-btn');
    if (deleteBtn) {
      deleteBtn.style.display = 'block';
    }
    
    // Focus on name input
    nameInput.focus();
    
    // Track edit state
    let isEditing = true;
    
    // Function to save changes
    function saveChanges() {
      if (!isEditing) return;
      isEditing = false;
      
      const customSkills = JSON.parse(customSkillsInput.value || '[]');
      customSkills[index].name = nameInput.value;
      customSkills[index].ability = abilitySelect.value;
      customSkillsInput.value = JSON.stringify(customSkills);
      config.saveCallback('customSkills', JSON.stringify(customSkills));
      
      // Re-render skills
      renderSkills();
    }
    
    // Handle input blur
    nameInput.addEventListener('blur', (e) => {
      // Don't save if focus is moving to the ability select
      if (e.relatedTarget !== abilitySelect) {
        saveChanges();
      }
    });
    
    // Handle select blur
    abilitySelect.addEventListener('blur', (e) => {
      // Don't save if focus is moving to the name input
      if (e.relatedTarget !== nameInput) {
        saveChanges();
      }
    });
    
    // Handle enter key
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveChanges();
      }
    });
  }
  
  /**
   * Remove a custom skill
   * @param {number} index - Skill index
   */
  function removeCustomSkill(index) {
    const customSkills = JSON.parse(customSkillsInput.value || '[]');
    
    customSkills.splice(index, 1);
    customSkillsInput.value = JSON.stringify(customSkills);
    config.saveCallback('customSkills', customSkillsInput.value);
    
    renderSkills();
  }
}

// Abilities Module
function initializeAbilities(config) {
  const abilityCards = document.querySelectorAll('.ability-card');
  const manaToggleIcons = document.querySelectorAll('.mana-toggle-icon');
  
  // Initialize mana ability toggles
  manaToggleIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      const ability = icon.dataset.ability;
      const isCurrentlyActive = icon.dataset.active === 'true';
      
      // Reset all toggle buttons
      manaToggleIcons.forEach(toggle => {
        toggle.dataset.active = 'false';
        toggle.textContent = '○'; // Empty circle
        toggle.style.color = '#666';
        toggle.closest('.ability-card').classList.remove('ability-card-active');
      });
      
      // If clicking an inactive button, activate it
      if (!isCurrentlyActive) {
        icon.dataset.active = 'true';
        icon.textContent = '●'; // Filled circle
        icon.style.color = 'var(--mana-color)';
        icon.closest('.ability-card').classList.add('ability-card-active');
        
        // Show mana container
        const manaContainer = document.querySelector('.mana-container');
        const manaHeaderText = document.getElementById('manaHeaderText');
        
        if (manaContainer) manaContainer.style.display = 'grid';
        if (manaHeaderText) manaHeaderText.style.display = '';
        
        // Save the selected ability
        config.saveCallback('useManaAbility', ability);
      } else {
        // Hide mana container if turning off
        const manaContainer = document.querySelector('.mana-container');
        const manaHeaderText = document.getElementById('manaHeaderText');
        
        if (manaContainer) manaContainer.style.display = 'none';
        if (manaHeaderText) manaHeaderText.style.display = 'none';
        
        // Clear the selected ability
        config.saveCallback('useManaAbility', null);
      }
    });
  });
}

// Rest Module
function initializeRest(config) {
  // Set up rest buttons
  setupRestButtons();
  
  // Add event listeners to buttons
  const shortRestBtn = document.querySelector('.short-rest-button');
  const longRestBtn = document.querySelector('.long-rest-button');
  
  if (shortRestBtn) {
    shortRestBtn.addEventListener('click', () => performShortRest(config.saveCallback));
  }
  
  if (longRestBtn) {
    longRestBtn.addEventListener('click', () => performLongRest(config.saveCallback));
  }
  
  // Create rest animation container
  createRestAnimationContainer();
  
  /**
   * Set up rest buttons if they don't exist
   */
  function setupRestButtons() {
    // Check if the header exists
    const hpManaHeader = document.getElementById('hpManaHeader');
    if (!hpManaHeader) return;
    
    // Check if rest buttons container already exists
    let restButtonsContainer = hpManaHeader.querySelector('.rest-buttons-container');
    
    // If it doesn't exist, create it
    if (!restButtonsContainer) {
      restButtonsContainer = document.createElement('div');
      restButtonsContainer.className = 'rest-buttons-container';
      
      // Create short rest button
      const shortRestBtn = document.createElement('button');
      shortRestBtn.type = 'button';
      shortRestBtn.className = 'rest-button short-rest-button';
      shortRestBtn.title = 'Short Rest';
      shortRestBtn.innerHTML = '🌙';
      
      // Create long rest button
      const longRestBtn = document.createElement('button');
      longRestBtn.type = 'button';
      longRestBtn.className = 'rest-button long-rest-button';
      longRestBtn.title = 'Long Rest';
      longRestBtn.innerHTML = '☀️';
      
      // Add buttons to container
      restButtonsContainer.appendChild(shortRestBtn);
      restButtonsContainer.appendChild(longRestBtn);
      
      // Add container to header
      hpManaHeader.appendChild(restButtonsContainer);
    }
  }
  
  /**
   * Create animation container for rest effects
   */
  function createRestAnimationContainer() {
    // Check if container already exists
    let animContainer = document.getElementById('restAnimationContainer');
    
    if (!animContainer) {
      animContainer = document.createElement('div');
      animContainer.id = 'restAnimationContainer';
      
      // Create animation box
      const animBox = document.createElement('div');
      animBox.className = 'rest-animation-box';
      
      // Create animation text
      const animText = document.createElement('div');
      animText.className = 'animation-text';
      
      // Create animation emoji
      const animEmoji = document.createElement('div');
      animEmoji.className = 'animation-emoji';
      
      // Add elements to container
      animBox.appendChild(animText);
      animBox.appendChild(animEmoji);
      animContainer.appendChild(animBox);
      
      // Add container to body
      document.body.appendChild(animContainer);
    }
  }
  
  /**
   * Perform a short rest
   * @param {Function} saveCallback - Callback for saving changes
   */
  function performShortRest(saveCallback) {
    showRestAnimation('Short Rest', '🌙', 'var(--mana-color)');
    
    // Mana recovery (50% of max)
    handleManaRecovery(0.5, saveCallback);
  }
  
  /**
   * Perform a long rest
   * @param {Function} saveCallback - Callback for saving changes
   */
  function performLongRest(saveCallback) {
    showRestAnimation('Long Rest', '☀️', 'var(--primary-color)');
    
    // Full HP recovery
    const currentHP = document.getElementById('currentHitPoints');
    const maxHP = document.getElementById('maxHitPoints');
    
    if (currentHP && maxHP) {
      const maxHPValue = parseInt(maxHP.value) || 0;
      
      currentHP.value = maxHPValue;
      saveCallback('hitPoints.current', maxHPValue);
    }
    
    // Full mana recovery
    handleManaRecovery(1.0, saveCallback);
  }
  
  /**
   * Handle mana recovery
   * @param {number} recoveryFactor - Factor for recovery (0.5 for short rest, 1.0 for long rest)
   * @param {Function} saveCallback - Callback for saving changes
   */
  function handleManaRecovery(recoveryFactor, saveCallback) {
    // Check if mana is enabled
    const activeManaToggle = document.querySelector('.mana-toggle-icon[data-active="true"]');
    if (!activeManaToggle) return;
    
    // Get mana inputs
    const currentMana = document.getElementById('currentMana');
    const maxMana = document.getElementById('maxMana');
    
    if (currentMana && maxMana) {
      const maxManaValue = parseInt(maxMana.value) || 0;
      const currentManaValue = parseInt(currentMana.value) || 0;
      
      // Calculate recovery amount
      const recoveryAmount = Math.floor(maxManaValue * recoveryFactor);
      const newMana = Math.min(maxManaValue, currentManaValue + recoveryAmount);
      
      // Update current mana
      currentMana.value = newMana;
      saveCallback('mana.current', newMana);
    }
  }
  
  /**
   * Show rest animation
   * @param {string} type - Type of rest (Short Rest/Long Rest)
   * @param {string} emoji - Emoji to display
   * @param {string} color - Color for animation
   */
  function showRestAnimation(type, emoji, color) {
    const restAnimContainer = document.getElementById('restAnimationContainer');
    if (!restAnimContainer) return;
    
    const restAnimBox = restAnimContainer.querySelector('.rest-animation-box');
    const restAnimText = restAnimContainer.querySelector('.animation-text');
    const restAnimEmoji = restAnimContainer.querySelector('.animation-emoji');
    
    restAnimText.textContent = type;
    restAnimText.style.color = color;
    restAnimEmoji.textContent = emoji;
    restAnimBox.style.borderColor = color;
    restAnimBox.style.border = `2px solid ${color}`;
    
    // Show animation
    restAnimContainer.style.visibility = 'visible';
    restAnimContainer.style.opacity = '1';
    
    setTimeout(() => {
      restAnimBox.style.transform = 'scale(1)';
    }, 10);
    
    // Hide animation after delay
    setTimeout(() => {
      restAnimBox.style.transform = 'scale(0.8)';
      restAnimContainer.style.opacity = '0';
      
      setTimeout(() => {
        restAnimContainer.style.visibility = 'hidden';
      }, 300);
    }, 1500);
  }
}

// Currency Module
function initializeCurrency(config) {
  const currencyInputs = document.querySelectorAll('.currency-input');
  
  currencyInputs.forEach(input => {
    // Make sure input is readonly to trigger popup
    input.readOnly = true;
    
    // Add click handler to show popup
    input.addEventListener('click', () => {
      showCurrencyPopup(input, config.saveCallback);
    });
  });
}

/**
 * Show currency modification popup
 * @param {HTMLElement} currencyInput - The currency input element
 * @param {Function} saveCallback - Callback for saving changes
 */
function showCurrencyPopup(currencyInput, saveCallback) {
  // Remove any existing popups
  removeExistingPopups('currencyPopupOverlay');
  
  // Determine currency type and color
  const currencyInfo = {
    'platinum': { name: 'Platinum Pieces (PP)', color: 'var(--platinum-color)' },
    'gold': { name: 'Gold Pieces (GP)', color: 'var(--gold-color)' },
    'electrum': { name: 'Electrum Pieces (EP)', color: 'var(--electrum-color)' },
    'silver': { name: 'Silver Pieces (SP)', color: 'var(--silver-color)' },
    'copper': { name: 'Copper Pieces (CP)', color: 'var(--copper-color)' }
  }[currencyInput.name] || { name: 'Currency', color: 'var(--primary-color)' };
  
  // Current value
  const currentValue = parseInt(currencyInput.value) || 0;
  
  // Create and add popup
  const popup = createPopup({
    id: 'currencyPopup',
    overlayId: 'currencyPopupOverlay',
    title: `Modify ${currencyInfo.name}`,
    currentValue: currentValue,
    valueColor: currencyInfo.color,
    borderColor: currencyInfo.color
  });
  
  // Create buttons
  const buttons = [
    {
      id: 'currencyAddBtn',
      text: 'Add',
      color: 'var(--success-color)',
      action: (amount) => {
        const newValue = currentValue + amount;
        currencyInput.value = newValue;
        saveCallback(`currency.${currencyInput.name}`, newValue);
        removePopup(popup);
      }
    },
    {
      id: 'currencyRemoveBtn',
      text: 'Remove',
      color: 'var(--error-color)',
      action: (amount) => {
        const newValue = Math.max(0, currentValue - amount);
        currencyInput.value = newValue;
        saveCallback(`currency.${currencyInput.name}`, newValue);
        removePopup(popup);
      }
    },
    {
      id: 'currencyCloseBtn',
      text: 'Close',
      color: '#9e9e9e',
      action: () => removePopup(popup)
    }
  ];
  
  // Add buttons to popup
  addPopupButtons(popup, buttons);
  
  // Focus amount input
  const amountInput = popup.querySelector('#popupAmountInput');
  if (amountInput) {
    amountInput.focus();
    amountInput.select();
  }
}

/**
 * Create a popup element
 * @param {Object} options - Popup configuration
 * @returns {HTMLElement} Created popup element
 */
function createPopup(options) {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = options.overlayId;
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';
  
  // Create popup
  const popup = document.createElement('div');
  popup.id = options.id;
  popup.className = 'attribute-popup';
  popup.style.backgroundColor = 'var(--content-bg-color)';
  popup.style.borderRadius = 'var(--border-radius-md)';
  popup.style.boxShadow = '0 4px 20px var(--shadow-color)';
  popup.style.padding = '20px';
  popup.style.maxWidth = '350px';
  popup.style.width = '100%';
  popup.style.animation = 'fadeIn 0.3s ease';
  popup.style.borderLeft = `4px solid ${options.borderColor}`;
  
  // Create title
  const title = document.createElement('h3');
  title.style.marginTop = '0';
  title.style.marginBottom = '20px';
  title.style.fontSize = '20px';
  title.style.color = 'var(--text-color)';
  title.style.textAlign = 'center';
  title.textContent = options.title;
  
  // Create value display
  const valueDisplay = document.createElement('div');
  valueDisplay.style.marginBottom = '20px';
  valueDisplay.style.textAlign = 'center';
  
  const valueText = document.createElement('p');
  valueText.style.margin = '5px 0';
  valueText.style.fontSize = '24px';
  valueText.style.fontWeight = 'bold';
  
  if (options.maxValue !== undefined) {
    // For HP/Mana style with max value
    const currentSpan = document.createElement('span');
    currentSpan.style.color = options.valueColor;
    currentSpan.textContent = options.currentValue;
    
    valueText.appendChild(currentSpan);
    valueText.appendChild(document.createTextNode(` / ${options.maxValue}`));
  } else {
    // For currency style with only current value
    valueText.style.color = options.valueColor;
    valueText.textContent = options.currentValue;
  }
  
  valueDisplay.appendChild(valueText);
  
  // Create amount input group
  const inputGroup = document.createElement('div');
  inputGroup.style.marginBottom = '20px';
  
  const inputLabel = document.createElement('label');
  inputLabel.htmlFor = 'popupAmountInput';
  inputLabel.style.display = 'block';
  inputLabel.style.marginBottom = '10px';
  inputLabel.style.fontWeight = 'bold';
  inputLabel.textContent = 'Amount:';
  
  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.id = 'popupAmountInput';
  amountInput.value = '0';
  amountInput.min = '0';
  amountInput.style.width = '100%';
  amountInput.style.padding = '10px';
  amountInput.style.fontSize = '16px';
  amountInput.style.border = '1px solid var(--input-border-color)';
  amountInput.style.borderRadius = 'var(--border-radius-sm)';
  amountInput.style.backgroundColor = 'var(--input-bg-color)';
  amountInput.style.color = 'var(--input-text-color)';
  
  inputGroup.appendChild(inputLabel);
  inputGroup.appendChild(amountInput);
  
  // Create buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.justifyContent = 'space-between';
  
  // Add elements to popup
  popup.appendChild(title);
  popup.appendChild(valueDisplay);
  popup.appendChild(inputGroup);
  popup.appendChild(buttonsContainer);
  
  // Add popup to overlay
  overlay.appendChild(popup);
  
  // Add overlay to body
  document.body.appendChild(overlay);
  
  // Close when clicking outside the popup
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      removePopup(overlay);
    }
  });
  
  // Handle Escape key
  document.addEventListener('keydown', function escapeListener(e) {
    if (e.key === 'Escape') {
      removePopup(overlay);
      document.removeEventListener('keydown', escapeListener);
    }
  });
  
  return popup;
}

/**
 * Add buttons to a popup
 * @param {HTMLElement} popup - The popup element
 * @param {Array<Object>} buttons - Button configurations
 */
function addPopupButtons(popup, buttons) {
  const buttonsContainer = popup.querySelector('div:last-child');
  if (!buttonsContainer) return;
  
  const amountInput = popup.querySelector('#popupAmountInput');
  
  buttons.forEach(buttonConfig => {
    const button = document.createElement('button');
    button.id = buttonConfig.id;
    button.style.backgroundColor = buttonConfig.color;
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '10px 20px';
    button.style.borderRadius = 'var(--border-radius-sm)';
    button.style.cursor = 'pointer';
    button.style.fontWeight = 'bold';
    button.style.flex = buttonConfig.id.includes('Close') ? '0.8' : '1';
    button.style.marginRight = buttonConfig.id.includes('Close') ? '0' : '10px';
    button.textContent = buttonConfig.text;
    
    button.addEventListener('click', () => {
      const amount = parseInt(amountInput?.value) || 0;
      buttonConfig.action(amount);
    });
    
    buttonsContainer.appendChild(button);
  });
  
  // Handle Enter key on amount input
  if (amountInput) {
    amountInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        // Find the primary button (usually the middle one) and click it
        const primaryButton = buttonsContainer.children[1] || buttonsContainer.children[0];
        if (primaryButton) primaryButton.click();
      }
    });
  }
}

/**
 * Remove an existing popup element
 * @param {HTMLElement} popup - The popup element or overlay
 */
function removePopup(popup) {
  // If given the popup directly, find its parent overlay
  const overlay = popup.id.includes('Overlay') ? popup : popup.parentElement;
  
  if (overlay) {
    document.body.style.overflow = ''; // Restore scrolling
    overlay.remove();
  }
}

/**
 * Remove any existing popups with the given overlay ID
 * @param {string} overlayId - ID of the overlay to remove
 */
function removeExistingPopups(overlayId) {
  const existingOverlay = document.getElementById(overlayId);
  if (existingOverlay) {
    existingOverlay.remove();
  }
}
