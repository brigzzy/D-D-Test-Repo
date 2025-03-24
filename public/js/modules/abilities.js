// public/js/modules/abilities.js

/**
 * Ability management module for D&D character sheet
 * Handles ability score calculations, modifiers, and mana ability interactions
 */
export class AbilityManager {
  /**
   * Calculate the ability modifier based on the ability score
   * @param {number} abilityScore - The ability score (1-30)
   * @returns {number} The calculated modifier
   */
  static calculateModifier(abilityScore) {
    return Math.floor((abilityScore - 10) / 2);
  }

  /**
   * Update the ability modifier display for a specific ability
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
   * Initialize ability card functionality
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static initializeAbilityCards(saveFieldCallback) {
    const abilityCards = document.querySelectorAll('.ability-card');
    const manaToggleIcons = document.querySelectorAll('.mana-toggle-icon');

    // Ability score input handling
    abilityCards.forEach(card => {
      const abilityScoreInput = card.querySelector('.ability-score');
      
      abilityScoreInput.addEventListener('change', (e) => {
        const newScore = parseInt(e.target.value);
        this.updateModifierDisplay(card, newScore);
        
        // Save the ability score
        const abilityName = e.target.name;
        saveFieldCallback(`abilities.${abilityName}`, newScore);
      });
    });

    // Mana ability toggle handling
    manaToggleIcons.forEach(icon => {
      icon.addEventListener('click', () => this.handleManaAbilityToggle(icon, saveFieldCallback));
    });
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

    // Only target Intelligence, Wisdom, and Charisma ability toggles
    const validAbilities = ['intelligence', 'wisdom', 'charisma'];
    
    // Check if the clicked icon is for a valid ability
    if (!validAbilities.includes(toggleIcon.dataset.ability)) return;

    // Determine if we're toggling off or on
    const isCurrentlyActive = toggleIcon.dataset.active === 'true';

    // Reset all toggle icons to grey stars
    manaToggleIcons.forEach(icon => {
      if (validAbilities.includes(icon.dataset.ability)) {
        icon.dataset.active = 'false';
        icon.textContent = '☆'; // Grey star
        icon.style.color = '#666'; // Grey color
      }
    });

    // Remove highlight from ability cards
    document.querySelectorAll('.ability-card').forEach(card => {
      card.classList.remove('ability-card-active');
    });

    // If the clicked toggle wasn't active, activate it
    if (!isCurrentlyActive) {
      toggleIcon.dataset.active = 'true';
      toggleIcon.textContent = '★'; // Gold star
      toggleIcon.style.color = 'gold';
      toggleIcon.closest('.ability-card').classList.add('ability-card-active');

      // Update mana container visibility
      if (manaHeaderText) manaHeaderText.style.display = '';
      if (manaContainer) manaContainer.style.display = 'grid';

      // Save the selected mana ability
      saveFieldCallback('useManaAbility', toggleIcon.dataset.ability);
    } else {
      // If toggling off, hide mana container
      if (manaHeaderText) manaHeaderText.style.display = 'none';
      if (manaContainer) manaContainer.style.display = 'none';
      saveFieldCallback('useManaAbility', null);
    }
  }

  /**
   * Initialize mana ability state on page load
   */
  static initializeManaAbilityState() {
    const manaToggleIcons = document.querySelectorAll('.mana-toggle-icon');
    const validAbilities = ['intelligence', 'wisdom', 'charisma'];
    
    manaToggleIcons.forEach(icon => {
      // Only style toggles for valid abilities
      if (validAbilities.includes(icon.dataset.ability)) {
        const isActive = icon.dataset.active === 'true';
        
        if (isActive) {
          icon.textContent = '★'; // Gold star
          icon.style.color = 'gold';
        } else {
          icon.textContent = '☆'; // Grey star
          icon.style.color = '#666';
        }
      }
    });
  }
}

// Optional: Export a function for easy initialization
export function setupAbilities(saveFieldCallback) {
  AbilityManager.initializeAbilityCards(saveFieldCallback);
  AbilityManager.initializeManaAbilityState();
}