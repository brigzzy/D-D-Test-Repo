from flask import Blueprint, redirect, url_for, render_template
from flask_login import current_user, login_required

# Create a main Blueprint for the index and dashboard routes
main = Blueprint('main', __name__)

@main.route('/')
def index():
    """Home page route."""
    # Redirect to dashboard if logged in, otherwise to login page
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return redirect(url_for('auth.login'))

@main.route('/dashboard')
@login_required
def dashboard():
    """User dashboard showing all characters."""
    # Import here to avoid circular imports
    from models import Character
    
    # Get all characters owned by the current user
    characters = Character.query.filter_by(user_id=current_user.id).all()
    return render_template('dashboard.html', characters=characters)

# Import all controllers to make them available
from .auth import auth
from .character import character
from .admin import admin

__all__ = ['main', 'auth', 'character', 'admin']
