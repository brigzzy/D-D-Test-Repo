# D&D Character Sheet Application

A full-stack web application for creating and managing Dungeons & Dragons character sheets with multi-user support and YAML-based data persistence.

## Features

- **User Authentication & Roles**
  - Secure login/logout functionality
  - Admin users can create and manage regular users
  - Role-based access control

- **Character Management**
  - Create, view, edit, and delete character sheets
  - Auto-save functionality for instant persistence
  - Character data stored in YAML format

- **Dynamic Character Sheet**
  - Interactive D&D 5e character sheet layout
  - Click-to-edit functionality on all fields
  - Dynamic skills section with ability to add custom skills
  - Automatic calculation of modifiers and derived stats

- **Responsive Design**
  - Mobile-friendly interface
  - Adaptive layout for different screen sizes

## Tech Stack

- **Backend**
  - Node.js
  - Express.js
  - express-session (authentication)
  - bcrypt (password hashing)
  - js-yaml (YAML data processing)
  - method-override (for PUT/DELETE requests)
  - express-ejs-layouts (template layouts)

- **Frontend**
  - EJS templates
  - Vanilla JavaScript
  - CSS with custom variables
  - Responsive design without external frameworks

- **Data Storage**
  - YAML files for both users and character data
  - File-based storage system organized in directories

## Project Structure

```
dnd-character-sheet-app/
├── index.js                  # Main application entry point
├── package.json              # Project dependencies
├── public/                   # Static assets
│   └── css/
│       └── style.css         # Application styles
├── views/                    # EJS templates
│   ├── layout.ejs            # Main layout template
│   ├── login.ejs             # Login form
│   ├── users.ejs             # User management view
│   ├── user_form.ejs         # Create user form
│   ├── characters.ejs        # Character list view
│   └── character_form.ejs    # Character sheet view/edit
└── data/                     # Data storage (created on first run)
    ├── users/                # User data in YAML format
    └── characters/           # Character data in YAML format
```

## Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the application:
   ```
   npm start
   ```
   or in development mode with auto-reload:
   ```
   npm run dev
   ```
4. Access the application at http://localhost:3000

## Initial Login

When the application first runs, it automatically creates an admin user:
- Username: `admin`
- Password: `admin`

It's recommended to change this password after initial login.

## Key Implementation Details

### Authentication

- Uses express-session for session management
- bcrypt for secure password hashing
- Custom middleware for route protection:
  - `requireAuth`: Ensures user is logged in
  - `requireAdmin`: Ensures user has admin privileges

### Data Storage

- Uses YAML files instead of a traditional database
- Each user record is stored in a separate file
- Character sheets are stored as individual YAML files
- Directory structure handles user-character relationship

### Character Sheet Features

- Auto-save functionality that persists changes when fields lose focus
- Real-time calculation of ability modifiers and skill bonuses
- Dynamic skills section allows adding custom skills
- Click-to-edit interface makes the interface clean while maintaining editability

### UI/UX Choices

- Clean, responsive design with a modern color scheme
- Fields are read-only by default, becoming editable on click
- Visual feedback for save status during auto-save operations
- Modal confirmations for destructive actions

## Extending the Application

### Adding New Character Attributes

To add new character attributes:
1. Update the character object schema in `index.js` (POST/PUT routes)
2. Add corresponding fields to the character_form.ejs template
3. Include any necessary calculations in the client-side JavaScript
4. Add appropriate styling in style.css

### Adding New Permanent Skills

To add new permanent skills to the character sheet template:

1. Locate the default character template in `index.js`, specifically in the `/characters/new` route handler
2. Find the `skills` array in the character template (around line 245)
3. Add your new skill to the array following this format:
   ```javascript
   { name: 'Your New Skill', ability: 'ability_name', proficient: false }
   ```
   where `ability_name` is one of: `strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, or `charisma`

Example of adding a "Linguistics" skill:
```javascript
skills: [
  { name: 'Acrobatics', ability: 'dexterity', proficient: false },
  // ... existing skills ...
  { name: 'Linguistics', ability: 'intelligence', proficient: false },
  { name: 'Sleight of Hand', ability: 'dexterity', proficient: false },
  // ... more existing skills ...
]
```

### Implementing New Features

Common extension points:
- Character export/import functionality
- Character sharing between users
- Spell management system
- Equipment tracking and management
- Campaign and party grouping

## Common Issues and Solutions

### Session Management

If you're experiencing session issues:
- Check the session secret in `index.js`
- Verify cookie settings and lifetime
- Ensure secure and httpOnly flags are appropriately set

### YAML Data Handling

- Always use try/catch blocks when reading YAML files
- Validate data before writing to prevent corruption
- Check file permissions if access errors occur

### Auto-save Functionality

- Debug using browser developer tools to monitor XHR requests
- Check network tab for failed save attempts
- Verify that fields have the correct data-field attributes

## License

This project is available for personal and educational use.