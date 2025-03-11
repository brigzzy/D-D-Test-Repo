from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from datetime import datetime

from models import User, db

# Create a Blueprint for authentication-related routes
auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login."""
    # If user is already logged in, redirect to dashboard
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Input validation
        if not username or not password:
            flash('Please enter both username and password', 'warning')
            return render_template('login.html')
        
        # Look up the user
        user = User.query.filter_by(username=username).first()
        
        # Check if user exists and password is correct
        if user and user.verify_password(password):
            # Login the user and update last login timestamp
            login_user(user)
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Redirect to the page they wanted or the dashboard
            next_page = request.args.get('next')
            if next_page and next_page.startswith('/'):  # Security check for open redirects
                return redirect(next_page)
            return redirect(url_for('main.dashboard'))
        else:
            flash('Invalid username or password', 'danger')
    
    return render_template('login.html')

@auth.route('/logout')
@login_required
def logout():
    """Handle user logout."""
    logout_user()
    flash('You have been logged out', 'info')
    return redirect(url_for('auth.login'))
