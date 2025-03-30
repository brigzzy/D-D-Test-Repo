// public/js/modules/mana.js

/**
 * Manages mana points and spend/restore functionality
 */
export class ManaManager {
    /**
     * Initialize mana functionality
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static initializeMana(saveFieldCallback) {
      const currentManaInput = document.getElementById('currentMana');
      const maxManaInput = document.getElementById('maxMana');
      
      if (!currentManaInput || !maxManaInput) return;
      
      // Add click event to current mana input
      currentManaInput.addEventListener('click', (e) => {
        // Only show popup if field is readonly (not already being edited)
        if (e.target.readOnly) {
          this.showManaPopup(e.target, maxManaInput, saveFieldCallback);
        }
      });
    }
    
    /**
     * Show mana modification popup
     * @param {HTMLElement} currentManaInput - Current mana input element
     * @param {HTMLElement} maxManaInput - Max mana input element
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static showManaPopup(currentManaInput, maxManaInput, saveFieldCallback) {
      // Create popup container or get existing
      let popup = document.getElementById('manaPopup');
      
      // If popup already exists, remove it first
      if (popup) {
        popup.remove();
      }
      
      // Create new popup
      popup = document.createElement('div');
      popup.id = 'manaPopup';
      popup.className = 'mana-popup';
      popup.style = `
        position: absolute;
        z-index: 1000;
        background-color: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        padding: 15px;
        min-width: 250px;
      `;
      
      // Position popup near the input
      const rect = currentManaInput.getBoundingClientRect();
      popup.style.top = (rect.bottom + window.scrollY + 5) + 'px';
      popup.style.left = (rect.left + window.scrollX) + 'px';
      
      // Current values
      const currentMana = parseInt(currentManaInput.value) || 0;
      const maxMana = parseInt(maxManaInput.value) || 0;
      
      // Create popup content
      popup.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px;">Modify Mana Points</h3>
        <div style="margin-bottom: 15px;">
          <p style="margin: 5px 0;">Current Mana: ${currentMana} / ${maxMana}</p>
        </div>
        <div style="margin-bottom: 15px;">
          <label for="manaChangeAmount" style="display: block; margin-bottom: 5px;">Amount:</label>
          <input type="number" id="manaChangeAmount" value="0" min="0" style="width: 100%; padding: 5px;">
        </div>
        <div style="display: flex; justify-content: space-between;">
          <button id="manaSpendBtn" style="background-color: #3f51b5; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Spend</button>
          <button id="manaRestoreBtn" style="background-color: #9c27b0; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Restore</button>
          <button id="manaCloseBtn" style="background-color: #ccc; color: black; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
      `;
      
      // Add popup to body
      document.body.appendChild(popup);
      
      // Focus amount input
      const amountInput = document.getElementById('manaChangeAmount');
      amountInput.focus();
      amountInput.select();
      
      // Handle spend button click
      document.getElementById('manaSpendBtn').addEventListener('click', () => {
        const amount = parseInt(amountInput.value) || 0;
        if (amount > 0) {
          const newMana = Math.max(0, currentMana - amount);
          currentManaInput.value = newMana;
          saveFieldCallback('mana.current', newMana);
          popup.remove();
        }
      });
      
      // Handle restore button click
      document.getElementById('manaRestoreBtn').addEventListener('click', () => {
        const amount = parseInt(amountInput.value) || 0;
        if (amount > 0) {
          const newMana = Math.min(maxMana, currentMana + amount);
          currentManaInput.value = newMana;
          saveFieldCallback('mana.current', newMana);
          popup.remove();
        }
      });
      
      // Handle close button click
      document.getElementById('manaCloseBtn').addEventListener('click', () => {
        popup.remove();
      });
      
      // Close popup when clicking outside
      document.addEventListener('click', function closePopup(e) {
        if (!popup.contains(e.target) && e.target !== currentManaInput) {
          popup.remove();
          document.removeEventListener('click', closePopup);
        }
      });
      
      // Handle Enter key in amount input
      amountInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          // Default to restore if Enter is pressed
          document.getElementById('manaRestoreBtn').click();
        } else if (e.key === 'Escape') {
          popup.remove();
        }
      });
    }
  
    /**
     * Handle mana recovery from rest
     * @param {string} restType - Type of rest ('short' or 'long')
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static handleManaRecovery(restType, saveFieldCallback) {
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
        const recoveryFactor = restType === 'short' ? 0.5 : 1.0;
        const recoveryAmount = Math.floor(maxManaValue * recoveryFactor);
        const newMana = Math.min(maxManaValue, currentManaValue + recoveryAmount);
        
        // Update current mana
        currentMana.value = newMana;
        
        // Save changes
        saveFieldCallback('mana.current', newMana);
      }
    }
  }