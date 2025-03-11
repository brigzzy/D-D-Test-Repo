/**
 * Very simple inline editing - pure vanilla JS
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing basic inline editing...');
    
    // Get character ID from URL
    const pathParts = window.location.pathname.split('/');
    const characterId = pathParts[pathParts.length - 1];
    console.log('Character ID:', characterId);
    
    // Add basic notification banner
    const banner = document.createElement('div');
    banner.style.backgroundColor = '#e9f5ff';
    banner.style.padding = '10px';
    banner.style.marginBottom = '15px';
    banner.style.borderRadius = '4px';
    banner.innerHTML = '<strong>✏️ Editing Mode:</strong> Click on highlighted fields to edit';
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Find simple text nodes for Species, Background, Alignment
    findAndMakeEditable('Species', characterId);
    findAndMakeEditable('Background', characterId, true); // has [brackets]
    findAndMakeEditable('Alignment', characterId, true);  // has [brackets]
    
    // Make ability scores editable
    findAndMakeEditableScore('STR', characterId);
    findAndMakeEditableScore('DEX', characterId);
    findAndMakeEditableScore('CON', characterId);
    findAndMakeEditableScore('INT', characterId);
    findAndMakeEditableScore('WIS', characterId);
    findAndMakeEditableScore('CHA', characterId);
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
                    valuePart.style.borderBottom = '1px dashed blue';
                    valuePart.style.cursor = 'pointer';
                    valuePart.style.backgroundColor = 'rgba(0,123,255,0.1)';
                    valuePart.style.padding = '0 2px';
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
                        valueSpan.style.borderBottom = '1px dashed blue';
                        valueSpan.style.cursor = 'pointer';
                        valueSpan.style.backgroundColor = 'rgba(0,123,255,0.1)';
                        valueSpan.style.padding = '0 2px';
                        
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

function findAndMakeEditableScore(ability, characterId) {
    // Find all text nodes containing exactly this ability name
    const allTextNodes = [];
    const walker = document.createTreeWalker(
        document.body, 
        NodeFilter.SHOW_TEXT, 
        null
    );
    
    let node;
    while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text === ability && 
            node.parentNode.tagName !== 'SCRIPT' && 
            node.parentNode.tagName !== 'STYLE') {
            allTextNodes.push(node);
        }
    }
    
    // For each instance found
    allTextNodes.forEach(abilityNode => {
        // Look at next sibling text nodes
        let nextNode = abilityNode.nextSibling;
        while (nextNode) {
            if (nextNode.nodeType === Node.TEXT_NODE) {
                const text = nextNode.textContent.trim();
                // If it's a number, make it editable
                if (/^\d+$/.test(text)) {
                    console.log(`Found ${ability} score: ${text}`);
                    
                    // Create editable span
                    const valueSpan = document.createElement('span');
                    valueSpan.textContent = text;
                    valueSpan.style.borderBottom = '1px dashed blue';
                    valueSpan.style.cursor = 'pointer';
                    valueSpan.style.backgroundColor = 'rgba(0,123,255,0.1)';
                    valueSpan.style.padding = '0 2px';
                    
                    // Replace original node
                    nextNode.parentNode.replaceChild(valueSpan, nextNode);
                    
                    // Add click handler
                    valueSpan.addEventListener('click', function() {
                        startEditing(valueSpan, ability.toLowerCase() + '_score', characterId, updateModifier);
                    });
                    break;
                }
            }
            nextNode = nextNode.nextSibling;
        }
    });
}

function startEditing(element, fieldName, characterId, callback) {
    const originalValue = element.textContent;
    
    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalValue;
    input.style.width = (element.offsetWidth + 20) + 'px';
    input.style.padding = '2px';
    input.style.border = '1px solid blue';
    
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
    
    // Update display
    element.textContent = newValue;
    element.style.opacity = '0.5';
    
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
        element.style.opacity = '1';
        element.style.borderBottom = '1px solid green';
        setTimeout(() => {
            element.style.borderBottom = '1px dashed blue';
        }, 2000);
        
        if (callback) callback(element, newValue);
    })
    .catch(error => {
        console.error('Save error:', error);
        element.textContent = originalValue;
        element.style.opacity = '1';
        element.style.borderBottom = '1px solid red';
        setTimeout(() => {
            element.style.borderBottom = '1px dashed blue';
        }, 2000);
    });
}

function updateModifier(element, newValue) {
    const score = parseInt(newValue);
    if (isNaN(score)) return;
    
    const mod = Math.floor((score - 10) / 2);
    const modText = mod >= 0 ? `+${mod}` : mod.toString();
    
    // Find next sibling text node that contains the modifier
    let nextNode = element.nextSibling;
    while (nextNode) {
        if (nextNode.nodeType === Node.TEXT_NODE) {
            const text = nextNode.textContent.trim();
            if (text.startsWith('+') || text.startsWith('-') || text === '0') {
                nextNode.textContent = modText;
                break;
            }
        }
        nextNode = nextNode.nextSibling;
    }
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