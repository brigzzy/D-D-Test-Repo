// public/js/modules/hitPoints.js - Modified version
export class HitPointManager {
  static initializeHitPoints(saveFieldCallback) {
    if (window.enhancedPopupsInitialized) {
      console.log('Enhanced popups already initialized, skipping HP module initialization');
      return;
    }
    console.log('HitPointManager.initializeHitPoints called');
    const currentHPInput = document.getElementById('currentHitPoints');
    const maxHPInput = document.getElementById('maxHitPoints');
    
    if (!currentHPInput || !maxHPInput) {
      console.error('HP inputs not found');
      return;
    }
    
    console.log('Adding click event to current HP input');
    
    // Add click event to current HP input
    currentHPInput.addEventListener('click', (e) => {
      console.log('HP input clicked through manager');
      // Only show popup if field is readonly (not already being edited)
      if (e.target.readOnly) {
        this.showHitPointPopup(e.target, maxHPInput, saveFieldCallback);
      }
    });
  }
  
  static showHitPointPopup(currentHPInput, maxHPInput, saveFieldCallback) {
    console.log('HitPointManager.showHitPointPopup called');
    
    // Create overlay container or get existing
    let overlay = document.getElementById('hpPopupOverlay');
    
    // If overlay already exists, remove it first
    if (overlay) {
      overlay.remove();
    }
    
    // Create new overlay
    overlay = document.createElement('div');
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
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes popupFadeIn {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    
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
    
    console.log('HP popup added to DOM');
    
    // Focus amount input
    const amountInput = document.getElementById('hpChangeAmount');
    amountInput.focus();
    amountInput.select();
    
    // Handle damage button click
    document.getElementById('hpDamageBtn').addEventListener('click', () => {
      console.log('Damage button clicked');
      const amount = parseInt(amountInput.value) || 0;
      if (amount > 0) {
        const newHP = Math.max(0, currentHP - amount);
        currentHPInput.value = newHP;
        if (saveFieldCallback) {
          saveFieldCallback('hitPoints.current', newHP);
        }
        closeOverlay();
      }
    });
    
    // Handle heal button click
    document.getElementById('hpHealBtn').addEventListener('click', () => {
      console.log('Heal button clicked');
      const amount = parseInt(amountInput.value) || 0;
      if (amount > 0) {
        const newHP = Math.min(maxHP, currentHP + amount);
        currentHPInput.value = newHP;
        if (saveFieldCallback) {
          saveFieldCallback('hitPoints.current', newHP);
        }
        closeOverlay();
      }
    });
    
    // Handle close button click
    document.getElementById('hpCloseBtn').addEventListener('click', () => {
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
        // Default to healing if Enter is pressed
        document.getElementById('hpHealBtn').click();
      }
    });
    
    function closeOverlay() {
      document.body.style.overflow = ''; // Restore scrolling
      overlay.remove();
    }
  }
}