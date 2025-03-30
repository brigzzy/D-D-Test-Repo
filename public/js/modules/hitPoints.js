// public/js/modules/hitPoints.js

/**
 * Manages hit points and health-related interactions
 */
export class HitPointManager {
  /**
   * Initialize hit points interaction
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static initializeHitPoints(saveFieldCallback) {
    const currentHP = document.getElementById('currentHitPoints');
    const maxHP = document.getElementById('maxHitPoints');
    
    if (!currentHP || !maxHP) return;

    // Make sure the current HP field appears clickable
    currentHP.style.cursor = 'pointer';
    
    // Remove any existing click handlers to prevent duplicates
    currentHP.removeEventListener('click', this._clickHandler);
    
    // Create a new click handler function bound to this class
    this._clickHandler = (e) => {
      // Only show popup if the field is readonly (not already being edited)
      if (currentHP.readOnly) {
        e.preventDefault();
        e.stopPropagation();
        this.createAdjustmentPopup(currentHP, 'HP', saveFieldCallback);
      }
    };
    
    // Add the click event listener
    currentHP.addEventListener('click', this._clickHandler);
  }

  /**
   * Create an adjustment popup for HP or Mana
   * @param {HTMLElement} inputElement - The input element that was clicked
   * @param {string} type - 'HP' or 'Mana'
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static createAdjustmentPopup(inputElement, type, saveFieldCallback) {
    // Remove any existing popups first
    this.removeExistingPopups();
    
    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'adjustment-popup hp-popup';
    
    // Create popup content
    popup.innerHTML = `
      <div style="margin-bottom: 10px;">
        <label>Amount:</label>
        <input type="number" id="adjustmentAmount" min="1" value="1" style="width: 60px; margin-left: 5px;">
      </div>
      <div style="display: flex; justify-content: space-between; gap: 10px;">
        <button id="damageBtn" style="background-color: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
          ${type === 'HP' ? 'Damage' : 'Use'}
        </button>
        <button id="healBtn" style="background-color: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
          ${type === 'HP' ? 'Heal' : 'Recover'}
        </button>
      </div>
    `;
    
    // Position popup near the input
    const rect = inputElement.getBoundingClientRect();
    popup.style.position = 'absolute';
    popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.zIndex = '100';
    popup.style.backgroundColor = 'white';
    popup.style.border = '1px solid #ddd';
    popup.style.borderRadius = '5px';
    popup.style.padding = '10px';
    popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
    // Add popup to document
    document.body.appendChild(popup);
    
    // Focus amount input
    const amountInput = popup.querySelector('#adjustmentAmount');
    if (amountInput) {
      amountInput.focus();
      amountInput.select();
    }
    
    // Set up event listeners
    const damageBtn = popup.querySelector('#damageBtn');
    const healBtn = popup.querySelector('#healBtn');
    
    if (damageBtn) {
      damageBtn.addEventListener('click', () => {
        this.adjustValue(inputElement, -1, type.toLowerCase(), saveFieldCallback);
      });
    }
    
    if (healBtn) {
      healBtn.addEventListener('click', () => {
        this.adjustValue(inputElement, 1, type.toLowerCase(), saveFieldCallback);
      });
    }
    
    // Close popup when clicking outside
    document.addEventListener('click', this.closePopupOnClickOutside);
    
    // Prevent clicks inside popup from closing it
    popup.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Close popup when pressing Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.removeExistingPopups();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Adjust HP or Mana value
   * @param {HTMLElement} inputElement - The input element to adjust
   * @param {number} direction - 1 for healing/recover, -1 for damage/use
   * @param {string} type - 'hp' or 'mana'
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static adjustValue(inputElement, direction, type, saveFieldCallback) {
    const amountInput = document.getElementById('adjustmentAmount');
    if (!amountInput) return;
    
    const amount = parseInt(amountInput.value) || 1;
    const currentValue = parseInt(inputElement.value) || 0;
    
    // Get max value
    let maxValue;
    if (type === 'hp') {
      const maxHP = document.getElementById('maxHitPoints');
      maxValue = maxHP ? parseInt(maxHP.value) || 0 : 0;
    } else if (type === 'mana') {
      const maxMana = document.getElementById('maxMana');
      maxValue = maxMana ? parseInt(maxMana.value) || 0 : 0;
    }
    
    // Calculate new value
    let newValue = currentValue + (amount * direction);
    
    // Enforce min/max limits
    newValue = Math.max(0, newValue);
    if (maxValue !== undefined) {
      newValue = Math.min(newValue, maxValue);
    }
    
    // Update input value
    inputElement.value = newValue;
    
    // Save change to server
    const fieldName = type === 'hp' ? 'hitPoints.current' : 'mana.current';
    saveFieldCallback(fieldName, newValue);
    
    // Remove popup
    this.removeExistingPopups();
  }

  /**
   * Close popup when clicking outside
   * @param {Event} e - Click event
   */
  static closePopupOnClickOutside(e) {
    const popup = document.querySelector('.adjustment-popup');
    if (popup && !popup.contains(e.target) && !e.target.matches('#currentHitPoints, #currentMana')) {
      HitPointManager.removeExistingPopups();
    }
  }

  /**
   * Remove any existing adjustment popups
   */
  static removeExistingPopups() {
    const existingPopups = document.querySelectorAll('.adjustment-popup');
    existingPopups.forEach(popup => {
      popup.remove();
    });
    
    // Remove global event listeners
    document.removeEventListener('click', this.closePopupOnClickOutside);
  }
}