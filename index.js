// This is the main index.js file for our application
// It sets up the Express server, authentication, and routes

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method')); // For handling PUT and DELETE requests
app.use(session({
  secret: 'dnd-character-sheet-app-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Set view engine and layouts
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'data', 'users'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'data', 'characters'), { recursive: true });
  } catch (err) {
    console.error('Error creating directories:', err);
  }
}

// Initialize admin user if it doesn't exist
async function initAdminUser() {
  const adminPath = path.join(__dirname, 'data', 'users', 'admin.yaml');
  try {
    await fs.access(adminPath);
  } catch (err) {
    // Admin doesn't exist, create it
    const hashedPassword = await bcrypt.hash('admin', 10);
    const admin = {
      username: 'admin',
      password: hashedPassword,
      isAdmin: true,
      createdAt: new Date().toISOString()
    };
    
    await fs.writeFile(adminPath, yaml.dump(admin));
    console.log('Admin user created');
  }
}

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  }
  res.status(403).send('Forbidden: Admin access required');
}

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/characters');
  } else {
    res.redirect('/login');
  }
});

// Login routes
app.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login',
    currentUser: null,
    error: null
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const userPath = path.join(__dirname, 'data', 'users', `${username}.yaml`);
    const userData = await fs.readFile(userPath, 'utf8');
    const user = yaml.load(userData);
    
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.user = {
        username: user.username,
        isAdmin: user.isAdmin || false
      };
      res.redirect('/characters');
    } else {
      res.render('login', { 
        title: 'Login', 
        currentUser: null,
        error: 'Invalid credentials'
      });
    }
  } catch (err) {
    res.render('login', { 
      title: 'Login', 
      currentUser: null,
      error: 'Invalid credentials'
    });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// User management (admin only)
app.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usersDir = path.join(__dirname, 'data', 'users');
    const files = await fs.readdir(usersDir);
    
    const users = await Promise.all(
      files.map(async (file) => {
        if (path.extname(file) === '.yaml') {
          const userData = await fs.readFile(path.join(usersDir, file), 'utf8');
          const user = yaml.load(userData);
          return {
            username: user.username,
            isAdmin: user.isAdmin || false,
            createdAt: user.createdAt
          };
        }
        return null;
      })
    );
    
    res.render('users', { 
      title: 'User Management',
      users: users.filter(user => user !== null), 
      currentUser: req.session.user
    });
  } catch (err) {
    res.status(500).send('Error loading users');
  }
});

app.get('/users/new', requireAuth, requireAdmin, (req, res) => {
  res.render('user_form', { 
    title: 'Create New User',
    user: null, 
    currentUser: req.session.user, 
    error: null 
  });
});

app.post('/users', requireAuth, requireAdmin, async (req, res) => {
  const { username, password, isAdmin } = req.body;
  
  try {
    const userPath = path.join(__dirname, 'data', 'users', `${username}.yaml`);
    
    // Check if user already exists
    try {
      await fs.access(userPath);
      return res.render('user_form', { 
        title: 'Create New User',
        error: 'User already exists', 
        user: { username, isAdmin: isAdmin === 'on' },
        currentUser: req.session.user
      });
    } catch (err) {
      // User doesn't exist, we can create it
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      username,
      password: hashedPassword,
      isAdmin: isAdmin === 'on',
      createdAt: new Date().toISOString()
    };
    
    await fs.writeFile(userPath, yaml.dump(user));
    res.redirect('/users');
  } catch (err) {
    res.status(500).send('Error creating user');
  }
});

// Character routes
app.get('/characters', requireAuth, async (req, res) => {
  try {
    const charactersDir = path.join(__dirname, 'data', 'characters');
    const files = await fs.readdir(charactersDir);
    
    const characters = await Promise.all(
      files.map(async (file) => {
        if (path.extname(file) === '.yaml') {
          const charData = await fs.readFile(path.join(charactersDir, file), 'utf8');
          const character = yaml.load(charData);
          if (character.owner === req.session.user.username || req.session.user.isAdmin) {
            return {
              id: path.basename(file, '.yaml'),
              name: character.name,
              class: character.class,
              level: character.level,
              owner: character.owner
            };
          }
        }
        return null;
      })
    );
    
    res.render('characters', { 
      title: 'My Characters',
      characters: characters.filter(char => char !== null), 
      currentUser: req.session.user 
    });
  } catch (err) {
    res.status(500).send('Error loading characters');
  }
});

