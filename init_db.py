import os
import argparse
import getpass
from flask import Flask
from models import db, User
from config import Config

def init_database(username=None, password=None):
    """Initialize the database and create the first admin user."""
    
    # Create Flask app with minimal configuration
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize database with app
    db.init_app(app)
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if any users exist
        if User.query.first() is not None:
            print("Database is already initialized with users.")
            return
        
        # Get admin username and password if not provided
        if username is None:
            username = input("Enter admin username: ")
        if password is None:
            password = getpass.getpass("Enter admin password: ")
            confirm_password = getpass.getpass("Confirm admin password: ")
            
            if password != confirm_password:
                print("Passwords do not match. Aborting.")
                return
        
        # Create admin user
        admin = User(username=username, is_admin=True)
        admin.password = password
        
        # Add to database
        db.session.add(admin)
        db.session.commit()
        
        print(f"Admin user '{username}' created successfully.")
        print("Database initialized.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Initialize the database and create admin user')
    parser.add_argument('--username', help='Admin username')
    parser.add_argument('--password', help='Admin password')
    args = parser.parse_args()
    
    init_database(args.username, args.password)
