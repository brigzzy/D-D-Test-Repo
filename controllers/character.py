from flask import Blueprint, render_template, redirect, url_for, flash, request, abort, jsonify
from flask_login import login_required, current_user
from models import db, Character

import os
import re

# Create a Blueprint for character-related routes
character = Blueprint('character', __name__)

@character.route('/new', methods=['GET', 'POST'])
@login_required
def new():
    """Create a new character."""
    if request.method == 'POST':
        # Get form data
        name = request.form.get('name')
        character_class = request.form.get('character_class', '')
        level = int(request.form.get('level', 1))
        species = request.form.get('species', '')
        content = request.form.get('content', '')
        
        # Validate required fields
        if not name:
            flash('Character name is required', 'warning')
            return render_template('character_edit.html', character=None, is_new=True)
        
        # Create the new character
        new_character = Character(
            name=name,
            character_class=character_class,
            level=level,
            species=species,
            user_id=current_user.id
        )
        
        # Add to database
        db.session.add(new_character)
        db.session.commit()
        
        # Save the character sheet content
        new_character.save_content(content)
        
        flash(f'Character "{name}" created successfully', 'success')
        return redirect(url_for('character.view', character_id=new_character.id))
    
    # GET request - show the create form
    # Provide a template if requested
    if request.args.get('template') == 'true':
        # Read the sample character template
        sample_path = 'templates/sample_character.md'
        try:
            with open(sample_path, 'r') as f:
                template_content = f.read()
        except FileNotFoundError:
            # Fallback to a simple template if file not found
            template_content = """# Character Name

## Character Information
Species: 
Class: 
Level: 1
Background: 
Alignment: 

## Core Statistics
Strength: 10
Dexterity: 10
Constitution: 10
Intelligence: 10
Wisdom: 10
Charisma: 10

## Combat
Armor Class: 10
Initiative: +0
Speed: 30
Maximum HP: 10
Current HP: 10
Temporary HP: 0
Hit Dice: 1d8

## Death Saves
Success 1: unmarked
Success 2: unmarked
Success 3: unmarked
Failure 1: unmarked
Failure 2: unmarked
Failure 3: unmarked

## Skills
(List skills you're proficient in)

## Weapons
- Weapon | Attack Bonus | Damage | Type

## Equipment
- (List your equipment here)

## Currency
Gold: 0
Silver: 0
Copper: 0

## Features & Traits
(List class features, racial traits, and other special abilities)

## Background
(Your character's backstory)

## Personality Traits
(Your character's personality)

## Ideals
(What principles does your character believe in?)

## Bonds
(What connects your character to people, places, or events?)

## Flaws
(What are your character's shortcomings?)
"""
        return render_template('character_edit.html', character=None, content=template_content, is_new=True)
    
    return render_template('character_edit.html', character=None, is_new=True)

@character.route('/<int:character_id>/field', methods=['POST'])
@login_required
def update_field(character_id):
    """
    Unified API endpoint to update a field in a character's markdown file.
    
    Expected JSON payload:
    {
        "field": "field_name",
        "value": "new_value"
    }
    """
    # Validate request
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    
    data = request.json
    field = data.get('field')
    value = data.get('value')
    
    # Debug logging
    print(f"Updating field: {field} with value: {value}")
    
    # Validate required fields
    if not field or value is None:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Find the character in the database
    character = Character.query.get_or_404(character_id)
    
    # Security check - only owner can edit (and admin)
    if character.user_id != current_user.id and not current_user.is_admin:
        return jsonify({"error": "Not authorized to edit this character"}), 403
    
    try:
        # Use the standardized update_field method from the Character model
        success = character.update_field(field, value)
        
        if success:
            return jsonify({
                "success": True, 
                "message": f"Updated {field} successfully"
            }), 200
        else:
            # Debug logging for failed updates
            print(f"Failed to update field {field} - not supported or no pattern match")
            return jsonify({
                "error": f"Failed to update {field}. Field may not be supported."
            }), 400
            
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error updating character field: {str(e)}")
        print(error_trace)
        return jsonify({"error": str(e)}), 500

@character.route('/<int:character_id>', methods=['GET'])
@login_required
def view(character_id):
    """View a character."""
    character = Character.query.get_or_404(character_id)
    
    # Security check - only owner can view (and admin)
    if character.user_id != current_user.id and not current_user.is_admin:
        abort(403)  # Forbidden
    
    content = character.get_content()
    
    # Use the new 5E character sheet view template
    return render_template('character_view.html', character=character, content=content)

