// public/js/modules/mana.js


import { updateSaveStatus } from './utils.js';

export class ManaManager {
  static initializeMana(saveFieldCallback) {
    console.log('Initializing mana manager');
    
    const currentManaInput = document.getElementById('currentMana');
    const maxManaInput = document.getElementById('maxMana');
    
    if (!currentManaInput || !maxManaInput) {
      console.log('Mana inputs not found, skipping initialization');
      return;
    }
    
    // Force readonly to ensure click handler works
    currentManaInput.readOnly = true;
    
    // Ensure we remove any existing listeners before adding new ones
    const newClickHandler = (e) => {
      console.log('Mana input clicked');
      if (e.target.readOnly) {
        this.showManaPopup(e.target, maxManaInput, saveFieldCallback);
      }
    };
    
    // Remove old handler if exists and add new one
    currentManaInput.removeEventListener('click', newClickHandler);
    currentManaInput.addEventListener('click', newClickHandler);
    
    console.log('Mana manager initialized successfully');

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
 * @param {HTMLElement} currentManaInput - The current mana input element
 * @param {HTMLElement} maxManaInput - The max mana input element
 * @param {function} saveFieldCallback - Function to save field changes
 */
static showManaPopup(currentManaInput, maxManaInput, saveFieldCallback) {
  console.log('Showing mana popup');
  
  // Remove any existing popups
  const existingOverlay = document.getElementById('manaPopupOverlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'manaPopupOverlay';
  overlay.style = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  
  // Create popup
  const popup = document.createElement('div');
  popup.id = 'manaPopup';
  popup.className = 'mana-popup';
  popup.style = `
    background-color: var(--content-bg-color);
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 20px var(--shadow-color);
    padding: 20px;
    max-width: 350px;
    width: 100%;
    animation: popupFadeIn 0.3s ease;
    border-left: 4px solid var(--mana-color);
  `;
  
  // Add animation if it doesn't exist
  if (!document.getElementById('popupAnimationStyle')) {
    const style = document.createElement('style');
    style.id = 'popupAnimationStyle';
    style.textContent = `
      @keyframes popupFadeIn {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Current values
  const currentMana = parseInt(currentManaInput.value) || 0;
  const maxMana = parseInt(maxManaInput.value) || 0;
  
  // Create popup content
  popup.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 20px; color: var(--text-color); text-align: center;">Modify Mana Points</h3>
    <div style="margin-bottom: 20px; text-align: center;">
      <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">
        <span style="color: var(--mana-color);">${currentMana}</span> / ${maxMana}
      </p>
    </div>
    <div style="margin-bottom: 20px;">
      <label for="manaChangeAmount" style="display: block; margin-bottom: 10px; font-weight: bold;">Amount:</label>
      <input type="number" id="manaChangeAmount" value="0" min="0" style="width: 100%; padding: 10px; font-size: 16px; border: 1px solid var(--input-border-color); border-radius: var(--border-radius-sm); background-color: var(--input-bg-color); color: var(--input-text-color);">
    </div>
    <div style="display: flex; justify-content: space-between;">
      <button id="manaSpendBtn" style="background-color: var(--mana-color); color: white; border: none; padding: 10px 20px; border-radius: var(--border-radius-sm); cursor: pointer; font-weight: bold; flex: 1; margin-right: 10px;">Spend</button>
      <button id="manaRestoreBtn" style="background-color: var(--primary-color); color: white; border: none; padding: 10px 20px; border-radius: var(--border-radius-sm); cursor: pointer; font-weight: bold; flex: 1; margin-right: 10px;">Restore</button>
      <button id="manaCloseBtn" style="background-color: #9e9e9e; color: white; border: none; padding: 10px 20px; border-radius: var(--border-radius-sm); cursor: pointer; font-weight: bold; flex: 0.8;">Close</button>
    </div>
  `;
  
  // Add popup to overlay
  overlay.appendChild(popup);
  
  // Add overlay to body
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden'; // Prevent scrolling
  
  // Focus amount input
  const amountInput = document.getElementById('manaChangeAmount');
  if (amountInput) {
    amountInput.focus();
    amountInput.select();
  }
  
  // Function to close overlay
  function closeOverlay() {
    document.body.style.overflow = ''; // Restore scrolling
    overlay.remove();
  }
  
  // Handle spend button click
  const spendBtn = document.getElementById('manaSpendBtn');
  if (spendBtn) {
    spendBtn.addEventListener('click', () => {
      const amount = parseInt(amountInput.value) || 0;
      if (amount > 0) {
        const newMana = Math.max(0, currentMana - amount);
        currentManaInput.value = newMana;
        saveFieldCallback('mana.current', newMana);
        closeOverlay();
      }
    });
  }
  
  // Handle restore button click
  const restoreBtn = document.getElementById('manaRestoreBtn');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
      const amount = parseInt(amountInput.value) || 0;
      if (amount > 0) {
        const newMana = Math.min(maxMana, currentMana + amount);
        currentManaInput.value = newMana;
        saveFieldCallback('mana.current', newMana);
        closeOverlay();
      }
    });
  }
  
  // Handle close button click
  const closeBtn = document.getElementById('manaCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeOverlay);
  }
  
  // Close when clicking outside the popup
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeOverlay();
    }
  });
  
  // Handle Escape key
  document.addEventListener('keydown', function escapeListener(e) {
    if (e.key === 'Escape') {
      closeOverlay();
      document.removeEventListener('keydown', escapeListener);
    }
  });
  
  // Handle Enter key
  if (amountInput) {
    amountInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        restoreBtn.click();
      }
    });
  }
}




  /**
   * Handle mana recovery during rests
   * @param {string} restType - 'short' or 'long'
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
      
      // Calculate recovery amount based on rest type
      const recoveryFactor = restType === 'long' ? 1.0 : 0.5;
      const recoveryAmount = Math.floor(maxManaValue * recoveryFactor);
      const newMana = Math.min(maxManaValue, currentManaValue + recoveryAmount);
      
      // Update current mana
      currentMana.value = newMana;
      saveFieldCallback('mana.current', newMana);
    }
  }
}