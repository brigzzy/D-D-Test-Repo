import os
import uuid
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
    
    @property
    def get_file_path(self):
        """Get the full file path for the character sheet."""
        from flask import current_app  # Import inside the method
        if 'CHARACTER_STORAGE_PATH' in current_app.config:
            return os.path.join(current_app.config['CHARACTER_STORAGE_PATH'], self.filename)
        else:
            # Fallback path if config is not available
            return os.path.join(os.path.dirname(os.path.dirname(__file__)), 'storage', 'characters', self.filename) 

    def get_content(self):
        try:
            with open(self.get_file_path(), 'r') as f:
                return f.read()
        except FileNotFoundError:
            # If file doesn't exist, create an empty one
            self.save_content('')
            return ''

    def save_content(self, content):
        with open(self.get_file_path(), 'w') as f:
            f.write(content)

        # Update the last modified time
        self.last_modified = datetime.utcnow()
        db.session.commit()
        
    def delete_file(self):
        try:
            os.remove(self.get_file_path())
        except FileNotFoundError:
            pass
    
    def __repr__(self):
        return f'<Character {self.name}, Level {self.level} {self.character_class}>'

    def get_file_path(self):
        """Get the full file path for the character sheet."""
        return os.path.join(current_app.config['CHARACTER_STORAGE_PATH'], self.filename)