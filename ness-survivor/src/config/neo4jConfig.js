import { driver as neo4jDriver, auth } from 'neo4j-driver';

const URI = process.env.REACT_APP_NEO4J_URI;
const USER = process.env.REACT_APP_NEO4J_USERNAME;
const PASSWORD = process.env.REACT_APP_NEO4J_PASSWORD;

let driver = null;
let initPromise = null;

export const initDriver = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        console.log('Initializing Neo4j driver with URI:', URI ? 'URI exists' : 'URI is missing');
        if (!URI || !USER || !PASSWORD) {
          throw new Error('Missing Neo4j credentials. Check your .env file.');
        }
        
        driver = neo4jDriver(URI, auth.basic(USER, PASSWORD));
        const serverInfo = await driver.getServerInfo();
        console.log('Neo4j Connection established');
        console.log(serverInfo);
        return driver;
      } catch (err) {
        console.log(`Neo4j Connection error\n${err}\nCause: ${err.cause}`);
        if (driver) {
          await driver.close();
        }
        driver = null;
        throw err;
      }
    })();
  }
  return initPromise;
};

export const getDriver = async () => {
  if (!driver) {
    await initDriver();
  }
  return driver;
};

export const closeDriver = async () => {
  if (driver) {
    await driver.close();
    driver = null;
  }
};