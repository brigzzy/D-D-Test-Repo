// public/js/modules/character-sheet.js

// Import utility functions and modules for character sheet management
import { debounce, saveField, makeFieldEditable, updateSaveStatus } from './utils.js';
import { AbilityManager } from './abilities.js';
import { SkillManager } from './skills.js';
import { HitPointManager } from './hitPoints.js';
import { RestManager } from './rest.js';
import { ManaManager } from './mana.js';  // Import the new mana module


// Main initialization function that runs when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Extract the character ID from the current URL
  const characterId = window.location.pathname.split('/').pop();
  
  // Centralized save method that will be passed to various modules
  const saveCallback = (field, value) => {
    try {
      // Attempt to save the field with error handling and status updates
      updateSaveStatus('saving');
      
      saveField(characterId, field, value)
        .then(() => updateSaveStatus('saved'))
        .catch(() => updateSaveStatus('error'));
    } catch (error) {
      console.error('Save callback error:', error);
      updateSaveStatus('error');
    }
  };

  // Initialize various character sheet components
  initializeEditableFields(saveCallback);
  AbilityManager.initializeAbilityCards(saveCallback);
  AbilityManager.initializeManaAbilityState();
  ManaManager.initializeMana(saveCallback);  // Use the new mana initialization
  SkillManager.initializeSkills(saveCallback);
  HitPointManager.initializeHitPoints(saveCallback);
  RestManager.initializeRestButtons(saveCallback);
});

/**
 * Initialize editable fields with autosave and interaction capabilities
 * @param {function} saveCallback - Callback function to save field changes
 */
function initializeEditableFields(saveCallback) {
  // Select all fields marked as editable
  const editableFields = document.querySelectorAll('.editable-field');
  
  editableFields.forEach(field => {
    // Make field clickable to enter edit mode
    field.addEventListener('click', () => makeFieldEditable(field));
    
    // Debounced save when field loses focus
    field.addEventListener('blur', debounce(() => {
      if (field.classList.contains('autosave')) {
        saveEditedField(field, saveCallback);
      }
    }, 500));
    
    // Allow Enter key to trigger save for non-textarea fields
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && field.tagName !== 'TEXTAREA') {
        field.blur();
      }
    });
  });
}

/**
 * Save an edited field with additional context-specific handling
 * @param {HTMLElement} field - The edited field element
 * @param {function} saveCallback - Callback to save field changes
 */

function saveEditedField(field, saveCallback) {
  const fieldName = field.dataset.field;
  // Pass the VALUE of the field, not the field itself
  const value = field.value;
  
  try {
    // Save the field value
    saveCallback(fieldName, value);
    
    // Reset field to read-only
    field.readOnly = true;
  } catch (error) {
    console.error('Error saving field:', error);
    updateSaveStatus('error');
  }
}

/**
 * Update proficiency bonus based on character level
 */
function updateProficiencyBonus() {
  const levelInput = document.getElementById('level');
  const proficiencyBonusDisplay = document.getElementById('proficiencyBonus');
  
  if (!levelInput || !proficiencyBonusDisplay) return;
  
  const level = parseInt(levelInput.value) || 1;
  const proficiencyBonus = Math.floor((level - 1) / 4) + 2;
  
  proficiencyBonusDisplay.textContent = `+${proficiencyBonus}`;
  
  // Update skill modifiers to reflect new proficiency bonus
  updateSkillModifiers(proficiencyBonus);
}

/**
 * Recalculate and update skill modifiers
 * @param {number} proficiencyBonus - Current proficiency bonus
 */
function updateSkillModifiers(proficiencyBonus) {
  // Collect current ability scores
  const abilities = {};
  document.querySelectorAll('.ability-score').forEach(input => {
    abilities[input.name] = parseInt(input.value) || 10;
  });
  
  // Update standard skills
  updateStandardSkillModifiers(abilities, proficiencyBonus);
  
  // Update custom skills
  updateCustomSkillModifiers(abilities, proficiencyBonus);
}

/**
 * Update modifiers for standard skills
 * @param {Object} abilities - Current ability scores
 * @param {number} proficiencyBonus - Current proficiency bonus
 */
function updateStandardSkillModifiers(abilities, proficiencyBonus) {
  const skillItems = document.querySelectorAll('.skill-item:not(.custom-skill)');
  const skills = JSON.parse(document.getElementById('skills').value);
  
  skillItems.forEach((skillItem, index) => {
    const skill = skills[index];
    if (!skill) return;
    
    const abilityMod = Math.floor((abilities[skill.ability] - 10) / 2);
    const totalModifier = abilityMod + (skill.proficient ? proficiencyBonus : 0);
    
    const modifierDisplay = skillItem.querySelector('.skill-modifier');
    if (modifierDisplay) {
      modifierDisplay.textContent = `${totalModifier >= 0 ? '+' : ''}${totalModifier}`;
    }
  });
}

/**
 * Update modifiers for custom skills
 * @param {Object} abilities - Current ability scores
 * @param {number} proficiencyBonus - Current proficiency bonus
 */
function updateCustomSkillModifiers(abilities, proficiencyBonus) {
  const customSkillItems = document.querySelectorAll('.skill-item.custom-skill');
  const customSkills = JSON.parse(document.getElementById('customSkills').value || '[]');
  
  customSkillItems.forEach((skillItem, index) => {
    const skill = customSkills[index];
    if (!skill) return;
    
    const abilityMod = Math.floor((abilities[skill.ability] - 10) / 2);
    const totalModifier = abilityMod + (skill.proficient ? proficiencyBonus : 0);
    
    const modifierDisplay = skillItem.querySelector('.skill-modifier');
    if (modifierDisplay) {
      modifierDisplay.textContent = `${totalModifier >= 0 ? '+' : ''}${totalModifier}`;
    }
  });
}