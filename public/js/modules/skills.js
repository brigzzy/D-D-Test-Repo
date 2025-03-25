// public/js/modules/skills.js

/**
 * Manages character skills, including standard and custom skills
 */
export class SkillManager {
  /**
   * Calculate skill modifier
   * @param {Object} skill - Skill object
   * @param {Object} abilities - Character abilities
   * @param {number} proficiencyBonus - Character's proficiency bonus
   * @returns {number} Calculated skill modifier
   */
  static calculateSkillModifier(skill, abilities, proficiencyBonus) {
    const abilityMod = Math.floor((abilities[skill.ability] - 10) / 2);
    return abilityMod + (skill.proficient ? proficiencyBonus : 0);
  }

  /**
   * Initialize skill interactions
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static initializeSkills(saveFieldCallback) {
    const skillsContainer = document.getElementById('skillsContainer');
    const skillsInput = document.getElementById('skills');
    const customSkillsInput = document.getElementById('customSkills');
    const proficiencyBonus = parseInt(document.getElementById('proficiencyBonus').textContent.replace('+', '')) || 2;

    if (!skillsContainer || !skillsInput) return;

    // Get abilities for modifier calculations
    const abilities = {};
    document.querySelectorAll('.ability-card').forEach(card => {
      const input = card.querySelector('input');
      if (input && input.name) {
        abilities[input.name] = parseInt(input.value) || 10;
      }
    });

    // Skill proficiency toggle
    skillsContainer.addEventListener('change', (e) => {
      if (e.target.classList.contains('skill-proficient')) {
        const isCustom = e.target.dataset.custom === 'true';
        const index = parseInt(e.target.dataset.index);
        
        let skills = JSON.parse(isCustom ? customSkillsInput.value : skillsInput.value);
        skills[index].proficient = e.target.checked;
        
        const inputToUpdate = isCustom ? customSkillsInput : skillsInput;
        inputToUpdate.value = JSON.stringify(skills);
        
        saveFieldCallback(
          isCustom ? 'customSkills' : 'skills', 
          JSON.stringify(skills)
        );

        // Update the display
        this.renderSkills(saveFieldCallback);
      }
    });

    // Add custom skill button
    const addSkillBtn = document.getElementById('addSkillBtn');
    if (addSkillBtn) {
      addSkillBtn.addEventListener('click', () => {
        const customSkills = JSON.parse(customSkillsInput.value || '[]');
        const newSkill = {
          name: 'New Skill',
          ability: 'dexterity',
          proficient: false
        };
        
        customSkills.push(newSkill);
        customSkillsInput.value = JSON.stringify(customSkills);
        saveFieldCallback('customSkills', JSON.stringify(customSkills));
        
        this.renderSkills(saveFieldCallback);
      });
    }

    // Initial render
    this.renderSkills(saveFieldCallback);
  }

  /**
   * Render skills in alphabetical order
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static renderSkills(saveFieldCallback) {
    const skillsContainer = document.getElementById('skillsContainer');
    const skillsInput = document.getElementById('skills');
    const customSkillsInput = document.getElementById('customSkills');
    const proficiencyBonus = parseInt(document.getElementById('proficiencyBonus').textContent.replace('+', '')) || 2;
    
    if (!skillsContainer || !skillsInput) return;
    
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
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'remove-skill-btn';
        deleteBtn.textContent = '×';
        deleteBtn.dataset.index = skill.index;
        deleteBtn.addEventListener('click', () => this.removeCustomSkill(skill.index, saveFieldCallback));
        
        skillItem.appendChild(deleteBtn);
      }
      
      skillsContainer.appendChild(skillItem);
    });
  }
  
  /**
   * Remove a custom skill
   * @param {number} index - Index of the skill to remove
   * @param {function} saveFieldCallback - Function to save field changes
   */
  static removeCustomSkill(index, saveFieldCallback) {
    const customSkillsInput = document.getElementById('customSkills');
    const customSkills = JSON.parse(customSkillsInput.value || '[]');
    
    customSkills.splice(index, 1);
    customSkillsInput.value = JSON.stringify(customSkills);
    saveFieldCallback('customSkills', JSON.stringify(customSkills));
    
    this.renderSkills(saveFieldCallback);
  }
}

// Export a function for easy initialization
export function setupSkills(saveFieldCallback) {
  SkillManager.initializeSkills(saveFieldCallback);
}