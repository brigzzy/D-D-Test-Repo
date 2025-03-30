// character-form.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('characterForm');
    if (!form) return;
    
    const characterId = window.location.pathname.split('/').pop();
    
    // Initialize all fields
    const editableFields = document.querySelectorAll('.editable-field');
    
    // Make fields editable on click
    editableFields.forEach(field => {
        field.addEventListener('click', function() {
            if (field.readOnly) {
                field.readOnly = false;
                field.focus();
            }
        });
        
        field.addEventListener('blur', function() {
            if (!field.readOnly) {
                saveField(field.dataset.field, field.value);
                field.readOnly = true;
                
                // Update ability modifiers if this is an ability score
                if (field.classList.contains('ability-score')) {
                    updateAbilityModifier(field);
                    updateSkillModifiers(); // Update skills that depend on this ability
                }
            }
        });
        
        // Save on Enter key for text inputs (not for textareas)
        if (field.tagName !== 'TEXTAREA') {
            field.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission
                    field.blur();
                }
            });
        }
    });
    
    // Initialize skills
    initializeSkills();
    
    // Function to initialize skills
    function initializeSkills() {
        const skillsContainer = document.getElementById('skillsContainer');
        const skillsInput = document.getElementById('skills');
        const customSkillsInput = document.getElementById('customSkills');
        
        if (!skillsContainer || !skillsInput) return;
        
        // Get all skills and sort them alphabetically
        renderSortedSkills();
        
        // Toggle skill proficiency
        skillsContainer.addEventListener('change', function(e) {
            if (e.target.classList.contains('skill-proficient')) {
                const isCustom = e.target.dataset.custom === 'true';
                const index = parseInt(e.target.dataset.index);
                
                let skills = JSON.parse(isCustom ? customSkillsInput.value : skillsInput.value);
                skills[index].proficient = e.target.checked;
                
                const inputToUpdate = isCustom ? customSkillsInput : skillsInput;
                inputToUpdate.value = JSON.stringify(skills);
                
                saveField(isCustom ? 'customSkills' : 'skills', inputToUpdate.value);
                
                // Update the display
                renderSortedSkills();
            }
        });
        
        // Add custom skill
        const addSkillBtn = document.getElementById('addSkillBtn');
        if (addSkillBtn) {
            addSkillBtn.addEventListener('click', function() {
                const customSkills = JSON.parse(customSkillsInput.value || '[]');
                const newSkill = {
                    name: 'New Skill',
                    ability: 'dexterity',
                    proficient: false
                };
                
                customSkills.push(newSkill);
                customSkillsInput.value = JSON.stringify(customSkills);
                saveField('customSkills', customSkillsInput.value);
                
                renderSortedSkills();
            });
        }
    }
    
    // Function to enter edit mode for a custom skill
    function enterEditMode(skillItem, index) {
        // Already in edit mode?
        if (skillItem.classList.contains('editing')) return;
        
        // Get custom skills
        const customSkillsInput = document.getElementById('customSkills');
        const customSkills = JSON.parse(customSkillsInput.value || '[]');
        
        // Add editing class
        skillItem.classList.add('editing');
        
        // Get existing elements
        const nameSpan = skillItem.querySelector('.skill-name');
        const abilitySpan = skillItem.querySelector('.skill-ability');
        
        // Get current values
        const currentName = nameSpan.textContent;
        const currentAbility = customSkills[index].ability || 'dexterity';
        
        // Create input for name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'custom-skill-name-edit';
        nameInput.value = currentName;
        
        // Create select for ability
        const abilitySelect = document.createElement('select');
        abilitySelect.className = 'custom-skill-ability-edit';
        
        // Add ability options
        ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(ability => {
            const option = document.createElement('option');
            option.value = ability;
            option.textContent = ability.charAt(0).toUpperCase();
            if (ability === currentAbility) {
                option.selected = true;
            }
            abilitySelect.appendChild(option);
        });
        
        // Create container for edit controls
        const editContainer = document.createElement('div');
        editContainer.className = 'edit-container';
        editContainer.appendChild(nameInput);
        editContainer.appendChild(abilitySelect);
        
        // Replace spans with edit container
        nameSpan.replaceWith(editContainer);
        abilitySpan.style.display = 'none';
        
        // Show delete button
        const deleteBtn = skillItem.querySelector('.remove-skill-btn');
        if (deleteBtn) {
            deleteBtn.style.display = 'block';
        }
        
        // Focus on name input
        nameInput.focus();
        
        // Track edit state
        let isEditing = true;
        
        // Function to save changes
        function saveChanges() {
            if (!isEditing) return;
            isEditing = false;
            
            const customSkills = JSON.parse(customSkillsInput.value || '[]');
            customSkills[index].name = nameInput.value;
            customSkills[index].ability = abilitySelect.value;
            customSkillsInput.value = JSON.stringify(customSkills);
            saveField('customSkills', customSkillsInput.value);
            
            // Re-render skills
            renderSortedSkills();
        }
        
        // Handle input blur
        nameInput.addEventListener('blur', function(e) {
            // Don't save if focus is moving to the ability select
            if (e.relatedTarget !== abilitySelect) {
                saveChanges();
            }
        });
        
        // Handle select blur
        abilitySelect.addEventListener('blur', function(e) {
            // Don't save if focus is moving to the name input
            if (e.relatedTarget !== nameInput) {
                saveChanges();
            }
        });
        
        // Handle enter key
        nameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                saveChanges();
            }
        });
    }
    
    // Render skills sorted alphabetically
    function renderSortedSkills() {
        const skillsContainer = document.getElementById('skillsContainer');
        const skillsInput = document.getElementById('skills');
        const customSkillsInput = document.getElementById('customSkills');
        const proficiencyBonus = parseInt(document.getElementById('proficiencyBonus').textContent.replace('+', '')) || 2;
        
        // Get abilities for modifier calculations
        const abilities = {};
        document.querySelectorAll('.ability-card').forEach(card => {
            const input = card.querySelector('input');
            if (input && input.name) {
                abilities[input.name] = parseInt(input.value) || 10;
            }
        });
        
        const skills = JSON.parse(skillsInput.value || '[]');
        const customSkills = JSON.parse(customSkillsInput.value || '[]');
        
        // Combine standard and custom skills with source info
        const allSkills = [
            ...skills.map((skill, index) => ({ ...skill, isCustom: false, index })),
            ...customSkills.map((skill, index) => ({ ...skill, isCustom: true, index }))
        ];
        
        // Sort alphabetically by name
        allSkills.sort((a, b) => a.name.localeCompare(b.name));
        
        // Clear container
        skillsContainer.innerHTML = '';
        
        // Add skills to container
        allSkills.forEach(skill => {
            const abilityMod = Math.floor((abilities[skill.ability] - 10) / 2);
            const modifier = abilityMod + (skill.proficient ? proficiencyBonus : 0);
            
            const skillItem = document.createElement('div');
            skillItem.className = 'skill-item';
            if (skill.isCustom) skillItem.classList.add('custom-skill');
            skillItem.dataset.index = skill.index;
            skillItem.dataset.custom = skill.isCustom;
            
            // Create checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = skill.isCustom ? `custom_skill_${skill.index}` : `skill_${skill.index}`;
            checkbox.className = 'skill-proficient';
            checkbox.checked = skill.proficient;
            checkbox.dataset.index = skill.index;
            checkbox.dataset.custom = skill.isCustom;
            
            // Create modifier span
            const modSpan = document.createElement('span');
            modSpan.className = 'skill-modifier';
            modSpan.textContent = `${modifier >= 0 ? '+' : ''}${modifier}`;
            
            // Create name span
            const nameSpan = document.createElement('span');
            nameSpan.className = 'skill-name';
            nameSpan.textContent = skill.name;
            if (skill.isCustom) {
                nameSpan.classList.add('custom-skill-name-display');
                nameSpan.addEventListener('dblclick', function() {
                    const skillItem = this.closest('.skill-item');
                    const index = parseInt(skillItem.dataset.index);
                    enterEditMode(skillItem, index);
                });
            }
            
            // Create ability span
            const abilitySpan = document.createElement('span');
            abilitySpan.className = 'skill-ability';
            abilitySpan.textContent = `(${skill.ability.charAt(0).toUpperCase()})`;
            
            // Add elements to skill item
            skillItem.appendChild(checkbox);
            skillItem.appendChild(modSpan);
            skillItem.appendChild(nameSpan);
            skillItem.appendChild(abilitySpan);
            
            // Add delete button for custom skills
            if (skill.isCustom) {
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'remove-skill-btn';
                deleteButton.textContent = '×';
                deleteButton.dataset.index = skill.index;
                
                // Add direct onclick event
                deleteButton.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const index = parseInt(this.dataset.index);
                    removeCustomSkill(index);
                    return false;
                };
                
                skillItem.appendChild(deleteButton);
            }
            
            skillsContainer.appendChild(skillItem);
        });
    }
    
    // Remove custom skill
    function removeCustomSkill(index) {
        const customSkillsInput = document.getElementById('customSkills');
        const customSkills = JSON.parse(customSkillsInput.value || '[]');
        
        customSkills.splice(index, 1);
        customSkillsInput.value = JSON.stringify(customSkills);
        saveField('customSkills', customSkillsInput.value);
        
        renderSortedSkills();
    }
    
    // Save field to server
    function saveField(fieldName, fieldValue) {
        // Update save status
        updateSaveStatus('saving');
        
        fetch(`/characters/${characterId}?_method=PUT`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                field: fieldName,
                value: fieldValue
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateSaveStatus('saved');
        })
        .catch(error => {
            console.error('Error updating field:', error);
            updateSaveStatus('error');
        });
    }
    
    // Update ability modifier when ability score changes
    function updateAbilityModifier(abilityInput) {
        const abilityCard = abilityInput.closest('.ability-card');
        if (!abilityCard) return;
        
        const abilityScore = parseInt(abilityInput.value) || 10;
        const modifier = Math.floor((abilityScore - 10) / 2);
        
        const modifierEl = abilityCard.querySelector('.ability-modifier');
        if (modifierEl) {
            modifierEl.textContent = `${modifier >= 0 ? '+' : ''}${modifier}`;
        }
    }
    
    // Update all skill modifiers
    function updateSkillModifiers() {
        // Re-render skills to update modifiers
        renderSortedSkills();
    }
    
    // Update save status
    function updateSaveStatus(status) {
        const saveStatus = document.getElementById('saveStatus');
        if (!saveStatus) return;
        
        if (status === 'saving') {
            saveStatus.textContent = 'Saving...';
            saveStatus.className = 'save-status saving';
        } else if (status === 'saved') {
            saveStatus.textContent = 'All changes saved';
            saveStatus.className = 'save-status saved';
        } else if (status === 'error') {
            saveStatus.textContent = 'Error saving changes';
            saveStatus.className = 'save-status error';
        }
    }
});