@character.route('/<int:character_id>/edit', methods=['GET', 'POST'])
@login_required
def edit(character_id):
    """Edit a character."""
    character = Character.query.get_or_404(character_id)
    
    # Security check - only owner can edit (and admin)
    if character.user_id != current_user.id and not current_user.is_admin:
        abort(403)  # Forbidden
    
    if request.method == 'POST':
        # Update character metadata
        character.name = request.form.get('name', character.name)
        character.character_class = request.form.get('character_class', character.character_class)
        character.level = int(request.form.get('level', character.level))
        character.species = request.form.get('species', character.species)
        
        # Update character content
        content = request.form.get('content', '')
        character.save_content(content)
        
        # Save changes to database
        db.session.commit()
        
        flash('Character updated successfully', 'success')
        return redirect(url_for('character.view', character_id=character.id))
    
    # GET request - show the edit form
    content = character.get_content()
    return render_template('character_edit.html', character=character, content=content, is_new=False)

@character.route('/<int:character_id>/delete', methods=['POST'])
@login_required
def delete(character_id):
    """Delete a character."""
    character = Character.query.get_or_404(character_id)
    
    # Security check - only owner can delete (and admin)
    if character.user_id != current_user.id and not current_user.is_admin:
        abort(403)  # Forbidden
    
    character_name = character.name
    
    # Delete the character file first
    character.delete_file()
    
    # Delete from database
    db.session.delete(character)
    db.session.commit()
    
    flash(f'Character "{character_name}" has been deleted', 'success')
    return redirect(url_for('main.dashboard'))




def _update_skill_proficiency(self, content, skill_name, proficiency_value):
    """Update skill proficiency in markdown content"""
    # Find Skills section
    skills_section = re.search(r'^##\s*Skills\s*\n([\s\S]*?)(?:\n\n|\n##|\n#|\s*$)', content, re.MULTILINE)
    
    skill_pattern = re.compile(f"{re.escape(skill_name)}:\\s*(Proficient|Expertise|Not Proficient)", re.MULTILINE | re.IGNORECASE)
    
    if skills_section:
        # Skills section exists, check if the skill is listed
        skill_match = skill_pattern.search(content)
        
        if skill_match:
            # Update existing skill
            return skill_pattern.sub(f"{skill_name}: {proficiency_value}", content)
        else:
            # Add skill to existing section
            section_end = skills_section.end()
            return content[:section_end] + f"\n{skill_name}: {proficiency_value}" + content[section_end:]
    else:
        # Create new Skills section
        skills_content = f"\n\n## Skills\n{skill_name}: {proficiency_value}"
        
        # Find a good place to insert it
        abilities_section = re.search(r'^##\s*Core Statistics', content, re.MULTILINE)
        if abilities_section:
            # Add after abilities
            next_section = re.search(r'^##', content[abilities_section.end():], re.MULTILINE)
            if next_section:
                insert_point = abilities_section.end() + next_section.start()
                return content[:insert_point] + skills_content + content[insert_point:]
        
        # Default: add at the end
        return content + skills_content


