/**
 * Query Executor Utility
 * 
 * This utility provides helper functions for consistent query execution patterns.
 * It's used internally by the neo4jService but can also be used directly for
 * custom queries not covered by the standard service.
 */

import { getDriver } from '../config/neo4jConfig';

/**
 * Represents the result of a query execution
 * @typedef {Object} QueryResult
 * @property {boolean} success - Whether the query executed successfully
 * @property {Array} data - The query results (array of record objects)
 * @property {string|null} error - Error message if execution failed
 * @property {number} recordCount - Number of records returned
 */

/**
 * Execute a single Cypher query with detailed result information
 * 
 * @param {string} query - The Cypher query to execute
 * @param {Object} params - Parameters to substitute in the query (default: {})
 * @returns {Promise<QueryResult>} - Detailed result object
 * 
 * @example
 * const result = await executeQueryWithDetails(
 *   'MATCH (p:Player) WHERE p.first_name = $name RETURN p',
 *   { name: 'John' }
 * );
 */
export const executeQueryWithDetails = async (query, params = {}) => {
  const driver = await getDriver();
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    const data = result.records.map(record => record.toObject());
    
    return {
      success: true,
      data,
      error: null,
      recordCount: data.length,
    };
  } catch (error) {
    console.error('Query execution error:', error);
    return {
      success: false,
      data: [],
      error: error.message,
      recordCount: 0,
    };
  } finally {
    await session.close();
  }
};

/**
 * Execute multiple queries in sequence within a single transaction
 * All queries succeed or all fail together.
 * 
 * @param {Array<{query: string, params: Object}>} queries - Array of query objects
 * @returns {Promise<Array<QueryResult>>} - Array of results for each query
 * 
 * @example
 * const results = await executeQueriesInTransaction([
 *   { query: 'CREATE (p:Player {...}) RETURN p', params: {...} },
 *   { query: 'MATCH (t:Tribe) ... RETURN t', params: {...} }
 * ]);
 */
export const executeQueriesInTransaction = async (queries) => {
  const driver = await getDriver();
  const session = driver.session();
  try {
    const txc = session.beginTransaction();
    const results = [];

    for (const { query, params = {} } of queries) {
      try {
        const result = await txc.run(query, params);
        const data = result.records.map(record => record.toObject());
        results.push({
          success: true,
          data,
          error: null,
          recordCount: data.length,
        });
      } catch (error) {
        // If any query fails, rollback all
        await txc.rollback();
        console.error('Transaction failed during query execution:', error);
        throw error;
      }
    }

    await txc.commit();
    return results;
  } catch (error) {
    console.error('Transaction execution error:', error);
    // Return error result for each query
    return queries.map(() => ({
      success: false,
      data: [],
      error: error.message,
      recordCount: 0,
    }));
  } finally {
    await session.close();
  }
};

/**
 * Format Neo4j Integer values to JavaScript numbers
 * Neo4j driver returns integers as special Integer objects
 * 
 * @param {Object} obj - Object that may contain Neo4j Integer values
 * @returns {Object} - Object with integers converted to numbers
 */
export const formatNeo4jIntegers = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(formatNeo4jIntegers);
  }

  const formatted = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && value.constructor && value.constructor.name === 'Integer') {
      formatted[key] = value.toNumber();
    } else if (typeof value === 'object') {
      formatted[key] = formatNeo4jIntegers(value);
    } else {
      formatted[key] = value;
    }
  }
  return formatted;
};

/**
 * Format query results for consistent output
 * Handles Neo4j specific types and normalizes data structure
 * 
 * @param {Array} records - Neo4j query result records
 * @returns {Array} - Formatted array of objects
 */
export const formatQueryResults = (records) => {
  return records.map(record => {
    const obj = record.toObject();
    return formatNeo4jIntegers(obj);
  });
};

/**
 * Validate query parameters before execution
 * Ensures all required parameters are provided
 * 
 * @param {string} query - The Cypher query
 * @param {Object} params - Parameters provided
 * @param {Array<string>} requiredParams - List of required parameter names
 * @returns {Object} - { valid: boolean, missing: Array<string> }
 * 
 * @example
 * const validation = validateQueryParams(
 *   query,
 *   { firstName: 'John' },
 *   ['firstName', 'lastName']
 * );
 * if (!validation.valid) {
 *   console.error('Missing:', validation.missing);
 * }
 */
export const validateQueryParams = (query, params, requiredParams = []) => {
  const missing = [];

  for (const param of requiredParams) {
    if (!(param in params) || params[param] === null || params[param] === undefined) {
      missing.push(param);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
};

/**
 * Build a WHERE clause filter from an object
 * Useful for dynamic filtering
 * 
 * @param {Object} filters - Object with property names and values
 * @param {string} nodeLabel - The node label to filter (e.g., 'p' for Player)
 * @returns {string} - WHERE clause string or empty string if no filters
 * 
 * @example
 * const where = buildWhereClause({ archetype: 'leader' }, 'p');
 * // Returns: "WHERE p.archetype = 'leader'"
 */
export const buildWhereClause = (filters, nodeLabel = 'n') => {
  if (!filters || Object.keys(filters).length === 0) {
    return '';
  }

  const conditions = Object.entries(filters)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${nodeLabel}.${key} = '${value}'`;
      } else if (typeof value === 'number') {
        return `${nodeLabel}.${key} = ${value}`;
      } else if (typeof value === 'boolean') {
        return `${nodeLabel}.${key} = ${value}`;
      }
      return null;
    })
    .filter(condition => condition !== null);

  if (conditions.length === 0) {
    return '';
  }

  return `WHERE ${conditions.join(' AND ')}`;
};

/**
 * Handle query execution with automatic retry on failure
 * Useful for temporary connection issues
 * 
 * @param {string} query - The Cypher query
 * @param {Object} params - Query parameters
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} delayMs - Delay between retries in milliseconds (default: 1000)
 * @returns {Promise<QueryResult>} - Query result
 */
export const executeQueryWithRetry = async (
  query,
  params = {},
  maxRetries = 3,
  delayMs = 1000
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await executeQueryWithDetails(query, params);
      if (result.success) {
        return result;
      }
      lastError = result.error;
    } catch (error) {
      lastError = error.message;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  return {
    success: false,
    data: [],
    error: `Query failed after ${maxRetries} attempts: ${lastError}`,
    recordCount: 0,
  };
};

/**
 * Extract a single value from a query result
 * Useful for queries that return a single value
 * 
 * @param {QueryResult} result - Result from executeQueryWithDetails
 * @param {string} key - The key to extract (e.g., 's' for Season)
 * @param {number} recordIndex - Which record to extract from (default: 0)
 * @returns {Object|null} - The extracted value properties or null
 */
export const extractSingleValue = (result, key, recordIndex = 0) => {
  if (!result.success || result.data.length <= recordIndex) {
    return null;
  }

  const record = result.data[recordIndex];
  const value = record[key];
  
  return value?.properties || value || null;
};

/**
 * Create a debug report for a query execution
 * Useful for troubleshooting
 * 
 * @param {string} queryName - Name of the query being executed
 * @param {QueryResult} result - Result from executeQueryWithDetails
 * @param {Object} params - The parameters that were used
 * @returns {Object} - Debug report object
 */
export const createDebugReport = (queryName, result, params) => {
  return {
    queryName,
    timestamp: new Date().toISOString(),
    success: result.success,
    recordCount: result.recordCount,
    error: result.error,
    paramsUsed: params,
    dataPreview: result.data.slice(0, 1), // First record only
  };
};
