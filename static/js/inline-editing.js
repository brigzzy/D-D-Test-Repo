/**
 * Simple emoji-based proficiency indicators for D&D character sheets
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing emoji-based proficiency indicators...');
    
    // Get character ID from URL
    const pathParts = window.location.pathname.split('/');
    const characterId = pathParts[pathParts.length - 1];
    console.log('Character ID:', characterId);
    
    // Replace the proficiency indicators with emojis
    replaceIndicatorsWithEmojis(characterId);
    
    // Make ability scores editable with modifier updates
    makeAbilityScoreEditable('str', characterId);
    makeAbilityScoreEditable('dex', characterId);
    makeAbilityScoreEditable('con', characterId);
    makeAbilityScoreEditable('int', characterId);
    makeAbilityScoreEditable('wis', characterId);
    makeAbilityScoreEditable('cha', characterId);
});

function replaceIndicatorsWithEmojis(characterId) {
    console.log('Replacing proficiency indicators with emojis...');
    
    // Replace saving throw indicators
    replaceSavingThrowIndicators(characterId);
    
    // Replace skill indicators
    replaceSkillIndicators(characterId);
}

function replaceSavingThrowIndicators(characterId) {
    // Find all saving throw items
    const saveItems = document.querySelectorAll('.d5e-save-item');
    console.log(`Found ${saveItems.length} saving throw items`);
    
    saveItems.forEach(saveItem => {
        // Get ability name (STR, DEX, etc.)
        const saveNameEl = saveItem.querySelector('.d5e-save-name');
        if (!saveNameEl) return;
        
        const ability = saveNameEl.textContent.toLowerCase();
        
        // Find and remove the original indicator
        const originalIndicator = saveItem.querySelector('.d5e-prof-indicator');
        if (originalIndicator) {
            // Check if it was proficient
            const wasProficient = originalIndicator.classList.contains('proficient');
            
            // Create emoji indicator
            const emojiIndicator = document.createElement('span');
            emojiIndicator.className = 'emoji-indicator';
            emojiIndicator.textContent = wasProficient ? '✅' : '⚪';
            emojiIndicator.style.cursor = 'pointer';
            emojiIndicator.style.marginRight = '8px';
            emojiIndicator.style.fontSize = '16px';
            
            // Store proficiency state
            emojiIndicator.dataset.proficient = wasProficient ? 'true' : 'false';
            emojiIndicator.dataset.ability = ability;
            
            // Add click handler
            emojiIndicator.addEventListener('click', function(event) {
                toggleSavingThrowProficiency(characterId, emojiIndicator);
                event.stopPropagation();
            });
            
            // Replace the original
            originalIndicator.parentNode.replaceChild(emojiIndicator, originalIndicator);
            console.log(`Replaced ${ability} save indicator with emoji`);
        }
    });
}

function replaceSkillIndicators(characterId) {
    // Find all skill items
    const skillItems = document.querySelectorAll('.d5e-skill-item');
    console.log(`Found ${skillItems.length} skill items`);
    
    skillItems.forEach(skillItem => {
        // Get skill information
        const skillNameEl = skillItem.querySelector('.d5e-skill-name');
        const skillAbilityEl = skillItem.querySelector('.d5e-skill-ability');
        if (!skillNameEl || !skillAbilityEl) return;
        
        const skillName = skillNameEl.textContent.trim();
        const ability = skillAbilityEl.textContent.toLowerCase();
        
        // Find and remove the original indicator
        const originalIndicator = skillItem.querySelector('.d5e-prof-indicator');
        if (originalIndicator) {
            // Check current state
            const isProficient = originalIndicator.classList.contains('proficient');
            const hasExpertise = originalIndicator.classList.contains('expertise');
            
            // Determine emoji to use
            let emoji = '⚪'; // Default: not proficient
            let state = 'none';
            
            if (hasExpertise) {
                emoji = '⭐'; // Star for expertise
                state = 'expertise';
            } else if (isProficient) {
                emoji = '✅'; // Check for proficient
                state = 'proficient';
            }
            
            // Create emoji indicator
            const emojiIndicator = document.createElement('span');
            emojiIndicator.className = 'emoji-indicator';
            emojiIndicator.textContent = emoji;
            emojiIndicator.style.cursor = 'pointer';
            emojiIndicator.style.marginRight = '8px';
            emojiIndicator.style.fontSize = '16px';
            
            // Store state
            emojiIndicator.dataset.state = state;
            emojiIndicator.dataset.ability = ability;
            emojiIndicator.dataset.skillName = skillName;
            
            // Add click handler
            emojiIndicator.addEventListener('click', function(event) {
                toggleSkillProficiency(characterId, emojiIndicator, skillItem);
                event.stopPropagation();
            });
            
            // Replace the original
            originalIndicator.parentNode.replaceChild(emojiIndicator, originalIndicator);
            console.log(`Replaced ${skillName} skill indicator with emoji: ${emoji}`);
        }
    });
}

function toggleSavingThrowProficiency(characterId, indicator) {
    // Get current state
    const isProficient = indicator.dataset.proficient === 'true';
    const ability = indicator.dataset.ability;
    
    console.log(`Toggling ${ability} save proficiency: ${isProficient ? 'ON → OFF' : 'OFF → ON'}`);
    
    // Toggle state
    indicator.dataset.proficient = isProficient ? 'false' : 'true';
    
    // Update emoji
    indicator.textContent = isProficient ? '⚪' : '✅';
    
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
    
    // Update the save value
    const saveValueElement = indicator.closest('.d5e-save-item').querySelector('.d5e-save-value');
    if (saveValueElement) {
        // Calculate new save value
        let saveValue = modValue;
        if (!isProficient) { // Now proficient (we toggled already)
            saveValue += profBonus;
        }
        
        // Format with + sign
        const saveText = saveValue >= 0 ? `+${saveValue}` : saveValue.toString();
        saveValueElement.textContent = saveText;
        
        console.log(`Updated ${ability} save value to ${saveText}`);
    }
    
    // Save to server
    saveProficiencyState(characterId, `${ability}_save_proficiency`, !isProficient);
}

function toggleSkillProficiency(characterId, indicator, skillItem) {
    // Get current state
    const currentState = indicator.dataset.state;
    const ability = indicator.dataset.ability;
    const skillName = indicator.dataset.skillName;
    
    // Determine next state (cycle through: none → proficient → expertise → none)
    let nextState;
    let nextEmoji;
    
    if (currentState === 'none') {
        nextState = 'proficient';
        nextEmoji = '✅';
        console.log(`${skillName}: NONE → PROFICIENT`);
    } else if (currentState === 'proficient') {
        nextState = 'expertise';
        nextEmoji = '⭐';
        console.log(`${skillName}: PROFICIENT → EXPERTISE`);
    } else { // expertise
        nextState = 'none';
        nextEmoji = '⚪';
        console.log(`${skillName}: EXPERTISE → NONE`);
    }
    
    // Update indicator
    indicator.dataset.state = nextState;
    indicator.textContent = nextEmoji;
    
    // Get ability modifier
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
    
    // Update skill value
    const skillValueElement = skillItem.querySelector('.d5e-skill-value');
    if (skillValueElement) {
        // Calculate new skill bonus
        let skillBonus = modValue;
        if (nextState === 'proficient') {
            skillBonus += profBonus;
        } else if (nextState === 'expertise') {
            skillBonus += (profBonus * 2);
        }
        
        // Format with + sign
        const skillText = skillBonus >= 0 ? `+${skillBonus}` : skillBonus.toString();
        skillValueElement.textContent = skillText;
        
        console.log(`Updated ${skillName} skill value to ${skillText}`);
    }
    
    // Save to server
    saveSkillProficiency(characterId, skillName, nextState);
}

function saveProficiencyState(characterId, field, isEnabled) {
    console.log(`Saving ${field} to server: ${isEnabled ? 'Proficient' : 'Not Proficient'}`);
    
    fetch(`/characters/${characterId}/field`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            field: field,
            value: isEnabled ? 'Proficient' : 'Not Proficient'
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save proficiency state');
        return response.json();
    })
    .then(data => {
        console.log(`Successfully saved ${field} proficiency state`);
    })
    .catch(error => {
        console.error('Save error:', error);
    });
}

function saveSkillProficiency(characterId, skillName, state) {
    console.log(`Saving ${skillName} skill state to server: ${state}`);
    
    fetch(`/characters/${characterId}/field`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            field: `skill_${skillName.toLowerCase().replace(/\s+/g, '_')}`,
            value: state === 'none' ? 'Not Proficient' : 
                  state === 'proficient' ? 'Proficient' : 'Expertise'
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save skill proficiency');
        return response.json();
    })
    .then(data => {
        console.log(`Successfully saved ${skillName} skill state`);
    })
    .catch(error => {
        console.error('Save error:', error);
    });
}

// Continue with the ability score editing functions
function makeAbilityScoreEditable(ability, characterId) {
    // Find the ability score element directly using its ID
    const scoreElement = document.getElementById(`${ability}-score`);
    if (scoreElement) {
        console.log(`Found ${ability} score element:`, scoreElement.textContent);
        
        // Add editable styling
        scoreElement.className = 'editable-field';
        
        // Add click handler
        scoreElement.addEventListener('click', function() {
            startEditing(scoreElement, `${ability}_score`, characterId, function(element, newValue) {
                // Update the modifier after saving
                updateAbilityModifier(ability, newValue);
            });
        });
    } else {
        console.warn(`Could not find element with ID ${ability}-score`);
    }
}

function startEditing(element, fieldName, characterId, callback) {
    const originalValue = element.textContent;
    
    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalValue;
    input.className = 'inline-edit-input';
    
    // Replace content with input
    element.textContent = '';
    element.appendChild(input);
    
    // Focus input
    input.focus();
    input.select();
    
    // Handle input events
    input.addEventListener('blur', function() {
        saveEdit(element, input.value, fieldName, characterId, originalValue, callback);
    });
    
    input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            saveEdit(element, input.value, fieldName, characterId, originalValue, callback);
            event.preventDefault();
        } else if (event.key === 'Escape') {
            element.textContent = originalValue;
            event.preventDefault();
        }
    });
}

function saveEdit(element, newValue, fieldName, characterId, originalValue, callback) {
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
        if (!response.ok) throw new Error('Failed to save');
        return response.json();
    })
    .then(data => {
        // Update save indicator to show success
        saveIndicator.className = 'save-indicator success';
        saveIndicator.textContent = '✅'; // Checkmark emoji
        
        setTimeout(() => {
            element.removeChild(saveIndicator);
        }, 2000);
        
        // Run callback if provided (e.g., to update modifier)
        if (callback) callback(element, newValue);
    })
    .catch(error => {
        console.error('Save error:', error);
        
        // Show error indicator
        saveIndicator.className = 'save-indicator error';
        saveIndicator.textContent = '❌'; // X emoji
        
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
    // Format with + sign for positive modifiers
    const modText = mod >= 0 ? `+${mod}` : mod.toString();
    
    // Find the modifier element and update it
    const modElement = document.getElementById(`${ability}-mod`);
    if (modElement) {
        modElement.textContent = modText;
    } else {
        console.warn(`Could not find modifier element for ${ability}`);
    }
    
    // Update saving throws and skills
    updateSavesAndSkillsForAbility(ability, mod);
}

function updateSavesAndSkillsForAbility(ability, modValue) {
    // Update saving throws
    const saveItems = document.querySelectorAll('.d5e-save-item');
    saveItems.forEach(saveItem => {
        const saveNameEl = saveItem.querySelector('.d5e-save-name');
        if (saveNameEl && saveNameEl.textContent === ability.toUpperCase()) {
            // Find the emoji indicator
            const emojiIndicator = saveItem.querySelector('.emoji-indicator');
            if (emojiIndicator) {
                const isProficient = emojiIndicator.dataset.proficient === 'true';
                
                // Get proficiency bonus
                let profBonus = 2; // Default
                const profBonusElement = document.getElementById('proficiency-bonus');
                if (profBonusElement) {
                    const match = profBonusElement.textContent.match(/([+-]?\d+)/);
                    if (match) profBonus = parseInt(match[1]);
                }
                
                // Calculate new save value
                let saveValue = modValue;
                if (isProficient) saveValue += profBonus;
                
                // Update the save value display
                const saveValueEl = saveItem.querySelector('.d5e-save-value');
                if (saveValueEl) {
                    const saveText = saveValue >= 0 ? `+${saveValue}` : saveValue.toString();
                    saveValueEl.textContent = saveText;
                }
            }
        }
    });
    
    // Update skills
    const skillItems = document.querySelectorAll('.d5e-skill-item');
    skillItems.forEach(skillItem => {
        const skillAbilityEl = skillItem.querySelector('.d5e-skill-ability');
        if (skillAbilityEl && skillAbilityEl.textContent === ability.toUpperCase()) {
            // Find the emoji indicator
            const emojiIndicator = skillItem.querySelector('.emoji-indicator');
            if (emojiIndicator) {
                const state = emojiIndicator.dataset.state;
                
                // Get proficiency bonus
                let profBonus = 2; // Default
                const profBonusElement = document.getElementById('proficiency-bonus');
                if (profBonusElement) {
                    const match = profBonusElement.textContent.match(/([+-]?\d+)/);
                    if (match) profBonus = parseInt(match[1]);
                }
                
                // Calculate new skill value
                let skillValue = modValue;
                if (state === 'proficient') skillValue += profBonus;
                else if (state === 'expertise') skillValue += (profBonus * 2);
                
                // Update the skill value display
                const skillValueEl = skillItem.querySelector('.d5e-skill-value');
                if (skillValueEl) {
                    const skillText = skillValue >= 0 ? `+${skillValue}` : skillValue.toString();
                    skillValueEl.textContent = skillText;
                }
            }
        }
    });
}

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






/**
 * Direct replacement of circular indicators with clickable emojis
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Direct replacement of indicators starting...');
    
    // Get character ID from URL
    const pathParts = window.location.pathname.split('/');
    const characterId = pathParts[pathParts.length - 1];
    
    // First, find all the indicator circles and replace them DIRECTLY in the DOM
    const allCircleInputs = document.querySelectorAll('input[type="radio"]');
    console.log(`Found ${allCircleInputs.length} circle inputs to replace`);
    
    allCircleInputs.forEach(function(circleInput) {
        // Create a simple clickable span with emoji
        const span = document.createElement('span');
        span.innerHTML = '⚪'; // White circle emoji
        span.style.cursor = 'pointer';
        span.style.fontSize = '18px';
        span.style.marginRight = '8px';
        
        // Find the parent element and replace the input
        const parent = circleInput.parentNode;
        if (parent) {
            parent.replaceChild(span, circleInput);
            
            // Add click handler
            span.addEventListener('click', function() {
                // Toggle between empty and filled
                if (span.innerHTML === '⚪') {
                    span.innerHTML = '✅';
                } else if (span.innerHTML === '✅') {
                    span.innerHTML = '⭐';
                } else {
                    span.innerHTML = '⚪';
                }
                
                // Update the value display if possible
                updateNearbyValue(span);
            });
        }
    });
    
    // Also try to find any existing indicators
    document.querySelectorAll('.d5e-prof-indicator').forEach(function(indicator) {
        // Create a simple clickable span with emoji
        const span = document.createElement('span');
        span.innerHTML = '⚪'; // Start with empty circle
        span.style.cursor = 'pointer';
        span.style.fontSize = '18px';
        span.style.marginRight = '8px';
        
        // Replace the indicator
        indicator.parentNode.replaceChild(span, indicator);
        
        // Add click handler
        span.addEventListener('click', function() {
            // Toggle between empty and filled
            if (span.innerHTML === '⚪') {
                span.innerHTML = '✅';
            } else if (span.innerHTML === '✅') {
                span.innerHTML = '⭐';
            } else {
                span.innerHTML = '⚪';
            }
            
            // Update the value display if possible
            updateNearbyValue(span);
        });
    });
    
    console.log('Replacement completed.');
});

// Function to update the value based on emoji state
function updateNearbyValue(span) {
    // Find the closest item container
    const container = span.closest('.d5e-save-item') || span.closest('.d5e-skill-item');
    if (!container) return;
    
    // Find the value element
    const valueElement = container.querySelector('.d5e-save-value') || container.querySelector('.d5e-skill-value');
    if (!valueElement) return;
    
    // Find the ability element to get the ability modifier
    const abilityElement = container.querySelector('.d5e-save-name') || container.querySelector('.d5e-skill-ability');
    if (!abilityElement) return;
    
    // Get ability name (STR, DEX, etc.) and convert to lowercase
    const ability = abilityElement.textContent.toLowerCase();
    
    // Find the corresponding ability modifier
    const modElement = document.getElementById(`${ability}-mod`);
    if (!modElement) return;
    
    // Extract the modifier value
    const modText = modElement.textContent;
    const modMatch = modText.match(/([+-]?\d+)/);
    if (!modMatch) return;
    const modValue = parseInt(modMatch[1]);
    
    // Get proficiency bonus
    let profBonus = 2; // Default
    const profBonusElement = document.getElementById('proficiency-bonus');
    if (profBonusElement) {
        const bonusMatch = profBonusElement.textContent.match(/([+-]?\d+)/);
        if (bonusMatch) profBonus = parseInt(bonusMatch[1]);
    }
    
    // Calculate new value based on emoji
    let newValue = modValue;
    if (span.innerHTML === '✅') {
        // Proficient
        newValue += profBonus;
    } else if (span.innerHTML === '⭐') {
        // Expertise (double proficiency)
        newValue += (profBonus * 2);
    }
    
    // Format with + sign if positive
    const newText = newValue >= 0 ? `+${newValue}` : newValue.toString();
    valueElement.textContent = newText;
}