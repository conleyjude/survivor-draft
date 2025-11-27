/**
 * DataImport.js
 * Import functionality for CSV and JSON files
 */

/**
 * Parse CSV string to array of objects
 * @param {string} csvContent - Raw CSV content
 * @param {Array} [headers] - Custom headers (auto-detected if not provided)
 * @returns {Array} Array of objects
 */
export const parseCSV = (csvContent, headers = null) => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }

  // Parse header row
  const headerLine = lines[0];
  const cols = headers || parseCSVLine(headerLine);
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj = {};
    
    cols.forEach((col, idx) => {
      obj[col] = values[idx] || '';
    });
    
    data.push(obj);
  }

  return data;
};

/**
 * Parse a single CSV line
 * @param {string} line - CSV line
 * @returns {Array} Array of values
 */
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

/**
 * Parse JSON content
 * @param {string} jsonContent - Raw JSON content
 * @returns {Array|Object} Parsed data
 */
export const parseJSON = (jsonContent) => {
  try {
    return JSON.parse(jsonContent);
  } catch (err) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }
};

/**
 * Read file as text
 * @param {File} file - File object
 * @returns {Promise<string>} File content
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};

/**
 * Validate player data
 * @param {Object} player - Player object
 * @returns {Object} {valid: boolean, errors: Array}
 */
