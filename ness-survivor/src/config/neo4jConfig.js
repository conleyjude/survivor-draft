import { driver as neo4jDriver, auth } from 'neo4j-driver';

const URI = process.env.REACT_APP_NEO4J_URI;
const USER = process.env.REACT_APP_NEO4J_USERNAME;
const PASSWORD = process.env.REACT_APP_NEO4J_PASSWORD;

let driver = null;
let initPromise = null;
let isInitializing = false;

/**
 * Initialize the Neo4j driver with connection pooling
 * This function ensures only one driver instance exists and handles
 * the connection lifecycle properly
 */
export const initDriver = async () => {
  // If already initialized, return immediately
  if (driver) {
    return driver;
  }

  // If currently initializing, wait for the promise
  if (initPromise) {
    return initPromise;
  }

  // Mark as initializing to prevent race conditions
  isInitializing = true;

  initPromise = (async () => {
    try {
      console.log('Initializing Neo4j driver with URI:', URI ? 'URI exists' : 'URI is missing');
      
      if (!URI || !USER || !PASSWORD) {
        throw new Error('Missing Neo4j credentials. Check your .env file.');
      }

      // Create driver with optimized connection pool settings
      driver = neo4jDriver(URI, auth.basic(USER, PASSWORD), {
        maxConnectionPoolSize: 50,
        minConnectionPoolSize: 5,
        maxConnectionLifetime: 60 * 60 * 1000, // 1 hour
        connectionAcquisitionTimeout: 60 * 1000, // 60 seconds
        socketConnectTimeout: 30 * 1000, // 30 seconds
        socketKeepAliveEnabled: true,
        socketKeepAliveOptions: {
          probeInterval: 30 * 1000, // 30 seconds
          idleTimeout: 60 * 1000, // 1 minute
        },
        disableLosslessIntegers: true, // Better for JavaScript
      });

      const serverInfo = await driver.getServerInfo();
      console.log('Neo4j Connection established successfully');
      console.log('Server info:', {
        agent: serverInfo.agent,
        protocolVersion: serverInfo.protocolVersion,
      });

      isInitializing = false;
      return driver;
    } catch (err) {
      console.error('Neo4j Connection error:', err.message);
      console.error('Cause:', err.cause);
      
      // Clean up on error
      if (driver) {
        try {
          await driver.close();
        } catch (closeErr) {
          console.error('Error closing driver on init failure:', closeErr);
        }
      }
      
      driver = null;
      initPromise = null;
      isInitializing = false;
      throw err;
    }
  })();

  return initPromise;
};

/**
 * Get the Neo4j driver instance
 * Initializes if needed and ensures only one instance exists
 */
export const getDriver = async () => {
  if (driver) {
    return driver;
  }

  if (!initPromise) {
    await initDriver();
  } else {
    await initPromise;
  }

  if (!driver) {
    throw new Error('Failed to initialize Neo4j driver');
  }

  return driver;
};

/**
 * Close the Neo4j driver
 * Should be called on app cleanup/unload
 */
export const closeDriver = async () => {
  if (driver) {
    try {
      await driver.close();
      console.log('Neo4j driver closed successfully');
    } catch (err) {
      console.error('Error closing Neo4j driver:', err);
    } finally {
      driver = null;
      initPromise = null;
      isInitializing = false;
    }
  }
};

/**
 * Check if driver is initialized and connected
 */
export const isDriverInitialized = () => {
  return driver !== null && !isInitializing;
};