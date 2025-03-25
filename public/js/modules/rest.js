// public/js/modules/rest.js
import { ManaManager } from './mana.js';

/**
 * Manages short and long rest mechanics
 */
export class RestManager {
  /**
   * Initialize rest buttons
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static initializeRestButtons(saveFieldCallback) {
    // Find or create rest buttons
    this.setupRestButtons();
    
    // Add event listeners to buttons
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
    
    // Create rest animation container if it doesn't exist
    this.createRestAnimationContainer();
  }
  
  /**
   * Set up rest buttons if they don't exist
   */
  static setupRestButtons() {
    // Check if the header exists
    const hpManaHeader = document.getElementById('hpManaHeader');
    if (!hpManaHeader) return;
    
    // Check if rest buttons container already exists
    let restButtonsContainer = hpManaHeader.querySelector('.rest-buttons-container');
    
    // If it doesn't exist, create it
    if (!restButtonsContainer) {
      restButtonsContainer = document.createElement('div');
      restButtonsContainer.className = 'rest-buttons-container';
      
      // Create short rest button
      const shortRestBtn = document.createElement('button');
      shortRestBtn.type = 'button';
      shortRestBtn.className = 'rest-button short-rest-button';
      shortRestBtn.title = 'Short Rest';
      shortRestBtn.innerHTML = '🌙';
      
      // Create long rest button
      const longRestBtn = document.createElement('button');
      longRestBtn.type = 'button';
      longRestBtn.className = 'rest-button long-rest-button';
      longRestBtn.title = 'Long Rest';
      longRestBtn.innerHTML = '☀️';
      
      // Add buttons to container
      restButtonsContainer.appendChild(shortRestBtn);
      restButtonsContainer.appendChild(longRestBtn);
      
      // Add container to header
      hpManaHeader.appendChild(restButtonsContainer);
    }
  }
  
  /**
   * Create animation container for rest effects
   */
  static createRestAnimationContainer() {
    // Check if container already exists
    let animContainer = document.getElementById('restAnimationContainer');
    
    if (!animContainer) {
      animContainer = document.createElement('div');
      animContainer.id = 'restAnimationContainer';
      animContainer.style.position = 'fixed';
      animContainer.style.top = '0';
      animContainer.style.left = '0';
      animContainer.style.right = '0';
      animContainer.style.bottom = '0';
      animContainer.style.display = 'flex';
      animContainer.style.alignItems = 'center';
      animContainer.style.justifyContent = 'center';
      animContainer.style.zIndex = '9999';
      animContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
      animContainer.style.opacity = '0';
      animContainer.style.visibility = 'hidden';
      animContainer.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
      
      // Create animation box
      const animBox = document.createElement('div');
      animBox.className = 'rest-animation-box';
      animBox.style.backgroundColor = 'white';
      animBox.style.padding = '20px';
      animBox.style.borderRadius = '10px';
      animBox.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.3)';
      animBox.style.display = 'flex';
      animBox.style.flexDirection = 'column';
      animBox.style.alignItems = 'center';
      animBox.style.transform = 'scale(0.8)';
      animBox.style.transition = 'transform 0.3s ease';
      
      // Create animation text
      const animText = document.createElement('div');
      animText.className = 'animation-text';
      animText.style.fontSize = '1.5rem';
      animText.style.fontWeight = 'bold';
      animText.style.marginBottom = '10px';
      
      // Create animation emoji
      const animEmoji = document.createElement('div');
      animEmoji.className = 'animation-emoji';
      animEmoji.style.fontSize = '3rem';
      
      // Add elements to container
      animBox.appendChild(animText);
      animBox.appendChild(animEmoji);
      animContainer.appendChild(animBox);
      
      // Add container to body
      document.body.appendChild(animContainer);
    }
  }
  
  /**
   * Perform a short rest
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static performShortRest(saveFieldCallback) {
    this.showRestAnimation('Short Rest', '🌙', '#3f51b5');
    
    // HP recovery (25% of max)
    const currentHP = document.getElementById('currentHitPoints');
    const maxHP = document.getElementById('maxHitPoints');
    
    if (currentHP && maxHP) {
      const maxHPValue = parseInt(maxHP.value) || 0;
      const currentHPValue = parseInt(currentHP.value) || 0;
      
      const recoveryAmount = Math.floor(maxHPValue * 0.25);
      const newHP = Math.min(maxHPValue, currentHPValue + recoveryAmount);
      
      currentHP.value = newHP;
      saveFieldCallback('hitPoints.current', newHP);
    }
    
    // Mana recovery (50% of max)
    ManaManager.handleManaRecovery('short', saveFieldCallback);
  }
  
  /**
   * Perform a long rest
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static performLongRest(saveFieldCallback) {
    this.showRestAnimation('Long Rest', '☀️', '#7b2cbf');
    
    // Full HP recovery
    const currentHP = document.getElementById('currentHitPoints');
    const maxHP = document.getElementById('maxHitPoints');
    
    if (currentHP && maxHP) {
      const maxHPValue = parseInt(maxHP.value) || 0;
      
      currentHP.value = maxHPValue;
      saveFieldCallback('hitPoints.current', maxHPValue);
    }
    
    // Full mana recovery
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
    if (!restAnimContainer) return;
    
    const restAnimBox = restAnimContainer.querySelector('.rest-animation-box');
    const restAnimText = restAnimContainer.querySelector('.animation-text');
    const restAnimEmoji = restAnimContainer.querySelector('.animation-emoji');
    
    restAnimText.textContent = type;
    restAnimText.style.color = color;
    restAnimEmoji.textContent = emoji;
    restAnimBox.style.borderColor = color;
    restAnimBox.style.border = `2px solid ${color}`;
    
    // Show animation
    restAnimContainer.style.visibility = 'visible';
    restAnimContainer.style.opacity = '1';
    
    setTimeout(() => {
      restAnimBox.style.transform = 'scale(1)';
    }, 10);
    
    // Hide animation after delay
    setTimeout(() => {
      restAnimBox.style.transform = 'scale(0.8)';
      restAnimContainer.style.opacity = '0';
      
      setTimeout(() => {
        restAnimContainer.style.visibility = 'hidden';
      }, 300);
    }, 1500);
  }
}