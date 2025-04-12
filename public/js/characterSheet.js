// characterSheet.js - Main entry point
import { saveField, updateSaveStatus, getCharacterIdFromUrl } from './modules/utils.js';
import { HitPointManager } from './modules/hitPoints.js';
import { ManaManager } from './modules/mana.js';
import { SkillManager } from './modules/skills.js';
import { AbilityManager } from './modules/abilities.js';
import { RestManager } from './modules/rest.js';
import { CurrencyManager } from './modules/currencyManager.js';
import { EditableFieldManager } from './modules/editableFields.js';
// Import but don't initialize here - it self-initializes
import { CharacterThemeManager } from './modules/characterTheme.js';

document.addEventListener('DOMContentLoaded', function() {
  console.log('Character sheet initializing');
  
  // Get character ID from URL
  const characterId = getCharacterIdFromUrl();
  if (!characterId) {
    console.log('No character ID found in URL');
    return;
  }
  
  console.log('Initializing character sheet for ID:', characterId);
  
  // Create a save callback function that all modules can use
  const saveFieldCallback = (fieldName, fieldValue) => {
    return saveField(characterId, fieldName, fieldValue);
  };

  try {
    // Initialize all modules
    EditableFieldManager.initialize(saveFieldCallback);
    HitPointManager.initializeHitPoints(saveFieldCallback);
    ManaManager.initializeMana(saveFieldCallback);
    SkillManager.initializeSkills(saveFieldCallback);
    AbilityManager.initializeAbilityCards(saveFieldCallback);
    RestManager.initializeRestButtons(saveFieldCallback);
    CurrencyManager.initializeCurrency(saveFieldCallback);
    AbilityManager.initializeAbilityCards(saveFieldCallback);
    AbilityManager.initializeManaAbilityState();
       
    console.log('Character sheet initialization complete');
  } catch (error) {
    console.error('Error initializing character sheet:', error);
  }
});