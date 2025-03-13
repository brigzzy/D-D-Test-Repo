import os
import uuid
import re
from datetime import datetime
from .user import db

from flask import current_app

class Character(db.Model):
    """Character model for storing D&D character metadata.
    
    The actual character sheet content is stored as markdown files on disk,
    while this database record keeps track of metadata and file locations.
    """
    
    __tablename__ = 'characters'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(64), nullable=False)
    character_class = db.Column(db.String(64), nullable=True)
    level = db.Column(db.Integer, default=1)
    species = db.Column(db.String(64), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_modified = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, *args, **kwargs):
        """Initialize character with a unique filename if not provided."""
        if 'filename' not in kwargs:
            kwargs['filename'] = f"{uuid.uuid4().hex}.md"
        super(Character, self).__init__(*args, **kwargs)
    
    def get_file_path(self):
        """Get the full file path for the character sheet."""
        return os.path.join(current_app.config['CHARACTER_STORAGE_PATH'], self.filename)

    def get_content(self):
        """Read and return the content of the character sheet markdown file.
        
        Returns:
            str: The content of the markdown file, or empty string if file not found.
        """
        try:
            with open(self.get_file_path(), 'r') as f:
                return f.read()
        except FileNotFoundError:
            # If file doesn't exist, create an empty one
            self.save_content('')
            return ''

    def save_content(self, content):
        """Save the provided content to the character sheet markdown file.
        
        Args:
            content (str): The markdown content to save
        """
        with open(self.get_file_path(), 'w') as f:
            f.write(content)

        # Update the last modified time
        self.last_modified = datetime.utcnow()
        db.session.commit()
        
    def delete_file(self):
        """Delete the character sheet markdown file from disk."""
        try:
            os.remove(self.get_file_path())
        except FileNotFoundError:
            pass
    
    def update_field(self, field, value):
        """Update a specific field in the markdown content using a standardized approach.
        
        Args:
            field (str): The field identifier to update
            value (any): The new value for the field
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        content = self.get_content()
        updated_content = None
        
        # Special case for the entire markdown content
        if field == 'markdown_content':
            self.save_content(value)
            return True
            
        # Dictionary mapping field names to regex patterns and their replacements
        field_patterns = {
            # Basic character information
            'name': (r'^#\s*.*$', f'# {value}', re.MULTILINE),
            'species': (r'^(species|Species):\s*(.*)$', f'\\1: {value}', re.MULTILINE),
            'class': (r'^(Class|class):\s*(.*)$', f'\\1: {value}', re.MULTILINE),
            'level': (r'^(Level|level):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'background': (r'^(Background|background):\s*(.*)$', f'\\1: {value}', re.MULTILINE),
            'alignment': (r'^(Alignment|alignment):\s*(.*)$', f'\\1: {value}', re.MULTILINE),
            
            # Ability scores
            'str_score': (r'^(Strength|STR|str|Str):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'dex_score': (r'^(Dexterity|DEX|dex|Dex):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'con_score': (r'^(Constitution|CON|con|Con):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'int_score': (r'^(Intelligence|INT|int|Int):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'wis_score': (r'^(Wisdom|WIS|wis|Wis):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'cha_score': (r'^(Charisma|CHA|cha|Cha):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            
            # Combat stats
            'armor_class': (r'^(Armor Class|AC):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'initiative': (r'^(Initiative):\s*([-+]?\d+)$', f'\\1: {value}', re.MULTILINE),
            'speed': (r'^(Speed):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'max_hp': (r'^(Maximum HP|Max HP):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'current_hp': (r'^(Current HP|HP):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'temp_hp': (r'^(Temporary HP|Temp HP):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'hit_dice': (r'^(Hit Dice):\s*(.+)$', f'\\1: {value}', re.MULTILINE),
            
            # Currency
            'gold': (r'^(Gold):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'silver': (r'^(Silver):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'copper': (r'^(Copper):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'electrum': (r'^(Electrum):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            'platinum': (r'^(Platinum):\s*(\d+)$', f'\\1: {value}', re.MULTILINE),
            
            # Character traits
            'personality_traits': (r'^(Personality Traits):\s*(.*)$', f'\\1: {value}', re.MULTILINE),
            'ideals': (r'^(Ideals):\s*(.*)$', f'\\1: {value}', re.MULTILINE),
            'bonds': (r'^(Bonds):\s*(.*)$', f'\\1: {value}', re.MULTILINE),
            'flaws': (r'^(Flaws):\s*(.*)$', f'\\1: {value}', re.MULTILINE),
        }
        
        # Create generic patterns for saving throws and skills
        abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
        abbr_abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha']
        
        # Add saving throw patterns
        for i, ability in enumerate(abilities):
            field_patterns[f'{abbr_abilities[i]}_save'] = (
                f'^({ability}|{abbr_abilities[i].upper()}|{abbr_abilities[i]}|{ability.capitalize()})\\s+Save:\\s*(Proficient|Not Proficient)$',
                f'\\1 Save: {value}',
                re.MULTILINE
            )
        
        # Special handling for skills
        if field.startswith('skill_'):
            skill_name = field[6:].replace('_', ' ').title()
            updated_content = self._update_skill_proficiency(content, skill_name, value)
            if updated_content:
                self.save_content(updated_content)
                return True
        
        # Check if we have a pattern for this field
        if field in field_patterns:
            pattern, replacement, flags = field_patterns[field]
            field_pattern = re.compile(pattern, flags=flags)
            
            match = field_pattern.search(content)
            if match:
                # Replace the value part
                updated_content = field_pattern.sub(replacement, content)
            else:
                # Field doesn't exist in markdown yet, need to add it to the appropriate section
                updated_content = self._add_field_to_section(content, field, value)
        else:
            # Special case for death saves
            if field.startswith('death_save_'):
                updated_content = self._update_death_saves(content, field, value)
        
        # If we have updated content, save it
        if updated_content:
            self.save_content(updated_content)
            
            # Update database fields that match markdown fields
            if field == 'species':
                self.species = value
                db.session.commit()
            elif field == 'class':
                self.character_class = value
                db.session.commit()
            elif field == 'level':
                try:
                    self.level = int(value)
                    db.session.commit()
                except ValueError:
                    pass
            elif field == 'name':
                self.name = value
                db.session.commit()
                
            return True
            
        return False

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

    def __repr__(self):
        return f'<Character {self.name}, Level {self.level} {self.character_class}>'