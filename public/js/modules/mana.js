// public/js/modules/mana.js

/**
 * Manages mana-related functionality for character sheet
 */
export class ManaManager {
    /**
     * Initialize mana-related interactions
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static initializeMana(saveFieldCallback) {
      // Safely query for mana toggle icons
      const manaToggleIcons = Array.from(document.querySelectorAll('.mana-toggle-icon'));
      
      if (manaToggleIcons.length === 0) {
        console.warn('No mana toggle icons found');
        return;
      }
      
      // Safely get mana container and header text
      const manaContainer = document.querySelector('.mana-container');
      const manaHeaderText = document.getElementById('manaHeaderText');
  
      // Add event listeners
      manaToggleIcons.forEach(icon => {
        // Remove any existing listeners to prevent duplicates
        icon.removeEventListener('click', this.createToggleHandler(saveFieldCallback, manaContainer, manaHeaderText));
        
        // Add new listener
        const handler = this.createToggleHandler(saveFieldCallback, manaContainer, manaHeaderText);
        icon.addEventListener('click', handler);
      });
  
      // Initialize mana ability state
      this.initializeManaAbilityState();
    }
  
    /**
     * Create a handler for mana toggle clicks
     * @param {function} saveFieldCallback - Callback to save field changes
     * @param {HTMLElement} manaContainer - Mana container element
     * @param {HTMLElement} manaHeaderText - Mana header text element
     * @returns {function} Event handler function
     */
    static createToggleHandler(saveFieldCallback, manaContainer, manaHeaderText) {
      return (event) => {
        const icon = event.currentTarget;
        const validAbilities = ['intelligence', 'wisdom', 'charisma'];
        const ability = icon.dataset.ability;
        
        if (!validAbilities.includes(ability)) return;
  
        const isCurrentlyActive = icon.dataset.active === 'true';
  
        // Reset all toggles
        document.querySelectorAll('.mana-toggle-icon').forEach(toggleIcon => {
          if (validAbilities.includes(toggleIcon.dataset.ability)) {
            toggleIcon.dataset.active = 'false';
            toggleIcon.textContent = '☆';
            toggleIcon.style.color = '#666';
            toggleIcon.closest('.ability-card')?.classList.remove('ability-card-active');
          }
        });
  
        // If not currently active, activate this ability
        if (!isCurrentlyActive) {
          icon.dataset.active = 'true';
          icon.textContent = '★';
          icon.style.color = 'gold';
          icon.closest('.ability-card')?.classList.add('ability-card-active');
  
          // Show mana container
          if (manaContainer) manaContainer.style.display = 'grid';
          if (manaHeaderText) manaHeaderText.style.display = '';
  
          // Save the selected ability
          saveFieldCallback('useManaAbility', ability);
        } else {
          // Hide mana container if deactivating
          if (manaContainer) manaContainer.style.display = 'none';
          if (manaHeaderText) manaHeaderText.style.display = 'none';
  
          // Clear the ability
          saveFieldCallback('useManaAbility', null);
        }
      };
    }
  
    /**
     * Initialize mana ability state on page load
     */
    static initializeManaAbilityState() {
      const manaToggleIcons = document.querySelectorAll('.mana-toggle-icon');
      const validAbilities = ['intelligence', 'wisdom', 'charisma'];
      
      manaToggleIcons.forEach(icon => {
        const ability = icon.dataset.ability;
        
        // Validate ability
        if (!validAbilities.includes(ability)) return;
  
        // Check active state
        const isActive = icon.dataset.active === 'true';
        
        // Update icon style
        if (isActive) {
          icon.textContent = '★'; // Gold star
          icon.style.color = 'gold';
          
          // Add active class to ability card
          const abilityCard = icon.closest('.ability-card');
          if (abilityCard) {
            abilityCard.classList.add('ability-card-active');
          }
        } else {
          icon.textContent = '☆'; // Grey star
          icon.style.color = '#666';
        }
      });
  
      // Update mana container visibility
      this.updateManaContainerVisibility();
    }
  
    /**
     * Update mana container visibility based on active mana ability
     */
    static updateManaContainerVisibility() {
      const manaContainer = document.querySelector('.mana-container');
      const manaHeaderText = document.getElementById('manaHeaderText');
      
      if (!manaContainer || !manaHeaderText) return;
  
      // Check if any mana toggle is active
      const activeManaToggle = document.querySelector('.mana-toggle-icon[data-active="true"]');
      
      if (activeManaToggle) {
        manaContainer.style.display = 'grid';
        manaHeaderText.style.display = '';
      } else {
        manaContainer.style.display = 'none';
        manaHeaderText.style.display = 'none';
      }
    }
  }
  
  // Export initialization function for easy setup
  export function setupMana(saveFieldCallback) {
    // Ensure DOM is fully loaded before initialization
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        ManaManager.initializeMana(saveFieldCallback);
      });
    } else {
      ManaManager.initializeMana(saveFieldCallback);
    }
  }