def _add_field_to_section(self, content, field, value):
    """Add a field to the appropriate section if it doesn't exist.
    
    Args:
        content (str): Current markdown content
        field (str): Field identifier
        value (any): Value to set
        
    Returns:
        str: Updated markdown content
    """
    # Determine which section the field belongs to
    section_mappings = {
        # Map fields to section titles and field labels
        'species': ('Character Information', 'Species'),
        'class': ('Character Information', 'Class'),
        'level': ('Character Information', 'Level'),
        'background': ('Character Information', 'Background'),
        'alignment': ('Character Information', 'Alignment'),
        
        'str_score': ('Core Statistics', 'Strength'),
        'dex_score': ('Core Statistics', 'Dexterity'),
        'con_score': ('Core Statistics', 'Constitution'),
        'int_score': ('Core Statistics', 'Intelligence'),
        'wis_score': ('Core Statistics', 'Wisdom'),
        'cha_score': ('Core Statistics', 'Charisma'),
        
        'armor_class': ('Combat', 'Armor Class'),
        'initiative': ('Combat', 'Initiative'),
        'speed': ('Combat', 'Speed'),
        'max_hp': ('Combat', 'Maximum HP'),
        'current_hp': ('Combat', 'Current HP'),
        'temp_hp': ('Combat', 'Temporary HP'),
        'hit_dice': ('Combat', 'Hit Dice'),
        
        'gold': ('Currency', 'Gold'),
        'silver': ('Currency', 'Silver'),
        'copper': ('Currency', 'Copper'),
        'electrum': ('Currency', 'Electrum'),
        'platinum': ('Currency', 'Platinum'),
        
        'personality_traits': ('Personality', 'Personality Traits'),
        'ideals': ('Personality', 'Ideals'),
        'bonds': ('Personality', 'Bonds'),
        'flaws': ('Personality', 'Flaws'),
    }
    
    if field in section_mappings:
        section_title, field_label = section_mappings[field]
        
        # Look for the section
        section_match = re.search(f'^##\\s*{section_title}', content, re.MULTILINE)
        
        if section_match:
            # Find the end of the section (next section or end of file)
            section_start = section_match.start()
            next_section = re.search('^##\\s', content[section_match.end():], re.MULTILINE)
            
            if next_section:
                section_end = section_match.end() + next_section.start()
            else:
                section_end = len(content)
            
            # Add the new field at the end of the section
            return (
                content[:section_end] + 
                f"\n{field_label}: {value}" + 
                content[section_end:]
            )
        else:
            # Section doesn't exist, create it with the field
            # Find a good spot to add it (after the last section or at the end)
            last_section = list(re.finditer('^##\\s', content, re.MULTILINE))
            
            if last_section:
                last_section_end = last_section[-1].start()
                next_section = re.search('^##\\s', content[last_section_end+1:], re.MULTILINE)
                
                if next_section:
                    insert_point = last_section_end + 1 + next_section.start()
                else:
                    insert_point = len(content)
            else:
                # No sections, add after the title
                title_match = re.search('^#\\s', content, re.MULTILINE)
                if title_match:
                    insert_point = title_match.end() + content[title_match.end():].find('\n') + 1
                else:
                    insert_point = len(content)
            
            return (
                content[:insert_point] + 
                f"\n\n## {section_title}\n{field_label}: {value}\n" + 
                content[insert_point:]
            )
    
    # If we don't have a mapping, just append to the end
    return content + f"\n\n{field}: {value}"


def _update_death_saves(self, content, field, value):
    """Update death save information in the markdown content.
    
    Args:
        content (str): Current markdown content
        field (str): Death save field identifier (e.g., death_save_success_1)
        value (str): 'marked' or 'unmarked'
        
    Returns:
        str: Updated markdown content
    """
    # Parse field name for type and index
    parts = field.split('_')
    if len(parts) < 4:
        return None
        
    save_type = parts[2]  # 'success' or 'failure'
    save_index = parts[3]  # '1', '2', or '3'
    
    # Find the Death Saves section
    death_saves_section = re.search(r'^##\s*Death Saves\s*\n([\s\S]*?)(?:\n\n|\n##|\n#|\s*$)', content, re.MULTILINE)
    
    if death_saves_section:
        # Extract the section to modify it
        section_text = death_saves_section.group(0)
        
        # Find and replace the specific save entry
        save_pattern = re.compile(f"{save_type.capitalize()} {save_index}: (marked|unmarked)", re.IGNORECASE)
        updated_section = save_pattern.sub(f"{save_type.capitalize()} {save_index}: {value}", section_text)
        
        # Replace the section in the content
        return content.replace(section_text, updated_section)
    else:
        # Need to create the Death Saves section
        death_saves_content = f"""## Death Saves
Success 1: unmarked
Success 2: unmarked
Success 3: unmarked
Failure 1: unmarked
Failure 2: unmarked
Failure 3: unmarked"""
        
        # Update the specific save
        save_pattern = re.compile(f"{save_type.capitalize()} {save_index}: (marked|unmarked)", re.IGNORECASE)
        death_saves_content = save_pattern.sub(f"{save_type.capitalize()} {save_index}: {value}", death_saves_content)
        
        # Find the right place to add it (after Combat section if it exists)
        combat_section = re.search(r'^##\s*Combat\s*\n([\s\S]*?)(?:\n\n|\n##|\n#|\s*$)', content, re.MULTILINE)
        
        if combat_section:
            combat_end = combat_section.end()
            return content[:combat_end] + "\n\n" + death_saves_content + content[combat_end:]
        else:
            # Just add at the end
            return content + "\n\n" + death_saves_content