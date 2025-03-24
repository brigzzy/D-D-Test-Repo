// index.js
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

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
    
    req.session.user = {
      username: user.username,
      isAdmin: user.isAdmin || false
    };
    
    res.redirect('/characters');
  } catch (err) {
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

// Character Routes remain the same as in the previous implementation

// Start the server
async function startServer() {
  await initializeApp();
  
  app.listen(PORT, () => {
    console.log(`D&D Character Sheet App running on port ${PORT}`);
  });
}

startServer();