// Add this to your character-form.js or in a separate file

document.addEventListener('DOMContentLoaded', function() {
    // Initialize mana toggle buttons
    initManaToggleButtons();

    function initManaToggleButtons() {
        const toggleButtons = document.querySelectorAll('.mana-toggle-icon');
        if (!toggleButtons.length) return;

        // Character ID for saving changes
        const characterId = window.location.pathname.split('/').pop();
        
        // Get mana container and header elements
        const manaContainer = document.querySelector('.mana-container');
        const manaHeaderText = document.getElementById('manaHeaderText');

        // Add click event to each toggle button
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const ability = this.dataset.ability;
                const isCurrentlyActive = this.dataset.active === 'true';
                
                // Reset all toggle buttons
                toggleButtons.forEach(toggle => {
                    toggle.dataset.active = 'false';
                    toggle.textContent = '○'; // Empty circle
                    toggle.style.color = '#666';
                    toggle.closest('.ability-card').classList.remove('ability-card-active');
                });
                
                // If clicking an inactive button, activate it
                if (!isCurrentlyActive) {
                    this.dataset.active = 'true';
                    this.textContent = '●'; // Filled circle
                    this.style.color = '#9932CC'; // Purple color
                    this.closest('.ability-card').classList.add('ability-card-active');
                    
                    // Show mana container
                    if (manaContainer) manaContainer.style.display = 'grid';
                    if (manaHeaderText) manaHeaderText.style.display = '';
                    
                    // Save the selected ability
                    saveField('useManaAbility', ability);
                } else {
                    // Hide mana container if turning off
                    if (manaContainer) manaContainer.style.display = 'none';
                    if (manaHeaderText) manaHeaderText.style.display = 'none';
                    
                    // Clear the selected ability
                    saveField('useManaAbility', null);
                }
            });
        });
        
        // Initialize toggle button states
        initToggleButtonStates();
    }
    
    function initToggleButtonStates() {
        const toggleButtons = document.querySelectorAll('.mana-toggle-icon');
        
        toggleButtons.forEach(btn => {
            const isActive = btn.dataset.active === 'true';
            
            if (isActive) {
                btn.textContent = '●'; // Filled circle
                btn.style.color = '#9932CC'; // Purple color
                btn.closest('.ability-card').classList.add('ability-card-active');
            } else {
                btn.textContent = '○'; // Empty circle
                btn.style.color = '#666'; // Grey color
            }
        });
        
        // Update mana container visibility
        const activeToggle = document.querySelector('.mana-toggle-icon[data-active="true"]');
        const manaContainer = document.querySelector('.mana-container');
        const manaHeaderText = document.getElementById('manaHeaderText');
        
        if (activeToggle) {
            if (manaContainer) manaContainer.style.display = 'grid';
            if (manaHeaderText) manaHeaderText.style.display = '';
        } else {
            if (manaContainer) manaContainer.style.display = 'none';
            if (manaHeaderText) manaHeaderText.style.display = 'none';
        }
    }
    
    // This is copied from your existing saveField function to make the above code work
    function saveField(fieldName, fieldValue) {
        // Get character ID from URL
        const characterId = window.location.pathname.split('/').pop();
        
        // Update save status if available
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) {
            saveStatus.textContent = 'Saving...';
            saveStatus.className = 'save-status saving';
        }
        
        fetch(`/characters/${characterId}?_method=PUT`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                field: fieldName,
                value: fieldValue
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (saveStatus) {
                saveStatus.textContent = 'All changes saved';
                saveStatus.className = 'save-status saved';
            }
        })
        .catch(error => {
            console.error('Error updating field:', error);
            if (saveStatus) {
                saveStatus.textContent = 'Error saving changes';
                saveStatus.className = 'save-status error';
            }
        });
    }
});




