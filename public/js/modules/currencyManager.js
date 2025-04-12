// public/js/modules/currencyManager.js

import { updateSaveStatus } from './utils.js';

/**
 * Currency management module for D&D character sheet
 * Handles currency field interactions and popups
 */
export class CurrencyManager {
    /**
     * Initialize currency field interactions
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static initializeCurrency(saveFieldCallback) {
      console.log('Initializing CurrencyManager');
      
      const currencyInputs = document.querySelectorAll('.currency-input');
      console.log(`Found ${currencyInputs.length} currency inputs`);
      
      currencyInputs.forEach(input => {
        // Make sure input is readonly to trigger popup
        input.readOnly = true;
        
        // Add click handler to show popup
        input.addEventListener('click', (e) => {
          console.log('Currency input clicked:', input.name);
          this.showCurrencyPopup(input, saveFieldCallback);
        });
      });
    }
    
    /**
     * Show currency modification popup
     * @param {HTMLElement} currencyInput - The currency input element
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static showCurrencyPopup(currencyInput, saveFieldCallback) {
      console.log('Showing currency popup for:', currencyInput.name);
      
      // Remove any existing popups
      const existingOverlay = document.getElementById('currencyPopupOverlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      
      // Create overlay container
      const overlay = document.createElement('div');
      overlay.id = 'currencyPopupOverlay';
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
      
      // Determine currency type and colors
      const currencyInfo = {
        'platinum': { name: 'Platinum Pieces (PP)', color: '#7b7b7b' },
        'gold': { name: 'Gold Pieces (GP)', color: '#d4af37' },
        'electrum': { name: 'Electrum Pieces (EP)', color: '#50c878' },
        'silver': { name: 'Silver Pieces (SP)', color: '#c0c0c0' },
        'copper': { name: 'Copper Pieces (CP)', color: '#b87333' }
      }[currencyInput.name] || { name: 'Currency', color: '#7b2cbf' };
      
      // Create popup element
      const popup = document.createElement('div');
      popup.id = 'currencyPopup';
      popup.className = 'currency-popup';
      popup.style = `
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        padding: 20px;
        max-width: 350px;
        width: 100%;
        animation: popupFadeIn 0.3s ease;
        border-left: 4px solid ${currencyInfo.color};
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
      
      // Current value
      const currentValue = parseInt(currencyInput.value) || 0;
      
      // Create popup content
      popup.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 20px; color: #333; text-align: center;">Modify ${currencyInfo.name}</h3>
        <div style="margin-bottom: 20px; text-align: center;">
          <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">
            <span style="color: ${currencyInfo.color};">${currentValue}</span>
          </p>
        </div>
        <div style="margin-bottom: 20px;">
          <label for="currencyChangeAmount" style="display: block; margin-bottom: 10px; font-weight: bold;">Amount:</label>
          <input type="number" id="currencyChangeAmount" value="0" min="0" style="width: 100%; padding: 10px; font-size: 16px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div style="display: flex; justify-content: space-between;">
          <button id="currencyAddBtn" style="background-color: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 1; margin-right: 10px;">Add</button>
          <button id="currencyRemoveBtn" style="background-color: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 1; margin-right: 10px;">Remove</button>
          <button id="currencyCloseBtn" style="background-color: #9e9e9e; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 0.8;">Close</button>
        </div>
      `;
      
      // Add popup to overlay and overlay to body
      overlay.appendChild(popup);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden'; // Prevent scrolling
      
      // Focus amount input
      const amountInput = document.getElementById('currencyChangeAmount');
      amountInput.focus();
      amountInput.select();
      
      // Function to close overlay
      function closeOverlay() {
        document.body.style.overflow = ''; // Restore scrolling
        overlay.remove();
      }
      
      // Handle add button click
      document.getElementById('currencyAddBtn').addEventListener('click', () => {
        const amount = parseInt(amountInput.value) || 0;
        if (amount > 0) {
          const newValue = currentValue + amount;
          currencyInput.value = newValue;
          saveFieldCallback(`currency.${currencyInput.name}`, newValue);
          closeOverlay();
        }
      });
      
      // Handle remove button click
      document.getElementById('currencyRemoveBtn').addEventListener('click', () => {
        const amount = parseInt(amountInput.value) || 0;
        if (amount > 0) {
          const newValue = Math.max(0, currentValue - amount);
          currencyInput.value = newValue;
          saveFieldCallback(`currency.${currencyInput.name}`, newValue);
          closeOverlay();
        }
      });
      
      // Handle close button click
      document.getElementById('currencyCloseBtn').addEventListener('click', closeOverlay);
      
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
      amountInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          document.getElementById('currencyAddBtn').click();
        }
      });
    }
  }