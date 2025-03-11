/**
 * Improved inline editing for D&D character sheets - vanilla JS
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing enhanced inline editing...');
    
    // Get character ID from URL
    const pathParts = window.location.pathname.split('/');
    const characterId = pathParts[pathParts.length - 1];
    console.log('Character ID:', characterId);
    
    // Add edit mode notification banner
    const banner = document.createElement('div');
    banner.style.backgroundColor = '#e9f5ff';
    banner.style.padding = '10px';
    banner.style.marginBottom = '15px';
    banner.style.borderRadius = '4px';
    banner.innerHTML = '<strong>✏️ Editing Mode:</strong> Click on highlighted fields to edit';
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Make text fields editable (Species, Background, Alignment)
    findAndMakeEditable('Species', characterId);
    findAndMakeEditable('Background', characterId, true); // has [brackets]
    findAndMakeEditable('Alignment', characterId, true);  // has [brackets]
    
    // Make ability scores editable with modifier updates
    makeAbilityScoreEditable('str', characterId);
    makeAbilityScoreEditable('dex', characterId);
    makeAbilityScoreEditable('con', characterId);
    makeAbilityScoreEditable('int', characterId);
    makeAbilityScoreEditable('wis', characterId);
    makeAbilityScoreEditable('cha', characterId);
    
    // Make saving throw proficiency indicators clickable
    makeAllSavingThrowsToggleable(characterId);
    
    // Make skill proficiency indicators clickable (with three states)
    makeAllSkillsToggleable(characterId);
});

function findAndMakeEditable(label, characterId, hasBrackets = false) {
    // Simple approach: find all text nodes
    const allTextNodes = [];
    const walker = document.createTreeWalker(
        document.body, 
        NodeFilter.SHOW_TEXT,
        null
    );
    
    let node;
    while (node = walker.nextNode()) {
        if (node.textContent.trim() && 
            node.parentNode.tagName !== 'SCRIPT' && 
            node.parentNode.tagName !== 'STYLE') {
            allTextNodes.push(node);
        }
    }
    
    // Find the label node
    for (let i = 0; i < allTextNodes.length; i++) {
        const node = allTextNodes[i];
        const text = node.textContent.trim();
        
        if (text.startsWith(label)) {
            console.log(`Found ${label}: ${text}`);
            
            if (hasBrackets) {
                // For bracketed content like "Background [Acolyte]"
                const match = text.match(/\[(.*?)\]/);
                if (match) {
                    // Create wrapper with separate spans
                    const wrapper = document.createElement('span');
                    const labelPart = document.createTextNode(text.split('[')[0] + '[');
                    const valuePart = document.createElement('span');
                    valuePart.textContent = match[1];
                    valuePart.className = 'editable-field';
                    
                    const endBracket = document.createTextNode(']');
                    
                    wrapper.appendChild(labelPart);
                    wrapper.appendChild(valuePart);
                    wrapper.appendChild(endBracket);
                    
                    // Replace original node
                    node.parentNode.replaceChild(wrapper, node);
                    
                    // Add click handler
                    valuePart.addEventListener('click', function() {
                        startEditing(valuePart, fieldNameFromLabel(label), characterId);
                    });
                }
            } else {
                // For simple content like "Species Human"
                // If we find a value after the label
                if (i + 1 < allTextNodes.length) {
                    const valueNode = allTextNodes[i + 1];
                    const valueText = valueNode.textContent.trim();
                    
                    if (valueText && !valueText.startsWith(label)) {
                        console.log(`  Value: ${valueText}`);
                        
                        // Wrap value in editable span
                        const valueSpan = document.createElement('span');
                        valueSpan.textContent = valueText;
                        valueSpan.className = 'editable-field';
                        
                        // Replace original value node
                        valueNode.parentNode.replaceChild(valueSpan, valueNode);
                        
                        // Add click handler
                        valueSpan.addEventListener('click', function() {
                            startEditing(valueSpan, fieldNameFromLabel(label), characterId);
                        });
                    }
                }
            }
        }
    }
}

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
    saveIndicator.innerHTML = '<i class="bi bi-hourglass"></i>';
    
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
        saveIndicator.innerHTML = '<i class="bi bi-check-circle"></i>';
        
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
        saveIndicator.innerHTML = '<i class="bi bi-exclamation-circle"></i>';
        
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
    const modValue = mod; // Numeric value for calculations
    
    // Find the modifier element and update it
    const modElement = document.getElementById(`${ability}-mod`);
    if (modElement) {
        modElement.textContent = modText;
    } else {
        console.warn(`Could not find modifier element for ${ability}`);
    }
    
    // Get proficiency bonus from the page
    let profBonus = 2; // Default to +2 if not found
    const profBonusElement = document.getElementById('proficiency-bonus');
    if (profBonusElement) {
        const profBonusText = profBonusElement.textContent;
        const profBonusMatch = profBonusText.match(/\+(\d+)/);
        if (profBonusMatch) {
            profBonus = parseInt(profBonusMatch[1]);
        }
    }
    
    // Update the corresponding saving throw
    updateSavingThrow(ability, modValue, profBonus);
    
    // Update all skills that use this ability
    updateSkillsForAbility(ability, modValue, profBonus);
}

function updateSavingThrow(ability, modValue, profBonus) {
    // Find the saving throw container
    const savingThrowsContainer = document.getElementById('saving-throws');
    if (!savingThrowsContainer) return;
    
    // Find the specific saving throw for this ability
    const saveItems = savingThrowsContainer.querySelectorAll('.d5e-save-item');
    saveItems.forEach(saveItem => {
        const saveNameElement = saveItem.querySelector('.d5e-save-name');
        if (saveNameElement && saveNameElement.textContent === ability.toUpperCase()) {
            const isProficient = saveItem.querySelector('.d5e-prof-indicator.proficient') !== null;
            const saveValueElement = saveItem.querySelector('.d5e-save-value');
            
            if (saveValueElement) {
                // Calculate the save bonus: modifier + proficiency bonus if proficient
                let saveBonus = modValue;
                if (isProficient) {
                    saveBonus += profBonus;
                }
                
                // Format with + sign for positive values
                const saveText = saveBonus >= 0 ? `+${saveBonus}` : saveBonus.toString();
                saveValueElement.textContent = saveText;
            }
        }
    });
}

function makeAllSavingThrowsToggleable(characterId) {
    // Find the saving throws container
    const savingThrowsContainer = document.getElementById('saving-throws');
    if (!savingThrowsContainer) return;
    
    // Find all saving throw items
    const saveItems = savingThrowsContainer.querySelectorAll('.d5e-save-item');
    saveItems.forEach(saveItem => {
        const profIndicator = saveItem.querySelector('.d5e-prof-indicator');
        const saveNameElement = saveItem.querySelector('.d5e-save-name');
        
        if (profIndicator && saveNameElement) {
            const ability = saveNameElement.textContent.toLowerCase();
            
            // Add cursor style to show it's clickable
            profIndicator.style.cursor = 'pointer';
            
            // Add click event to toggle proficiency
            profIndicator.addEventListener('click', function() {
                // Toggle between not proficient and proficient
                const isProficient = profIndicator.classList.contains('proficient');
                
                if (isProficient) {
                    // Switch to not proficient
                    profIndicator.classList.remove('proficient');
                } else {
                    // Switch to proficient
                    profIndicator.classList.add('proficient');
                }
                
                // Update the saving throw value
                const modElement = document.getElementById(`${ability}-mod`);
                if (modElement) {
                    const modText = modElement.textContent;
                    const modMatch = modText.match(/([+-]\d+)/);
                    if (modMatch) {
                        const modValue = parseInt(modMatch[1]);
                        
                        // Get proficiency bonus
                        const profBonusElement = document.getElementById('proficiency-bonus');
                        const profBonus = profBonusElement ? parseInt(profBonusElement.textContent.replace('+', '')) : 2;
                        
                        // Update the saving throw display
                        updateSavingThrow(ability, modValue, profBonus);
                        
                        // Save to server
                        saveProficiencyState(characterId, `${ability}_save_proficiency`, !isProficient);
                    }
                }
            });
        }
    });
}

function makeAllSkillsToggleable(characterId) {
    // Find the skills container
    const skillsContainer = document.getElementById('skills');
    if (!skillsContainer) return;
    
    // Find all skill items
    const skillItems = skillsContainer.querySelectorAll('.d5e-skill-item');
    skillItems.forEach(skillItem => {
        const profIndicator = skillItem.querySelector('.d5e-prof-indicator');
        const skillNameElement = skillItem.querySelector('.d5e-skill-name');
        const skillAbilityElement = skillItem.querySelector('.d5e-skill-ability');
        
        if (profIndicator && skillNameElement && skillAbilityElement) {
            const skillName = skillNameElement.textContent.trim();
            const ability = skillAbilityElement.textContent.toLowerCase();
            
            // Add cursor style to show it's clickable
            profIndicator.style.cursor = 'pointer';
            
            // Add click event to cycle through proficiency states
            profIndicator.addEventListener('click', function() {
                // Determine current state
                const isProficient = profIndicator.classList.contains('proficient');
                const hasExpertise = profIndicator.classList.contains('expertise');
                
                // Get the current state
                let newState;
                if (hasExpertise) {
                    // From expertise to not proficient
                    profIndicator.classList.remove('proficient', 'expertise');
                    newState = 'none';
                } else if (isProficient) {
                    // From proficient to expertise
                    profIndicator.classList.add('expertise');
                    newState = 'expertise';
                } else {
                    // From not proficient to proficient
                    profIndicator.classList.add('proficient');
                    newState = 'proficient';
                }
                
                // Update the skill value
                const modElement = document.getElementById(`${ability}-mod`);
                if (modElement) {
                    const modText = modElement.textContent;
                    const modMatch = modText.match(/([+-]\d+)/);
                    if (modMatch) {
                        const modValue = parseInt(modMatch[1]);
                        
                        // Get proficiency bonus
                        const profBonusElement = document.getElementById('proficiency-bonus');
                        const profBonus = profBonusElement ? parseInt(profBonusElement.textContent.replace('+', '')) : 2;
                        
                        // Update the skill display
                        updateSkillsForAbility(ability, modValue, profBonus);
                        
                        // Save to server
                        saveSkillProficiency(characterId, skillName, newState);
                    }
                }
            });
        }
    });
}

function saveProficiencyState(characterId, field, isEnabled) {
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
        console.log(`Saved ${field} proficiency state: ${isEnabled}`);
    })
    .catch(error => {
        console.error('Save error:', error);
    });
}

function saveSkillProficiency(characterId, skillName, state) {
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
        console.log(`Saved skill ${skillName} proficiency state: ${state}`);
    })
    .catch(error => {
        console.error('Save error:', error);
    });
}

function updateSkillsForAbility(ability, modValue, profBonus) {
    // Define which skills use each ability
    const abilitySkillMap = {
        'str': ['Athletics'],
        'dex': ['Acrobatics', 'Sleight of Hand', 'Stealth'],
        'con': [],
        'int': ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'],
        'wis': ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'],
        'cha': ['Deception', 'Intimidation', 'Performance', 'Persuasion']
    };
    
    // Get the skills for this ability
    const skills = abilitySkillMap[ability] || [];
    if (skills.length === 0) return;
    
    // Find the skills container
    const skillsContainer = document.getElementById('skills');
    if (!skillsContainer) return;
    
    // Find and update each skill that uses this ability
    const skillItems = skillsContainer.querySelectorAll('.d5e-skill-item');
    skillItems.forEach(skillItem => {
        const skillNameElement = skillItem.querySelector('.d5e-skill-name');
        const skillAbilityElement = skillItem.querySelector('.d5e-skill-ability');
        
        // Check if this skill uses the ability we're updating
        if (skillNameElement && 
            skillAbilityElement && 
            skillAbilityElement.textContent === ability.toUpperCase()) {
            
            // Determine proficiency status
            const isProficient = skillItem.querySelector('.d5e-prof-indicator.proficient') !== null;
            const hasExpertise = skillItem.querySelector('.d5e-prof-indicator.expertise') !== null;
            const skillValueElement = skillItem.querySelector('.d5e-skill-value');
            
            if (skillValueElement) {
                // Calculate the skill bonus
                let skillBonus = modValue;
                if (isProficient) {
                    skillBonus += profBonus;
                }
                if (hasExpertise) {
                    skillBonus += profBonus; // Add proficiency bonus again for expertise
                }
                
                // Format with + sign for positive values
                const skillText = skillBonus >= 0 ? `+${skillBonus}` : skillBonus.toString();
                skillValueElement.textContent = skillText;
            }
        }
    });
}

function fieldNameFromLabel(label) {
    return label.toLowerCase();
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