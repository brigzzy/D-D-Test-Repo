/**
 * text-based-inline-editing.js
 * This script enables inline editing for character sheets that are rendered as plain text
 */

document.addEventListener('DOMContentLoaded', function() {
  // Extract character ID from the URL path
  const pathParts = window.location.pathname.split('/');
  const characterId = pathParts[pathParts.length - 1]; // Assumes path like /character/123
  
  // Initialize editing functionality
  initInlineEditing(characterId);
  
  // Add an info banner about editing capability
  addEditingInfoBanner();
});

/**
* Initialize inline editing for the character sheet
* @param {string} characterId - The ID of the character being edited
*/
function initInlineEditing(characterId) {
  // Find the main content area that contains the character text
  const mainContent = document.querySelector('.container') || document.body;
  
  // Find all text nodes that represent character data
  processTextNodes(mainContent, characterId);
}

/**
* Process text nodes to make editable fields
* @param {HTMLElement} container - The container element
* @param {string} characterId - The ID of the character
*/
function processTextNodes(container, characterId) {
  // Define fields that can be edited and their regex patterns
  const editableFields = [
      { 
          name: 'species',
          pattern: /^Species$/,
          valuePattern: /^Species\s*(.*)$/,
          fieldType: 'species'
      },
      { 
          name: 'background',
          pattern: /^Background\s*\[.*\]$/,
          valuePattern: /^Background\s*\[(.*)\]$/,
          fieldType: 'background'
      },
      { 
          name: 'alignment',
          pattern: /^Alignment\s*\[.*\]$/,
          valuePattern: /^Alignment\s*\[(.*)\]$/,
          fieldType: 'alignment'
      },
      // Ability scores
      { 
          name: 'STR',
          pattern: /^STR$/,
          valueType: 'next-line',
          fieldType: 'str_score'
      },
      { 
          name: 'DEX',
          pattern: /^DEX$/,
          valueType: 'next-line',
          fieldType: 'dex_score'
      },
      { 
          name: 'CON',
          pattern: /^CON$/,
          valueType: 'next-line', 
          fieldType: 'con_score'
      },
      { 
          name: 'INT',
          pattern: /^INT$/,
          valueType: 'next-line',
          fieldType: 'int_score'
      },
      { 
          name: 'WIS',
          pattern: /^WIS$/,
          valueType: 'next-line',
          fieldType: 'wis_score'
      },
      { 
          name: 'CHA',
          pattern: /^CHA$/,
          valueType: 'next-line',
          fieldType: 'cha_score'
      }
  ];
  
  // Get all text nodes in the document
  const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      { acceptNode: node => node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
  );
  
  const textNodes = [];
  let currentNode;
  while (currentNode = walker.nextNode()) {
      textNodes.push(currentNode);
  }
  
  // Process each text node to find editable fields
  for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      const trimmedText = node.textContent.trim();
      
      // Check if this text node matches any of our editable fields
      for (const field of editableFields) {
          if (field.pattern.test(trimmedText)) {
              // This is a field we want to make editable
              
              // For fields with values on the same line
              if (field.valuePattern) {
                  const match = trimmedText.match(field.valuePattern);
                  if (match) {
                      const value = match[1].trim();
                      wrapNodeWithEditableSpan(node, field.fieldType, value, characterId);
                  }
              }
              
              // For fields with values on the next line
              if (field.valueType === 'next-line' && i + 1 < textNodes.length) {
                  const valueNode = textNodes[i + 1];
                  const valueText = valueNode.textContent.trim();
                  
                  // Skip the modifier line
                  if (valueText.startsWith('+') || valueText.startsWith('-')) {
                      continue;
                  }
                  
                  wrapNodeWithEditableSpan(valueNode, field.fieldType, valueText, characterId);
              }
          }
      }
  }
}

/**
* Wrap a text node with an editable span element
* @param {Node} textNode - The text node to wrap
* @param {string} fieldName - The name of the field
* @param {string} value - The current value
* @param {string} characterId - The character ID
*/
function wrapNodeWithEditableSpan(textNode, fieldName, value, characterId) {
  // Create a span element to replace the text node
  const span = document.createElement('span');
  span.className = 'editable-field';
  span.setAttribute('data-field', fieldName);
  span.textContent = textNode.textContent;
  
  // Replace the text node with our span
  textNode.parentNode.replaceChild(span, textNode);
  
  // Add click handler to make it editable
  span.addEventListener('click', function() {
      startEditing(span, fieldName, characterId);
  });
}

