/**
 * inline-editing.js
 * This script enables inline editing for D&D character sheets
 * Works with both structured and plain text views
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing D&D sheet inline editing...');
    
    // Get the character ID from the URL
    const pathParts = window.location.pathname.split('/');
    const characterId = pathParts[pathParts.length - 1];
    console.log('Character ID:', characterId);
    
    // Determine if we're viewing a structured sheet or plain text
    const isStructuredSheet = document.querySelector('.d5e-character-sheet') !== null;
    
    if (isStructuredSheet) {
        console.log('Detected structured character sheet');
        initializeStructuredSheetEditing(characterId);
    } else {
        console.log('Detected plain text character sheet');
        initializePlainTextEditing(characterId);
    }
    
    // Add a notification about editing
    addEditingNotification();
});

/**
 * Add a notification banner about editing functionality
 */
function addEditingNotification() {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '10px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.zIndex = '9999';
    notification.style.padding = '10px 15px';
    notification.style.backgroundColor = '#e9f5ff';
    notification.style.borderLeft = '4px solid #007bff';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: bold;">✏️ Character Sheet Editing</span>
            <span>Click on highlighted fields to edit them directly</span>
            <button id="close-notification" style="margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer; opacity: 0.5;">×</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Add close button functionality
    document.getElementById('close-notification').addEventListener('click', function() {
        notification.style.display = 'none';
        
        // Store preference
        localStorage.setItem('hideEditingNotification', 'true');
    });
    
    // Check if notification should be hidden
    if (localStorage.getItem('hideEditingNotification') === 'true') {
        notification.style.display = 'none';
    }
}

/**
 * Initialize editing for the structured character sheet
 * @param {string} characterId - The ID of the character
 */
function initializeStructuredSheetEditing(characterId) {
    // Make basic information fields editable
    const backgroundElement = document.getElementById('background');
    if (backgroundElement) makeEditable(backgroundElement, 'background', characterId);
    
    const alignmentElement = document.getElementById('alignment');
    if (alignmentElement) makeEditable(alignmentElement, 'alignment', characterId);
    
    // Find species field - the species field doesn't have an ID, so we need to find it by traversing the DOM
    const detailItems = document.querySelectorAll('.d5e-detail-item');
    detailItems.forEach(item => {
        // Look for a label with "Species" text
        const label = item.querySelector('label');
        if (label && label.textContent === 'Species') {
            const speciesSpan = item.querySelector('span');
            if (speciesSpan) makeEditable(speciesSpan, 'species', characterId);
        }
    });
    
    // Make ability scores editable
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
        const scoreElement = document.getElementById(`${ability}-score`);
        if (scoreElement) {
            makeEditable(scoreElement, `${ability}_score`, characterId, function(element, newValue) {
                updateAbilityModifier(ability, newValue);
            });
        }
    });
    
    // Make combat stats editable
    const combatFields = [
        { id: 'armor-class', field: 'armor_class' },
        { id: 'initiative', field: 'initiative' },
        { id: 'speed', field: 'speed' },
        { id: 'max-hp', field: 'max_hp' },
        { id: 'current-hp', field: 'current_hp' },
        { id: 'temp-hp', field: 'temp_hp' },
        { id: 'hit-dice', field: 'hit_dice' }
    ];
    
    combatFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) makeEditable(element, field.field, characterId);
    });
    
    // Make spell info editable
    const spellFields = [
        { id: 'spell-ability', field: 'spell_ability' },
        { id: 'spell-save-dc', field: 'spell_save_dc' },
        { id: 'spell-attack', field: 'spell_attack' }
    ];
    
    spellFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) makeEditable(element, field.field, characterId);
    });
    
    // Make currency editable
    const currencyFields = [
        { id: 'pp', field: 'platinum' },
        { id: 'gp', field: 'gold' },
        { id: 'ep', field: 'electrum' },
        { id: 'sp', field: 'silver' },
        { id: 'cp', field: 'copper' }
    ];
    
    currencyFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) makeEditable(element, field.field, characterId);
    });
    
    // Make personality traits editable
    const personalityFields = [
        { id: 'personality-traits', field: 'personality_traits' },
        { id: 'ideals', field: 'ideals' },
        { id: 'bonds', field: 'bonds' },
        { id: 'flaws', field: 'flaws' }
    ];
    
    personalityFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) makeEditable(element, field.field, characterId);
    });
}

/**
 * Initialize editing for the plain text character sheet
 * @param {string} characterId - The ID of the character
 */
