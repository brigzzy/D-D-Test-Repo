import os
import secrets

class Config:
    """Application configuration settings."""
    
    # Base directory of the application
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    # Secret key for session management and CSRF protection
    # In production, this should be set as an environment variable
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(16)
    
    # SQLite database URI
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(BASE_DIR, 'storage', 'dnd_app.db')
    
    # Disable SQLAlchemy event system (not needed for this app)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Storage location for character sheets
    CHARACTER_STORAGE_PATH = os.path.join(BASE_DIR, 'storage', 'characters')
    
    # Ensure storage directory exists
    @staticmethod
    def init_app(app):
        # Create character storage directory if it doesn't exist
        if not os.path.exists(app.config['CHARACTER_STORAGE_PATH']):
            os.makedirs(app.config['CHARACTER_STORAGE_PATH'])