/**
* Start the editing process for a field
* @param {HTMLElement} element - The element to edit
* @param {string} fieldName - The name of the field being edited
* @param {string} characterId - The ID of the character
*/
function startEditing(element, fieldName, characterId) {
  // Check if already editing
  if (element.querySelector('input')) return;
  
  // Get current text and find the actual value to edit
  const fullText = element.textContent;
  let valueToEdit = '';
  let prefixText = '';
  
  // Extract the actual value based on the field type
  if (fieldName === 'species') {
      valueToEdit = fullText.replace('Species', '').trim();
      prefixText = 'Species ';
  } else if (fieldName === 'background') {
      const match = fullText.match(/Background\s*\[(.*)\]/);
      if (match) {
          valueToEdit = match[1];
          prefixText = 'Background [';
      }
  } else if (fieldName === 'alignment') {
      const match = fullText.match(/Alignment\s*\[(.*)\]/);
      if (match) {
          valueToEdit = match[1];
          prefixText = 'Alignment [';
      }
  } else if (fieldName.endsWith('_score')) {
      // For ability scores, the entire text is the value
      valueToEdit = fullText;
      prefixText = '';
  }
  
  // Create an input for editing
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'inline-edit-input';
  input.value = valueToEdit;
  
  // Clear the element content and add prefix + input
  element.textContent = '';
  if (prefixText) {
      const prefix = document.createTextNode(prefixText);
      element.appendChild(prefix);
  }
  element.appendChild(input);
  
  // If editing background or alignment, add the closing bracket
  if (fieldName === 'background' || fieldName === 'alignment') {
      const suffix = document.createTextNode(']');
      element.appendChild(suffix);
  }
  
  // Focus and select all text in the input
  input.focus();
  input.select();
  
  // Store original text for cancel operation
  const originalText = fullText;
  
  // Handle input blur (save on focus lost)
  input.addEventListener('blur', function() {
      saveEdit(element, input, fieldName, characterId, originalText, prefixText);
  });
  
  // Handle Enter key press
  input.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
          saveEdit(element, input, fieldName, characterId, originalText, prefixText);
          event.preventDefault();
      } else if (event.key === 'Escape') {
          // Cancel edit and restore original text
          element.textContent = originalText;
          event.preventDefault();
      }
  });
}

/**
* Save the edited value
* @param {HTMLElement} element - The element being edited
* @param {HTMLInputElement} input - The input field
* @param {string} fieldName - The field name
* @param {string} characterId - The character ID
* @param {string} originalText - The original element text
* @param {string} prefixText - Text that comes before the editable value
*/
function saveEdit(element, input, fieldName, characterId, originalText, prefixText) {
  const newValue = input.value.trim();
  
  // Show loading state
  element.classList.add('saving');
  
  // Format the display text based on field type
  let displayText = '';
  if (fieldName === 'species') {
      displayText = `Species ${newValue}`;
  } else if (fieldName === 'background') {
      displayText = `Background [${newValue}]`;
  } else if (fieldName === 'alignment') {
      displayText = `Alignment [${newValue}]`;
  } else if (fieldName.endsWith('_score')) {
      displayText = newValue;
  }
  
  // Send to server
  fetch(`/character/${characterId}/field`, {
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
      // Success - update display
      element.textContent = displayText;
      element.classList.remove('saving');
      element.classList.add('save-success');
      
      // Reset the success highlight after a delay
      setTimeout(() => {
          element.classList.remove('save-success');
      }, 2000);
      
      // If this is an ability score, also update the modifier line
      if (fieldName.endsWith('_score')) {
          updateAbilityModifier(element, newValue);
      }
  })
  .catch(error => {
      console.error('Error saving:', error);
      
      // Restore the original text on error
      element.textContent = originalText;
      element.classList.remove('saving');
      element.classList.add('save-error');
      
      // Show error notification
      showNotification('Error saving change. Please try again.', 'error');
      
      // Reset the error highlight after a delay
      setTimeout(() => {
          element.classList.remove('save-error');
      }, 2000);
  });
}

