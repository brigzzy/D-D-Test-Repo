// public/js/modules/hitPoints.js - Fixed version

/**
 * Manages character hit points, including the popup interface
 */
export class HitPointManager {
  /**
   * Initialize hit point functionality
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static initializeHitPoints(saveFieldCallback) {
    console.log('Initializing hit points manager');
    
    const currentHPInput = document.getElementById('currentHitPoints');
    const maxHPInput = document.getElementById('maxHitPoints');
    
    if (!currentHPInput || !maxHPInput) {
      console.warn('HP inputs not found in the DOM');
      return;
    }
    
    // Force readonly to ensure click handler works
    currentHPInput.readOnly = true;
    
    // Remove any existing click listeners to prevent duplication
    currentHPInput.removeEventListener('click', this._clickHandler);
    
    // Create a bound click handler that we can reference for removal if needed
    this._clickHandler = (e) => {
      console.log('HP field clicked!');
      this.showHitPointPopup(currentHPInput, maxHPInput, saveFieldCallback);
      e.stopPropagation(); // Prevent other click handlers
    };
    
    // Add the click event listener
    currentHPInput.addEventListener('click', this._clickHandler);
    
    console.log('Hit points manager initialized successfully');
  }
  
  /**
   * Show hit point modification popup
   * @param {HTMLElement} currentHPInput - Current HP input element
   * @param {HTMLElement} maxHPInput - Max HP input element
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static showHitPointPopup(currentHPInput, maxHPInput, saveFieldCallback) {
    console.log('Showing hit points popup');
    
    // Remove any existing popups
    const existingOverlay = document.getElementById('hpPopupOverlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'hpPopupOverlay';
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
    popup.id = 'hpPopup';
    popup.className = 'hp-popup';
    popup.style = `
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      padding: 20px;
      max-width: 350px;
      width: 100%;
      animation: popupFadeIn 0.3s ease;
      border-left: 4px solid #f44336;
    `;
    
    // Add animation if not already defined
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
    const currentHP = parseInt(currentHPInput.value) || 0;
    const maxHP = parseInt(maxHPInput.value) || 0;
    
    // Create popup content
    popup.innerHTML = `
      <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 20px; color: #333; text-align: center;">Modify Hit Points</h3>
      <div style="margin-bottom: 20px; text-align: center;">
        <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">
          <span style="color: #f44336;">${currentHP}</span> / ${maxHP}
        </p>
      </div>
      <div style="margin-bottom: 20px;">
        <label for="hpChangeAmount" style="display: block; margin-bottom: 10px; font-weight: bold;">Amount:</label>
        <input type="number" id="hpChangeAmount" value="0" min="0" style="width: 100%; padding: 10px; font-size: 16px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div style="display: flex; justify-content: space-between;">
        <button id="hpDamageBtn" style="background-color: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 1; margin-right: 10px;">Damage</button>
        <button id="hpHealBtn" style="background-color: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 1; margin-right: 10px;">Heal</button>
        <button id="hpCloseBtn" style="background-color: #9e9e9e; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 0.8;">Close</button>
      </div>
    `;
    
    // Add popup to overlay
    overlay.appendChild(popup);
    
    // Add overlay to body
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Focus amount input
    const amountInput = document.getElementById('hpChangeAmount');
    amountInput.focus();
    amountInput.select();
    
    // Function to close overlay
    function closeOverlay() {
      document.body.style.overflow = ''; // Restore scrolling
      overlay.remove();
    }
    
    // Handle damage button click
    document.getElementById('hpDamageBtn').addEventListener('click', function() {
      const amount = parseInt(amountInput.value) || 0;
      if (amount > 0) {
        const newHP = Math.max(0, currentHP - amount);
        currentHPInput.value = newHP;
        saveFieldCallback('hitPoints.current', newHP);
        closeOverlay();
      }
    });
    
    // Handle heal button click
    document.getElementById('hpHealBtn').addEventListener('click', function() {
      const amount = parseInt(amountInput.value) || 0;
      if (amount > 0) {
        const newHP = Math.min(maxHP, currentHP + amount);
        currentHPInput.value = newHP;
        saveFieldCallback('hitPoints.current', newHP);
        closeOverlay();
      }
    });
    
    // Handle close button click
    document.getElementById('hpCloseBtn').addEventListener('click', function() {
      closeOverlay();
    });
    
    // Close when clicking outside the popup
    overlay.addEventListener('click', function(e) {
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
    amountInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        document.getElementById('hpHealBtn').click();
      }
    });
  }
}