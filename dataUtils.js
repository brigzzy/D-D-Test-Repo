// dataUtils.js
const path = require('path');
const fs = require('fs/promises');
const yaml = require('js-yaml');

/**
 * Ensure directories exist for data storage
 */
async function ensureDirectories() {
  const directories = [
    path.join(__dirname, 'data'),
    path.join(__dirname, 'data', 'users'),
    path.join(__dirname, 'data', 'characters')
  ];

  for (const dir of directories) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Generic method to read YAML file
 * @param {string} filePath - Full path to the YAML file
 * @returns {Promise<Object>} Parsed YAML data
 */
async function readYamlFile(filePath) {
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return yaml.load(fileContents);
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    throw err;
  }
}

/**
 * Generic method to write YAML file
 * @param {string} filePath - Full path to the YAML file
 * @param {Object} data - Data to write
 */
async function writeYamlFile(filePath, data) {
  try {
    await fs.writeFile(filePath, yaml.dump(data));
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
    throw err;
  }
}

/**
 * List all files in a directory
 * @param {string} directoryPath - Path to the directory
 * @returns {Promise<string[]>} Array of filenames
 */
async function listFiles(directoryPath) {
  try {
    return await fs.readdir(directoryPath);
  } catch (err) {
    console.error(`Error listing files in ${directoryPath}:`, err);
    return [];
  }
}

module.exports = {
  ensureDirectories,
  readYamlFile,
  writeYamlFile,
  listFiles
};