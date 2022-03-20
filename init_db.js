// a dangerous file
const stripe = require('./utils/stripe/index')

const { query, promisePoolEnd, databaseConfig } = require('./utils/db/index')
      bcrypt = require('bcryptjs')
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
    DROP TABLE IF EXISTS plan;
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
    DROP TABLE IF EXISTS time;
  `)
  await query(`
    DROP TABLE IF EXISTS timename;
  `)
  await query(`
    DROP TABLE IF EXISTS time_timename;
  `)
  await query(`
    DROP TABLE IF EXISTS video;
  `)
  await query(`
    DROP TABLE IF EXISTS clip;
  `)
  await query(`
    DROP TABLE IF EXISTS object_tag;
  `)
  await query(`
    DROP TABLE IF EXISTS tag_group;
  `)
  await query(`
    DROP TABLE IF EXISTS tag;
  `)
  await query(`
    DROP TABLE IF EXISTS folder_object;
  `)
  await query(`
    DROP TABLE IF EXISTS folder;
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
    CREATE TABLE IF NOT EXISTS plan(
      id INT PRIMARY KEY AUTO_INCREMENT,
      is_the_freemium BOOLEAN NOT NULL,
      is_the_ best BOOLEAN NOT NULL,
      created DATE NOT NULL,
      upload_hours_per_month INT NOT NULL,
      total_hours_saved INT,
      stripe_price_id VARCHAR(100),
      short_name VARCHAR(10) NOT NULL,
      full_name VARCHAR(40) NOT NULL,
      description VARCHAR(1000) NOT NULL,
      price INT NOT NULL
    );
  `)

  await query(`
      INSERT INTO plan (is_the_freemium, is_the_best, upload_hours_per_month, created, stripe_price_id, short_name, full_name, description, price)
      VALUES (true, false, 0.5, CURDATE(), null, 'test', 'Test Plan', 'This is the test plan', 0 );
  `)

  await query(`
      INSERT INTO plan (is_the_freemium, is_the_best, upload_hours_per_month, created, stripe_price_id, short_name, full_name, description, price)
      VALUES (false, false, 15, CURDATE(), 'price_1KEFwZA2CHRD2pUGhaehEJpN', 'gold', 'Gold Plan', 'This is the gold plan', 25 );
  `)

  await query(`
      INSERT INTO plan (is_the_freemium, is_the_best, upload_hours_per_month, created, stripe_price_id, short_name, full_name, description, price)
      VALUES (false, true, 40, CURDATE(), 'price_1KDwlGA2CHRD2pUGzsaCaX2k', 'basic', 'Basic Plan', 'This is the basic plan', 15 );
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
      tiimio_admin BOOLEAN NOT NULL DEFAULT false,
      password VARCHAR(300) NOT NULL,
      email_confirmed BOOLEAN NOT NULL DEFAULT false,
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
      plan_id INT NOT NULL,
      join_code VARCHAR(20),
      FOREIGN KEY (league_id) REFERENCES league(id),
      FOREIGN KEY (sport_id) REFERENCES sport(id),
      FOREIGN KEY (plan_id) REFERENCES plan(id)
    );
  `)

  await query(`
  INSERT INTO team (
    team_name, league_id, sport_id, created, join_code, plan_id
    ) VALUES 
    ( "Testi-tiimi", NULL, 1, CURDATE(), "123456", 1 ),
    ( "Koskenkorvan Urheilijat", NULL, 1, CURDATE(), "A7RHSK", 1 )
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
      deleted BOOLEAN DEFAULT false,
      hls_url VARCHAR(1000),
      duration_ts INT,
      duration INT,
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

  await query(`
      CREATE TABLE IF NOT EXISTS clip(
        id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
        starttime DECIMAL(15, 5) NOT NULL,
        endtime DECIMAL(15, 5) NOT NULL,
        video_id VARCHAR(50) NOT NULL,
        title VARCHAR(50),
        description VARCHAR(1000) DEFAULT '',
        created DATE NOT NULL,
        FOREIGN KEY (video_id) REFERENCES video(id) ON DELETE CASCADE
      );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tag_group(
      id INT PRIMARY KEY AUTO_INCREMENT,
      group_name VARCHAR(100) NOT NULL,
      team_id INT,
      league_id INT,
      FOREIGN KEY (league_id) REFERENCES league(id),
      FOREIGN KEY (team_id) REFERENCES team(id)
    );
  `)

  await query(`
    INSERT INTO tag_group (
      group_name, team_id
      ) VALUES 
      ( "Players", 1 ),
      ( "Events", 1 )
      ;
  `)

  await query(`
      CREATE TABLE IF NOT EXISTS tag(
        id INT PRIMARY KEY AUTO_INCREMENT,
        group_id INT NOT NULL,
        tag_name VARCHAR(50) NOT NULL,
        FOREIGN KEY (group_id) REFERENCES tag_group(id)
      );
  `)

  await query(`
    INSERT INTO tag (
      group_id, tag_name
      ) VALUES 
      ( 1, "Mörkö Marko" ),
      ( 1, "Jari Halttunen" )
      ;
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
      current_plan INT,
      FOREIGN KEY (team_id) REFERENCES team(id),
      FOREIGN KEY (email) REFERENCES user(email),
      FOREIGN KEY (current_plan) REFERENCES plan(id)
    );
  `)

  await query(`
    INSERT INTO user_team (
      email, team_id, team_admin, team_orderer, league_admin, user_joined_team, stripe_id, current_plan
    ) VALUES
      ( "aku@kettunen.com", 1, true, true, true, CURDATE(), '${customer1.id}', 1 ),
      ( "aku@kettunen.com", 2, false, false, false, CURDATE(), NULL, 1 )
    ;
  `)

  // await query(`
  // INSERT INTO video (
  //   id, team_id, original_url, service, job_id, title, description, original_type, 
  //   original_size, mp4_url, hls_url, duration, thumb_url, lazy_thumb_url, s3_key,
  //   uploader, uploaded, encoded
  //   ) VALUES 
  //   ( 'joujoujou', 1, 'yo', 'coconut', '123', 'Testi', 'Tällainen testi', 'mp4', 1000, 'https://tiimio-vid-dev.s3.eu-west-1.amazonaws.com/0365e631-3351-4151-805e-6f812bbc9865/720p.mp4',
  //     '123', 1900, 'https://tiimio-vid-dev.s3.eu-west-1.amazonaws.com/0365e631-3351-4151-805e-6f812bbc9865/thumbnail_medium.jpg',
  //     'https://tiimio-vid-dev.s3.eu-west-1.amazonaws.com/0365e631-3351-4151-805e-6f812bbc9865/thumbnail_low.jpg',
  //     '0365e631-3351-4151-805e-6f812bbc9865', 'aku@kettunen.com', NOW(), true
  //   )
  //   ;
  // `)

  await query(`
    CREATE TABLE IF NOT EXISTS folder(
      id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
      team_id INT NOT NULL,
      name VARCHAR(50),
      created TIMESTAMP NOT NULL,
      parent INT,
      position INT,
      clip_id INT,
      type VARCHAR(10),
      FOREIGN KEY (parent) REFERENCES folder(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES team(id)
    );
  `)

  await query(`
      CREATE TABLE IF NOT EXISTS time(
        id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
        video_id VARCHAR(50) NOT NULL,
        title VARCHAR(50),
        comment VARCHAR(500),
        created TIMESTAMP NOT NULL,
        FOREIGN KEY (video_id) REFERENCES video(id) ON DELETE CASCADE
      );
  `)

  await query(`
      CREATE TABLE IF NOT EXISTS timename(
        id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
        team_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        created TIMESTAMP NOT NULL,
        FOREIGN KEY (team_id) REFERENCES team(id) ON DELETE CASCADE
      );
  `)

  await query(`
      INSERT INTO timename (team_id, name, created)
      VALUES (1, '0yd', NOW()), (1, '20yd', NOW());
  `)

  await query(`
      CREATE TABLE IF NOT EXISTS time_timename(
        timename_id INT NOT NULL,
        time_id INT NOT NULL,
        video_time DECIMAL(10, 4) NOT NULL,
        time_from_first DECIMAL(8, 4) NOT NULL,
        pretty_time VARCHAR(5) NOT NULL,
        FOREIGN KEY (timename_id) REFERENCES timename(id),
        FOREIGN KEY (time_id) REFERENCES time(id) ON DELETE CASCADE
      );
  `)

  await query(`
      CREATE TABLE IF NOT EXISTS object_tag(
        clip_id INT,
        time_id INT,
        video_id VARCHAR(50),
        tag_id INT NOT NULL,
        FOREIGN KEY (clip_id) REFERENCES clip(id) ON DELETE CASCADE,
        FOREIGN KEY (time_id) REFERENCES time(id) ON DELETE CASCADE,
        FOREIGN KEY (video_id) REFERENCES video(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
      );
  `)

  let tables = await query(`show tables;`)
  tables.map(table => {
    console.log(table.Tables_in_tiimio)
  })

  await promisePoolEnd()

return
}

init()