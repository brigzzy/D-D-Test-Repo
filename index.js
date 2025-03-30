// index.js
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const fs = require('fs/promises');

// Import custom modules
const { requireAuth, requireAdmin, loadUserData, saveUserData } = require('./middleware');
const { 
  ensureDirectories, 
  readYamlFile, 
  writeYamlFile, 
  listFiles 
} = require('./dataUtils');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(session({
  secret: 'dnd-character-sheet-app-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Set view engine and layouts
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Attach user info to every request
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Initialize admin user and directories
async function initializeApp() {
  await ensureDirectories();
  await initAdminUser();
}

// Create admin user if it doesn't exist
async function initAdminUser() {
  const adminPath = path.join(__dirname, 'data', 'users', 'admin.yaml');
  try {
    await readYamlFile(adminPath);
  } catch (err) {
    // Admin doesn't exist, create it
    const hashedPassword = await bcrypt.hash('admin', 10);
    const admin = {
      username: 'admin',
      password: hashedPassword,
      isAdmin: true,
      createdAt: new Date().toISOString()
    };
    
    await writeYamlFile(adminPath, admin);
    console.log('Admin user created');
  }
}

// Authentication Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/characters');
  }
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login',
    error: null
  });
});

// Login functionality
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await loadUserData(username);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { 
        title: 'Login', 
        error: 'Invalid credentials'
      });
    }
    
    // Create session with user data including theme preference
    req.session.user = {
      username: user.username,
      isAdmin: user.isAdmin || false,
      theme: user.theme || 'light' // Include theme preference in session
    };
    
    res.redirect('/characters');
  } catch (err) {
    console.error('Error during login:', err);
    res.render('login', { 
      title: 'Login', 
      error: 'An error occurred during login'
    });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// User Management Routes
app.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usersDir = path.join(__dirname, 'data', 'users');
    const files = await listFiles(usersDir);
    
    const users = await Promise.all(
      files
        .filter(file => file.endsWith('.yaml'))
        .map(async (file) => {
          const userData = await readYamlFile(path.join(usersDir, file));
          return {
            username: userData.username,
            isAdmin: userData.isAdmin || false,
            createdAt: userData.createdAt
          };
        })
    );
    
    res.render('users', { 
      title: 'User Management',
      users 
    });
  } catch (err) {
    res.status(500).send('Error loading users');
  }
});

app.get('/users/new', requireAuth, requireAdmin, (req, res) => {
  res.render('user_form', { 
    title: 'Create New User',
    user: null, 
    error: null 
  });
});

app.post('/users', requireAuth, requireAdmin, async (req, res) => {
  const { username, password, isAdmin } = req.body;
  
  try {
    const userPath = path.join(__dirname, 'data', 'users', `${username}.yaml`);
    
    // Check if user already exists
    try {
      await readYamlFile(userPath);
      return res.render('user_form', { 
        title: 'Create New User',
        error: 'User already exists', 
        user: { username, isAdmin: isAdmin === 'on' }
      });
    } catch (err) {
      // User doesn't exist, we can create it
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        username,
        password: hashedPassword,
        isAdmin: isAdmin === 'on',
        createdAt: new Date().toISOString()
      };
      
      await writeYamlFile(userPath, user);
      res.redirect('/users');
    }
  } catch (err) {
    res.status(500).send('Error creating user');
  }
});

// Character Routes
app.get('/characters', requireAuth, async (req, res) => {
  try {
    const charactersDir = path.join(__dirname, 'data', 'characters');
    
    // Create the characters directory if it doesn't exist
    await fs.mkdir(charactersDir, { recursive: true });
    
    const files = await listFiles(charactersDir);
    
    const characters = await Promise.all(
      files
        .filter(file => file.endsWith('.yaml'))
        .map(async (file) => {
          try {
            const character = await readYamlFile(path.join(charactersDir, file));
            
            // Only include characters owned by the current user or if user is admin
            if (character.owner === req.session.user.username || req.session.user.isAdmin) {
              return {
                id: path.basename(file, '.yaml'),
                name: character.name || 'Unnamed Character',
                class: character.class || 'Unknown Class',
                level: character.level || 1,
                owner: character.owner
              };
            }
            return null;
          } catch (err) {
            console.error(`Error reading character file ${file}:`, err);
            return null;
          }
        })
    );
    
    // Filter out null values (characters the user doesn't have access to or errors)
    const filteredCharacters = characters.filter(character => character !== null);
    
    res.render('characters', { 
      title: 'My Characters',
      characters: filteredCharacters,
      currentUser: req.session.user
    });
  } catch (err) {
    console.error('Error loading characters:', err);
    res.status(500).send('Error loading characters');
  }
});

