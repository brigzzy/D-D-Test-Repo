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
species: 
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

@character.route('/<character_id>/field', methods=['POST'])
@login_required
def update_character_field(character_id):
    """
    API endpoint to update a specific field in a character's markdown file
    """
    # Validate request
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    
    data = request.json
    field = data.get('field')
    value = data.get('value')
    
    # Validate required fields
    if not field or value is None:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Find the character in the database
    character = Character.query.get_or_404(character_id)
    
    # Security check - only owner can edit (and admin)
    if character.user_id != current_user.id and not current_user.is_admin:
        return jsonify({"error": "Not authorized to edit this character"}), 403
    
    try:
        # Get the content of the markdown file
        content = character.get_content()
        
        # Update the field based on the field name
        updated_content = None
        
        # Dictionary of field names to their regex patterns
        field_patterns = {
            'species': (r'^(species|Species):\s*(.*)$', f"\\1: {value}"),
            'background': (r'^(background|Background):\s*(.*)$', f"\\1: {value}"),
            'alignment': (r'^(alignment|Alignment):\s*(.*)$', f"\\1: {value}"),
            'str_score': (r'^(str|strength|STR|Strength):\s*(\d+)$', f"\\1: {value}"),
            'dex_score': (r'^(dex|dexterity|DEX|Dexterity):\s*(\d+)$', f"\\1: {value}"),
            'con_score': (r'^(con|constitution|CON|Constitution):\s*(\d+)$', f"\\1: {value}"),
            'int_score': (r'^(int|intelligence|INT|Intelligence):\s*(\d+)$', f"\\1: {value}"),
            'wis_score': (r'^(wis|wisdom|WIS|Wisdom):\s*(\d+)$', f"\\1: {value}"),
            'cha_score': (r'^(cha|charisma|CHA|Charisma):\s*(\d+)$', f"\\1: {value}"),
            'max_hp': (r'^(max hp|maximum hp|Max HP|Maximum HP):\s*(\d+)$', f"\\1: {value}"),
            'current_hp': (r'^(current hp|Current HP):\s*(\d+)$', f"\\1: {value}"),
            'temp_hp': (r'^(temp hp|temporary hp|Temp HP|Temporary HP):\s*(\d+)$', f"\\1: {value}"),
            'personality_traits': (r'^(personality traits|Personality Traits):\s*(.*)$', f"\\1: {value}"),
            'ideals': (r'^(ideals|Ideals):\s*(.*)$', f"\\1: {value}"),
            'bonds': (r'^(bonds|Bonds):\s*(.*)$', f"\\1: {value}"),
            'flaws': (r'^(flaws|Flaws):\s*(.*)$', f"\\1: {value}"),
            
            # Add patterns for saving throw proficiencies
            'str_save_proficiency': (r'^(str|strength|STR|Strength)\s+Save:\s*(Proficient|Not Proficient)$', f"\\1 Save: {value}"),
            'dex_save_proficiency': (r'^(dex|dexterity|DEX|Dexterity)\s+Save:\s*(Proficient|Not Proficient)$', f"\\1 Save: {value}"),
            'con_save_proficiency': (r'^(con|constitution|CON|Constitution)\s+Save:\s*(Proficient|Not Proficient)$', f"\\1 Save: {value}"),
            'int_save_proficiency': (r'^(int|intelligence|INT|Intelligence)\s+Save:\s*(Proficient|Not Proficient)$', f"\\1 Save: {value}"),
            'wis_save_proficiency': (r'^(wis|wisdom|WIS|Wisdom)\s+Save:\s*(Proficient|Not Proficient)$', f"\\1 Save: {value}"),
            'cha_save_proficiency': (r'^(cha|charisma|CHA|Charisma)\s+Save:\s*(Proficient|Not Proficient)$', f"\\1 Save: {value}")
        }
        
        # Check if we have a pattern for this field
        if field in field_patterns:
            pattern, replacement = field_patterns[field]
            field_pattern = re.compile(pattern, re.MULTILINE | re.IGNORECASE)
            
            match = field_pattern.search(content)
            if match:
                # Replace the value part
                updated_content = field_pattern.sub(replacement, content)
            else:
                # If field doesn't exist yet, add it after the header section or at a logical place
                if field.endswith('_score'):
                    # Look for the ability scores section
                    ability_section = re.search(r'(##?\s*Core Statistics|##?\s*Ability Scores)', content, re.IGNORECASE)
                    if ability_section:
                        section_end = content.find('\n\n', ability_section.end())
                        if section_end != -1:
                            updated_content = content[:section_end] + f"\n{field_name}: {value}" + content[section_end:]
                        else:
                            # Add at the end of the file
                            updated_content = content + f"\n\n{field_name}: {value}\n"
                elif field.startswith('death_save_'):
                    # Handle death saves
                    # Parsing death_save_success_1 or death_save_failure_2
                    parts = field.split('_')
                    if len(parts) >= 4:
                        save_type = parts[2]  # success or failure
                        save_index = parts[3]  # 1, 2, or 3
                        
                        # Look for the Death Saves section
                        death_save_section = re.search(r'##?\s*Death Saves', content, re.IGNORECASE)
                        
                        if death_save_section:
                            # Find the line with this specific death save
                            pattern = fr"{save_type.capitalize()} {save_index}: (marked|unmarked)"
                            save_line = re.search(pattern, content, re.IGNORECASE)
                            
                            if save_line:
                                # Replace the existing line
                                updated_content = re.sub(
                                    pattern, 
                                    f"{save_type.capitalize()} {save_index}: {value}", 
                                    content, 
                                    flags=re.IGNORECASE
                                )
                            else:
                                # Add a new line to the section
                                section_end = content.find('\n\n', death_save_section.end())
                                if section_end != -1:
                                    updated_content = content[:section_end] + f"\n{save_type.capitalize()} {save_index}: {value}" + content[section_end:]
                                else:
                                    # Add at the end of the section
                                    updated_content = content + f"\n{save_type.capitalize()} {save_index}: {value}\n"
                        else:
                            # Create a new Death Saves section
                            combat_section = re.search(r'##?\s*Combat', content, re.IGNORECASE)
                            
                            if combat_section:
                                section_end = content.find('\n\n', combat_section.end())
                                if section_end != -1:
                                    updated_content = content[:section_end] + f"\n\n## Death Saves\n{save_type.capitalize()} {save_index}: {value}" + content[section_end:]
                                else:
                                    # Add at the end
                                    updated_content = content + f"\n\n## Death Saves\n{save_type.capitalize()} {save_index}: {value}\n"
                            else:
                                # Just add at the end
                                updated_content = content + f"\n\n## Death Saves\n{save_type.capitalize()} {save_index}: {value}\n"
                elif field.endswith('_save_proficiency'):
                    # Handle saving throw proficiencies
                    ability = field.split('_')[0]
                    save_section = re.search(r'##?\s*Saving Throws', content, re.IGNORECASE)
                    if save_section:
                        section_end = content.find('\n\n', save_section.end())
                        ability_name = {
                            'str': 'Strength',
                            'dex': 'Dexterity',
                            'con': 'Constitution',
                            'int': 'Intelligence',
                            'wis': 'Wisdom',
                            'cha': 'Charisma'
                        }.get(ability, ability.title())
                        
                        if section_end != -1:
                            updated_content = content[:section_end] + f"\n{ability_name} Save: {value}" + content[section_end:]
                        else:
                            # Add at the end of the section
                            updated_content = content + f"\n{ability_name} Save: {value}\n"
                    else:
                        # Create a saving throws section after Core Statistics
                        ability_name = {
                            'str': 'Strength',
                            'dex': 'Dexterity',
                            'con': 'Constitution',
                            'int': 'Intelligence',
                            'wis': 'Wisdom',
                            'cha': 'Charisma'
                        }.get(ability, ability.title())
                        
                        core_stats = re.search(r'##?\s*Core Statistics', content, re.IGNORECASE)
                        if core_stats:
                            section_end = content.find('\n\n', core_stats.end())
                            if section_end != -1:
                                updated_content = content[:section_end] + f"\n\n## Saving Throws\n{ability_name} Save: {value}" + content[section_end:]
                            else:
                                # Add at the end
                                updated_content = content + f"\n\n## Saving Throws\n{ability_name} Save: {value}\n"
                        else:
                            # Just add at the end
                            updated_content = content + f"\n\n## Saving Throws\n{ability_name} Save: {value}\n"
        elif field.endswith('_save_proficiency'):
            # Handle saving throw proficiencies
            ability = field.split('_')[0]
            save_section = re.search(r'##?\s*Saving Throws', content, re.IGNORECASE)
            if save_section:
                section_end = content.find('\n\n', save_section.end())
                ability_name = {
                    'str': 'Strength',
                    'dex': 'Dexterity',
                    'con': 'Constitution',
                    'int': 'Intelligence',
                    'wis': 'Wisdom',
                    'cha': 'Charisma'
                }.get(ability, ability.title())
                
                if section_end != -1:
                    updated_content = content[:section_end] + f"\n{ability_name} Save: {value}" + content[section_end:]
                else:
                    # Add at the end of the section
                    updated_content = content + f"\n{ability_name} Save: {value}\n"
            else:
                # Create a saving throws section after Core Statistics
                ability_name = {
                    'str': 'Strength',
                    'dex': 'Dexterity',
                    'con': 'Constitution',
                    'int': 'Intelligence',
                    'wis': 'Wisdom',
                    'cha': 'Charisma'
                }.get(ability, ability.title())
                
                core_stats = re.search(r'##?\s*Core Statistics', content, re.IGNORECASE)
                if core_stats:
                    section_end = content.find('\n\n', core_stats.end())
                    if section_end != -1:
                        updated_content = content[:section_end] + f"\n\n## Saving Throws\n{ability_name} Save: {value}" + content[section_end:]
                    else:
                        # Add at the end
                        updated_content = content + f"\n\n## Saving Throws\n{ability_name} Save: {value}\n"
                else:
                    # Just add at the end
                    updated_content = content + f"\n\n## Saving Throws\n{ability_name} Save: {value}\n"
        elif field.startswith('skill_'):
            # Handle skill proficiencies
            skill_name = field.replace('skill_', '').replace('_', ' ').title()
            pattern = re.compile(f"{skill_name}:\\s*(Proficient|Expertise|Not Proficient)", re.IGNORECASE)
            match = pattern.search(content)
            
            if match:
                # Replace existing skill proficiency
                updated_content = pattern.sub(f"{skill_name}: {value}", content)
            else:
                # Add new skill entry after Skills section heading
                skills_section = re.search(r'##?\s*Skills', content, re.IGNORECASE)
                if skills_section:
                    insertion_point = skills_section.end()
                    updated_content = content[:insertion_point] + f"\n{skill_name}: {value}" + content[insertion_point:]
                else:
                    # No Skills section, create one
                    core_stats_section = re.search(r'##?\s*Core Statistics', content, re.IGNORECASE)
                    if core_stats_section:
                        insertion_point = content.find('\n\n', core_stats_section.end())
                        if insertion_point != -1:
                            updated_content = content[:insertion_point] + f"\n\n## Skills\n{skill_name}: {value}" + content[insertion_point:]
                        else:
                            updated_content = content + f"\n\n## Skills\n{skill_name}: {value}\n"
                    else:
                        # Just add at the end
                        updated_content = content + f"\n\n## Skills\n{skill_name}: {value}\n"

        # After checking field_patterns, add this check:
        elif field.endswith('_save_proficiency'):
            # Handle saving throw proficiencies
            ability = field.split('_')[0]
            ability_name = {
                'str': 'Strength',
                'dex': 'Dexterity',
                'con': 'Constitution',
                'int': 'Intelligence',
                'wis': 'Wisdom',
                'cha': 'Charisma'
            }.get(ability, ability.title())
            
            save_section = re.search(r'##?\s*Saving Throws', content, re.IGNORECASE)
            if save_section:
                # Add to existing section
                insertion_point = save_section.end()
                updated_content = content[:insertion_point] + f"\n{ability_name} Save: {value}" + content[insertion_point:]
            else:
                # Create new section
                updated_content = content + f"\n\n## Saving Throws\n{ability_name} Save: {value}\n"
                
        else:
            return jsonify({"error": f"Field '{field}' is not supported for editing"}), 400
        
        # Write the updated content back to the file
        if updated_content:
            character.save_content(updated_content)
            
            # Update the character model in the database for certain fields
            if field == 'species':
                character.species = value
                db.session.commit()
            # Add more database field updates as needed
            
            return jsonify({"success": True, "message": f"Updated {field} to '{value}'"}), 200
        else:
            return jsonify({"error": f"Failed to update {field}"}), 500
            
    except Exception as e:
        import traceback
        print(f"Error updating character field: {str(e)}")
        print(traceback.format_exc())
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

