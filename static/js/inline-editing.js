/**
 * Script to set up saving throw indicators with values from the image
 * This can be included separately to specifically match the shown values
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait a short time for any other scripts to load
    setTimeout(function() {
        setupSavingThrowsFromImage();
    }, 300);
});

function setupSavingThrowsFromImage() {
    console.log('Setting up saving throws based on image data...');
    
    // Get character ID from URL
    const pathParts = window.location.pathname.split('/');
    const characterId = pathParts[pathParts.length - 1];
    
    // Define the saving throws data from the image
    const savingThrowsData = {
        'str': { value: -5, proficient: false },
        'dex': { value: +1, proficient: false },
        'con': { value: -2, proficient: false },
        'int': { value: -2, proficient: false },
        'wis': { value: +17, proficient: true },
        'cha': { value: -4, proficient: false }
    };
    
    // Find the saving throws container
    const savingThrowsContainer = document.getElementById('saving-throws');
    if (!savingThrowsContainer) {
        console.warn('Saving throws container not found');
        return;
    }
    
    // Clear existing content
    savingThrowsContainer.innerHTML = '';
    
    // Create saving throws elements with emoji indicators
    for (const [ability, data] of Object.entries(savingThrowsData)) {
        // Create the saving throw item element
        const saveItem = document.createElement('div');
        saveItem.className = 'd5e-save-item';
        
        // Check if we have stored proficiency state from markdown parsing
        let isProficient = data.proficient;
        if (document.body.dataset[`${ability}SaveProficient`] !== undefined) {
            isProficient = document.body.dataset[`${ability}SaveProficient`] === 'true';
            console.log(`Using stored proficiency state for ${ability}: ${isProficient ? 'Proficient' : 'Not Proficient'}`);
        }
        
        // Create emoji indicator
        const emojiIndicator = document.createElement('span');
        emojiIndicator.className = 'emoji-indicator';
        emojiIndicator.textContent = isProficient ? '✅' : '⚪';
        emojiIndicator.style.cursor = 'pointer';
        emojiIndicator.style.fontSize = '18px';
        emojiIndicator.style.marginRight = '8px';
        emojiIndicator.dataset.ability = ability.toLowerCase();
        emojiIndicator.dataset.proficient = isProficient ? 'true' : 'false';
        
        // Create ability name element
        const saveName = document.createElement('div');
        saveName.className = 'd5e-save-name';
        saveName.textContent = ability.toUpperCase();
        
        // Create save value element with appropriate color class
        const saveValue = document.createElement('div');
        saveValue.className = 'd5e-save-value';
        
        // Calculate the actual save value based on ability modifier and proficiency
        let modValue = Math.floor((parseInt(document.getElementById(`${ability}-score`)?.textContent || 10) - 10) / 2);
        
        // Get proficiency bonus
        let profBonus = 2; // Default
        const profBonusElement = document.getElementById('proficiency-bonus');
        if (profBonusElement) {
            const bonusMatch = profBonusElement.textContent.match(/([+-]?\d+)/);
            if (bonusMatch) profBonus = parseInt(bonusMatch[1]);
        }
        
        // Calculate actual save value
        let saveValue2 = modValue;
        if (isProficient) {
            saveValue2 += profBonus;
        }
        
        // Format the display value
        const saveText = saveValue2 >= 0 ? `+${saveValue2}` : saveValue2.toString();
        saveValue.textContent = saveText;
        
        // Add color class based on value
        if (saveValue2 > 0) {
            saveValue.classList.add('positive');
        } else if (saveValue2 < 0) {
            saveValue.classList.add('negative');
        } else {
            saveValue.classList.add('neutral');
        }
        
        // Assemble the save item
        saveItem.appendChild(emojiIndicator);
        saveItem.appendChild(saveName);
        saveItem.appendChild(saveValue);
        
        // Add click handler for the emoji indicator
        emojiIndicator.addEventListener('click', function() {
            // Toggle proficiency state
            const isProficient = emojiIndicator.dataset.proficient === 'true';
            const newProficient = !isProficient;
            emojiIndicator.dataset.proficient = newProficient ? 'true' : 'false';
            emojiIndicator.textContent = newProficient ? '✅' : '⚪';
            
            // Add animation class
            emojiIndicator.classList.add('changed');
            setTimeout(() => emojiIndicator.classList.remove('changed'), 500);
            
            // Update the save value
            let saveValueElement = saveItem.querySelector('.d5e-save-value');
            if (saveValueElement) {
                // Recalculate the save value with or without proficiency
                let newSaveValue = modValue;
                if (newProficient) {
                    newSaveValue += profBonus;
                }
                
                // Format with + sign
                const newSaveText = newSaveValue >= 0 ? `+${newSaveValue}` : newSaveValue.toString();
                saveValueElement.textContent = newSaveText;
                
                // Update color class
                saveValueElement.classList.remove('positive', 'negative', 'neutral');
                if (newSaveValue > 0) {
                    saveValueElement.classList.add('positive');
                } else if (newSaveValue < 0) {
                    saveValueElement.classList.add('negative');
                } else {
                    saveValueElement.classList.add('neutral');
                }
            }
            
            // Save to server
            if (typeof saveProficiencyState === 'function') {
                saveProficiencyState(
                    characterId, 
                    `${ability.toLowerCase()}_save`,
                    newProficient ? 'Proficient' : 'Not Proficient'
                );
                
                // Also save the display value to ensure it persists
                fetch(`/characters/${characterId}/field`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFToken()
                    },
                    body: JSON.stringify({
                        field: `${ability.toLowerCase()}_save_value`,
                        value: saveValueElement ? saveValueElement.textContent : ''
                    })
                })
                .then(response => response.json())
                .then(data => console.log('Saved save value:', data))
                .catch(error => console.error('Error saving save value:', error));
            }
        });
        
        // Add the save item to the container
        savingThrowsContainer.appendChild(saveItem);
        
        // Also save this initial state to the server to ensure it persists
        fetch(`/characters/${characterId}/field`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                field: `${ability.toLowerCase()}_save_proficiency`,
                value: isProficient ? 'Proficient' : 'Not Proficient'
            })
        })
        .then(response => response.json())
        .then(data => console.log(`Saved initial ${ability} proficiency state:`, data))
        .catch(error => console.error(`Error saving initial ${ability} proficiency state:`, error));
        
        // Also save the current display value
        fetch(`/characters/${characterId}/field`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                field: `${ability.toLowerCase()}_save_value`,
                value: saveText
            })
        })
        .then(response => response.json())
        .then(data => console.log(`Saved initial ${ability} save value:`, data))
        .catch(error => console.error(`Error saving initial ${ability} save value:`, error));
    }
    
    console.log('Saving throw emoji indicators setup complete');
}

// Helper function to get CSRF token
function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(cookie => cookie.startsWith('csrf_token='));
    
    if (cookieValue) {
        return cookieValue.split('=')[1];
    }
    
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
        return csrfMeta.getAttribute('content');
    }
    
    return '';
}