import os
from flask import Flask, redirect, url_for
from flask_login import LoginManager
from flask_migrate import Migrate
import markdown
from markdown.extensions.fenced_code import FencedCodeExtension

from config import Config
from models import db, User
from controllers import main, auth, character, admin

def create_app(config_class=Config):
    """Application factory pattern for Flask app."""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Initialize login manager for user authentication
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'warning'
    
    @login_manager.user_loader
    def load_user(user_id):
        """Load user by ID."""
        return User.query.get(int(user_id))
    
    # Register blueprints
    app.register_blueprint(main)
    app.register_blueprint(auth)
    app.register_blueprint(character, url_prefix='/characters')
    app.register_blueprint(admin)
    
    # Jinja2 template filter for markdown rendering
    @app.template_filter('markdown')
    def render_markdown(text):
        """Render Markdown to HTML."""
        return markdown.markdown(text, extensions=[FencedCodeExtension()])
    
    # Initialize storage directory
    with app.app_context():
        Config.init_app(app)
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    # Check if the database exists, if not suggest running init_db.py
    if not os.path.exists(os.path.join(Config.BASE_DIR, 'dnd_app.db')):
        print("Database not found. Please run 'python init_db.py' to initialize the database.")
    
    app.run(debug=True)