@character.route('/<int:character_id>', methods=['PATCH'])
@login_required
def update_character(character_id):
    try:
        character = Character.query.get_or_404(character_id)
        
        # Security check
        if character.user_id != current_user.id and not current_user.is_admin:
            abort(403)
        
        data = request.json
        print(f"Received data: {data}")
        
        content = character.get_content()
        print(f"Current content (first 100 chars): {content[:100]}")
        
        # Define field mappings from frontend to markdown patterns
        field_mappings = {
            'currency': {
                'cp': 'Copper',
                'sp': 'Silver',
                'gp': 'Gold',
                'ep': 'Electrum',
                'pp': 'Platinum'
            },
            'class-level': 'Level',
            'class': 'Class',
            'species': 'species',
            'background': 'Background',
            'alignment': 'Alignment',
            # Add more mappings as needed
        }
        
        # Update fields
        for key, value in data.items():
            pattern = rf"{re.escape(key)}:\s*(.+)"
            print(f"Searching for pattern: {pattern}")

            if key in field_mappings:
                if isinstance(value, dict):
                    # Handle nested fields like currency.cp
                    for nested_key, nested_value in value.items():
                        if nested_key in field_mappings[key]:
                            markdown_field = field_mappings[key][nested_key]
                            pattern = rf"{markdown_field}:\s*(\d+)"
                            print(f"Searching for pattern: {pattern}")
                            
                            # Use a function for replacement
                            content = re.sub(pattern, f"{key}: {value}", content)
                            
                            # Check if any replacements were made
                            if re.search(pattern, content) is None:
                                print(f"Warning: No match found for {markdown_field}")
                else:
                    # Handle direct fields
                    markdown_field = field_mappings[key]
                    pattern = rf"{markdown_field}:\s*(.+)"
                    print(f"Searching for pattern: {pattern}")
                    
                    # Use a function for replacement
                    content = re.sub(pattern, f"{markdown_field}: {value}", content)
                    
                    # Check if any replacements were made
                    if re.search(pattern, content) is None:
                        print(f"Warning: No match found for {markdown_field}")
            else:
                print(f"Warning: No mapping found for field {key}")
        
        # Save updated content
        character.save_content(content)
        return jsonify({'success': True, 'message': 'Character updated successfully'})
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        print(f"Error in update_character: {str(e)}")
        print(traceback_str)
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500