function initializePlainTextEditing(characterId) {
    // Find text elements
    const allTextNodes = [];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: node => node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
    );
    
    let node;
    while (node = walker.nextNode()) {
        if (node.parentNode.tagName !== 'SCRIPT' && 
            node.parentNode.tagName !== 'STYLE') {
            allTextNodes.push(node);
        }
    }
    
    // Process text nodes for editable fields
    allTextNodes.forEach((textNode, index) => {
        const text = textNode.textContent.trim();
        
        // Species field
        if (text === 'Species') {
            // If the next node exists and has content
            if (index < allTextNodes.length - 1) {
                const valueNode = allTextNodes[index + 1];
                if (valueNode && valueNode.textContent.trim()) {
                    makeNodeEditable(valueNode, 'species', characterId);
                }
            }
        }
        
        // Background field
        if (text.match(/^Background\s*\[.*\]$/)) {
            const match = text.match(/\[(.*)\]/);
            if (match) {
                // Create spans to make just the value part editable
                const span = document.createElement('span');
                span.innerHTML = `Background [<span class="editable-value" data-field="background">${match[1]}</span>]`;
                
                // Replace the text node with our span structure
                textNode.parentNode.replaceChild(span, textNode);
                
                // Make the inner span editable
                makeEditable(span.querySelector('.editable-value'), 'background', characterId);
            }
        }
        
        // Alignment field
        if (text.match(/^Alignment\s*\[.*\]$/)) {
            const match = text.match(/\[(.*)\]/);
            if (match) {
                // Create spans to make just the value part editable
                const span = document.createElement('span');
                span.innerHTML = `Alignment [<span class="editable-value" data-field="alignment">${match[1]}</span>]`;
                
                // Replace the text node with our span structure
                textNode.parentNode.replaceChild(span, textNode);
                
                // Make the inner span editable
                makeEditable(span.querySelector('.editable-value'), 'alignment', characterId);
            }
        }
        
        // Ability scores
        const abilityMatch = text.match(/^(STR|DEX|CON|INT|WIS|CHA)$/);
        if (abilityMatch) {
            const ability = abilityMatch[1].toLowerCase();
            
            // Look for the score value (should be the next text node)
            if (index < allTextNodes.length - 1) {
                const scoreNode = allTextNodes[index + 1];
                const scoreText = scoreNode.textContent.trim();
                
                // If it's a number and not a modifier (which would start with + or -)
                if (scoreText.match(/^\d+$/) && !scoreText.startsWith('+') && !scoreText.startsWith('-')) {
                    makeNodeEditable(scoreNode, `${ability}_score`, characterId, function(element, newValue) {
                        // Find the modifier node (usually right after the score)
                        if (index < allTextNodes.length - 2) {
                            const modNode = allTextNodes[index + 2];
                            const modText = modNode.textContent.trim();
                            
                            // If it looks like a modifier (starts with + or -)
                            if (modText.startsWith('+') || modText.startsWith('-') || modText === '0') {
                                // Calculate new modifier
                                const score = parseInt(newValue);
                                if (!isNaN(score)) {
                                    const mod = Math.floor((score - 10) / 2);
                                    const modStr = mod >= 0 ? `+${mod}` : mod.toString();
                                    modNode.textContent = modStr;
                                }
                            }
                        }
                    });
                }
            }
        }
    });
}

/**
 * Make a node editable by wrapping it in a span
 * @param {Node} textNode - The text node to make editable
 * @param {string} fieldName - The field name
 * @param {string} characterId - The character ID
 * @param {Function} [callback] - Optional callback after save
 */
function makeNodeEditable(textNode, fieldName, characterId, callback) {
    // Create a span element
    const span = document.createElement('span');
    span.className = 'editable-field';
    span.setAttribute('data-field', fieldName);
    span.textContent = textNode.textContent;
    
    // Replace the text node with our span
    textNode.parentNode.replaceChild(span, textNode);
    
    // Make the span editable
    makeEditable(span, fieldName, characterId, callback);
}

/**
 * Make an element editable
 * @param {HTMLElement} element - The element to make editable
 * @param {string} fieldName - The field name
 * @param {string} characterId - The character ID
 * @param {Function} [callback] - Optional callback after save
 */
