/**
 * D&D Character Sheet Manager
 * Provides a unified interface for interacting with character sheets
 */

class CharacterManager {
    constructor(characterId) {
        this.characterId = characterId;
        this.markdownContent = null;
        this.originalMarkdownElement = document.querySelector('.original-markdown');
        
        // Extract content from the original markdown element if available
        if (this.originalMarkdownElement) {
            this.markdownContent = this.originalMarkdownElement.textContent;
        }
        
        // Initialize CSRF token
        this.csrfToken = this._getCSRFToken();
        
        console.log('🧙‍♂️ Character Manager initialized for character ID:', this.characterId);
    }
    
    /**
     * Update a character field
     * @param {string} field - Field identifier
     * @param {any} value - New value for the field
     * @returns {Promise} - Promise resolving to the update result
     */
    async updateField(field, value) {
        console.log(`📝 Updating field "${field}" to:`, value);
        
        try {
            const response = await fetch(`/characters/${this.characterId}/field`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify({
                    field: field,
                    value: value
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ Update successful:', result);
            
            // Update local markdown content if available
            if (result.success && this.originalMarkdownElement) {
                await this.refreshMarkdownContent();
            }
            
            return result;
        } catch (error) {
            console.error('❌ Error updating field:', error);
            throw error;
        }
    }
    
    /**
     * Make a field editable with inline editing
     * @param {string} elementId - DOM element ID for the editable field
     * @param {string} fieldName - Field identifier for the API
     * @param {Function} callback - Optional callback after successful update
     */
    makeFieldEditable(elementId, fieldName, callback = null) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Element with ID "${elementId}" not found`);
            return;
        }
        
        // Add editable styling
        element.classList.add('editable-field');
        
        // Add click handler
        element.addEventListener('click', () => {
            this._startEditingField(element, fieldName, callback);
        });
        
        console.log(`✏️ Made ${elementId} editable (field: ${fieldName})`);
    }
    
    /**
     * Set up emoji-based toggles for proficiencies
     * @param {string} selector - CSS selector for proficiency items
     * @param {string} fieldPrefix - Field name prefix for the API
     */
    setupProficiencyToggles(selector, fieldPrefix) {
        const items = document.querySelectorAll(selector);
        
        items.forEach(item => {
            const nameElement = item.querySelector('.d5e-save-name, .d5e-skill-name');
            if (!nameElement) return;
            
            const name = nameElement.textContent.trim();
            
            // Create toggle
            const emojiToggle = document.createElement('span');
            emojiToggle.className = 'emoji-indicator';
            emojiToggle.textContent = '⚪';
            emojiToggle.dataset.state = 'none';
            
            // Add click handler
            emojiToggle.addEventListener('click', async () => {
                // Cycle through states: none → proficient → expertise → none
                const currentState = emojiToggle.dataset.state;
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
                
                // Update visual state
                emojiToggle.dataset.state = nextState;
                emojiToggle.textContent = nextEmoji;
                
                // Add visual feedback
                emojiToggle.classList.add('changed');
                setTimeout(() => emojiToggle.classList.remove('changed'), 500);
                
                // Map the state to a value for the API
                const stateValue = nextState === 'none' ? 'Not Proficient' : 
                                  nextState === 'proficient' ? 'Proficient' : 'Expertise';
                
                // Save to server
                try {
                    const fieldName = `${fieldPrefix}_${name.toLowerCase().replace(/\s+/g, '_')}`;
                    await this.updateField(fieldName, stateValue);
                    
                    // Update the display value if needed
                    this._updateProficiencyDisplayValue(item, nextState);
                } catch (error) {
                    // Revert to previous state on error
                    emojiToggle.dataset.state = currentState;
                    emojiToggle.textContent = currentState === 'none' ? '⚪' : 
                                             currentState === 'proficient' ? '✅' : '⭐';
                }
            });
            
            // Insert at the beginning of the item
            item.insertBefore(emojiToggle, item.firstChild);
        });
        
        console.log(`🎯 Setup proficiency toggles for ${items.length} items with prefix "${fieldPrefix}"`);
    }
    
    /**
     * Setup death saving throw indicators
     */
    setupDeathSaves() {
        const container = document.getElementById('death-saves');
        if (!container) {
            console.warn('⚠️ Death saves container not found');
            return;
        }
        
        // Build UI for success and failure rows
        const buildSaveRow = (type, label) => {
            const row = document.createElement('div');
            row.className = 'd5e-death-save-row';
            
            const rowLabel = document.createElement('label');
            rowLabel.textContent = label;
            
            const boxes = document.createElement('div');
            boxes.className = 'd5e-death-save-boxes';
            
            row.appendChild(rowLabel);
            row.appendChild(boxes);
            
            // Create indicators
            for (let i = 1; i <= 3; i++) {
                const indicator = document.createElement('span');
                indicator.className = 'emoji-indicator death-save-indicator';
                indicator.textContent = '⚪'; // Default state
                indicator.dataset.type = type;
                indicator.dataset.index = i;
                indicator.dataset.active = 'false';
                
                indicator.addEventListener('click', async () => {
                    const isActive = indicator.dataset.active === 'true';
                    const newState = !isActive;
                    
                    // Update visual state
                    indicator.dataset.active = newState ? 'true' : 'false';
                    indicator.textContent = newState ? (type === 'success' ? '❤️' : '💀') : '⚪';
                    
                    // Add visual feedback
                    indicator.classList.add('changed');
                    setTimeout(() => indicator.classList.remove('changed'), 500);
                    
                    // Save to server
                    try {
                        await this.updateField(
                            `death_save_${type}_${i}`, 
                            newState ? 'marked' : 'unmarked'
                        );
                    } catch (error) {
                        // Revert on error
                        indicator.dataset.active = isActive ? 'true' : 'false';
                        indicator.textContent = isActive ? (type === 'success' ? '❤️' : '💀') : '⚪';
                    }
                });
                
                boxes.appendChild(indicator);
            }
            
            return row;
        };
        
        // Clear and rebuild container
        container.innerHTML = '';
        container.appendChild(buildSaveRow('success', 'Successes'));
        container.appendChild(buildSaveRow('failure', 'Failures'));
        
        // Parse current state from markdown
        this._updateDeathSavesFromMarkdown();
        
        console.log('🎲 Death saves interface initialized');
    }
    
    /**
     * Refresh the markdown content
     */
    async refreshMarkdownContent() {
        try {
            const response = await fetch(`/characters/${this.characterId}`);
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const newMarkdown = doc.querySelector('.original-markdown');
            if (newMarkdown) {
                this.markdownContent = newMarkdown.textContent;
                this.originalMarkdownElement.textContent = this.markdownContent;
                console.log('📝 Markdown content refreshed');
                
                // Update any state derived from markdown
                this._updateDeathSavesFromMarkdown();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error refreshing markdown:', error);
            return false;
        }
    }
    
    /**
     * Calculate proficiency bonus based on character level according to D&D 5E rules
     * @param {number} level - Character level (1-20)
     * @returns {number} - Proficiency bonus
     */
    calculateProficiencyBonus(level) {
        // Ensure level is a number between 1 and 20
        level = Math.max(1, Math.min(20, parseInt(level) || 1));
        
        // D&D 5E proficiency bonus formula: +2 at level 1, +1 every 4 levels
        return Math.floor((level - 1) / 4) + 2;
    }
    
    /**
     * Initialize the entire character sheet with all editable fields and toggles
     */
    initializeSheet() {
        // Make ability scores editable
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
            this.makeFieldEditable(`${ability}-score`, `${ability}_score`, (element, newValue) => {
                this._updateAbilityModifier(ability, newValue);
            });
        });
        
        // Make character name editable
        this.makeFieldEditable('character-name', 'name');
        
        // Make species editable
        this.makeFieldEditable('species', 'species');
        
        // Make class editable
        this.makeFieldEditable('character-class', 'class');
        
        // Make level editable with special handling for proficiency bonus
        this.makeFieldEditable('character-level', 'level', (element, newValue) => {
            // Update proficiency bonus when level changes
            const level = parseInt(newValue) || 1;
            this.updateProficiencyBonus(level);
        });        
        
        // Basic information
        this.makeFieldEditable('background', 'background');
        this.makeFieldEditable('alignment', 'alignment');
        
        // Combat stats
        this.makeFieldEditable('armor-class', 'armor_class');
        this.makeFieldEditable('initiative', 'initiative');
        this.makeFieldEditable('speed', 'speed');
        this.makeFieldEditable('max-hp', 'max_hp');
        this.makeFieldEditable('current-hp', 'current_hp');
        this.makeFieldEditable('temp-hp', 'temp_hp');
        this.makeFieldEditable('hit-dice', 'hit_dice');
        
        // Currency
        this.makeFieldEditable('pp', 'platinum');
        this.makeFieldEditable('gp', 'gold');
        this.makeFieldEditable('ep', 'electrum');
        this.makeFieldEditable('sp', 'silver');
        this.makeFieldEditable('cp', 'copper');
        
        // Personality traits
        this.makeFieldEditable('personality-traits', 'personality_traits');
        this.makeFieldEditable('ideals', 'ideals');
        this.makeFieldEditable('bonds', 'bonds');
        this.makeFieldEditable('flaws', 'flaws');
        
        // Setup proficiency toggles
        this.setupProficiencyToggles('.d5e-save-item', 'save');
        this.setupProficiencyToggles('.d5e-skill-item', 'skill');
        
        // Setup death saves
        this.setupDeathSaves();
        
        console.log('✨ Character sheet fully initialized');
    }

    /**
     * Update proficiency bonus value and all dependent skills/saves
     * @param {number} level - Character level (1-20)
     */
    updateProficiencyBonus(level) {
        // Calculate new proficiency bonus
        const profBonus = this.calculateProficiencyBonus(level);
        
        // Update display
        const profBonusElement = document.getElementById('proficiency-bonus');
        if (profBonusElement) {
            profBonusElement.textContent = `+${profBonus}`;
        }
        
        // Update all skills and saves
        this._updateAllProficiencyDependentValues(profBonus);
        
        return profBonus;
    }

    
    /**
     * Start editing a field inline
     * @private
     */
    _startEditingField(element, fieldName, callback) {
        // Explicitly trim the text content BEFORE any manipulation
        const originalValue = element.textContent.trim();
        
        // Create input element for editing
        const input = document.createElement('input');
        input.type = 'text';
        
        // Set the input value BEFORE clearing the element
        input.value = originalValue;
        
        input.className = 'inline-edit-input';
        
        // Clear the element and append the input
        element.innerHTML = ''; // Use innerHTML instead of textContent
        element.appendChild(input);
        
        // Verify the input value
        input.value = originalValue;
        
        // Focus and select input
        input.focus();
        input.select();
        
        // Handle input events
        input.addEventListener('blur', () => {
            this._saveFieldEdit(element, input.value, fieldName, originalValue, callback);
        });
        
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this._saveFieldEdit(element, input.value, fieldName, originalValue, callback);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                element.textContent = originalValue;
            }
        });
    }
    
    /**
     * Save an edited field value
     * @private
     */
    async _saveFieldEdit(element, newValue, fieldName, originalValue, callback) {
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
        
        try {
            // Send to server
            const result = await this.updateField(fieldName, newValue);
            
            // Show success indicator
            saveIndicator.className = 'save-indicator success';
            saveIndicator.textContent = '✅';
            
            // Run callback if provided
            if (callback) {
                callback(element, newValue);
            }
            
            // Remove indicator after delay
            setTimeout(() => {
                if (element.contains(saveIndicator)) {
                    element.removeChild(saveIndicator);
                }
            }, 2000);
        } catch (error) {
            // Show error indicator
            saveIndicator.className = 'save-indicator error';
            saveIndicator.textContent = '❌';
            
            // Reset to original value after delay
            setTimeout(() => {
                element.textContent = originalValue;
            }, 2000);
        }
    }
    
    /**
     * Update ability modifier when score changes
     * @private
     */
    _updateAbilityModifier(ability, scoreValue) {
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
        
        // Update all saving throws and skills that use this ability
        this._updateDependentValues(ability, mod);
    }
    
    /**
     * Update all values that depend on proficiency bonus
     * @param {number} profBonus - New proficiency bonus value
     * @private
     */
    _updateAllProficiencyDependentValues(profBonus) {
        console.log(`Updating all proficiency values with bonus: +${profBonus}`);
        
        // Get all ability modifiers first
        const abilityMods = {};
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
            const modElement = document.getElementById(`${ability}-mod`);
            if (modElement) {
                const modText = modElement.textContent;
                const modMatch = modText.match(/([+-]?\d+)/);
                if (modMatch) {
                    abilityMods[ability] = parseInt(modMatch[1]);
                } else {
                    abilityMods[ability] = 0;
                }
            }
        });
        
        console.log("Ability modifiers:", abilityMods);
        
        // Update all saving throws first
        document.querySelectorAll('.d5e-save-item').forEach(saveItem => {
            const nameElement = saveItem.querySelector('.d5e-save-name');
            const valueElement = saveItem.querySelector('.d5e-save-value');
            
            if (!nameElement || !valueElement) return;
            
            // Get ability name from the save
            const abilityName = nameElement.textContent.toLowerCase().trim();
            
            // Extract just the ability abbreviation (str, dex, etc.)
            const ability = abilityName.slice(0, 3);
            
            // Check if proficient
            const isProficient = saveItem.querySelector('.d5e-prof-indicator.proficient') ||
                            (saveItem.querySelector('.emoji-indicator') && 
                                saveItem.querySelector('.emoji-indicator').dataset.state === 'proficient');
            
            // Get ability modifier
            const mod = abilityMods[ability] || 0;
            
            // Calculate save value
            let saveValue = mod;
            if (isProficient) {
                saveValue += profBonus;
            }
            
            // Format and display
            const formattedValue = saveValue >= 0 ? `+${saveValue}` : saveValue.toString();
            valueElement.textContent = formattedValue;
            
            // Add color classes
            valueElement.classList.remove('positive', 'negative', 'neutral');
            if (saveValue > 0) {
                valueElement.classList.add('positive');
            } else if (saveValue < 0) {
                valueElement.classList.add('negative');
            } else {
                valueElement.classList.add('neutral');
            }
            
            console.log(`Updated ${ability} save: ${formattedValue} (${isProficient ? 'proficient' : 'not proficient'})`);
        });
        
        // Then update skills
        document.querySelectorAll('.d5e-skill-item').forEach(skillItem => {
            const abilityElement = skillItem.querySelector('.d5e-skill-ability');
            const nameElement = skillItem.querySelector('.d5e-skill-name');
            const valueElement = skillItem.querySelector('.d5e-skill-value');
            
            if (!abilityElement || !nameElement || !valueElement) return;
            
            // Get the ability and skill name
            const ability = abilityElement.textContent.toLowerCase().trim();
            const skillName = nameElement.textContent.trim();
            
            // Check proficiency state
            let profState = 'none';
            const emojiIndicator = skillItem.querySelector('.emoji-indicator');
            const oldIndicator = skillItem.querySelector('.d5e-prof-indicator');
            
            if (emojiIndicator) {
                profState = emojiIndicator.dataset.state || 'none';
            } else if (oldIndicator) {
                if (oldIndicator.classList.contains('expertise')) {
                    profState = 'expertise';
                } else if (oldIndicator.classList.contains('proficient')) {
                    profState = 'proficient';
                }
            }
            
            // Get ability modifier
            const mod = abilityMods[ability] || 0;
            
            // Calculate skill value
            let skillValue = mod;
            if (profState === 'proficient') {
                skillValue += profBonus;
            } else if (profState === 'expertise') {
                skillValue += (profBonus * 2);
            }
            
            // Format and display
            const formattedValue = skillValue >= 0 ? `+${skillValue}` : skillValue.toString();
            valueElement.textContent = formattedValue;
            
            // Add color classes
            valueElement.classList.remove('positive', 'negative', 'neutral');
            if (skillValue > 0) {
                valueElement.classList.add('positive');
            } else if (skillValue < 0) {
                valueElement.classList.add('negative');
            } else {
                valueElement.classList.add('neutral');
            }
            
            console.log(`Updated ${skillName} (${ability}): ${formattedValue} (${profState})`);
        });
    }
    
    /**
 * Update proficiency display value
 * @private
 */
_updateProficiencyDisplayValue(item, state, customProfBonus = null) {
    const valueElement = item.querySelector('.d5e-save-value, .d5e-skill-value');
    if (!valueElement) return;
    
    // Get ability modifier
    let abilityMod = 0;
    const abilityElement = item.querySelector('.d5e-skill-ability');
    
    if (abilityElement) {
        // For skills
        const ability = abilityElement.textContent.toLowerCase();
        const modElement = document.getElementById(`${ability}-mod`);
        if (modElement) {
            const modText = modElement.textContent;
            const modMatch = modText.match(/([+-]?\d+)/);
            if (modMatch) {
                abilityMod = parseInt(modMatch[1]);
            }
        }
    } else {
        // For saving throws
        const nameElement = item.querySelector('.d5e-save-name');
        if (nameElement) {
            // Get the saving throw name and convert to ability abbreviation
            let abilityText = nameElement.textContent.trim().toLowerCase();
            
            // Map full ability names or abbreviations to standard 3-letter codes
            const abilityMap = {
                'str': 'str', 'strength': 'str',
                'dex': 'dex', 'dexterity': 'dex', 
                'con': 'con', 'constitution': 'con',
                'int': 'int', 'intelligence': 'int',
                'wis': 'wis', 'wisdom': 'wis',
                'cha': 'cha', 'charisma': 'cha'
            };
            
            // Extract just the ability part (in case of "STR Save" or similar)
            let ability = abilityText.split(/\s+/)[0];
            ability = abilityMap[ability] || ability;
            
            const modElement = document.getElementById(`${ability}-mod`);
            if (modElement) {
                const modText = modElement.textContent;
                const modMatch = modText.match(/([+-]?\d+)/);
                if (modMatch) {
                    abilityMod = parseInt(modMatch[1]);
                }
            }
        }
    }
    
    // Get proficiency bonus (use custom value if provided, otherwise get from UI)
    let profBonus = customProfBonus;
    if (profBonus === null) {
        const profBonusElement = document.getElementById('proficiency-bonus');
        if (profBonusElement) {
            const bonusText = profBonusElement.textContent;
            const bonusMatch = bonusText.match(/([+-]?\d+)/);
            if (bonusMatch) {
                profBonus = parseInt(bonusMatch[1]);
            } else {
                profBonus = 2; // Default
            }
        } else {
            profBonus = 2; // Default
        }
    }
    
    // Calculate new value
    let newValue = abilityMod;
    if (state === 'proficient') {
        newValue += profBonus;
    } else if (state === 'expertise') {
        newValue += (profBonus * 2);
    }
    
    // Format with plus sign for positive values
    const formattedValue = newValue >= 0 ? `+${newValue}` : newValue.toString();
    valueElement.textContent = formattedValue;
    
    // Add color classes
    valueElement.classList.remove('positive', 'negative', 'neutral');
    if (newValue > 0) {
        valueElement.classList.add('positive');
    } else if (newValue < 0) {
        valueElement.classList.add('negative');
    } else {
        valueElement.classList.add('neutral');
    }
}

    /**
     * Update all values that depend on a specific ability
     * @private
     */
    _updateDependentValues(ability, modValue) {
        // Update saving throws that use this ability
        document.querySelectorAll('.d5e-save-item').forEach(saveItem => {
            const nameElement = saveItem.querySelector('.d5e-save-name');
            if (nameElement && nameElement.textContent.toLowerCase() === ability) {
                const emojiIndicator = saveItem.querySelector('.emoji-indicator');
                if (emojiIndicator) {
                    const state = emojiIndicator.dataset.state || 'none';
                    this._updateProficiencyDisplayValue(saveItem, state);
                }
            }
        });
        
        // Update skills that use this ability
        document.querySelectorAll('.d5e-skill-item').forEach(skillItem => {
            const abilityElement = skillItem.querySelector('.d5e-skill-ability');
            if (abilityElement && abilityElement.textContent.toLowerCase() === ability) {
                const emojiIndicator = skillItem.querySelector('.emoji-indicator');
                if (emojiIndicator) {
                    const state = emojiIndicator.dataset.state || 'none';
                    this._updateProficiencyDisplayValue(skillItem, state);
                }
            }
        });
    }
    
    /**
     * Update death saves from markdown content
     * @private
     */
    _updateDeathSavesFromMarkdown() {
        if (!this.markdownContent) return;
        
        // Parse death saves from markdown
        const deathSaveSection = this.markdownContent.match(/##\s*Death Saves\s*\n([\s\S]*?)(?:\n\n|\n##|\n#|\s*$)/i);
        
        if (deathSaveSection && deathSaveSection[1]) {
            const deathSaveLines = deathSaveSection[1].trim().split('\n');
            
            deathSaveLines.forEach(line => {
                // Check for success/failure marks
                const successMatch = line.match(/Success\s+(\d+):\s*(marked|unmarked)/i);
                const failureMatch = line.match(/Failure\s+(\d+):\s*(marked|unmarked)/i);
                
                if (successMatch) {
                    const index = parseInt(successMatch[1]);
                    const isMarked = successMatch[2].toLowerCase() === 'marked';
                    this._updateDeathSaveIndicator('success', index, isMarked);
                }
                
                if (failureMatch) {
                    const index = parseInt(failureMatch[1]);
                    const isMarked = failureMatch[2].toLowerCase() === 'marked';
                    this._updateDeathSaveIndicator('failure', index, isMarked);
                }
            });
        }
    }
    
    /**
     * Update a specific death save indicator
     * @private
     */
    _updateDeathSaveIndicator(type, index, isMarked) {
        const indicator = document.querySelector(`.death-save-indicator[data-type="${type}"][data-index="${index}"]`);
        if (indicator) {
            indicator.dataset.active = isMarked ? 'true' : 'false';
            indicator.textContent = isMarked ? (type === 'success' ? '❤️' : '💀') : '⚪';
        }
    }
    
    /**
     * Get CSRF token from meta tag or cookies
     * @private
     */
    _getCSRFToken() {
        // Try to get from meta tag
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        if (csrfMeta) {
            return csrfMeta.getAttribute('content');
        }
        
        // Try to get from cookie
        const cookieValue = document.cookie
            .split('; ')
            .find(cookie => cookie.startsWith('csrf_token='));
        
        if (cookieValue) {
            return cookieValue.split('=')[1];
        }
        
        return '';
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Get character ID from URL
    const pathParts = window.location.pathname.split('/');
    const characterId = pathParts[pathParts.length - 1];
    
    // Only initialize on character view page
    if (characterId && !isNaN(characterId) && document.querySelector('.d5e-character-sheet')) {
        window.characterManager = new CharacterManager(characterId);
        window.characterManager.initializeSheet();
    }
});
