// public/js/modules/abilities.js

import { updateSaveStatus } from './utils.js';

/**
 * Ability management module for D&D character sheet
 * Handles ability score calculations, modifiers, and mana ability interactions
 */
// modules/abilities.js
export class AbilityManager {
  /**
   * Initialize ability card functionality
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static initializeAbilityCards(saveFieldCallback) {
    console.log('Initializing ability cards');
    const abilityCards = document.querySelectorAll('.ability-card');
    const manaToggleIcons = document.querySelectorAll('.mana-toggle-icon');

    // Ability score input handling
    abilityCards.forEach(card => {
      const abilityScoreInput = card.querySelector('.ability-score');
      
      if (abilityScoreInput) {
        abilityScoreInput.addEventListener('change', (e) => {
          const newScore = parseInt(e.target.value);
          this.updateModifierDisplay(card, newScore);
          
          // Save the ability score
          const abilityName = e.target.name;
          saveFieldCallback(`abilities.${abilityName}`, newScore);
        });
      }
    });

    // Mana ability toggle handling
    manaToggleIcons.forEach(icon => {
      console.log('Found mana toggle icon for ability:', icon.dataset.ability);
      
      // Set initial icon state
      this.updateToggleIconDisplay(icon);
      
      // Add click handler
      icon.addEventListener('click', () => {
        console.log('Toggle icon clicked for ability:', icon.dataset.ability);
        this.handleManaAbilityToggle(icon, saveFieldCallback);
      });
    });
    
    console.log('Ability cards initialization complete');
  }
  
  /**
   * Update toggle icon display based on active state
   * @param {HTMLElement} toggleIcon - The toggle icon element
   */
  static updateToggleIconDisplay(toggleIcon) {
    const isActive = toggleIcon.dataset.active === 'true';
    console.log('Updating toggle icon display, active:', isActive);
    
    if (isActive) {
      toggleIcon.textContent = '●'; // Filled circle
      toggleIcon.style.color = 'var(--mana-color)';
      toggleIcon.closest('.ability-card').classList.add('ability-card-active');
    } else {
      toggleIcon.textContent = '○'; // Empty circle
      toggleIcon.style.color = '#666';
      toggleIcon.closest('.ability-card').classList.remove('ability-card-active');
    }
  }