// Add this to your character-form.js or create a new file

document.addEventListener('DOMContentLoaded', function() {
    // Initialize rest buttons 
    initRestButtons();
    
    // Add rest buttons if they don't exist
    function initRestButtons() {
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
            shortRestBtn.onclick = performShortRest;
            
            // Create long rest button
            const longRestBtn = document.createElement('button');
            longRestBtn.type = 'button';
            longRestBtn.className = 'rest-button long-rest-button';
            longRestBtn.title = 'Long Rest';
            longRestBtn.innerHTML = '☀️';
            longRestBtn.onclick = performLongRest;
            
            // Add buttons to container
            restButtonsContainer.appendChild(shortRestBtn);
            restButtonsContainer.appendChild(longRestBtn);
            
            // Add container to header
            hpManaHeader.appendChild(restButtonsContainer);
        }
        
        // Create rest animation container if it doesn't exist
        createRestAnimationContainer();
    }
    
    // Create animation container for rest effects
    function createRestAnimationContainer() {
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
    
    // Perform a short rest
    function performShortRest() {
        // Show animation
        showRestAnimation('Short Rest', '🌙', '#3f51b5');
        
        // Get character ID
        const characterId = window.location.pathname.split('/').pop();
        
        // Get HP inputs
        const currentHP = document.getElementById('currentHitPoints');
        const maxHP = document.getElementById('maxHitPoints');
        
        if (currentHP && maxHP) {
            const maxHPValue = parseInt(maxHP.value) || 0;
            const currentHPValue = parseInt(currentHP.value) || 0;
            
            // Recover some HP (e.g., 25% of max)
            const recoveryAmount = Math.floor(maxHPValue * 0.25);
            const newHP = Math.min(maxHPValue, currentHPValue + recoveryAmount);
            
            // Update current HP
            currentHP.value = newHP;
            
            // Save changes
            saveField('hitPoints.current', newHP);
        }
        
        // Handle mana recovery (half of max)
        handleManaRecovery(0.5);
    }
    
    // Perform a long rest
    function performLongRest() {
        // Show animation
        showRestAnimation('Long Rest', '☀️', '#7b2cbf');
        
        // Get character ID
        const characterId = window.location.pathname.split('/').pop();
        
        // Get HP inputs
        const currentHP = document.getElementById('currentHitPoints');
        const maxHP = document.getElementById('maxHitPoints');
        
        if (currentHP && maxHP) {
            const maxHPValue = parseInt(maxHP.value) || 0;
            
            // Full HP recovery
            currentHP.value = maxHPValue;
            
            // Save changes
            saveField('hitPoints.current', maxHPValue);
        }
        
        // Handle mana recovery (full)
        handleManaRecovery(1.0);
    }
    
    // Handle mana recovery based on a recovery factor
    function handleManaRecovery(recoveryFactor) {
        // Check if mana is enabled
        const activeManaToggle = document.querySelector('.mana-toggle-icon[data-active="true"]');
        if (!activeManaToggle) return;
        
        // Get mana inputs
        const currentMana = document.getElementById('currentMana');
        const maxMana = document.getElementById('maxMana');
        
        if (currentMana && maxMana) {
            const maxManaValue = parseInt(maxMana.value) || 0;
            const currentManaValue = parseInt(currentMana.value) || 0;
            
            // Calculate recovery amount
            const recoveryAmount = Math.floor(maxManaValue * recoveryFactor);
            const newMana = Math.min(maxManaValue, currentManaValue + recoveryAmount);
            
            // Update current mana
            currentMana.value = newMana;
            
            // Save changes
            saveField('mana.current', newMana);
        }
    }
    
    // Show rest animation
    function showRestAnimation(type, emoji, color) {
        const restAnimContainer = document.getElementById('restAnimationContainer');
        if (!restAnimContainer) return;
        
        const restAnimBox = restAnimContainer.querySelector('.rest-animation-box');
        const restAnimText = restAnimContainer.querySelector('.animation-text');
        const restAnimEmoji = restAnimContainer.querySelector('.animation-emoji');
        
        restAnimText.textContent = type;
        restAnimText.style.color = color;
        restAnimEmoji.textContent = emoji;
        restAnimBox.style.borderColor = color;
        
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
    
    // Save field to server (using the same function as in character-form.js)
    function saveField(fieldName, fieldValue) {
        // Get character ID from URL
        const characterId = window.location.pathname.split('/').pop();
        
        // Update save status if available
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) {
            saveStatus.textContent = 'Saving...';
            saveStatus.className = 'save-status saving';
        }
        
        fetch(`/characters/${characterId}?_method=PUT`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                field: fieldName,
                value: fieldValue
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (saveStatus) {
                saveStatus.textContent = 'All changes saved';
                saveStatus.className = 'save-status saved';
            }
        })
        .catch(error => {
            console.error('Error updating field:', error);
            if (saveStatus) {
                saveStatus.textContent = 'Error saving changes';
                saveStatus.className = 'save-status error';
            }
        });
    }
});








