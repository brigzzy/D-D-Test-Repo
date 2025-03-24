// public/js/modules/rest.js
import { ManaManager } from './mana.js';  // Import the new mana module

/**
 * Manages short and long rest mechanics
 */
export class RestManager {
    /**
     * Initialize rest buttons
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static initializeRestButtons(saveFieldCallback) {
      const shortRestBtn = document.querySelector('.short-rest-button');
      const longRestBtn = document.querySelector('.long-rest-button');
  
      if (shortRestBtn) {
        shortRestBtn.addEventListener('click', () => 
          this.performShortRest(saveFieldCallback)
        );
      }
  
      if (longRestBtn) {
        longRestBtn.addEventListener('click', () => 
          this.performLongRest(saveFieldCallback)
        );
      }
    }
  
    /**
     * Perform a short rest
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static performShortRest(saveFieldCallback) {
      this.showRestAnimation('Short Rest', '🌙', '#3f51b5');
      
      // Recover HP
      const currentHP = document.getElementById('currentHitPoints');
      const maxHP = document.getElementById('maxHitPoints');
      
      if (currentHP && maxHP) {
        const maxHPValue = parseInt(maxHP.value) || 0;
        const currentHPValue = parseInt(currentHP.value) || 0;
        
        // Optional: Add short rest HP recovery logic if needed
        const recoveredHP = Math.floor(maxHPValue * 0.1); // Example: recover 10% HP
        const newHPValue = Math.min(maxHPValue, currentHPValue + recoveredHP);
        
        currentHP.value = newHPValue;
        saveFieldCallback('hitPoints.current', newHPValue);
      }
      
      // Delegate mana recovery to ManaManager
      ManaManager.handleManaRecovery('short', saveFieldCallback);
    }
  
    /**
     * Perform a long rest
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static performLongRest(saveFieldCallback) {
      this.showRestAnimation('Long Rest', '☀️', '#7b2cbf');
      
      // Fully recover HP
      const currentHP = document.getElementById('currentHitPoints');
      const maxHP = document.getElementById('maxHitPoints');
      
      if (currentHP && maxHP) {
        const maxHPValue = parseInt(maxHP.value) || 0;
        currentHP.value = maxHPValue;
        saveFieldCallback('hitPoints.current', maxHPValue);
      }
      
      // Delegate mana recovery to ManaManager
      ManaManager.handleManaRecovery('long', saveFieldCallback);
    }
  
    /**
     * Show rest animation
     * @param {string} type - Type of rest
     * @param {string} emoji - Emoji to display
     * @param {string} color - Animation color
     */
    static showRestAnimation(type, emoji, color) {
      const restAnimContainer = document.getElementById('restAnimationContainer');
      const restAnimBox = restAnimContainer.querySelector('.rest-animation-box');
      const restAnimText = restAnimContainer.querySelector('.animation-text');
      const restAnimEmoji = restAnimContainer.querySelector('.animation-emoji');
      
      restAnimText.textContent = type;
      restAnimText.style.color = color;
      restAnimEmoji.textContent = emoji;
      restAnimBox.style.border = `2px solid ${color}`;
      
      restAnimContainer.style.visibility = 'visible';
      restAnimContainer.style.opacity = '1';
      
      setTimeout(() => {
        restAnimBox.style.transform = 'scale(1)';
      }, 10);
      
      setTimeout(() => {
        restAnimBox.style.transform = 'scale(0.8)';
        restAnimContainer.style.opacity = '0';
        
        setTimeout(() => {
          restAnimContainer.style.visibility = 'hidden';
        }, 300);
      }, 1500);
    }
}
