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
            }
        });
        
        // Save on Enter key for text inputs (not for textareas)
        if (field.tagName !== 'TEXTAREA') {
            field.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
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
        
        fetch(`/characters/${characterId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
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