app.get('/characters/new', requireAuth, (req, res) => {
  res.render('character_form', { 
    title: 'Create New Character',
    character: {
      name: '',
      race: '',
      class: '',
      level: 1,
      abilities: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
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
      customSkills: []
    },
    isNew: true,
    currentUser: req.session.user
  });
});

app.post('/characters', requireAuth, async (req, res) => {
  try {
    const characterData = req.body;
    
    // Process the form data to create the character object
    const character = {
      name: characterData.name,
      race: characterData.race,
      class: characterData.class,
      level: parseInt(characterData.level),
      owner: req.session.user.username,
      createdAt: new Date().toISOString(),
      abilities: {
        strength: parseInt(characterData.strength),
        dexterity: parseInt(characterData.dexterity),
        constitution: parseInt(characterData.constitution),
        intelligence: parseInt(characterData.intelligence),
        wisdom: parseInt(characterData.wisdom),
        charisma: parseInt(characterData.charisma)
      },
      skills: JSON.parse(characterData.skills),
      customSkills: JSON.parse(characterData.customSkills),
      background: characterData.background,
      alignment: characterData.alignment,
      hitPoints: {
        maximum: parseInt(characterData.maxHitPoints),
        current: parseInt(characterData.currentHitPoints)
      },
      armorClass: parseInt(characterData.armorClass),
      speed: parseInt(characterData.speed),
      equipment: characterData.equipment,
      features: characterData.features,
      spells: characterData.spells
    };
    
    const id = Date.now().toString();
    const charPath = path.join(__dirname, 'data', 'characters', `${id}.yaml`);
    
    await fs.writeFile(charPath, yaml.dump(character));
    res.redirect(`/characters/${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating character');
  }
});

app.get('/characters/:id', requireAuth, async (req, res) => {
  try {
    const charPath = path.join(__dirname, 'data', 'characters', `${req.params.id}.yaml`);
    const charData = await fs.readFile(charPath, 'utf8');
    const character = yaml.load(charData);
    
    // Check if user has access to this character
    if (character.owner !== req.session.user.username && !req.session.user.isAdmin) {
      return res.status(403).send('Forbidden: You do not have access to this character');
    }
    
    res.render('character_form', { 
      title: character.name,
      character, 
      isNew: false, 
      characterId: req.params.id,
      currentUser: req.session.user
    });
  } catch (err) {
    res.status(404).send('Character not found');
  }
});

app.put('/characters/:id', requireAuth, async (req, res) => {
  try {
    const charPath = path.join(__dirname, 'data', 'characters', `${req.params.id}.yaml`);
    const charData = await fs.readFile(charPath, 'utf8');
    const character = yaml.load(charData);
    
    // Check if user has access to this character
    if (character.owner !== req.session.user.username && !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this character' });
    }
    
    // Update the field sent in the request
    const { field, value } = req.body;
    const fieldPath = field.split('.');
    
    let target = character;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      if (!target[fieldPath[i]]) {
        target[fieldPath[i]] = {};
      }
      target = target[fieldPath[i]];
    }
    
    const lastField = fieldPath[fieldPath.length - 1];
    
    // Handle different types of values
    if (lastField === 'skills' || lastField === 'customSkills') {
      target[lastField] = JSON.parse(value);
    } else if (!isNaN(value) && String(parseInt(value)) === value) {
      target[lastField] = parseInt(value);
    } else {
      target[lastField] = value;
    }
    
    await fs.writeFile(charPath, yaml.dump(character));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating character' });
  }
});

app.delete('/characters/:id', requireAuth, async (req, res) => {
  try {
    const charPath = path.join(__dirname, 'data', 'characters', `${req.params.id}.yaml`);
    const charData = await fs.readFile(charPath, 'utf8');
    const character = yaml.load(charData);
    
    // Check if user has access to this character
    if (character.owner !== req.session.user.username && !req.session.user.isAdmin) {
      return res.status(403).send('Forbidden: You do not have access to this character');
    }
    
    await fs.unlink(charPath);
    res.redirect('/characters');
  } catch (err) {
    res.status(500).send('Error deleting character');
  }
});

// Start the server
async function startServer() {
  await ensureDirectories();
  await initAdminUser();
  
  app.listen(PORT, () => {
    console.log(`D&D Character Sheet App running on port ${PORT}`);
  });
}

startServer();
