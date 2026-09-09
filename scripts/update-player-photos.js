#!/usr/bin/env node
// Sets photo_url on existing players. Edit the PHOTOS map below with real image URLs, then run:
//   node scripts/update-player-photos.js

require('../server/node_modules/dotenv').config({
  path: require('path').resolve(__dirname, '../server/.env'),
});

const { getDriver, closeDriver } = require('../server/neo4jConfig');

const PHOTOS = {
  'Aaliyah Puglia': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Aaliyah-Puglia_00233b.jpg?w=3000',
  'Alexis Levine': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Alexis-Levine_00414b.jpg?w=3000',
  'Ana Sani': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Ana-Sani_00648b.jpg?w=3000',
  'Brady Booker': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Brady-Booker_01089b.jpg?w=3000',
  'Carter Krull': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Carter-Krull_01398b.jpg?w=3000',
  'Cristian Chavez': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Cristian-Chavez_01508b.jpg?w=3000',
  'Danny Kilby': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Danny-_Kilby_-Kilby_01719b.jpg?w=3000',
  'Devin Way': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Devin-Way_01860b.jpg?w=3000',
  'Eric Macksoud': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Eric-Macksoud_02058b.jpg?w=3000',
  'Jelly Loblack': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Angelica-_Jelly_-Loblack_01038b.jpg?w=3000',
  'Jenna Doore': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Jenna-Doore_02163b.jpg?w=3000',
  'Kristin Flickinger': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Kristin-Flickinger_02415b.jpg?w=3000',
  'Lewis Kelly': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Lewis-Kelly_02482b.jpg?w=3000',
  'Linnea Capobianco': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Linnea-Capobianco_02720b.jpg?w=3000',
  'Maggie Nestor': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Maggie-Nestor_03035b.jpg?w=3000',
  'Mike Pinsky': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Mike-Pinsky_03098b.jpg?w=3000',
  'Ori Jean-Charles': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Ori-Jean-Charles_03280b.jpg?w=3000',
  'Patt Cannaday': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Patt-Cannaday_03473b.jpg?w=3000',
  'Rob Antonson': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Rob-Antonson_03679b2.jpg?w=3000',
  'Sharonda Cox': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Sharonda-Cox_03865b.jpg?w=3000',
  'Thien An Nguyen': 'https://www.hollywoodreporter.com/wp-content/uploads/2026/08/3197255_SRVR_S51_Thein-An-Nguyen_00074b.jpg?w=3000',
};

// Full names that don't split as "First Last" (matches the DB's stored first_name/last_name)
const NAME_OVERRIDES = {
  'Thien An Nguyen': { first_name: 'Thien An', last_name: 'Nguyen' },
};

const updatePhotos = async () => {
  const driver = await getDriver();
  const session = driver.session();

  try {
    const players = Object.entries(PHOTOS)
      .filter(([, url]) => url)
      .map(([full_name, photo_url]) => {
        if (NAME_OVERRIDES[full_name]) {
          return { ...NAME_OVERRIDES[full_name], photo_url };
        }
        const [first_name, ...rest] = full_name.split(' ');
        return { first_name, last_name: rest.join(' '), photo_url };
      });

    if (players.length === 0) {
      console.log('No photo URLs set in PHOTOS - fill them in before running.');
      return;
    }

    const result = await session.executeWrite((transaction) => transaction.run(
      `UNWIND $players AS player
       MATCH (p:Player {first_name: player.first_name, last_name: player.last_name})
       SET p.photo_url = player.photo_url
       RETURN count(p) AS updated`,
      { players }
    ));

    console.log(`Updated photo_url for ${result.records[0].get('updated')} player(s).`);
  } finally {
    await session.close();
    await closeDriver();
  }
};

updatePhotos().catch((err) => {
  console.error('Failed to update player photos:', err.message);
  process.exit(1);
});