// public/js/characterSheet.js

document.addEventListener('DOMContentLoaded', function() {
    // Import all necessary modules
    Promise.all([
      import('./modules/hitPoints.js'),
      import('./modules/mana.js'),
      import('./modules/skills.js'),
      import('./modules/abilities.js'),
      import('./modules/rest.js')
    ]).then(([hitPointsModule, manaModule, skillsModule, abilitiesModule, restModule]) => {
      // Extract classes from modules
      const { HitPointManager } = hitPointsModule;
      const { ManaManager } = manaModule;
      const { SkillManager } = skillsModule;
      const { AbilityManager } = abilitiesModule;
      const { RestManager } = restModule;
      
      // Initialize character sheet with all modules
      initializeCharacterSheet(HitPointManager, ManaManager, SkillManager, AbilityManager, RestManager);
    }).catch(error => {
      console.error('Error loading modules:', error);
    });
  });
  
  /**
   * Initialize all character sheet functionality
   * @param {Class} HitPointManager - Hit Points manager class
   * @param {Class} ManaManager - Mana manager class
   * @param {Class} SkillManager - Skills manager class
   * @param {Class} AbilityManager - Abilities manager class
   * @param {Class} RestManager - Rest manager class
   */
  
  /**
   * Initialize all editable fields
   */
  function initializeEditableFields() {
    console.log('Initializing editable fields');
    const editableFields = document.querySelectorAll('.editable-field');
    console.log('Found editable fields:', editableFields.length);
    
    editableFields.forEach(field => {
        // Skip HP/Mana fields as they use popups
        if (field.id === 'currentHitPoints' || field.id === 'currentMana') {
          return;
        }
      // Make field editable on click
      field.addEventListener('click', function(e) {
        // Don't make HP/Mana fields editable on click as they use popups
        
        if (field.readOnly) {
          field.readOnly = false;
          field.focus();
        }
      });
      
      // Save field on blur
      field.addEventListener('blur', function() {
        if (!field.readOnly) {
          const fieldName = field.dataset.field;
          const fieldValue = field.value;
          
          if (fieldName) {
            saveField(getCharacterId(), fieldName, fieldValue);
          }
          
          field.readOnly = true;
          
          // Update ability modifiers if this is an ability score
          if (field.classList.contains('ability-score')) {
            updateAbilityModifier(field);
          }
        }
      });
      
      // Save on Enter key for text inputs (not for textareas)
      if (field.tagName !== 'TEXTAREA') {
        field.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            field.blur();
          }
        });
      }
    });
  }
  
  /**
   * Save field to server
   * @param {string} characterId - Character ID
   * @param {string} fieldName - Field name
   * @param {*} fieldValue - Field value
   */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Character sheet script loaded');
    
    // First check if our fields exist
    const currentHPInput = document.getElementById('currentHitPoints');
    const currentManaInput = document.getElementById('currentMana');
    
    console.log('Current HP field exists:', !!currentHPInput);
    console.log('Current Mana field exists:', !!currentManaInput);
    
    // Add direct click handlers first as a fallback
    if (currentHPInput) {
      console.log('Adding direct click handler to HP field');
      currentHPInput.addEventListener('click', function(e) {
        console.log('HP field clicked directly!');
        if (e.target.readOnly) {
          showSimpleHPPopup(e.target);
        }
      });
    }
    
    if (currentManaInput) {
      console.log('Adding direct click handler to Mana field');
      currentManaInput.addEventListener('click', function(e) {
        console.log('Mana field clicked directly!');
        if (e.target.readOnly) {
          showSimpleManaPopup(e.target);
        }
      });
    }
  
    // Try to import modules
    console.log('Attempting to import modules...');
    
    Promise.all([
      import('./modules/hitPoints.js').catch(err => {
        console.error('Failed to import hitPoints.js:', err);
        return { HitPointManager: null };
      }),
      import('./modules/mana.js').catch(err => {
        console.error('Failed to import mana.js:', err);
        return { ManaManager: null };
      })
    ]).then(([hitPointsModule, manaModule]) => {
      console.log('Modules imported?', {
        hitPointsModule: !!hitPointsModule,
        hitPointManager: !!hitPointsModule.HitPointManager,
        manaModule: !!manaModule,
        manaManager: !!manaModule.ManaManager
      });
      
      // Extract classes from modules
      const HitPointManager = hitPointsModule.HitPointManager;
      const ManaManager = manaModule.ManaManager;
      
      // Initialize character sheet with modules if available
      if (HitPointManager && ManaManager) {
        console.log('Initializing with module classes');
        initializeCharacterSheet(HitPointManager, ManaManager);
      } else {
        console.log('Using simple initialization due to missing modules');
        initializeEditableFields();
      }
    }).catch(error => {
      console.error('Error in module loading process:', error);
      console.log('Falling back to simple initialization');
      initializeEditableFields();
    });
  });
  
  /**
   * Simple HP popup for debugging
   */
  function showSimpleHPPopup(currentHPInput) {
    console.log('Showing simple HP popup');
    
    // Create popup container
    let popup = document.createElement('div');
    popup.id = 'hpPopup';
    popup.style = `
      position: absolute;
      z-index: 1000;
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      padding: 15px;
      min-width: 250px;
    `;
    
    // Position popup near the input
    const rect = currentHPInput.getBoundingClientRect();
    popup.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    popup.style.left = (rect.left + window.scrollX) + 'px';
    
    // Create popup content
    popup.innerHTML = `
      <h3 style="margin-top: 0; margin-bottom: 10px;">Debug HP Popup</h3>
      <div style="margin-bottom: 15px;">
        <p>Current value: ${currentHPInput.value}</p>
      </div>
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">Amount:</label>
        <input type="number" id="debugAmount" value="1" min="0" style="width: 100%; padding: 5px;">
      </div>
      <div style="display: flex; justify-content: space-between;">
        <button id="debugDamageBtn" style="background-color: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Damage</button>
        <button id="debugHealBtn" style="background-color: #4caf50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Heal</button>
        <button id="debugCloseBtn" style="background-color: #ccc; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
      </div>
    `;
    
    // Add popup to body
    document.body.appendChild(popup);
    
    // Add simple button handlers
    document.getElementById('debugDamageBtn').addEventListener('click', () => {
      const amount = parseInt(document.getElementById('debugAmount').value) || 0;
      const current = parseInt(currentHPInput.value) || 0;
      currentHPInput.value = Math.max(0, current - amount);
      popup.remove();
      console.log('HP damaged, new value:', currentHPInput.value);
    });
    
    document.getElementById('debugHealBtn').addEventListener('click', () => {
      const amount = parseInt(document.getElementById('debugAmount').value) || 0;
      const current = parseInt(currentHPInput.value) || 0;
      currentHPInput.value = current + amount;
      popup.remove();
      console.log('HP healed, new value:', currentHPInput.value);
    });
    
    document.getElementById('debugCloseBtn').addEventListener('click', () => {
      popup.remove();
    });
  }
  
  /**
   * Simple Mana popup for debugging
   */
  function showSimpleManaPopup(currentManaInput) {
    console.log('Showing simple Mana popup');
    
    // Create popup container
    let popup = document.createElement('div');
    popup.id = 'manaPopup';
    popup.style = `
      position: absolute;
      z-index: 1000;
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      padding: 15px;
      min-width: 250px;
    `;
    
    // Position popup near the input
    const rect = currentManaInput.getBoundingClientRect();
    popup.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    popup.style.left = (rect.left + window.scrollX) + 'px';
    
    // Create popup content
    popup.innerHTML = `
      <h3 style="margin-top: 0; margin-bottom: 10px;">Debug Mana Popup</h3>
      <div style="margin-bottom: 15px;">
        <p>Current value: ${currentManaInput.value}</p>
      </div>
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">Amount:</label>
        <input type="number" id="debugManaAmount" value="1" min="0" style="width: 100%; padding: 5px;">
      </div>
      <div style="display: flex; justify-content: space-between;">
        <button id="debugSpendBtn" style="background-color: #3f51b5; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Spend</button>
        <button id="debugRestoreBtn" style="background-color: #9c27b0; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Restore</button>
        <button id="debugManaCloseBtn" style="background-color: #ccc; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
      </div>
    `;
    
    // Add popup to body
    document.body.appendChild(popup);
    
    // Add simple button handlers
    document.getElementById('debugSpendBtn').addEventListener('click', () => {
      const amount = parseInt(document.getElementById('debugManaAmount').value) || 0;
      const current = parseInt(currentManaInput.value) || 0;
      currentManaInput.value = Math.max(0, current - amount);
      popup.remove();
      console.log('Mana spent, new value:', currentManaInput.value);
    });
    
    document.getElementById('debugRestoreBtn').addEventListener('click', () => {
      const amount = parseInt(document.getElementById('debugManaAmount').value) || 0;
      const current = parseInt(currentManaInput.value) || 0;
      currentManaInput.value = current + amount;
      popup.remove();
      console.log('Mana restored, new value:', currentManaInput.value);
    });
    
    document.getElementById('debugManaCloseBtn').addEventListener('click', () => {
      popup.remove();
    });
  }
  
  /**
   * Initialize character sheet with modules
   */
  function initializeCharacterSheet(HitPointManager, ManaManager) {
    console.log('Initializing character sheet with modules');
    const characterId = getCharacterId();
    
    // Initialize editable fields
    initializeEditableFields();
    
    // Set up save field function
    const saveFieldCallback = (fieldName, fieldValue) => saveField(characterId, fieldName, fieldValue);
    
    // Initialize HP and Mana
    try {
      console.log('Initializing HP manager');
      HitPointManager.initializeHitPoints(saveFieldCallback);
      
      console.log('Initializing Mana manager');
      ManaManager.initializeMana(saveFieldCallback);
    } catch (error) {
      console.error('Error initializing HP/Mana:', error);
    }
  }
  
  /**
   * Get character ID from URL
   */
  function getCharacterId() {
    const id = window.location.pathname.split('/').pop();
    console.log('Character ID:', id);
    return id;
  }
  
  /**
   * Save field to server
   */
  function saveField(characterId, fieldName, fieldValue) {
    console.log('Saving field:', fieldName, fieldValue);
    
    // Update save status
    updateSaveStatus('saving');
    
    fetch(`/characters/${characterId}?_method=PUT`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        field: fieldName,
        value: fieldValue
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Field saved successfully');
      updateSaveStatus('saved');
    })
    .catch(error => {
      console.error('Error saving field:', error);
      updateSaveStatus('error');
    });
  }
  
  /**
   * Update the ability modifier when ability score changes
   */
  function updateAbilityModifier(abilityInput) {
    const abilityCard = abilityInput.closest('.ability-card');
    if (!abilityCard) return;
    
    const abilityScore = parseInt(abilityInput.value) || 10;
    const modifier = Math.floor((abilityScore - 10) / 2);
    
    const modifierEl = abilityCard.querySelector('.ability-modifier');
    if (modifierEl) {
      modifierEl.textContent = `${modifier >= 0 ? '+' : ''}${modifier}`;
    }
  }
  
  /**
   * Update save status
   */
  function updateSaveStatus(status) {
    const saveStatus = document.getElementById('saveStatus');
    if (!saveStatus) return;
    
    if (status === 'saving') {
      saveStatus.textContent = 'Saving...';
      saveStatus.className = 'save-status saving';
    } else if (status === 'saved') {
      saveStatus.textContent = 'All changes saved';
      saveStatus.className = 'save-status saved';
    } else if (status === 'error') {
      saveStatus.textContent = 'Error saving changes';
      saveStatus.className = 'save-status error';
    }
  }