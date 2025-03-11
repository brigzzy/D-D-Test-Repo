from flask import Blueprint, render_template, redirect, url_for, flash, request, abort
from flask_login import login_required, current_user
from models import db, User

# Create a Blueprint for admin routes
admin = Blueprint('admin', __name__, url_prefix='/admin')

# Admin access check decorator
def admin_required(f):
    """Decorator to require admin access for a route."""
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            abort(403)  # Forbidden
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return login_required(decorated_function)

@admin.route('/')
@admin_required
def dashboard():
    """Admin dashboard."""
    return render_template('admin/dashboard.html')

@admin.route('/users')
@admin_required
def list_users():
    """List all users."""
    users = User.query.all()
    return render_template('admin/users.html', users=users)

@admin.route('/users/new', methods=['GET', 'POST'])
@admin_required
def new_user():
    """Create a new user."""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        is_admin = 'is_admin' in request.form
        
        # Validate input
        if not username or not password:
            flash('Username and password are required', 'warning')
            return render_template('admin/user_form.html')
        
        # Check if username is already taken
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'danger')
            return render_template('admin/user_form.html')
        
        # Create user
        user = User(username=username, is_admin=is_admin)
        user.password = password
        db.session.add(user)
        db.session.commit()
        
        flash(f'User "{username}" created successfully', 'success')
        return redirect(url_for('admin.list_users'))
    
    return render_template('admin/user_form.html')

@admin.route('/users/<int:user_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit_user(user_id):
    """Edit an existing user."""
    user = User.query.get_or_404(user_id)
    
    # Prevent editing yourself - to avoid removing your own admin rights accidentally
    if user.id == current_user.id:
        flash('You cannot edit your own user account from here', 'warning')
        return redirect(url_for('admin.list_users'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        is_admin = 'is_admin' in request.form
        
        # Validate input
        if not username:
            flash('Username is required', 'warning')
            return render_template('admin/user_form.html', user=user)
        
        # Check if username is taken by another user
        existing_user = User.query.filter_by(username=username).first()
        if existing_user and existing_user.id != user.id:
            flash('Username already exists', 'danger')
            return render_template('admin/user_form.html', user=user)
        
        # Update user
        user.username = username
        if password:  # Only update password if provided
            user.password = password
        user.is_admin = is_admin
        db.session.commit()
        
        flash(f'User "{username}" updated successfully', 'success')
        return redirect(url_for('admin.list_users'))
    
    return render_template('admin/user_form.html', user=user)

@admin.route('/users/<int:user_id>/delete', methods=['POST'])
@admin_required
def delete_user(user_id):
    """Delete a user."""
    user = User.query.get_or_404(user_id)
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        flash('You cannot delete your own account', 'danger')
        return redirect(url_for('admin.list_users'))
    
    username = user.username
    
    # Delete the user
    db.session.delete(user)
    db.session.commit()
    
    flash(f'User "{username}" has been deleted', 'success')
    return redirect(url_for('admin.list_users'))