/**
* Update the ability modifier after changing an ability score
* @param {HTMLElement} scoreElement - The score element
* @param {string} newScore - The new ability score
*/
function updateAbilityModifier(scoreElement, newScore) {
  // Find the next text node (should be the modifier)
  const score = parseInt(newScore);
  if (isNaN(score)) return;
  
  const mod = Math.floor((score - 10) / 2);
  const modText = mod >= 0 ? `+${mod}` : mod.toString();
  
  // Look for the next text node that could be a modifier
  let next = scoreElement.nextSibling;
  while (next) {
      if (next.nodeType === Node.TEXT_NODE && 
          (next.textContent.trim().startsWith('+') || 
           next.textContent.trim().startsWith('-') ||
           next.textContent.trim() === '0')) {
          next.textContent = modText;
          break;
      }
      next = next.nextSibling;
  }
  
  // If we didn't find it as a direct sibling, look for the next element
  if (!next) {
      const parent = scoreElement.parentNode;
      const siblings = Array.from(parent.childNodes);
      const index = siblings.indexOf(scoreElement);
      
      for (let i = index + 1; i < siblings.length; i++) {
          const node = siblings[i];
          if (node.nodeType === Node.TEXT_NODE && 
              (node.textContent.trim().startsWith('+') || 
               node.textContent.trim().startsWith('-') ||
               node.textContent.trim() === '0')) {
              node.textContent = modText;
              break;
          }
      }
  }
}

/**
* Add banner with editing instructions
*/
function addEditingInfoBanner() {
  const banner = document.createElement('div');
  banner.className = 'editing-info-banner';
  banner.innerHTML = `
      <div class="info-content">
          <i class="bi bi-pencil-square"></i> 
          <span>Click on highlighted fields to edit your character</span>
          <button class="close-btn">&times;</button>
      </div>
  `;
  
  // Add to page
  const container = document.querySelector('.container') || document.body;
  container.insertBefore(banner, container.firstChild);
  
  // Add close button functionality
  const closeBtn = banner.querySelector('.close-btn');
  closeBtn.addEventListener('click', function() {
      banner.style.display = 'none';
      
      // Remember this preference
      localStorage.setItem('hideEditingBanner', 'true');
  });
  
  // Check if banner should be hidden
  if (localStorage.getItem('hideEditingBanner') === 'true') {
      banner.style.display = 'none';
  }
}

/**
* Show a notification message
* @param {string} message - The message to display
* @param {string} type - The type of notification (success, error)
*/
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Remove after a delay
  setTimeout(() => {
      notification.classList.add('hiding');
      setTimeout(() => {
          notification.remove();
      }, 500);
  }, 3000);
}

/**
* Get CSRF token from cookies or meta tag
* @returns {string} CSRF token
*/
function getCSRFToken() {
  // Try to get from cookie
  const cookieValue = document.cookie
      .split('; ')
      .find(cookie => cookie.startsWith('csrf_token='));
  
  if (cookieValue) {
      return cookieValue.split('=')[1];
  }
  
  // Try to get from meta tag
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  if (csrfMeta) {
      return csrfMeta.getAttribute('content');
  }
  
  return '';
}

// Add CSS styles
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
  
  .inline-edit-input {
      padding: 2px 4px;
      border: 1px solid #007bff;
      border-radius: 3px;
      font-size: inherit;
      outline: none;
      background-color: white;
  }
  
  .editable-field.saving {
      background-color: rgba(0, 123, 255, 0.1);
      animation: pulse 1s infinite;
  }
  
  .editable-field.save-success {
      background-color: rgba(40, 167, 69, 0.1);
      border-bottom-color: #28a745;
      transition: background-color 1s;
  }
  
  .editable-field.save-error {
      background-color: rgba(220, 53, 69, 0.1);
      border-bottom-color: #dc3545;
      transition: background-color 1s;
  }
  
  .editing-info-banner {
      background-color: #e9ecef;
      padding: 10px;
      margin-bottom: 15px;
      border-radius: 4px;
      border-left: 4px solid #007bff;
  }
  
  .editing-info-banner .info-content {
      display: flex;
      align-items: center;
      gap: 10px;
  }
  
  .editing-info-banner .close-btn {
      margin-left: auto;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      opacity: 0.5;
  }
  
  .editing-info-banner .close-btn:hover {
      opacity: 1;
  }
  
  .notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 15px;
      border-radius: 4px;
      background-color: #343a40;
      color: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      opacity: 0.9;
      transition: opacity 0.5s;
  }
  
  .notification.success {
      background-color: #28a745;
  }
  
  .notification.error {
      background-color: #dc3545;
  }
  
  .notification.hiding {
      opacity: 0;
  }
  
  @keyframes pulse {
      0% { opacity: 0.7; }
      50% { opacity: 1; }
      100% { opacity: 0.7; }
  }
`;
document.head.appendChild(style);