function makeEditable(element, fieldName, characterId, callback) {
    // Skip if already processed
    if (element.classList.contains('editable-field')) {
        return;
    }
    
    // Add editable styling
    element.classList.add('editable-field');
    element.style.position = 'relative';
    element.style.cursor = 'pointer';
    element.style.borderBottom = '1px dashed rgba(0, 123, 255, 0.5)';
    element.style.transition = 'all 0.2s';
    
    // Store original value
    const originalValue = element.textContent;
    
    // Add click handler
    element.addEventListener('click', function() {
        // Skip if already editing
        if (element.querySelector('input')) return;
        
        // Create input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = element.textContent;
        input.style.width = '100%';
        input.style.padding = '2px 4px';
        input.style.border = '1px solid #007bff';
        input.style.borderRadius = '3px';
        input.style.fontSize = 'inherit';
        input.style.outline = 'none';
        
        // Clear content and add input
        element.textContent = '';
        element.appendChild(input);
        
        // Focus and select
        input.focus();
        input.select();
        
        // Save on blur
        input.addEventListener('blur', function() {
            saveField(element, input.value, fieldName, characterId, originalValue, callback);
        });
        
        // Handle enter/escape
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                saveField(element, input.value, fieldName, characterId, originalValue, callback);
                event.preventDefault();
            } else if (event.key === 'Escape') {
                // Cancel edit
                element.textContent = originalValue;
                event.preventDefault();
            }
        });
    });
}

/**
 * Save edited field to the server
 * @param {HTMLElement} element - The element being edited
 * @param {string} newValue - The new value
 * @param {string} fieldName - The field name
 * @param {string} characterId - The character ID
 * @param {string} originalValue - Original value for fallback
 * @param {Function} [callback] - Optional callback after save
 */
function saveField(element, newValue, fieldName, characterId, originalValue, callback) {
    // Skip if no change
    if (newValue.trim() === originalValue.trim()) {
        element.textContent = originalValue;
        return;
    }
    
    // Show saving state
    element.textContent = newValue;
    element.style.opacity = '0.7';
    
    // Add loading indicator
    const loadingIndicator = document.createElement('span');
    loadingIndicator.style.marginLeft = '5px';
    loadingIndicator.innerHTML = '⏳';
    loadingIndicator.style.animation = 'pulse 1s infinite';
    element.appendChild(loadingIndicator);
    
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
        if (!response.ok) throw new Error('Save failed');
        return response.json();
    })
    .then(data => {
        // Success state
        element.style.opacity = '1';
        loadingIndicator.remove();
        
        // Add success indicator
        const successIndicator = document.createElement('span');
        successIndicator.style.marginLeft = '5px';
        successIndicator.style.color = '#28a745';
        successIndicator.innerHTML = '✓';
        element.appendChild(successIndicator);
        
        // Remove success indicator after delay
        setTimeout(() => {
            successIndicator.remove();
        }, 2000);
        
        // Run callback if provided
        if (callback && typeof callback === 'function') {
            callback(element, newValue);
        }
    })
    .catch(error => {
        console.error('Error saving:', error);
        
        // Error state
        element.style.opacity = '1';
        loadingIndicator.remove();
        
        // Restore original value
        element.textContent = originalValue;
        
        // Add error indicator
        const errorIndicator = document.createElement('span');
        errorIndicator.style.marginLeft = '5px';
        errorIndicator.style.color = '#dc3545';
        errorIndicator.innerHTML = '✗';
        element.appendChild(errorIndicator);
        
        // Show error message
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 15px';
        notification.style.backgroundColor = '#dc3545';
        notification.style.color = 'white';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '9999';
        notification.textContent = 'Failed to save changes. Please try again.';
        document.body.appendChild(notification);
        
        // Remove notification after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
        
        // Remove error indicator after delay
        setTimeout(() => {
            errorIndicator.remove();
        }, 3000);
    });
}

/**
 * Update ability modifier when score changes
 * @param {string} ability - The ability code (str, dex, etc.)
 * @param {string} newValue - The new ability score
 */
function updateAbilityModifier(ability, newValue) {
    const score = parseInt(newValue);
    if (isNaN(score)) return;
    
    // Calculate new modifier
    const mod = Math.floor((score - 10) / 2);
    const modText = mod >= 0 ? `+${mod}` : mod.toString();
    
    // Update the modifier element
    const modElement = document.getElementById(`${ability}-mod`);
    if (modElement) {
        modElement.textContent = modText;
    }
}

/**
 * Get CSRF token from cookies or meta tags
 * @returns {string} CSRF token
 */
function getCSRFToken() {
    // Try cookies
    const cookieValue = document.cookie
        .split('; ')
        .find(cookie => cookie.startsWith('csrf_token='));
    
    if (cookieValue) {
        return cookieValue.split('=')[1];
    }
    
    // Try meta tag
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
        return csrfMeta.getAttribute('content');
    }
    
    return '';
}

// Add keyframes for animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
}

.editable-field:hover {
    background-color: rgba(0, 123, 255, 0.1);
    border-bottom-color: #007bff;
}

.editable-field:hover::after {
    content: "✏️";
    font-size: 12px;
    margin-left: 5px;
    opacity: 0.7;
}
`;
document.head.appendChild(styleSheet);