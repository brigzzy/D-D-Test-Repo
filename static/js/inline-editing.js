/**
 * Enhanced emoji-based proficiency indicators for D&D character sheets
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing emoji-based proficiency indicators...');
    
    // Get character ID from URL
    const pathParts = window.location.pathname.split('/');
    const characterId = pathParts[pathParts.length - 1];
    console.log('Character ID:', characterId);
    
    // First step: make ability scores editable
    makeAbilityScoresEditable(characterId);
    
    // Second step: replace circular indicators with emojis
    replaceAllIndicatorsWithEmojis(characterId);
});

function makeAbilityScoresEditable(characterId) {
    // Make each ability score editable
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
        const scoreElement = document.getElementById(`${ability}-score`);
        if (scoreElement) {
            console.log(`Making ${ability} score editable`);
            
            // Add editable styling
            scoreElement.className = 'editable-field';
            
            // Add click handler
            scoreElement.addEventListener('click', function() {
                startEditingField(scoreElement, `${ability}_score`, characterId, function(element, newValue) {
                    // Update the modifier after saving
                    updateAbilityModifier(ability, newValue);
                });
            });
        }
    });
}

function replaceAllIndicatorsWithEmojis(characterId) {
    console.log('Replacing all proficiency indicators with emojis...');
    
    // Replace saving throw indicators
    document.querySelectorAll('.d5e-save-item').forEach(saveItem => {
        const nameElement = saveItem.querySelector('.d5e-save-name');
        if (!nameElement) return;
        
        const ability = nameElement.textContent.toLowerCase();
        const originalIndicator = saveItem.querySelector('.d5e-prof-indicator');
        
        if (originalIndicator) {
            // Determine initial proficiency state
            const isProficient = originalIndicator.classList.contains('proficient');
            
            // Create emoji indicator
            const emojiIndicator = document.createElement('span');
            emojiIndicator.className = 'emoji-indicator';
            emojiIndicator.textContent = isProficient ? '✅' : '⚪';
            emojiIndicator.style.cursor = 'pointer';
            emojiIndicator.style.marginRight = '8px';
            emojiIndicator.style.fontSize = '16px';
            emojiIndicator.dataset.ability = ability;
            emojiIndicator.dataset.proficient = isProficient ? 'true' : 'false';
            
            // Add click handler
            emojiIndicator.addEventListener('click', function() {
                toggleSavingThrowProficiency(characterId, emojiIndicator, saveItem);
            });
            
            // Replace the original indicator
            originalIndicator.parentNode.replaceChild(emojiIndicator, originalIndicator);
            console.log(`Replaced ${ability} save indicator with emoji`);
        }
    });
    
    // Replace skill indicators
    document.querySelectorAll('.d5e-skill-item').forEach(skillItem => {
        const nameElement = skillItem.querySelector('.d5e-skill-name');
        const abilityElement = skillItem.querySelector('.d5e-skill-ability');
        if (!nameElement || !abilityElement) return;
        
        const skillName = nameElement.textContent.trim();
        const ability = abilityElement.textContent.toLowerCase();
        const originalIndicator = skillItem.querySelector('.d5e-prof-indicator');
        
        if (originalIndicator) {
            // Determine initial state
            const isProficient = originalIndicator.classList.contains('proficient');
            const hasExpertise = originalIndicator.classList.contains('expertise');
            
            let emoji = '⚪';  // default: not proficient
            let state = 'none';
            
            if (hasExpertise) {
                emoji = '⭐';  // expertise
                state = 'expertise';
            } else if (isProficient) {
                emoji = '✅';  // proficient
                state = 'proficient';
            }
            
            // Create emoji indicator
            const emojiIndicator = document.createElement('span');
            emojiIndicator.className = 'emoji-indicator';
            emojiIndicator.textContent = emoji;
            emojiIndicator.style.cursor = 'pointer';
            emojiIndicator.style.marginRight = '8px';
            emojiIndicator.style.fontSize = '16px';
            emojiIndicator.dataset.ability = ability;
            emojiIndicator.dataset.skillName = skillName;
            emojiIndicator.dataset.state = state;
            
            // Add click handler
            emojiIndicator.addEventListener('click', function() {
                toggleSkillProficiency(characterId, emojiIndicator, skillItem);
            });
            
            // Replace the original indicator
            originalIndicator.parentNode.replaceChild(emojiIndicator, originalIndicator);
            console.log(`Replaced ${skillName} skill indicator with emoji`);
        }
    });
}

function toggleSavingThrowProficiency(characterId, indicator, saveItem) {
    // Get current state
    const isProficient = indicator.dataset.proficient === 'true';
    const ability = indicator.dataset.ability;
    
    // Toggle proficiency state
    const newProficient = !isProficient;
    indicator.dataset.proficient = newProficient ? 'true' : 'false';
    
    // Update emoji display
    indicator.textContent = newProficient ? '✅' : '⚪';
    
    console.log(`Toggling ${ability} save proficiency: ${isProficient ? 'OFF' : 'ON'}`);
    
    // Update the display value
    updateSavingThrowValue(indicator, saveItem);
    
    // Save to server - important for persistence!
    saveProficiencyToServer(characterId, `${ability}_save_proficiency`, newProficient ? 'Proficient' : 'Not Proficient');
}

function toggleSkillProficiency(characterId, indicator, skillItem) {
    // Get current state and info
    const currentState = indicator.dataset.state;
    const ability = indicator.dataset.ability;
    const skillName = indicator.dataset.skillName;
    
    // Determine next state (cycle through: none → proficient → expertise → none)
    let nextState, nextEmoji;
    
    if (currentState === 'none') {
        nextState = 'proficient';
        nextEmoji = '✅';
    } else if (currentState === 'proficient') {
        nextState = 'expertise';
        nextEmoji = '⭐';
    } else { // expertise
        nextState = 'none';
        nextEmoji = '⚪';
    }
    
    console.log(`Toggling ${skillName} proficiency: ${currentState} → ${nextState}`);
    
    // Update indicator
    indicator.dataset.state = nextState;
    indicator.textContent = nextEmoji;
    
    // Update the display value
    updateSkillValue(indicator, skillItem);
    
    // Save to server - important for persistence!
    saveSkillToServer(characterId, skillName, nextState);
}

function updateSavingThrowValue(indicator, saveItem) {
    const isProficient = indicator.dataset.proficient === 'true';
    const ability = indicator.dataset.ability;
    
    // Get the ability modifier
    let modValue = 0;
    const modElement = document.getElementById(`${ability}-mod`);
    if (modElement) {
        const modText = modElement.textContent;
        const modMatch = modText.match(/([+-]?\d+)/);
        if (modMatch) {
            modValue = parseInt(modMatch[1]);
        }
    }
    
    // Get proficiency bonus
    let profBonus = 2; // Default
    const profBonusElement = document.getElementById('proficiency-bonus');
    if (profBonusElement) {
        const bonusText = profBonusElement.textContent;
        const bonusMatch = bonusText.match(/([+-]?\d+)/);
        if (bonusMatch) {
            profBonus = parseInt(bonusMatch[1]);
        }
    }
    
    // Calculate new save value based on proficiency
    let saveValue = modValue;
    if (isProficient) {
        saveValue += profBonus; // Add proficiency bonus if proficient
    }
    
    // Format with plus sign for positive values
    const saveText = saveValue >= 0 ? `+${saveValue}` : saveValue.toString();
    
    // Update the display
    const valueElement = saveItem.querySelector('.d5e-save-value');
    if (valueElement) {
        valueElement.textContent = saveText;
    }
}

function updateSkillValue(indicator, skillItem) {
    const state = indicator.dataset.state;
    const ability = indicator.dataset.ability;
    
    // Get the ability modifier
    let modValue = 0;
    const modElement = document.getElementById(`${ability}-mod`);
    if (modElement) {
        const modText = modElement.textContent;
        const modMatch = modText.match(/([+-]?\d+)/);
        if (modMatch) {
            modValue = parseInt(modMatch[1]);
        }
    }
    
    // Get proficiency bonus
    let profBonus = 2; // Default
    const profBonusElement = document.getElementById('proficiency-bonus');
    if (profBonusElement) {
        const bonusText = profBonusElement.textContent;
        const bonusMatch = bonusText.match(/([+-]?\d+)/);
        if (bonusMatch) {
            profBonus = parseInt(bonusMatch[1]);
        }
    }
    
    // Calculate new skill value based on proficiency level
    let skillValue = modValue;
    if (state === 'proficient') {
        skillValue += profBonus; // Add proficiency
    } else if (state === 'expertise') {
        skillValue += (profBonus * 2); // Add double proficiency
    }
    
    // Format with plus sign for positive values
    const skillText = skillValue >= 0 ? `+${skillValue}` : skillValue.toString();
    
    // Update the display
    const valueElement = skillItem.querySelector('.d5e-skill-value');
    if (valueElement) {
        valueElement.textContent = skillText;
    }
}

function saveProficiencyToServer(characterId, field, value) {
    console.log(`Saving ${field} as ${value} to server`);
    
    fetch(`/characters/${characterId}/field`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            field: field,
            value: value
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log(`Successfully saved ${field} to server:`, data);
    })
    .catch(error => {
        console.error('Error saving proficiency:', error);
    });
}

function saveSkillToServer(characterId, skillName, state) {
    console.log(`Saving ${skillName} as ${state} to server`);
    
    // Format field name as expected by server (snake_case)
    const formattedSkillName = `skill_${skillName.toLowerCase().replace(/\s+/g, '_')}`;
    const stateValue = state === 'none' ? 'Not Proficient' : 
                       state === 'proficient' ? 'Proficient' : 'Expertise';
    
    fetch(`/characters/${characterId}/field`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            field: formattedSkillName,
            value: stateValue
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log(`Successfully saved ${skillName} to server:`, data);
    })
    .catch(error => {
        console.error('Error saving skill:', error);
    });
}

function startEditingField(element, fieldName, characterId, callback) {
    const originalValue = element.textContent;
    
    // Create input element for editing
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalValue;
    input.className = 'inline-edit-input';
    
    // Replace content with input
    element.textContent = '';
    element.appendChild(input);
    
    // Focus and select input
    input.focus();
    input.select();
    
    // Handle input events
    input.addEventListener('blur', function() {
        saveFieldEdit(element, input.value, fieldName, characterId, originalValue, callback);
    });
    
    input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            saveFieldEdit(element, input.value, fieldName, characterId, originalValue, callback);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            element.textContent = originalValue;
        }
    });
}

function saveFieldEdit(element, newValue, fieldName, characterId, originalValue, callback) {
    if (newValue === originalValue) {
        element.textContent = originalValue;
        return;
    }
    
    // Create save indicator
    const saveIndicator = document.createElement('span');
    saveIndicator.className = 'save-indicator';
    saveIndicator.innerHTML = '⏳'; // Hourglass emoji
    
    // Update display
    element.textContent = newValue;
    element.appendChild(saveIndicator);
    
    // Send to server
    fetch(`/characters/${characterId}/field`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            field: fieldName,
            value: newValue
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save');
        }
        return response.json();
    })
    .then(data => {
        // Show success indicator
        saveIndicator.className = 'save-indicator success';
        saveIndicator.textContent = '✅';
        
        // Remove indicator after delay
        setTimeout(() => {
            if (element.contains(saveIndicator)) {
                element.removeChild(saveIndicator);
            }
        }, 2000);
        
        // Run callback if provided
        if (callback) {
            callback(element, newValue);
        }
    })
    .catch(error => {
        console.error('Save error:', error);
        
        // Show error indicator
        saveIndicator.className = 'save-indicator error';
        saveIndicator.textContent = '❌';
        
        // Reset to original value after delay
        setTimeout(() => {
            element.textContent = originalValue;
        }, 2000);
    });
}

function updateAbilityModifier(ability, scoreValue) {
    const score = parseInt(scoreValue);
    if (isNaN(score)) return;
    
    // Calculate modifier using D&D rules: floor((score - 10) / 2)
    const mod = Math.floor((score - 10) / 2);
    // Format with plus sign for positive modifiers
    const modText = mod >= 0 ? `+${mod}` : mod.toString();
    
    // Update modifier display
    const modElement = document.getElementById(`${ability}-mod`);
    if (modElement) {
        modElement.textContent = modText;
    }
    
    // Also update all saving throws and skills that use this ability
    updateDependentValues(ability, mod);
}

function updateDependentValues(ability, modValue) {
    // Update saving throws that use this ability
    document.querySelectorAll('.d5e-save-item').forEach(saveItem => {
        const nameElement = saveItem.querySelector('.d5e-save-name');
        if (nameElement && nameElement.textContent.toLowerCase() === ability) {
            const emojiIndicator = saveItem.querySelector('.emoji-indicator');
            if (emojiIndicator) {
                updateSavingThrowValue(emojiIndicator, saveItem);
            }
        }
    });
    
    // Update skills that use this ability
    document.querySelectorAll('.d5e-skill-item').forEach(skillItem => {
        const abilityElement = skillItem.querySelector('.d5e-skill-ability');
        if (abilityElement && abilityElement.textContent.toLowerCase() === ability) {
            const emojiIndicator = skillItem.querySelector('.emoji-indicator');
            if (emojiIndicator) {
                updateSkillValue(emojiIndicator, skillItem);
            }
        }
    });
}

function getCSRFToken() {
    // Try to get from cookie
    const cookieValue = document.cookie
        .split('; ')
        .find(cookie => cookie.startsWith('csrf_token='));
    
    if (cookieValue) {
        return cookieValue.split('=')[1];
    }
    
    // Try to get from meta tag
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
        return csrfMeta.getAttribute('content');
    }
    
    return '';
}