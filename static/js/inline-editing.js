/**
 * Enhanced emoji-based proficiency indicators for D&D character sheets
 * Includes robust error handling and debugging
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Character sheet JS initializing...');
    
    // Get character ID from URL
    const pathParts = window.location.pathname.split('/');
    const characterId = pathParts[pathParts.length - 1];
    console.log('📝 Character ID:', characterId);
    
    // Checking DOM structure for debugging
    console.log('🔍 Checking for save items:', document.querySelectorAll('.d5e-save-item').length);
    console.log('🔍 Checking for skill items:', document.querySelectorAll('.d5e-skill-item').length);
    
    // First step: make ability scores editable
    makeAbilityScoresEditable(characterId);
    
    // Second step: add emoji indicators with fallback
    initializeProficiencyIndicators(characterId);
    
    // Third step: initialize death save indicators
    initializeDeathSaveIndicators(characterId);
});

function makeAbilityScoresEditable(characterId) {
    // Make each ability score editable
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
        const scoreElement = document.getElementById(`${ability}-score`);
        if (scoreElement) {
            console.log(`✏️ Making ${ability} score editable`);
            
            // Add editable styling
            scoreElement.classList.add('editable-field');
            
            // Add click handler
            scoreElement.addEventListener('click', function() {
                startEditingField(scoreElement, `${ability}_score`, characterId, function(element, newValue) {
                    // Update the modifier after saving
                    updateAbilityModifier(ability, newValue);
                });
            });
        } else {
            console.warn(`⚠️ Could not find ability score element for ${ability}`);
        }
    });
}

function initializeProficiencyIndicators(characterId) {
    console.log('🎯 Initializing proficiency indicators...');
    
    // First check if we have any saving throws or skills
    const saveItems = document.querySelectorAll('.d5e-save-item');
    const skillItems = document.querySelectorAll('.d5e-skill-item');
    
    if (saveItems.length === 0 && skillItems.length === 0) {
        console.warn('⚠️ No save items or skill items found in the DOM. Using fallback method.');
        
        // Use a timeout to ensure the DOM is fully loaded
        setTimeout(() => {
            console.log('🔄 Attempting fallback initialization...');
            createSavingThrowsIfNeeded();
            createSkillsIfNeeded();
            
            // Try again after creating elements
            addEmojiIndicators(characterId);
        }, 500);
    } else {
        // Proceed with normal initialization
        addEmojiIndicators(characterId);
    }
}

function initializeDeathSaveIndicators(characterId) {
    console.log('🎲 Initializing death save indicators...');
    
    // Get death save rows
    const successRow = document.querySelector('.d5e-death-save-row:nth-child(1)');
    const failureRow = document.querySelector('.d5e-death-save-row:nth-child(2)');
    
    if (!successRow || !failureRow) {
        console.warn('⚠️ Death save rows not found');
        return;
    }
    
    // Clear and recreate the boxes containers
    const successBoxes = successRow.querySelector('.d5e-death-save-boxes');
    const failureBoxes = failureRow.querySelector('.d5e-death-save-boxes');
    
    if (successBoxes && failureBoxes) {
        // Clear existing content
        successBoxes.innerHTML = '';
        failureBoxes.innerHTML = '';
        
        // Create success emoji indicators (hearts)
        for (let i = 0; i < 3; i++) {
            const indicator = document.createElement('span');
            indicator.className = 'emoji-indicator death-save-indicator';
            indicator.textContent = '⚪'; // Start with empty circle
            indicator.dataset.index = i;
            indicator.dataset.type = 'success';
            indicator.dataset.active = 'false';
            indicator.dataset.activeEmoji = '❤️'; // Heart for success
            indicator.dataset.inactiveEmoji = '⚪';
            
            // Add click handler
            indicator.addEventListener('click', function() {
                toggleDeathSave(indicator, characterId);
            });
            
            successBoxes.appendChild(indicator);
        }
        
        // Create failure emoji indicators (skulls)
        for (let i = 0; i < 3; i++) {
            const indicator = document.createElement('span');
            indicator.className = 'emoji-indicator death-save-indicator';
            indicator.textContent = '⚪'; // Start with empty circle
            indicator.dataset.index = i;
            indicator.dataset.type = 'failure';
            indicator.dataset.active = 'false';
            indicator.dataset.activeEmoji = '💀'; // Skull for failure
            indicator.dataset.inactiveEmoji = '⚪';
            
            // Add click handler
            indicator.addEventListener('click', function() {
                toggleDeathSave(indicator, characterId);
            });
            
            failureBoxes.appendChild(indicator);
        }
        
        console.log('✅ Death save indicators initialized successfully');
    } else {
        console.warn('⚠️ Death save boxes containers not found');
    }
}

function createSavingThrowsIfNeeded() {
    const savingThrowsContainer = document.getElementById('saving-throws');
    if (!savingThrowsContainer) {
        console.warn('⚠️ No saving throws container found');
        return;
    }
    
    if (savingThrowsContainer.children.length === 0) {
        console.log('🔧 Creating saving throw elements...');
        const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        
        abilities.forEach(ability => {
            const saveItem = document.createElement('div');
            saveItem.className = 'd5e-save-item';
            saveItem.innerHTML = `
                <div class="d5e-prof-indicator"></div>
                <div class="d5e-save-name">${ability.toUpperCase()}</div>
                <div class="d5e-save-value">-5</div>
            `;
            savingThrowsContainer.appendChild(saveItem);
        });
        
        console.log('✅ Created saving throw elements:', savingThrowsContainer.children.length);
    }
}

function createSkillsIfNeeded() {
    const skillsContainer = document.getElementById('skills');
    if (!skillsContainer) {
        console.warn('⚠️ No skills container found');
        return;
    }
    
    if (skillsContainer.children.length === 0) {
        console.log('🔧 Creating skill elements...');
        const skills = [
            {name: 'Acrobatics', ability: 'dex'},
            {name: 'Animal Handling', ability: 'wis'},
            {name: 'Arcana', ability: 'int'},
            {name: 'Athletics', ability: 'str'},
            {name: 'Deception', ability: 'cha'},
            {name: 'History', ability: 'int'},
            {name: 'Insight', ability: 'wis'},
            {name: 'Intimidation', ability: 'cha'},
            {name: 'Investigation', ability: 'int'},
            {name: 'Medicine', ability: 'wis'},
            {name: 'Nature', ability: 'int'},
            {name: 'Perception', ability: 'wis'},
            {name: 'Performance', ability: 'cha'},
            {name: 'Persuasion', ability: 'cha'},
            {name: 'Religion', ability: 'int'},
            {name: 'Sleight of Hand', ability: 'dex'},
            {name: 'Stealth', ability: 'dex'},
            {name: 'Survival', ability: 'wis'}
        ];
        
        skills.forEach(skill => {
            const skillItem = document.createElement('div');
            skillItem.className = 'd5e-skill-item';
            skillItem.innerHTML = `
                <div class="d5e-prof-indicator"></div>
                <div class="d5e-skill-ability">${skill.ability.toUpperCase()}</div>
                <div class="d5e-skill-name">${skill.name}</div>
                <div class="d5e-skill-value">-5</div>
            `;
            skillsContainer.appendChild(skillItem);
        });
        
        console.log('✅ Created skill elements:', skillsContainer.children.length);
    }
}

function toggleDeathSave(indicator, characterId) {
    // Get current state
    const isActive = indicator.dataset.active === 'true';
    const type = indicator.dataset.type;
    const index = parseInt(indicator.dataset.index);
    
    // Toggle state
    indicator.dataset.active = isActive ? 'false' : 'true';
    
    // Update emoji display
    indicator.textContent = isActive ? indicator.dataset.inactiveEmoji : indicator.dataset.activeEmoji;
    
    console.log(`🔄 Toggling ${type} death save #${index + 1}: ${isActive ? 'OFF' : 'ON'}`);
    
    // Add visual indicator that the change is being applied
    indicator.classList.add('changed');
    setTimeout(() => {
        indicator.classList.remove('changed');
    }, 500);
    
    // Save to server
    saveDeathSaveToServer(characterId, type, index, !isActive);
}

function saveDeathSaveToServer(characterId, type, index, isActive) {
    console.log(`💾 Saving death save ${type} #${index + 1} state: ${isActive}`);
    
    // Format field name for the server
    const fieldName = `death_save_${type}_${index + 1}`;
    const value = isActive ? 'marked' : 'unmarked';
    
    fetch(`/characters/${characterId}/field`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            field: fieldName,
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
        console.log(`✅ Successfully saved ${fieldName} to server:`, data);
    })
    .catch(error => {
        console.error(`❌ Error saving death save: ${error}`);
        // Revert the UI on error
        const indicator = document.querySelector(`.death-save-indicator[data-type="${type}"][data-index="${index}"]`);
        if (indicator) {
            const currentState = indicator.dataset.active === 'true';
            indicator.dataset.active = currentState ? 'false' : 'true';
            indicator.textContent = currentState ? indicator.dataset.inactiveEmoji : indicator.dataset.activeEmoji;
        }
    });
}

function addEmojiIndicators(characterId) {
    console.log('🎭 Adding emoji indicators to saving throws and skills...');
    
    // Add to saving throw items
    const saveItems = document.querySelectorAll('.d5e-save-item');
    console.log(`🔍 Found ${saveItems.length} saving throw items`);
    
    saveItems.forEach(saveItem => {
        // Check if an emoji indicator already exists to avoid duplicates
        if (saveItem.querySelector('.emoji-indicator')) {
            return;
        }
        
        const nameElement = saveItem.querySelector('.d5e-save-name');
        if (!nameElement) {
            console.warn('⚠️ Save item missing name element:', saveItem);
            return;
        }
        
        const ability = nameElement.textContent.toLowerCase();
        
        // Check if proficient by looking for the 'proficient' class on the (hidden) indicator
        const hiddenIndicator = saveItem.querySelector('.d5e-prof-indicator');
        const isProficient = hiddenIndicator ? hiddenIndicator.classList.contains('proficient') : false;
        
        // Create emoji indicator
        const emojiIndicator = document.createElement('span');
        emojiIndicator.className = 'emoji-indicator';
        emojiIndicator.textContent = isProficient ? '✅' : '⚪';
        emojiIndicator.dataset.ability = ability;
        emojiIndicator.dataset.proficient = isProficient ? 'true' : 'false';
        
        // Add click handler
        emojiIndicator.addEventListener('click', function() {
            toggleSavingThrowProficiency(characterId, emojiIndicator, saveItem);
        });
        
        // Insert at the beginning of the item
        saveItem.insertBefore(emojiIndicator, saveItem.firstChild);
        console.log(`✅ Added ${ability} save indicator emoji`);
    });
    
    // Add to skill items
    const skillItems = document.querySelectorAll('.d5e-skill-item');
    console.log(`🔍 Found ${skillItems.length} skill items`);
    
    skillItems.forEach(skillItem => {
        // Check if an emoji indicator already exists to avoid duplicates
        if (skillItem.querySelector('.emoji-indicator')) {
            return;
        }
        
        const nameElement = skillItem.querySelector('.d5e-skill-name');
        const abilityElement = skillItem.querySelector('.d5e-skill-ability');
        
        if (!nameElement || !abilityElement) {
            console.warn('⚠️ Skill item missing name or ability element:', skillItem);
            return;
        }
        
        const skillName = nameElement.textContent.trim();
        const ability = abilityElement.textContent.toLowerCase();
        
        // Check for proficiency/expertise in the hidden indicator
        const hiddenIndicator = skillItem.querySelector('.d5e-prof-indicator');
        const isProficient = hiddenIndicator ? hiddenIndicator.classList.contains('proficient') : false;
        const hasExpertise = hiddenIndicator ? hiddenIndicator.classList.contains('expertise') : false;
        
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
        emojiIndicator.dataset.ability = ability;
        emojiIndicator.dataset.skillName = skillName;
        emojiIndicator.dataset.state = state;
        
        // Add click handler
        emojiIndicator.addEventListener('click', function() {
            toggleSkillProficiency(characterId, emojiIndicator, skillItem);
        });
        
        // Insert at the beginning of the item
        skillItem.insertBefore(emojiIndicator, skillItem.firstChild);
        console.log(`✅ Added ${skillName} skill indicator emoji`);
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
    
    console.log(`🔄 Toggling ${ability} save proficiency: ${isProficient ? 'OFF' : 'ON'}`);
    
    // Add a visual indicator that the change is being applied
    indicator.classList.add('changed');
    setTimeout(() => {
        indicator.classList.remove('changed');
    }, 500);
    
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
    
    console.log(`🔄 Toggling ${skillName} proficiency: ${currentState} → ${nextState}`);
    
    // Update indicator
    indicator.dataset.state = nextState;
    indicator.textContent = nextEmoji;
    
    // Add a visual indicator that the change is being applied
    indicator.classList.add('changed');
    setTimeout(() => {
        indicator.classList.remove('changed');
    }, 500);
    
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
        
        // Add color classes
        valueElement.classList.remove('positive', 'negative', 'neutral');
        if (saveValue > 0) {
            valueElement.classList.add('positive');
        } else if (saveValue < 0) {
            valueElement.classList.add('negative');
        } else {
            valueElement.classList.add('neutral');
        }
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
        
        // Add color classes
        valueElement.classList.remove('positive', 'negative', 'neutral');
        if (skillValue > 0) {
            valueElement.classList.add('positive');
        } else if (skillValue < 0) {
            valueElement.classList.add('negative');
        } else {
            valueElement.classList.add('neutral');
        }
    }
}

function saveProficiencyToServer(characterId, field, value) {
    console.log(`💾 Saving ${field} as ${value} to server`);
    
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
        console.log(`✅ Successfully saved ${field} to server:`, data);
    })
    .catch(error => {
        console.error('❌ Error saving proficiency:', error);
    });
}

function saveSkillToServer(characterId, skillName, state) {
    console.log(`💾 Saving ${skillName} as ${state} to server`);
    
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
        console.log(`✅ Successfully saved ${skillName} to server:`, data);
    })
    .catch(error => {
        console.error('❌ Error saving skill:', error);
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