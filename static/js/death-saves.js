/**
 * Death saves handling for D&D 5E character sheets
 * This script handles the UI and saving of death saving throws
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize after a short delay to ensure other scripts have loaded
    setTimeout(initializeDeathSaves, 300);
});

function initializeDeathSaves() {
    console.log('📊 Initializing death saves tracking...');
    
    // Get the character ID from the URL
    const pathParts = window.location.pathname.split('/');
    const characterId = pathParts[pathParts.length - 1];
    
    // Get the death saves container
    const deathSavesContainer = document.getElementById('death-saves');
    if (!deathSavesContainer) {
        console.error('❌ Death saves container not found');
        return;
    }
    
    // Get original markdown content
    const originalMarkdownDiv = document.querySelector('.original-markdown');
    if (!originalMarkdownDiv) {
        console.error('❌ Original markdown container not found');
        return;
    }
    
    let markdownContent = originalMarkdownDiv.textContent;
    console.log('📝 Found original markdown content');
    
    // Parse existing death save states from markdown
    const deathSaveStates = parseDeathSavesFromMarkdown(markdownContent);
    console.log('📊 Parsed death save states:', deathSaveStates);
    
    // Clear the container and build a new UI
    buildDeathSavesUI(deathSavesContainer, deathSaveStates, characterId, markdownContent);
}

function parseDeathSavesFromMarkdown(markdown) {
    // Default states (all unmarked)
    const states = {
        successMarks: [false, false, false],
        failureMarks: [false, false, false]
    };
    
    // Look for death saves section in the markdown
    const deathSaveSection = markdown.match(/##\s*Death Saves\s*\n([\s\S]*?)(?:\n\n|\n##|\n#|\s*$)/i);
    
    if (deathSaveSection && deathSaveSection[1]) {
        console.log('✅ Found death saves section in markdown');
        const deathSaveLines = deathSaveSection[1].trim().split('\n');
        
        // Parse each line looking for success/failure markings
        deathSaveLines.forEach(line => {
            const successMatch = line.match(/Success\s+(\d+):\s*(marked|unmarked)/i);
            const failureMatch = line.match(/Failure\s+(\d+):\s*(marked|unmarked)/i);
            
            if (successMatch) {
                const index = parseInt(successMatch[1]) - 1;
                if (index >= 0 && index < 3) {
                    states.successMarks[index] = successMatch[2].toLowerCase() === 'marked';
                }
            }
            
            if (failureMatch) {
                const index = parseInt(failureMatch[1]) - 1;
                if (index >= 0 && index < 3) {
                    states.failureMarks[index] = failureMatch[2].toLowerCase() === 'marked';
                }
            }
        });
    } else {
        console.log('ℹ️ No death saves section found in markdown');
    }
    
    return states;
}

function buildDeathSavesUI(container, states, characterId, markdownContent) {
    // Clear existing content
    container.innerHTML = '';
    
    // Add a label with reset button at the top
    const deathSavesHeader = document.createElement('div');
    deathSavesHeader.className = 'd5e-death-save-header';
    deathSavesHeader.style.display = 'flex';
    deathSavesHeader.style.justifyContent = 'space-between';
    deathSavesHeader.style.alignItems = 'center';
    deathSavesHeader.style.marginBottom = '8px';
    
    const headerLabel = document.createElement('label');
    headerLabel.textContent = 'Death Saves';
    headerLabel.style.fontWeight = 'bold';
    
    const resetAllBtn = document.createElement('span');
    resetAllBtn.textContent = '↺ Reset';
    resetAllBtn.title = 'Reset all death saves';
    resetAllBtn.style.cursor = 'pointer';
    resetAllBtn.style.color = '#7b2cbf';
    resetAllBtn.style.fontSize = '14px';
    
    deathSavesHeader.appendChild(headerLabel);
    deathSavesHeader.appendChild(resetAllBtn);
    container.appendChild(deathSavesHeader);
    
    // Create success row with hearts
    const successRow = document.createElement('div');
    successRow.className = 'd5e-death-save-row';
    successRow.innerHTML = '<label>Successes</label><div class="d5e-death-save-boxes"></div>';
    container.appendChild(successRow);
    
    // Create failure row with skulls
    const failureRow = document.createElement('div');
    failureRow.className = 'd5e-death-save-row';
    failureRow.innerHTML = '<label>Failures</label><div class="d5e-death-save-boxes"></div>';
    container.appendChild(failureRow);
    
    // Add success indicators (hearts)
    const successBoxes = successRow.querySelector('.d5e-death-save-boxes');
    const successHearts = [];
    
    for (let i = 0; i < 3; i++) {
        const heart = document.createElement('span');
        // Initialize based on parsed state
        const isActive = states.successMarks[i];
        heart.textContent = isActive ? '❤️' : '⚪';
        heart.className = 'emoji-indicator death-save-indicator';
        heart.setAttribute('data-index', i);
        heart.setAttribute('data-type', 'success');
        heart.setAttribute('data-active', isActive ? 'true' : 'false');
        heart.style.fontSize = '22px';
        heart.style.margin = '0 6px';
        heart.style.cursor = 'pointer';
        
        heart.addEventListener('click', function() {
            const isActive = heart.getAttribute('data-active') === 'true';
            const newState = !isActive;
            
            // Update heart and state
            heart.textContent = newState ? '❤️' : '⚪';
            heart.setAttribute('data-active', newState ? 'true' : 'false');
            states.successMarks[i] = newState;
            
            // Add visual feedback
            heart.classList.add('changed');
            setTimeout(() => heart.classList.remove('changed'), 500);
            
            // Save changes
            saveDeathSaves(characterId, states, markdownContent);
        });
        
        successHearts.push(heart);
        successBoxes.appendChild(heart);
    }
    
    // Add failure indicators (skulls)
    const failureBoxes = failureRow.querySelector('.d5e-death-save-boxes');
    const failureSkulls = [];
    
    for (let i = 0; i < 3; i++) {
        const skull = document.createElement('span');
        // Initialize based on parsed state
        const isActive = states.failureMarks[i];
        skull.textContent = isActive ? '💀' : '⚪';
        skull.className = 'emoji-indicator death-save-indicator';
        skull.setAttribute('data-index', i);
        skull.setAttribute('data-type', 'failure');
        skull.setAttribute('data-active', isActive ? 'true' : 'false');
        skull.style.fontSize = '22px';
        skull.style.margin = '0 6px';
        skull.style.cursor = 'pointer';
        
        skull.addEventListener('click', function() {
            const isActive = skull.getAttribute('data-active') === 'true';
            const newState = !isActive;
            
            // Update skull and state
            skull.textContent = newState ? '💀' : '⚪';
            skull.setAttribute('data-active', newState ? 'true' : 'false');
            states.failureMarks[i] = newState;
            
            // Add visual feedback
            skull.classList.add('changed');
            setTimeout(() => skull.classList.remove('changed'), 500);
            
            // Save changes
            saveDeathSaves(characterId, states, markdownContent);
        });
        
        failureSkulls.push(skull);
        failureBoxes.appendChild(skull);
    }
    
    // Add reset button functionality
    resetAllBtn.addEventListener('click', function() {
        // Reset all hearts
        successHearts.forEach((heart, index) => {
            heart.textContent = '⚪';
            heart.setAttribute('data-active', 'false');
            states.successMarks[index] = false;
        });
        
        // Reset all skulls
        failureSkulls.forEach((skull, index) => {
            skull.textContent = '⚪';
            skull.setAttribute('data-active', 'false');
            states.failureMarks[index] = false;
        });
        
        // Save all states to server
        saveDeathSaves(characterId, states, markdownContent);
        
        // Visual feedback for reset
        resetAllBtn.textContent = '✓ Reset';
        resetAllBtn.style.color = '#28a745';
        setTimeout(() => {
            resetAllBtn.textContent = '↺ Reset';
            resetAllBtn.style.color = '#7b2cbf';
        }, 1000);
    });
}

function saveDeathSaves(characterId, states, markdownContent) {
    // Get CSRF token from meta tag or cookie
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                     document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || '';
    
    console.log('💾 Saving death saves to server...');
    
    // The issue is likely in this endpoint - let's send the individual saves separately
    // instead of trying to update the whole section at once
    
    // Start with successes
    for (let i = 0; i < 3; i++) {
        fetch(`/characters/${characterId}/field`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                field: `death_save_success_${i+1}`,
                value: states.successMarks[i] ? 'marked' : 'unmarked'
            })
        })
        .then(response => {
            if (!response.ok) {
                console.error(`Error saving success ${i+1}:`, response.status);
            }
        })
        .catch(error => {
            console.error(`Error saving success ${i+1}:`, error);
        });
    }
    
    // Then failures
    for (let i = 0; i < 3; i++) {
        fetch(`/characters/${characterId}/field`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                field: `death_save_failure_${i+1}`,
                value: states.failureMarks[i] ? 'marked' : 'unmarked'
            })
        })
        .then(response => {
            if (!response.ok) {
                console.error(`Error saving failure ${i+1}:`, response.status);
            }
        })
        .catch(error => {
            console.error(`Error saving failure ${i+1}:`, error);
        });
    }
    
    // Also update the displayed markdown
    const originalMarkdownDiv = document.querySelector('.original-markdown');
    if (originalMarkdownDiv) {
        // Generate updated content for display
        const deathSavesContent = `## Death Saves
Success 1: ${states.successMarks[0] ? 'marked' : 'unmarked'}
Success 2: ${states.successMarks[1] ? 'marked' : 'unmarked'}
Success 3: ${states.successMarks[2] ? 'marked' : 'unmarked'}
Failure 1: ${states.failureMarks[0] ? 'marked' : 'unmarked'}
Failure 2: ${states.failureMarks[1] ? 'marked' : 'unmarked'}
Failure 3: ${states.failureMarks[2] ? 'marked' : 'unmarked'}`;

        // Update the markdown display without trying to send the whole content
        const updatedContent = updateMarkdownWithDeathSaves(markdownContent, deathSavesContent);
        originalMarkdownDiv.textContent = updatedContent;
    }
}

function updateMarkdownWithDeathSaves(markdownContent, deathSavesContent) {
    // Check if a Death Saves section already exists
    const deathSaveSection = markdownContent.match(/##\s*Death Saves\s*\n([\s\S]*?)(?:\n\n|\n##|\n#|\s*$)/i);
    
    if (deathSaveSection) {
        // Replace existing Death Saves section
        return markdownContent.replace(
            /##\s*Death Saves\s*\n([\s\S]*?)(?:\n\n|\n##|\n#|\s*$)/i,
            deathSavesContent + '\n\n'
        );
    } else {
        // Add the Death Saves section after Combat or at the end
        const combatSection = markdownContent.match(/##\s*Combat\s*\n([\s\S]*?)(?:\n\n|\n##|\n#|\s*$)/i);
        
        if (combatSection) {
            // Add after Combat section
            const combatFullMatch = combatSection[0];
            return markdownContent.replace(
                combatFullMatch,
                combatFullMatch + '\n\n' + deathSavesContent
            );
        } else {
            // Just append to the end
            return markdownContent.trim() + '\n\n' + deathSavesContent;
        }
    }
}
