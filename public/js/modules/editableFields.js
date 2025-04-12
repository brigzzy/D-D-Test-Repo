// modules/editableFields.js

import { updateSaveStatus } from './utils.js';

export class EditableFieldManager {
    /**
     * Initialize all editable fields
     * @param {function} saveCallback - Callback to save changes
     */
    static initialize(saveCallback) {
      const editableFields = document.querySelectorAll('.editable-field');
      console.log(`Found ${editableFields.length} editable fields`);
      
      editableFields.forEach(field => {
        // Skip fields that have special handlers (HP/Mana/Currency)
        if (field.classList.contains('currency-input') || 
            field.id === 'currentHitPoints' || 
            field.id === 'currentMana') {
          return;
        }
        
        // Make field editable on click
        field.addEventListener('click', function() {
          if (this.readOnly) {
            this.readOnly = false;
            this.focus();
            
            // For text inputs, select all text for easy replacement
            if (this.type === 'text' || this.type === 'number') {
              this.select();
            }
          }
        });
        
        // Handle field losing focus
        field.addEventListener('blur', function() {
          if (!this.readOnly) {
            const fieldName = this.dataset.field;
            if (fieldName) {
              saveCallback(fieldName, this.value);
            }
            
            this.readOnly = true;
            
            // Update ability modifiers if ability score changed
            if (this.classList.contains('ability-score')) {
              const abilityCard = this.closest('.ability-card');
              const abilityScore = parseInt(this.value) || 10;
              
              // Use the AbilityManager to update the display
              import('./abilities.js').then(module => {
                module.AbilityManager.updateModifierDisplay(abilityCard, abilityScore);
                
                // Update skills that depend on this ability
                import('./skills.js').then(skillsModule => {
                  skillsModule.SkillManager.renderSkills(saveCallback);
                });
              });
            }
          }
        });
        
        // Handle Enter key for text inputs
        if (field.tagName !== 'TEXTAREA') {
          field.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              this.blur();
            }
          });
        }
      });
    }
  }