  /**
   * Handle mana ability toggle interaction
   * @param {HTMLElement} toggleIcon - The clicked toggle icon
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static handleManaAbilityToggle(toggleIcon, saveFieldCallback) {
    const manaToggleIcons = document.querySelectorAll('.mana-toggle-icon');
    const manaContainer = document.querySelector('.mana-container');
    const manaHeaderText = document.getElementById('manaHeaderText');
    const spellsSection = document.querySelector('.spells-section');
    const knownSpellsSection = document.querySelector('.knownSpells-section');
    const castSpellsSection = document.querySelector('.castSpells-section');

    // Only target Intelligence, Wisdom, and Charisma ability toggles
    const validAbilities = ['intelligence', 'wisdom', 'charisma'];
    
    // Check if the clicked icon is for a valid ability
    if (!validAbilities.includes(toggleIcon.dataset.ability)) {
      console.log('Ignoring toggle for non-spellcasting ability');
      return;
    }

    // Determine if we're toggling off or on
    const isCurrentlyActive = toggleIcon.dataset.active === 'true';
    console.log('Toggle state before change:', isCurrentlyActive);

    // Reset all toggle icons to inactive
    manaToggleIcons.forEach(icon => {
      if (validAbilities.includes(icon.dataset.ability)) {
        icon.dataset.active = 'false';
        this.updateToggleIconDisplay(icon);
      }
    });

    // Remove highlight from ability cards
    document.querySelectorAll('.ability-card').forEach(card => {
      card.classList.remove('ability-card-active');
    });

    // If the clicked toggle wasn't active, activate it
    if (!isCurrentlyActive) {
      console.log('Activating toggle for:', toggleIcon.dataset.ability);
      toggleIcon.dataset.active = 'true';
      this.updateToggleIconDisplay(toggleIcon);

      // Update mana container visibility
      if (manaHeaderText) manaHeaderText.style.display = '';
      if (manaContainer) manaContainer.style.display = 'grid';
      if (spellsSection) spellsSection.style.display = 'block';
      if (knownSpellsSection) knownSpellsSection.style.display = 'block';
      if (castSpellsSection) castSpellsSection.style.display = 'block';

      // Save the selected mana ability
      saveFieldCallback('useManaAbility', toggleIcon.dataset.ability);
    } else {
      console.log('Deactivating all toggles');
      // If toggling off, hide mana container
      if (manaHeaderText) manaHeaderText.style.display = 'none';
      if (manaContainer) manaContainer.style.display = 'none';
      if (spellsSection) spellsSection.style.display = 'none';
      if (knownSpellsSection) knownSpellsSection.style.display = 'none';
      if (castSpellsSection) castSpellsSection.style.display = 'none';
      
      // Clear the selected ability
      saveFieldCallback('useManaAbility', null);
    }
  }

  /**
   * Initialize mana ability state on page load
   */
  static initializeManaAbilityState() {
    console.log('Initializing mana ability state');
    const manaToggleIcons = document.querySelectorAll('.mana-toggle-icon');
    const validAbilities = ['intelligence', 'wisdom', 'charisma'];
    
    // Show/hide mana and spell sections based on active toggle
    let hasActiveManaAbility = false;
    
    manaToggleIcons.forEach(icon => {
      // Only process toggles for valid abilities
      if (validAbilities.includes(icon.dataset.ability)) {
        const isActive = icon.dataset.active === 'true';
        console.log(`Toggle for ${icon.dataset.ability}: active = ${isActive}`);
        
        if (isActive) {
          hasActiveManaAbility = true;
        }
        
        // Update icon display
        this.updateToggleIconDisplay(icon);
      }
    });
    
    // Show/hide mana and spell sections based on any active ability
    const manaContainer = document.querySelector('.mana-container');
    const manaHeaderText = document.getElementById('manaHeaderText');
    const spellsSection = document.querySelector('.spells-section');
    const knownSpellsSection = document.querySelector('.knownSpells-section');
    const castSpellsSection = document.querySelector('.castSpells-section');
    
    if (hasActiveManaAbility) {
      if (manaHeaderText) manaHeaderText.style.display = '';
      if (manaContainer) manaContainer.style.display = 'grid';
      if (spellsSection) spellsSection.style.display = 'block';
      if (knownSpellsSection) knownSpellsSection.style.display = 'block';
      if (castSpellsSection) castSpellsSection.style.display = 'block';
    } else {
      if (manaHeaderText) manaHeaderText.style.display = 'none';
      if (manaContainer) manaContainer.style.display = 'none';
      if (spellsSection) spellsSection.style.display = 'none';
      if (knownSpellsSection) knownSpellsSection.style.display = 'none';
      if (castSpellsSection) castSpellsSection.style.display = 'none';
    }
    
    console.log('Mana ability state initialization complete');
  }
  
  /**
   * Update ability modifier display for a specific ability
   * @param {HTMLElement} abilityCard - The ability card element
   * @param {number} abilityScore - The new ability score
   */
  static updateModifierDisplay(abilityCard, abilityScore) {
    const modifierElement = abilityCard.querySelector('.ability-modifier');
    if (!modifierElement) return;

    const modifier = this.calculateModifier(abilityScore);
    modifierElement.textContent = `${modifier >= 0 ? '+' : ''}${modifier}`;
  }
  
  /**
   * Calculate ability modifier from score
   * @param {number} score - Ability score
   * @returns {number} Calculated modifier
   */
  static calculateModifier(score) {
    return Math.floor((score - 10) / 2);
  }
}

// Export a function for easy initialization
export function setupAbilities(saveFieldCallback) {
  AbilityManager.initializeAbilityCards(saveFieldCallback);
  AbilityManager.initializeManaAbilityState();
}
