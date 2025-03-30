// middleware.js
const path = require('path');
const fs = require('fs/promises');
const yaml = require('js-yaml');

/**
 * Middleware to require authentication
 * Ensures user is logged in before accessing protected routes
 */
function requireAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

/**
 * Middleware to require admin privileges
 * Ensures user has admin role before accessing admin routes
 */
function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  }
  res.status(403).send('Forbidden: Admin access required');
}

/**
 * Load user data from YAML file
 * @param {string} username - Username to load
 * @returns {Promise<Object>} User data object
 */
async function loadUserData(username) {
  const userPath = path.join(__dirname, 'data', 'users', `${username}.yaml`);
  try {
    const userData = await fs.readFile(userPath, 'utf8');
    return yaml.load(userData);
  } catch (err) {
    console.error(`Error loading user data for ${username}:`, err);
    return null;
  }
}

/**
 * Save user data to YAML file
 * @param {string} username - Username to save
 * @param {Object} userData - User data to save
 */
async function saveUserData(username, userData) {
  const userPath = path.join(__dirname, 'data', 'users', `${username}.yaml`);
  try {
    await fs.writeFile(userPath, yaml.dump(userData));
  } catch (err) {
    console.error(`Error saving user data for ${username}:`, err);
    throw err;
  }
}

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  // If user is logged in, attach theme preference
  if (req.session.user && req.session.user.theme) {
    res.locals.userTheme = req.session.user.theme;
  }
  next();
});

module.exports = {
  requireAuth,
  requireAdmin,
  loadUserData,
  saveUserData
};
