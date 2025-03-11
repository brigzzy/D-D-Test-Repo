/**
 * plain-text-inline-editing.js
 * Specialized for editing character sheets displayed as plain text
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing plain text editing...');
    
    // Extract character ID from the URL
    const pathParts = window.location.pathname.split('/');
    const characterId = pathParts[pathParts.length - 1];
    console.log('Character ID:', characterId);
    
    // Add indicator banner
    addEditingBanner();
    
    // Make fields editable
    setupPlainTextEditing(characterId);
});

/**
 * Add a banner explaining the editing functionality
 */
function addEditingBanner() {
    const banner = document.createElement('div');
    banner.style.padding = '10px';
    banner.style.marginBottom = '15px';
    banner.style.backgroundColor = '#e9f5ff';
    banner.style.borderLeft = '4px solid #007bff';
    banner.style.borderRadius = '4px';
    
    banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: bold;">✏️ Character Sheet Editing</span>
            <span>Click on highlighted fields to edit them directly</span>
            <button id="close-banner" style="margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer; opacity: 0.5;">×</button>
        </div>
    `;
    
    // Get the container
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(banner, container.firstChild);
    
    // Add close button handler
    document.getElementById('close-banner').addEventListener('click', function() {
        banner.style.display = 'none';
    });
}

/**
 * Setup plain text editing by identifying edit targets
 * @param {string} characterId - The ID of the character
 */
function setupPlainTextEditing(characterId) {
    // Get all text in the document
    const textElements = getAllTextElements();
    
    // Pattern-based field recognition
    const editableFields = [
        {
            pattern: /^Species$/,
            fieldType: 'species',
            valueIndex: 1, // Get value from next text element
            displayFormat: (value) => `Species ${value}`
        },
        {
            pattern: /^Background \[.*\]$/,
            fieldType: 'background',
            valuePattern: /\[(.*)\]/,
            displayFormat: (value) => `Background [${value}]`
        },
        {
            pattern: /^Alignment \[.*\]$/,
            fieldType: 'alignment',
            valuePattern: /\[(.*)\]/,
            displayFormat: (value) => `Alignment [${value}]`
        },
        {
            pattern: /^STR$/,
            fieldType: 'str_score',
            valuePattern: /^(\d+)$/,
            valueIndex: 1, // Next element should be the value
            displayFormat: (value) => value
        },
        {
            pattern: /^DEX$/,
            fieldType: 'dex_score',
            valuePattern: /^(\d+)$/,
            valueIndex: 1,
            displayFormat: (value) => value
        },
        {
            pattern: /^CON$/,
            fieldType: 'con_score',
            valuePattern: /^(\d+)$/,
            valueIndex: 1,
            displayFormat: (value) => value
        },
        {
            pattern: /^INT$/,
            fieldType: 'int_score',
            valuePattern: /^(\d+)$/,
            valueIndex: 1,
            displayFormat: (value) => value
        },
        {
            pattern: /^WIS$/,
            fieldType: 'wis_score',
            valuePattern: /^(\d+)$/,
            valueIndex: 1,
            displayFormat: (value) => value
        },
        {
            pattern: /^CHA$/,
            fieldType: 'cha_score',
            valuePattern: /^(\d+)$/,
            valueIndex: 1,
            displayFormat: (value) => value
        }
    ];
    
    // Process each text element
    textElements.forEach((element, index) => {
        const text = element.textContent.trim();
        
        // Check each pattern for a match
        editableFields.forEach(field => {
            if (field.pattern.test(text)) {
                // This is a label element
                
                if (field.valuePattern && field.valuePattern.test(text)) {
                    // The value is part of this element (e.g., "Background [Acolyte]")
                    const match = text.match(field.valuePattern);
                    if (match && match[1]) {
                        makeElementEditable(element, field.fieldType, match[1], characterId, field.displayFormat);
                    }
                } else if (field.valueIndex !== undefined && index + field.valueIndex < textElements.length) {
                    // The value is in a separate element
                    const valueElement = textElements[index + field.valueIndex];
                    const valueText = valueElement.textContent.trim();
                    
                    // Skip "+" modifier lines for ability scores
                    if (valueText.startsWith('+') || valueText.startsWith('-')) {
                        return;
                    }
                    
                    if (field.valuePattern) {
                        const match = valueText.match(field.valuePattern);
                        if (match && match[1]) {
                            makeElementEditable(valueElement, field.fieldType, match[1], characterId, field.displayFormat);
                        }
                    } else {
                        makeElementEditable(valueElement, field.fieldType, valueText, characterId, field.displayFormat);
                    }
                }
            }
        });
    });
}

/**
 * Get all text elements in the document
 * @returns {Element[]} Array of text-containing elements
 */
function getAllTextElements() {
    // Find all elements that directly contain text
    const elements = [];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: node => node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
    );
    
    let node;
    while (node = walker.nextNode()) {
        // Skip script and style content
        if (node.parentElement.tagName === 'SCRIPT' || 
            node.parentElement.tagName === 'STYLE' ||
            node.parentElement.classList.contains('editable-field')) {
            continue;
        }
        
        // If the text is directly in the body or a container div
        elements.push(node.parentElement);
    }
    
    return elements;
}

/**
 * Make an element editable
 * @param {Element} element - The element to make editable
 * @param {string} fieldType - The type of field (for the API)
 * @param {string} currentValue - The current value
 * @param {string} characterId - The character ID
 * @param {Function} displayFormat - Function to format display text
 */
function makeElementEditable(element, fieldType, currentValue, characterId, displayFormat) {
    // Already editable?
    if (element.classList.contains('editable-field')) {
        return;
    }
    
    // Store original element properties
    const originalText = element.textContent;
    const originalHTML = element.innerHTML;
    
    // Make the element look editable
    element.classList.add('editable-field');
    
    // Add click handler
    element.addEventListener('click', function() {
        // Skip if already editing
        if (element.querySelector('input')) {
            return;
        }
        
        // Create an input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
        input.className = 'edit-input';
        input.style.width = '100%';
        input.style.padding = '2px 4px';
        input.style.border = '1px solid #007bff';
        input.style.borderRadius = '3px';
        input.style.fontSize = 'inherit';
        
        // Clear and replace content
        element.innerHTML = '';
        element.appendChild(input);
        
        // Focus the input
        input.focus();
        input.select();
        
        // Handle input blur (save)
        input.addEventListener('blur', function() {
            saveFieldValue(element, input.value, fieldType, characterId, originalText, displayFormat);
        });
        
        // Handle enter and escape keys
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                saveFieldValue(element, input.value, fieldType, characterId, originalText, displayFormat);
                event.preventDefault();
            } else if (event.key === 'Escape') {
                // Cancel and restore
                element.innerHTML = originalHTML;
                event.preventDefault();
            }
        });
    });
}

/**
 * Save a field value to the server
 * @param {Element} element - The element being edited
 * @param {string} newValue - The new value
 * @param {string} fieldType - The field type 
 * @param {string} characterId - The character ID
 * @param {string} originalText - The original element text
 * @param {Function} displayFormat - Function to format display text
 */
function saveFieldValue(element, newValue, fieldType, characterId, originalText, displayFormat) {
    // Show saving state
    element.classList.add('saving');
    element.textContent = newValue;
    
    // Send to the server
    fetch(`/characters/${characterId}/field`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            field: fieldType,
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
        // Success state
        element.classList.remove('saving');
        element.classList.add('save-success');
        
        // Format the display
        if (displayFormat) {
            element.textContent = displayFormat(newValue);
        } else {
            element.textContent = newValue;
        }
        
        // Remove success class after animation
        setTimeout(() => {
            element.classList.remove('save-success');
        }, 2000);
        
        // Update ability score modifier if needed
        if (fieldType.endsWith('_score')) {
            updateAbilityModifier(element, newValue);
        }
    })
    .catch(error => {
        console.error('Error saving field:', error);
        
        // Error state
        element.classList.remove('saving');
        element.classList.add('save-error');
        element.textContent = originalText;
        
        // Show error message
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = 'Failed to save. Please try again.';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 15px';
        notification.style.backgroundColor = '#dc3545';
        notification.style.color = 'white';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '9999';
        document.body.appendChild(notification);
        
        // Remove notification after delay
        setTimeout(() => {
            notification.remove();
        }, 3000);
    });
}

/**
 * Update the modifier when an ability score changes
 * @param {Element} scoreElement - The score element
 * @param {string} newScore - The new score value
 */
function updateAbilityModifier(scoreElement, newScore) {
    const score = parseInt(newScore);
    if (isNaN(score)) return;
    
    const mod = Math.floor((score - 10) / 2);
    const modText = mod >= 0 ? `+${mod}` : mod.toString();
    
    // Find the next element that could be a modifier
    let currentElement = scoreElement;
    while (currentElement = currentElement.nextElementSibling) {
        const text = currentElement.textContent.trim();
        if (text.startsWith('+') || text.startsWith('-') || text === '0') {
            currentElement.textContent = modText;
            break;
        }
    }
}

/**
 * Get CSRF token from cookies
 * @returns {string} CSRF token
 */
function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(cookie => cookie.startsWith('csrf_token='));
    
    if (cookieValue) {
        return cookieValue.split('=')[1];
    }
    
    // Fallback to meta tag
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
        return csrfMeta.getAttribute('content');
    }
    
    return '';
}

// Add CSS
const style = document.createElement('style');
style.textContent = `
.editable-field {
    position: relative;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    border-bottom: 1px dashed #6c757d;
    transition: all 0.2s;
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

.editable-field.saving {
    opacity: 0.7;
    animation: pulse 1s infinite;
}

.editable-field.save-success {
    background-color: rgba(40, 167, 69, 0.1);
    border-bottom-color: #28a745;
}

.editable-field.save-error {
    background-color: rgba(220, 53, 69, 0.1);
    border-bottom-color: #dc3545;
}

@keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
}
`;
document.head.appendChild(style);
