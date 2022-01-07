// a dangerous file
const stripe = require('./utils/stripe/index')

const { query, promisePoolEnd, databaseConfig } = require('./utils/db/index')
      bcrypt = require('bcrypt')
      saltRounds = 10;
      plainText = 'secret';
const { v4: uuidv4 } = require('uuid');

require('dotenv')

if(databaseConfig.host != 'tiimio-dev.cgizl8uo5piu.eu-central-1.rds.amazonaws.com') process.exit()

const init = async () => {
  await query(`
    SET FOREIGN_KEY_CHECKS = 0;
  `)
  await query(`
    DROP TABLE IF EXISTS league;
  `)
  await query(`
    DROP TABLE IF EXISTS team;
  `)
  await query(`
    DROP TABLE IF EXISTS sport;
  `)
  await query(`
    DROP TABLE IF EXISTS user;
  `)
  await query(`
    DROP TABLE IF EXISTS user_team;
  `)

  await query(`
    DROP TABLE IF EXISTS video;
  `)

  await query(`
    SET FOREIGN_KEY_CHECKS = 1;
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS sport(
      id INT PRIMARY KEY AUTO_INCREMENT,
      sport_name VARCHAR(100),
      created DATE
    );
  `)

  await query(`
    INSERT INTO sport(
      created, sport_name
    ) VALUES (
      CURDATE(), 'Pesäpallo'
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS league (
      id INT PRIMARY KEY AUTO_INCREMENT,
      created DATE NOT NULL,
      league_name VARCHAR(100) NOT NULL,
      sport_id INT NOT NULL,
      FOREIGN KEY (sport_id) REFERENCES sport(id)
    );
  `)

  await query(`
    INSERT INTO league (
      created, league_name, sport_id
    ) VALUES (
      CURDATE(), "Testi-liiga", 1
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS user(
      email VARCHAR(300) NOT NULL PRIMARY KEY,
      full_name VARCHAR(200) NOT NULL,
      tiimio_admin BOOLEAN NOT NULL,
      password VARCHAR(300) NOT NULL,
      email_confirmed BOOLEAN NOT NULL,
      stripe_customer_id VARCHAR(100) NOT NULL,
      joined DATE NOT NULL
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS team(
      id INT PRIMARY KEY AUTO_INCREMENT,
      team_name VARCHAR(100) NOT NULL,
      league_id INT,
      sport_id INT NOT NULL,
      created DATE NOT NULL,
      join_code VARCHAR(20),
      FOREIGN KEY (league_id) REFERENCES league(id),
      FOREIGN KEY (sport_id) REFERENCES sport(id)
    );
  `)

  await query(`
  INSERT INTO team (
    team_name, league_id, sport_id, created, join_code
    ) VALUES 
    ( "Testi-tiimi", NULL, 1, CURDATE(), "1234-1234" ),
    ( "Koskenkorvan Urheilijat", NULL, 1, CURDATE(), "A6G6-SIJD" )
    ;
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS video(
      id VARCHAR(50) PRIMARY KEY NOT NULL,
      team_id INT NOT NULL,
      original_url VARCHAR(500) NOT NULL,
      service VARCHAR(20) NOT NULL,
      job_id VARCHAR(100),
      title VARCHAR(200) NOT NULL,
      description VARCHAR(1000),
      original_type VARCHAR(20) NOT NULL,
      original_size INT NOT NULL,
      mp4_url VARCHAR(1000),
      hls_url VARCHAR(1000),
      duration VARCHAR(200),
      thumb_url VARCHAR(300),
      lazy_thumb_url VARCHAR(300),
      s3_key VARCHAR(50) NOT NULL,
      uploader VARCHAR(300) NOT NULL,
      uploaded DATE NOT NULL,
      encoded BOOLEAN NOT NULL,
      FOREIGN KEY (team_id) REFERENCES team(id),
      FOREIGN KEY (uploader) REFERENCES user(email)
    );
  `)

  const hash = await bcrypt.hash(plainText, saltRounds)

  await query(`
      INSERT INTO user (
        email, full_name, tiimio_admin, password, joined, email_confirmed
      ) VALUES 
      ( "aku@kettunen.com", "Aku Kettunen", false, "${hash}", CURDATE(), true ),
      ( "aku@epesis.com", "Jari Halttunen", true, "${hash}", CURDATE(), true )
    ;
  `)

  const customer1 = await stripe.createCustomer({ 
    full_name: 'Aku Kettunen',
    email: 'aku@kettunen.com',
    meta: {
      team_id: 1,
      team_name: 'Testi-tiimi'
    }
  })

  await query(`
    CREATE TABLE IF NOT EXISTS user_team(
      email VARCHAR(300) NOT NULL,
      team_id INT NOT NULL,
      team_admin BOOLEAN NOT NULL,
      team_orderer BOOLEAN NOT NULL,
      league_admin BOOLEAN,
      user_joined_team DATE,
      stripe_id VARCHAR(100),
      FOREIGN KEY (team_id) REFERENCES team(id),
      FOREIGN KEY (email) REFERENCES user(email)
    );
  `)

  await query(`
    INSERT INTO user_team (
      email, team_id, team_admin, team_orderer, league_admin, user_joined_team, stripe_id
    ) VALUES
      ( "aku@kettunen.com", 1, true, true, true, CURDATE(), '${customer1.id}' ),
      ( "aku@kettunen.com", 2, false, false, false, CURDATE(), NULL )
    ;
  `)


  let tables = await query(`show tables;`)
  tables.map(table => {
    console.log(table.Tables_in_tiimio)
  })

  await promisePoolEnd()

return
}

init()