app.get('/characters/new', requireAuth, (req, res) => {
  // Default character template
  const character = {
    name: '',
    class: '',
    level: 1,
    race: '',
    background: '',
    alignment: '',
    abilities: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    hitPoints: {
      maximum: 10,
      current: 10
    },
    armorClass: 10,
    initiative: 0,
    speed: 30,
    skills: [
      { name: 'Acrobatics', ability: 'dexterity', proficient: false },
      { name: 'Animal Handling', ability: 'wisdom', proficient: false },
      { name: 'Arcana', ability: 'intelligence', proficient: false },
      { name: 'Athletics', ability: 'strength', proficient: false },
      { name: 'Deception', ability: 'charisma', proficient: false },
      { name: 'History', ability: 'intelligence', proficient: false },
      { name: 'Insight', ability: 'wisdom', proficient: false },
      { name: 'Intimidation', ability: 'charisma', proficient: false },
      { name: 'Investigation', ability: 'intelligence', proficient: false },
      { name: 'Medicine', ability: 'wisdom', proficient: false },
      { name: 'Nature', ability: 'intelligence', proficient: false },
      { name: 'Perception', ability: 'wisdom', proficient: false },
      { name: 'Performance', ability: 'charisma', proficient: false },
      { name: 'Persuasion', ability: 'charisma', proficient: false },
      { name: 'Religion', ability: 'intelligence', proficient: false },
      { name: 'Sleight of Hand', ability: 'dexterity', proficient: false },
      { name: 'Stealth', ability: 'dexterity', proficient: false },
      { name: 'Survival', ability: 'wisdom', proficient: false }
    ],
    customSkills: [],
    equipment: '',
    features: '',
    spells: '',
    mana: {
      maximum: 0,
      current: 0
    }
  };
  
  res.render('character_form', { 
    title: 'Create New Character',
    character,
    characterId: null,
    isNew: true
  });
});

app.post('/characters', requireAuth, async (req, res) => {
  try {
    const characterId = Date.now().toString();
    const characterPath = path.join(__dirname, 'data', 'characters', `${characterId}.yaml`);
    
    // Process the character data from the form
    const character = {
      name: req.body.name,
      class: req.body.class,
      level: parseInt(req.body.level) || 1,
      race: req.body.race,
      background: req.body.background || '',
      alignment: req.body.alignment || '',
      owner: req.session.user.username,
      createdAt: new Date().toISOString(),
      abilities: {
        strength: parseInt(req.body.strength) || 10,
        dexterity: parseInt(req.body.dexterity) || 10,
        constitution: parseInt(req.body.constitution) || 10,
        intelligence: parseInt(req.body.intelligence) || 10,
        wisdom: parseInt(req.body.wisdom) || 10,
        charisma: parseInt(req.body.charisma) || 10
      },
      hitPoints: {
        maximum: parseInt(req.body.maxHitPoints) || 10,
        current: parseInt(req.body.currentHitPoints) || 10
      },
      armorClass: parseInt(req.body.armorClass) || 10,
      initiative: parseInt(req.body.initiative) || 0,
      speed: parseInt(req.body.speed) || 30,
      skills: JSON.parse(req.body.skills || '[]'),
      customSkills: JSON.parse(req.body.customSkills || '[]'),
      equipment: req.body.equipment || '',
      features: req.body.features || '',
      spells: req.body.spells || '',
      mana: {
        maximum: parseInt(req.body.maxMana) || 0,
        current: parseInt(req.body.currentMana) || 0
      }
    };
    
    await writeYamlFile(characterPath, character);
    res.redirect('/characters');
  } catch (err) {
    console.error('Error creating character:', err);
    res.status(500).send('Error creating character');
  }
});

app.get('/characters/:id', requireAuth, async (req, res) => {
  try {
    const characterPath = path.join(__dirname, 'data', 'characters', `${req.params.id}.yaml`);
    const character = await readYamlFile(characterPath);
    
    // Check if user has access to this character
    if (character.owner !== req.session.user.username && !req.session.user.isAdmin) {
      return res.status(403).send('Forbidden: You do not have access to this character');
    }
    
    res.render('character_form', { 
      title: character.name,
      character,
      characterId: req.params.id,
      isNew: false
    });
  } catch (err) {
    console.error('Error loading character:', err);
    res.status(404).send('Character not found');
  }
});

