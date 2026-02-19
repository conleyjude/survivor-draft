const neo4j = require('neo4j-driver');

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USERNAME;
const PASSWORD = process.env.NEO4J_PASSWORD;

let driver = null;

/**
 * Initialize the Neo4j driver
 */
const initDriver = async () => {
  if (driver) return driver;

  if (!URI || !USER || !PASSWORD) {
    throw new Error('Missing Neo4j credentials. Check your .env file.');
  }

  driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD), {
    maxConnectionPoolSize: 50,
    minConnectionPoolSize: 5,
    maxConnectionLifetime: 60 * 60 * 1000,
    connectionAcquisitionTimeout: 60 * 1000,
    socketConnectTimeout: 30 * 1000,
    disableLosslessIntegers: true,
  });

  const serverInfo = await driver.getServerInfo();
  console.log('Neo4j connected:', serverInfo.agent);
  return driver;
};

/**
 * Get the driver instance (initializes if needed)
 */
const getDriver = async () => {
  if (!driver) await initDriver();
  return driver;
};

/**
 * Close the driver
 */
const closeDriver = async () => {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('Neo4j driver closed');
  }
};

module.exports = { initDriver, getDriver, closeDriver };
