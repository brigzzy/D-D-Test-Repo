// public/js/hitPoints.js - Direct file (not in modules folder)

// This is a simplified version placed in the root js folder in case there are path issues
console.log('Simple hitPoints.js loaded');

export class HitPointManager {
  static initializeHitPoints(saveFieldCallback) {
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
    
    // Create popup container or get existing
    let popup = document.getElementById('hpPopup');
    
    // If popup already exists, remove it first
    if (popup) {
      popup.remove();
    }
    
    // Create new popup
    popup = document.createElement('div');
    popup.id = 'hpPopup';
    popup.className = 'hp-popup';
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
    const rect = currentHPInput.getBoundingClientRect();
    popup.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    popup.style.left = (rect.left + window.scrollX) + 'px';
    
    // Current values
    const currentHP = parseInt(currentHPInput.value) || 0;
    const maxHP = parseInt(maxHPInput.value) || 0;
    
    // Create popup content
    popup.innerHTML = `
      <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px;">Modify Hit Points</h3>
      <div style="margin-bottom: 15px;">
        <p style="margin: 5px 0;">Current HP: ${currentHP} / ${maxHP}</p>
      </div>
      <div style="margin-bottom: 15px;">
        <label for="hpChangeAmount" style="display: block; margin-bottom: 5px;">Amount:</label>
        <input type="number" id="hpChangeAmount" value="0" min="0" style="width: 100%; padding: 5px;">
      </div>
      <div style="display: flex; justify-content: space-between;">
        <button id="hpDamageBtn" style="background-color: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Damage</button>
        <button id="hpHealBtn" style="background-color: #4caf50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Heal</button>
        <button id="hpCloseBtn" style="background-color: #ccc; color: black; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
      </div>
    `;
    
    // Add popup to body
    document.body.appendChild(popup);
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
        popup.remove();
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
        popup.remove();
      }
    });
    
    // Handle close button click
    document.getElementById('hpCloseBtn').addEventListener('click', () => {
      popup.remove();
    });
    
    // Close popup when clicking outside
    document.addEventListener('click', function closePopup(e) {
      if (!popup.contains(e.target) && e.target !== currentHPInput) {
        popup.remove();
        document.removeEventListener('click', closePopup);
      }
    });
    
    // Handle Enter key in amount input
    amountInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        // Default to healing if Enter is pressed
        document.getElementById('hpHealBtn').click();
      } else if (e.key === 'Escape') {
        popup.remove();
      }
    });
  }
}