app.put('/characters/:id', requireAuth, async (req, res) => {
  try {
    const characterPath = path.join(__dirname, 'data', 'characters', `${req.params.id}.yaml`);
    const character = await readYamlFile(characterPath);
    
    // Check if user has access to this character
    if (character.owner !== req.session.user.username && !req.session.user.isAdmin) {
      return res.status(403).send('Forbidden: You do not have access to this character');
    }
    
    // Handle single field update via AJAX
    if (req.body.field && req.body.value !== undefined) {
      let value = req.body.value;
      
      // Handle nested fields (e.g., abilities.strength)
      const fieldParts = req.body.field.split('.');
      if (fieldParts.length === 1) {
        // Handle JSON strings
        if (
          req.body.field === 'skills' || 
          req.body.field === 'customSkills'
        ) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON value' });
          }
        }
        character[fieldParts[0]] = value;
      } else if (fieldParts.length === 2) {
        if (!character[fieldParts[0]]) {
          character[fieldParts[0]] = {};
        }
        character[fieldParts[0]][fieldParts[1]] = value;
      }
      
      await writeYamlFile(characterPath, character);
      return res.json({ success: true });
    }
    
    // Handle full form submission
    const updatedCharacter = {
      ...character,
      name: req.body.name,
      class: req.body.class,
      level: parseInt(req.body.level) || 1,
      race: req.body.race,
      background: req.body.background || '',
      alignment: req.body.alignment || '',
      abilities: {
        strength: parseInt(req.body.strength) || 10,
        dexterity: parseInt(req.body.dexterity) || 10,
        constitution: parseInt(req.body.constitution) || 10,
        intelligence: parseInt(req.body.intelligence) || 10,
        wisdom: parseInt(req.body.wisdom) || 10,
        charisma: parseInt(req.body.charisma) || 10
      },
      hitPoints: {
        maximum: parseInt(req.body.maxHitPoints) || character.hitPoints.maximum,
        current: parseInt(req.body.currentHitPoints) || character.hitPoints.current
      },
      armorClass: parseInt(req.body.armorClass) || 10,
      initiative: parseInt(req.body.initiative) || 0,
      speed: parseInt(req.body.speed) || 30,
      skills: JSON.parse(req.body.skills || '[]'),
      customSkills: JSON.parse(req.body.customSkills || '[]'),
      equipment: req.body.equipment || '',
      features: req.body.features || '',
      spells: req.body.spells || '',
      mana: {
        maximum: parseInt(req.body.maxMana) || 0,
        current: parseInt(req.body.currentMana) || 0
      }
    };
    
    await writeYamlFile(characterPath, updatedCharacter);
    res.redirect(`/characters/${req.params.id}`);
  } catch (err) {
    console.error('Error updating character:', err);
    res.status(500).send('Error updating character');
  }
});

app.delete('/characters/:id', requireAuth, async (req, res) => {
  try {
    const characterPath = path.join(__dirname, 'data', 'characters', `${req.params.id}.yaml`);
    const character = await readYamlFile(characterPath);
    
    // Check if user has access to delete this character
    if (character.owner !== req.session.user.username && !req.session.user.isAdmin) {
      return res.status(403).send('Forbidden: You do not have permission to delete this character');
    }
    
    await fs.unlink(characterPath);
    res.redirect('/characters');
  } catch (err) {
    console.error('Error deleting character:', err);
    res.status(500).send('Error deleting character');
  }
});

// Start the server
async function startServer() {
  await initializeApp();
  
  app.listen(PORT, () => {
    console.log(`D&D Character Sheet App running on port ${PORT}`);
  });
}


// User Preferences Route
app.post('/user/preferences', requireAuth, async (req, res) => {
  console.log('User preferences route called:', req.body);
  
  try {
    const { preference, value } = req.body;
    const username = req.session.user.username;
    
    console.log(`Saving ${preference} preference for user ${username}: ${value}`);
    
    // Validate input
    if (!preference || value === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Only allow certain preferences to be saved
    if (preference !== 'theme') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid preference type' 
      });
    }
    
    // Only allow valid theme values
    if (preference === 'theme' && !['light', 'dark'].includes(value)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid theme value' 
      });
    }
    
    // Load current user data
    const userPath = path.join(__dirname, 'data', 'users', `${username}.yaml`);
    
    console.log('Loading user data from:', userPath);
    
    let userData;
    try {
      const fileContents = await fs.readFile(userPath, 'utf8');
      userData = yaml.load(fileContents);
      console.log('Current user data:', userData);
    } catch (err) {
      console.error(`Error loading user data for ${username}:`, err);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Update user data with new preference
    userData[preference] = value;
    
    // Update session data as well
    req.session.user[preference] = value;
    
    console.log('Updated user data:', userData);
    
    // Save updated user data
    try {
      await fs.writeFile(userPath, yaml.dump(userData));
      console.log('User data saved successfully');
      
      return res.json({ 
        success: true, 
        message: 'Preference saved successfully' 
      });
    } catch (err) {
      console.error(`Error saving user data for ${username}:`, err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error saving user data' 
      });
    }
  } catch (err) {
    console.error('Unexpected error in user preferences route:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});




startServer();