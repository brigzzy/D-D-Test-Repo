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
      const currentHPInput = document.getElementById('currentHitPoints');
      const maxHPInput = document.getElementById('maxHitPoints');
      
      if (!currentHPInput || !maxHPInput) return;
  
      // HP Popup functionality
      currentHPInput.addEventListener('click', this.createHPPopup.bind(this, saveFieldCallback));
    }
  
    /**
     * Create HP adjustment popup
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static createHPPopup(saveFieldCallback) {
      const currentHPInput = document.getElementById('currentHitPoints');
      const maxHPInput = document.getElementById('maxHitPoints');
  
      // Create popup logic (similar to existing implementation)
      const popup = document.createElement('div');
      popup.className = 'hp-popup';
      popup.innerHTML = `
        <div>
          <label>Amount:</label>
          <input type="number" id="hpChangeAmount" min="1" value="1">
        </div>
        <div>
          <button id="damageBtn">Damage</button>
          <button id="healBtn">Healing</button>
        </div>
      `;
  
      // Position and style popup
      this.positionPopup(popup, currentHPInput);
  
      // Add event listeners for damage and healing
      popup.querySelector('#damageBtn').addEventListener('click', () => 
        this.adjustHitPoints(currentHPInput, maxHPInput, -1, saveFieldCallback)
      );
      
      popup.querySelector('#healBtn').addEventListener('click', () => 
        this.adjustHitPoints(currentHPInput, maxHPInput, 1, saveFieldCallback)
      );
  
      document.body.appendChild(popup);
    }
  
    /**
     * Adjust hit points
     * @param {HTMLInputElement} currentHPInput - Current HP input
     * @param {HTMLInputElement} maxHPInput - Max HP input
     * @param {number} direction - 1 for healing, -1 for damage
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static adjustHitPoints(currentHPInput, maxHPInput, direction, saveFieldCallback) {
      const changeAmount = parseInt(document.getElementById('hpChangeAmount').value) || 0;
      const currentHP = parseInt(currentHPInput.value) || 0;
      const maxHP = parseInt(maxHPInput.value) || 0;
  
      let newHP = currentHP + (changeAmount * direction);
      newHP = Math.max(0, Math.min(newHP, maxHP));
  
      currentHPInput.value = newHP;
      saveFieldCallback('hitPoints.current', newHP);
  
      // Remove popup
      document.querySelector('.hp-popup')?.remove();
    }
  
    /**
     * Position the HP popup relative to the input
     * @param {HTMLElement} popup - Popup element
     * @param {HTMLElement} inputElement - Input element to position near
     */
    static positionPopup(popup, inputElement) {
      const rect = inputElement.getBoundingClientRect();
      popup.style.position = 'absolute';
      popup.style.top = `${rect.bottom + window.scrollY}px`;
      popup.style.left = `${rect.left + window.scrollX}px`;
    }
  }