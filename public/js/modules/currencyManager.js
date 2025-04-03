// public/js/modules/currencyManager.js

export class CurrencyManager {
    /**
     * Initialize currency interaction
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static initializeCurrency(saveFieldCallback) {
      console.error('CurrencyManager initializing with saveFieldCallback:', saveFieldCallback);
      
      // Timeout to ensure DOM is fully loaded
      setTimeout(() => {
        const currencyInputs = document.querySelectorAll('.currency-input');
        
        console.error(`CurrencyManager: Found ${currencyInputs.length} currency inputs`);
        
        currencyInputs.forEach(input => {
          console.error(`CurrencyManager: Processing input`, input);
          
          // Force readonly if not already set
          input.readOnly = true;
          
          // Add click event listener directly
          input.onclick = (e) => {
            console.error(`CurrencyManager: Input clicked`, input);
            this.showCurrencyPopup(input, saveFieldCallback);
          };
        });
      }, 1000);
    }
    
    /**
     * Show currency modification popup
     * @param {HTMLElement} currencyInput - Currency input element
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static showCurrencyPopup(currencyInput, saveFieldCallback) {
      console.error('showCurrencyPopup called with input:', currencyInput);
      
      // Ensure a previous popup is removed
      const existingOverlay = document.getElementById('currencyPopupOverlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      
      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'currencyPopupOverlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;
      
      // Determine currency type and format it nicely
      const currencyName = {
        'platinum': 'Platinum Pieces (PP)',
        'gold': 'Gold Pieces (GP)',
        'electrum': 'Electrum Pieces (EP)',
        'silver': 'Silver Pieces (SP)',
        'copper': 'Copper Pieces (CP)'
      }[currencyInput.name] || 'Currency';
      
      // Create popup
      const popup = document.createElement('div');
      popup.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        width: 300px;
        max-width: 90%;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      `;
      
      // Popup content
      popup.innerHTML = `
        <h2>${currencyName}</h2>
        <p>Current Value: ${currencyInput.value}</p>
        <input type="number" id="currencyAmount" placeholder="Amount" />
        <div>
          <button id="addBtn">Add</button>
          <button id="subtractBtn">Subtract</button>
          <button id="closeBtn">Close</button>
        </div>
      `;
      
      // Add popup to overlay
      overlay.appendChild(popup);
      
      // Add to body
      document.body.appendChild(overlay);
      
      // Button event listeners
      const addBtn = popup.querySelector('#addBtn');
      const subtractBtn = popup.querySelector('#subtractBtn');
      const closeBtn = popup.querySelector('#closeBtn');
      const amountInput = popup.querySelector('#currencyAmount');
      
      addBtn.onclick = () => {
        const amount = parseInt(amountInput.value) || 0;
        const newValue = parseInt(currencyInput.value) + amount;
        currencyInput.value = newValue;
        saveFieldCallback(`currency.${currencyInput.name}`, newValue);
        overlay.remove();
      };
      
      subtractBtn.onclick = () => {
        const amount = parseInt(amountInput.value) || 0;
        const newValue = Math.max(0, parseInt(currencyInput.value) - amount);
        currencyInput.value = newValue;
        saveFieldCallback(`currency.${currencyInput.name}`, newValue);
        overlay.remove();
      };
      
      closeBtn.onclick = () => {
        overlay.remove();
      };
      
      // Close when clicking outside
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      };
    }
  }
  
  // Export a function for easy initialization
  export function setupCurrency(saveFieldCallback) {
    console.error('setupCurrency called with saveFieldCallback:', saveFieldCallback);
    CurrencyManager.initializeCurrency(saveFieldCallback);
  }// public/js/modules/currencyManager.js
  
  export class CurrencyManager {
    /**
     * Initialize currency interaction
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static initializeCurrency(saveFieldCallback) {
      console.error('CurrencyManager initializing with saveFieldCallback:', saveFieldCallback);
      
      // Timeout to ensure DOM is fully loaded
      setTimeout(() => {
        const currencyInputs = document.querySelectorAll('.currency-input');
        
        console.error(`CurrencyManager: Found ${currencyInputs.length} currency inputs`);
        
        currencyInputs.forEach(input => {
          console.error(`CurrencyManager: Processing input`, input);
          
          // Force readonly if not already set
          input.readOnly = true;
          
          // Add click event listener directly
          input.onclick = (e) => {
            console.error(`CurrencyManager: Input clicked`, input);
            this.showCurrencyPopup(input, saveFieldCallback);
          };
        });
        
        // Force first input to show popup (for debugging)
        if (currencyInputs.length > 0) {
          console.error('Forcing first input popup');
          this.showCurrencyPopup(currencyInputs[0], saveFieldCallback);
        }
      }, 1000);
    }
    
    /**
     * Show currency modification popup
     * @param {HTMLElement} currencyInput - Currency input element
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static showCurrencyPopup(currencyInput, saveFieldCallback) {
      console.error('showCurrencyPopup called with input:', currencyInput);
      
      // Ensure a previous popup is removed
      const existingOverlay = document.getElementById('currencyPopupOverlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      
      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'currencyPopupOverlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;
      
      // Create popup
      const popup = document.createElement('div');
      popup.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        width: 300px;
        max-width: 90%;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      `;
      
      // Popup content
      popup.innerHTML = `
        <h2>Currency Popup</h2>
        <p>Current Value: ${currencyInput.value}</p>
        <input type="number" id="currencyAmount" placeholder="Amount" />
        <div>
          <button id="addBtn">Add</button>
          <button id="subtractBtn">Subtract</button>
          <button id="closeBtn">Close</button>
        </div>
      `;
      
      // Add popup to overlay
      overlay.appendChild(popup);
      
      // Add to body
      document.body.appendChild(overlay);
      
      // Button event listeners
      const addBtn = popup.querySelector('#addBtn');
      const subtractBtn = popup.querySelector('#subtractBtn');
      const closeBtn = popup.querySelector('#closeBtn');
      const amountInput = popup.querySelector('#currencyAmount');
      
      addBtn.onclick = () => {
        const amount = parseInt(amountInput.value) || 0;
        const newValue = parseInt(currencyInput.value) + amount;
        currencyInput.value = newValue;
        saveFieldCallback(`currency.${currencyInput.name}`, newValue);
        overlay.remove();
      };
      
      subtractBtn.onclick = () => {
        const amount = parseInt(amountInput.value) || 0;
        const newValue = Math.max(0, parseInt(currencyInput.value) - amount);
        currencyInput.value = newValue;
        saveFieldCallback(`currency.${currencyInput.name}`, newValue);
        overlay.remove();
      };
      
      closeBtn.onclick = () => {
        overlay.remove();
      };
      
      // Close when clicking outside
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      };
    }
  }
  
  // Export a function for easy initialization
  export function setupCurrency(saveFieldCallback) {
    console.error('setupCurrency called with saveFieldCallback:', saveFieldCallback);
    CurrencyManager.initializeCurrency(saveFieldCallback);
  }