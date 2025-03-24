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
          
          this.renderSkills();
        });
      }
  
      this.renderSkills();
    }
  
    /**
     * Render and sort skills
     */
    static renderSkills() {
      const skillsContainer = document.getElementById('skillsContainer');
      const skillsInput = document.getElementById('skills');
      const customSkillsInput = document.getElementById('customSkills');
      
      const skills = JSON.parse(skillsInput.value);
      const customSkills = JSON.parse(customSkillsInput.value || '[]');
      
      // Sorting logic can be added here if needed
      const allSkills = [
        ...skills.map(skill => ({ ...skill, isCustom: false })),
        ...customSkills.map(skill => ({ ...skill, isCustom: true }))
      ].sort((a, b) => a.name.localeCompare(b.name));
  
      // Rendering logic remains similar to the current implementation
      // You would replace the current skills rendering code with this method
    }
  }