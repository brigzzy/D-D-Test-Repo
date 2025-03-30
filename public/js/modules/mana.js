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
    // Initialize mana toggle functionality
    this.initializeManaToggles(saveFieldCallback);
    
    // Initialize mana adjustment popup
    this.initializeManaAdjustment(saveFieldCallback);
    
    // Set initial mana ability state
    this.updateManaContainerVisibility();
  }
  
  /**
   * Initialize mana toggle buttons
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static initializeManaToggles(saveFieldCallback) {
    // Get all mana toggle icons
    const manaToggleIcons = document.querySelectorAll('.mana-toggle-icon');
    const manaContainer = document.querySelector('.mana-container');
    const manaHeaderText = document.getElementById('manaHeaderText');
    
    manaToggleIcons.forEach(icon => {
      icon.addEventListener('click', () => {
        const ability = icon.dataset.ability;
        const isCurrentlyActive = icon.dataset.active === 'true';
        
        // Reset all toggle buttons
        manaToggleIcons.forEach(toggle => {
          toggle.dataset.active = 'false';
          toggle.textContent = '○'; // Empty circle
          toggle.style.color = '#666';
          const abilityCard = toggle.closest('.ability-card');
          if (abilityCard) abilityCard.classList.remove('ability-card-active');
        });
        
        // If the clicked toggle wasn't already active, activate it
        if (!isCurrentlyActive) {
          icon.dataset.active = 'true';
          icon.textContent = '●'; // Filled circle
          icon.style.color = '#9932CC'; // Purple color
          const abilityCard = icon.closest('.ability-card');
          if (abilityCard) abilityCard.classList.add('ability-card-active');
          
          // Show mana container
          if (manaContainer) manaContainer.style.display = 'grid';
          if (manaHeaderText) manaHeaderText.style.display = '';
          
          // Save the selected ability
          saveFieldCallback('useManaAbility', ability);
        } else {
          // Hide mana container
          if (manaContainer) manaContainer.style.display = 'none';
          if (manaHeaderText) manaHeaderText.style.display = 'none';
          
          // Clear the selected ability
          saveFieldCallback('useManaAbility', null);
        }
      });
    });
  }
  
  /**
   * Initialize mana adjustment functionality
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static initializeManaAdjustment(saveFieldCallback) {
    const currentMana = document.getElementById('currentMana');
    
    if (currentMana) {
      // Make sure the current Mana field appears clickable
      currentMana.style.cursor = 'pointer';
      
      // Remove any existing click handlers to prevent duplicates
      currentMana.removeEventListener('click', this._clickHandler);
      
      // Create a new click handler function bound to this instance
      this._clickHandler = (e) => {
        // Only show popup if the field is readonly (not already being edited)
        if (currentMana.readOnly) {
          e.preventDefault();
          e.stopPropagation();
          
          // Import HitPointManager dynamically to avoid circular dependencies
          import('./hitPoints.js').then(module => {
            const HitPointManager = module.HitPointManager;
            HitPointManager.createAdjustmentPopup(currentMana, 'Mana', saveFieldCallback);
          }).catch(err => {
            console.error('Error importing HitPointManager:', err);
          });
        }
      };
      
      // Add the click event listener
      currentMana.addEventListener('click', this._clickHandler);
    }
  }
  
  /**
   * Handle mana recovery during rests
   * @param {string} restType - 'short' or 'long'
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static handleManaRecovery(restType, saveFieldCallback) {
    // Check if mana is enabled (any toggle icon is active)
    const activeManaToggle = document.querySelector('.mana-toggle-icon[data-active="true"]');
    if (!activeManaToggle) return;
    
    // Get mana inputs
    const currentMana = document.getElementById('currentMana');
    const maxMana = document.getElementById('maxMana');
    
    if (currentMana && maxMana) {
      const maxManaValue = parseInt(maxMana.value) || 0;
      const currentManaValue = parseInt(currentMana.value) || 0;
      
      // Calculate recovery amount based on rest type
      const recoveryFactor = restType === 'short' ? 0.5 : 1.0; // 50% for short rest, 100% for long rest
      const recoveryAmount = Math.floor(maxManaValue * recoveryFactor);
      const newMana = Math.min(maxManaValue, currentManaValue + recoveryAmount);
      
      // Update current mana
      currentMana.value = newMana;
      
      // Save changes
      saveFieldCallback('mana.current', newMana);
    }
  }
  
  /**
   * Update mana container visibility based on active toggle
   */
  static updateManaContainerVisibility() {
    const manaContainer = document.querySelector('.mana-container');
    const manaHeaderText = document.getElementById('manaHeaderText');
    const activeManaToggle = document.querySelector('.mana-toggle-icon[data-active="true"]');
    
    if (manaContainer && manaHeaderText) {
      if (activeManaToggle) {
        manaContainer.style.display = 'grid';
        manaHeaderText.style.display = '';
        
        // Update active toggle appearance
        activeManaToggle.textContent = '●'; // Filled circle
        activeManaToggle.style.color = '#9932CC'; // Purple color
        const abilityCard = activeManaToggle.closest('.ability-card');
        if (abilityCard) abilityCard.classList.add('ability-card-active');
      } else {
        manaContainer.style.display = 'none';
        manaHeaderText.style.display = 'none';
      }
    }
  }
}