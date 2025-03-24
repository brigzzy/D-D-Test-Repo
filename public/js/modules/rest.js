// public/js/modules/rest.js

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
      
      // Recover half mana
      const currentMana = document.getElementById('currentMana');
      const maxMana = document.getElementById('maxMana');
      
      if (currentMana && maxMana) {
        const currentManaValue = parseInt(currentMana.value) || 0;
        const maxManaValue = parseInt(maxMana.value) || 0;
        const recoveredMana = Math.floor(maxManaValue / 2);
        const newManaValue = Math.min(maxManaValue, currentManaValue + recoveredMana);
        
        currentMana.value = newManaValue;
        saveFieldCallback('mana.current', newManaValue);
      }
    }
  
    /**
     * Perform a long rest
     * @param {function} saveFieldCallback - Function to save field changes
     */
    static performLongRest(saveFieldCallback) {
      this.showRestAnimation('Long Rest', '☀️', '#7b2cbf');
      
      // Fully recover HP and mana
      const currentHP = document.getElementById('currentHitPoints');
      const maxHP = document.getElementById('maxHitPoints');
      const currentMana = document.getElementById('currentMana');
      const maxMana = document.getElementById('maxMana');
      
      if (currentHP && maxHP) {
        const maxHPValue = parseInt(maxHP.value) || 0;
        currentHP.value = maxHPValue;
        saveFieldCallback('hitPoints.current', maxHPValue);
      }
      
      if (currentMana && maxMana) {
        const maxManaValue = parseInt(maxMana.value) || 0;
        currentMana.value = maxManaValue;
        saveFieldCallback('mana.current', maxManaValue);
      }
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