export const validatePlayerData = (player) => {
  const errors = [];

  if (!player['First Name'] || !player['First Name'].trim()) {
    errors.push('First Name is required');
  }
  if (!player['Last Name'] || !player['Last Name'].trim()) {
    errors.push('Last Name is required');
  }
  if (!player['Season']) {
    errors.push('Season is required');
  }
  if (!player['Tribe']) {
    errors.push('Tribe is required');
  }
  if (player['Placement'] && isNaN(Number(player['Placement']))) {
    errors.push('Placement must be a number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate season data
 * @param {Object} season - Season object
 * @returns {Object} {valid: boolean, errors: Array}
 */
export const validateSeasonData = (season) => {
  const errors = [];

  if (!season['Season Number']) {
    errors.push('Season Number is required');
  }
  if (isNaN(Number(season['Season Number']))) {
    errors.push('Season Number must be a number');
  }
  if (!season['Year']) {
    errors.push('Year is required');
  }
  if (isNaN(Number(season['Year']))) {
    errors.push('Year must be a number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate team data
 * @param {Object} team - Team object
 * @returns {Object} {valid: boolean, errors: Array}
 */
export const validateTeamData = (team) => {
  const errors = [];

  if (!team['Team Name'] || !team['Team Name'].trim()) {
    errors.push('Team Name is required');
  }
  if (!team['Owner'] || !team['Owner'].trim()) {
    errors.push('Owner is required');
  }
  if (!team['Season']) {
    errors.push('Season is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Transform CSV player data to Neo4j format
 * @param {Array} csvData - Array of player objects from CSV
 * @returns {Array} Transformed data
 */
export const transformPlayerData = (csvData) => {
  return csvData.map(row => ({
    first_name: row['First Name'] || '',
    last_name: row['Last Name'] || '',
    season_number: Number(row['Season']) || 0,
    tribe_name: row['Tribe'] || '',
    placement: row['Placement'] ? Number(row['Placement']) : null,
    occupation: row['Occupation'] || '',
    age: row['Age'] ? Number(row['Age']) : null,
    challenges_won: row['Challenges Won'] ? Number(row['Challenges Won']) : 0,
    votes_received: row['Votes Received'] ? Number(row['Votes Received']) : 0,
    has_idol: row['Has Idol']?.toLowerCase() === 'yes',
    idols_played: row['Idols Played'] ? Number(row['Idols Played']) : 0,
  }));
};

/**
 * Transform CSV season data to Neo4j format
 * @param {Array} csvData - Array of season objects from CSV
 * @returns {Array} Transformed data
 */
export const transformSeasonData = (csvData) => {
  return csvData.map(row => ({
    season_number: Number(row['Season Number']) || 0,
    year: Number(row['Year']) || new Date().getFullYear(),
  }));
};

/**
 * Transform CSV team data to Neo4j format
 * @param {Array} csvData - Array of team objects from CSV
 * @returns {Array} Transformed data
 */
export const transformTeamData = (csvData) => {
  return csvData.map(row => ({
    team_name: row['Team Name'] || '',
    owner: row['Owner'] || '',
    season_number: Number(row['Season']) || 0,
    previous_wins: row['Previous Wins'] ? Number(row['Previous Wins']) : 0,
  }));
};

/**
 * Import players from file
 * @param {File} file - CSV or JSON file
 * @returns {Promise<Object>} {success: boolean, data: Array, errors: Array}
 */
export const importPlayers = async (file) => {
  try {
    const content = await readFileAsText(file);
    const fileType = file.name.split('.').pop().toLowerCase();
    
    let data;
    if (fileType === 'csv') {
      data = parseCSV(content);
    } else if (fileType === 'json') {
      data = parseJSON(content);
      if (!Array.isArray(data)) data = [data];
    } else {
      throw new Error('Unsupported file format. Please use CSV or JSON.');
    }

    // Validate all rows
    const errors = [];
    const validRows = [];

    data.forEach((row, idx) => {
      const validation = validatePlayerData(row);
      if (validation.valid) {
        validRows.push(row);
      } else {
        errors.push({
          row: idx + 2, // +2 because row 1 is header
          errors: validation.errors,
        });
      }
    });

    // Transform valid data
    const transformed = transformPlayerData(validRows);

    return {
      success: errors.length === 0,
      data: transformed,
      errors,
      summary: {
        total: data.length,
        valid: validRows.length,
        invalid: errors.length,
      },
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      errors: [{ error: err.message }],
      summary: { total: 0, valid: 0, invalid: 0 },
    };
  }
};

/**
 * Import seasons from file
 * @param {File} file - CSV or JSON file
 * @returns {Promise<Object>} {success: boolean, data: Array, errors: Array}
 */
export const importSeasons = async (file) => {
  try {
    const content = await readFileAsText(file);
    const fileType = file.name.split('.').pop().toLowerCase();
    
    let data;
    if (fileType === 'csv') {
      data = parseCSV(content);
    } else if (fileType === 'json') {
      data = parseJSON(content);
      if (!Array.isArray(data)) data = [data];
    } else {
      throw new Error('Unsupported file format. Please use CSV or JSON.');
    }

    // Validate all rows
    const errors = [];
    const validRows = [];

    data.forEach((row, idx) => {
      const validation = validateSeasonData(row);
      if (validation.valid) {
        validRows.push(row);
      } else {
        errors.push({
          row: idx + 2,
          errors: validation.errors,
        });
      }
    });

    // Transform valid data
    const transformed = transformSeasonData(validRows);

    return {
      success: errors.length === 0,
      data: transformed,
      errors,
      summary: {
        total: data.length,
        valid: validRows.length,
        invalid: errors.length,
      },
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      errors: [{ error: err.message }],
      summary: { total: 0, valid: 0, invalid: 0 },
    };
  }
};

/**
 * Import teams from file
 * @param {File} file - CSV or JSON file
 * @returns {Promise<Object>} {success: boolean, data: Array, errors: Array}
 */
export const importTeams = async (file) => {
  try {
    const content = await readFileAsText(file);
    const fileType = file.name.split('.').pop().toLowerCase();
    
    let data;
    if (fileType === 'csv') {
      data = parseCSV(content);
    } else if (fileType === 'json') {
      data = parseJSON(content);
      if (!Array.isArray(data)) data = [data];
    } else {
      throw new Error('Unsupported file format. Please use CSV or JSON.');
    }

    // Validate all rows
    const errors = [];
    const validRows = [];

    data.forEach((row, idx) => {
      const validation = validateTeamData(row);
      if (validation.valid) {
        validRows.push(row);
      } else {
        errors.push({
          row: idx + 2,
          errors: validation.errors,
        });
      }
    });

    // Transform valid data
    const transformed = transformTeamData(validRows);

    return {
      success: errors.length === 0,
      data: transformed,
      errors,
      summary: {
        total: data.length,
        valid: validRows.length,
        invalid: errors.length,
      },
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      errors: [{ error: err.message }],
      summary: { total: 0, valid: 0, invalid: 0 },
    };
  }
};

export default {
  parseCSV,
  parseJSON,
  readFileAsText,
  validatePlayerData,
  validateSeasonData,
  validateTeamData,
  transformPlayerData,
  transformSeasonData,
  transformTeamData,
  importPlayers,
  importSeasons,
  importTeams,
};
