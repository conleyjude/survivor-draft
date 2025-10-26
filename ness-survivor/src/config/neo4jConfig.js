const neo4j = require('neo4j-driver');
require('dotenv').config();

const URI = process.env.REACT_APP_NEO4J_URI;
const USER = process.env.REACT_APP_NEO4J_USERNAME;
const PASSWORD = process.env.REACT_APP_NEO4J_PASSWORD;

let driver = null;

export const initDriver = async () => {
  try {
    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
    const serverInfo = await driver.getServerInfo();
    console.log('Neo4j Connection established');
    console.log(serverInfo);
    return driver;
  } catch (err) {
    console.log(`Neo4j Connection error\n${err}\nCause: ${err.cause}`);
    if (driver) {
      await driver.close();
    }
    throw err;
  }
};

export const getDriver = () => driver;

export const closeDriver = async () => {
  if (driver) {
    await driver.close();
    driver = null;
  }
};