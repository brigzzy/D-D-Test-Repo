// public/js/modules/mana.js - Modified version
export class ManaManager {
  static initializeMana(saveFieldCallback) {
    if (window.enhancedPopupsInitialized) {
      console.log('Enhanced popups already initialized, skipping Mana module initialization');
      return;
    }
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
  
  static showManaPopup(currentManaInput, maxManaInput, saveFieldCallback) {
    // Create overlay container or get existing
    let overlay = document.getElementById('manaPopupOverlay');
    
    // If overlay already exists, remove it first
    if (overlay) {
      overlay.remove();
    }
    
    // Create new overlay
    overlay = document.createElement('div');
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
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      padding: 20px;
      max-width: 350px;
      width: 100%;
      animation: popupFadeIn 0.3s ease;
      border-left: 4px solid #3f51b5;
    `;
    
    // Current values
    const currentMana = parseInt(currentManaInput.value) || 0;
    const maxMana = parseInt(maxManaInput.value) || 0;
    
    // Create popup content
    popup.innerHTML = `
      <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 20px; color: #333; text-align: center;">Modify Mana Points</h3>
      <div style="margin-bottom: 20px; text-align: center;">
        <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">
          <span style="color: #3f51b5;">${currentMana}</span> / ${maxMana}
        </p>
      </div>
      <div style="margin-bottom: 20px;">
        <label for="manaChangeAmount" style="display: block; margin-bottom: 10px; font-weight: bold;">Amount:</label>
        <input type="number" id="manaChangeAmount" value="0" min="0" style="width: 100%; padding: 10px; font-size: 16px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div style="display: flex; justify-content: space-between;">
        <button id="manaSpendBtn" style="background-color: #3f51b5; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 1; margin-right: 10px;">Spend</button>
        <button id="manaRestoreBtn" style="background-color: #9c27b0; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 1; margin-right: 10px;">Restore</button>
        <button id="manaCloseBtn" style="background-color: #9e9e9e; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 0.8;">Close</button>
      </div>
    `;
    
    // Add popup to overlay
    overlay.appendChild(popup);
    
    // Add overlay to body
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
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
        closeOverlay();
      }
    });
    
    // Handle restore button click
    document.getElementById('manaRestoreBtn').addEventListener('click', () => {
      const amount = parseInt(amountInput.value) || 0;
      if (amount > 0) {
        const newMana = Math.min(maxMana, currentMana + amount);
        currentManaInput.value = newMana;
        saveFieldCallback('mana.current', newMana);
        closeOverlay();
      }
    });
    
    // Handle close button click
    document.getElementById('manaCloseBtn').addEventListener('click', () => {
      closeOverlay();
    });
    
    // Close when clicking outside the popup
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeOverlay();
      }
    });
    
    // Handle Escape key to close popup
    document.addEventListener('keydown', function escapeListener(e) {
      if (e.key === 'Escape') {
        closeOverlay();
        document.removeEventListener('keydown', escapeListener);
      }
    });
    
    // Handle Enter key in amount input
    amountInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        // Default to restore if Enter is pressed
        document.getElementById('manaRestoreBtn').click();
      }
    });
    
    function closeOverlay() {
      document.body.style.overflow = ''; // Restore scrolling
      overlay.remove();
    }
  }
}