#!/usr/bin/env node

require('../server/node_modules/dotenv').config({
  path: require('path').resolve(__dirname, '../server/.env'),
});

const { getDriver, closeDriver } = require('../server/neo4jConfig');

const SEASON_NUMBER = 51;
const SEASON_YEAR = 2026;
const SOURCE_URL = 'https://survivor.fandom.com/wiki/Survivor_51#Castaways';

// The wiki currently leaves Original Tribe blank for every castaway.
const TRIBES = [
  { name: 'Savu', color: '#3f5b46' },
  { name: 'Toka', color: '#b0451f' },
];

const PLAYERS = [
  { first_name: 'Aaliyah', last_name: 'Puglia', age: 24, hometown: 'Providence, RI', occupation: 'Chef' },
  { first_name: 'Alexis', last_name: 'Levine', age: 34, hometown: 'Atlanta, GA', occupation: 'Criminal Defense Attorney' },
  { first_name: 'Ana', last_name: 'Sani', age: 34, hometown: 'Toronto, ON', occupation: 'Voice Actress' },
  { first_name: 'Brady', last_name: 'Booker', age: 27, hometown: 'Knoxville, TN', occupation: 'Pro Wrestler' },
  { first_name: 'Carter', last_name: 'Krull', age: 24, hometown: 'Sioux Falls, SD', occupation: 'Livestock Farmer' },
  { first_name: 'Cristian', last_name: 'Chavez', age: 25, hometown: 'Salt Lake City, UT', occupation: 'Head of HR' },
  { first_name: 'Danny', last_name: 'Kilby', age: 30, hometown: 'London, ON', occupation: 'Game Designer' },
  { first_name: 'Devin', last_name: 'Way', age: 33, hometown: 'Los Angeles, CA', occupation: 'Actor' },
  { first_name: 'Eric', last_name: 'Macksoud', age: 34, hometown: 'Windsor Locks, CT', occupation: 'Mental Health Counselor' },
  { first_name: 'Jelly', last_name: 'Loblack', age: 29, hometown: 'Bloomington, IN', occupation: 'Sociology Professor' },
  { first_name: 'Jenna', last_name: 'Doore', age: 30, hometown: 'Toledo, OH', occupation: 'Wedding Photographer' },
  { first_name: 'Kristin', last_name: 'Flickinger', age: 49, hometown: 'Santa Barbara, CA', occupation: 'Crisis Management' },
  { first_name: 'Lewis', last_name: 'Kelly', age: 28, hometown: 'Corozal, PR', occupation: 'Farmer' },
  { first_name: 'Linnea', last_name: 'Capobianco', age: 25, hometown: 'Jersey City, NJ', occupation: 'Entrepreneur' },
  { first_name: 'Maggie', last_name: 'Nestor', age: 40, hometown: 'Charles Town, WV', occupation: 'Farmer' },
  { first_name: 'Mike', last_name: 'Pinsky', age: 32, hometown: 'New York City, NY', occupation: 'Baseball Executive' },
  { first_name: 'Ori', last_name: 'Jean-Charles', age: 27, hometown: 'Spring Valley, NY', occupation: 'Personal Trainer' },
  { first_name: 'Patt', last_name: 'Cannaday', age: 33, hometown: 'Washington, DC', occupation: 'Federal Prosecutor' },
  { first_name: 'Rob', last_name: 'Antonson', age: 40, hometown: 'Cumberland, RI', occupation: 'Airline Gate Agent' },
  { first_name: 'Sharonda', last_name: 'Cox', age: 34, hometown: 'Richmond, KY', occupation: 'Resident, OBGYN' },
  { first_name: 'Thien An', last_name: 'Nguyen', age: 24, hometown: 'Fort Worth, TX', occupation: 'Medical Student' },
].map((player) => ({
  ...player,
  archetype: '',
  notes: `Imported from ${SOURCE_URL}`,
  status: 'active',
  challenges_won: 0,
  has_idol: false,
  idols_played: 0,
  votes_received: 0,
  photo_url: null,
}));

const populate = async () => {
  const driver = await getDriver();
  const session = driver.session();

  try {
    await session.executeWrite((transaction) => transaction.run(
      `MERGE (s:Season {season_number: $season_number})
       SET s.year = $year
       RETURN s`,
      { season_number: SEASON_NUMBER, year: SEASON_YEAR }
    ));

    await session.executeWrite((transaction) => transaction.run(
      `MATCH (s:Season {season_number: $season_number})
       UNWIND $tribes AS tribe
       MERGE (t:Tribe {tribe_name: tribe.name})
       SET t.tribe_color = tribe.color
       MERGE (s)-[:HAS_TRIBE]->(t)
       RETURN count(t) AS tribes`,
      { season_number: SEASON_NUMBER, tribes: TRIBES }
    ));

    const result = await session.executeWrite((transaction) => transaction.run(
      `MATCH (s:Season {season_number: $season_number})
       UNWIND $players AS player
       MERGE (p:Player {first_name: player.first_name, last_name: player.last_name})
       SET p.age = player.age,
           p.occupation = player.occupation,
           p.hometown = player.hometown,
           p.archetype = player.archetype,
           p.notes = player.notes,
           p.status = player.status,
           p.challenges_won = player.challenges_won,
           p.has_idol = player.has_idol,
           p.idols_played = player.idols_played,
           p.votes_received = player.votes_received,
           p.photo_url = player.photo_url
       MERGE (p)-[:COMPETES_IN]->(s)
       RETURN count(p) AS players`,
      { season_number: SEASON_NUMBER, players: PLAYERS }
    ));

    console.log(`Populated Season ${SEASON_NUMBER} with ${result.records[0].get('players')} players.`);
    console.log('Starting tribe assignments were not imported because the source page leaves them blank.');
  } finally {
    await session.close();
    await closeDriver();
  }
};

populate().catch((error) => {
  console.error('Failed to populate Survivor 51:', error.message);
  process.exitCode = 1;
});
