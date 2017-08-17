'use strict';

const tmi = require('tmi.js');
const discord = require('discord.js');
const massive = require('massive');
const config = require('./config.json');
const COMMANDS = require('./lib/commands.js');
const USERS = require('./lib/users.js');
const CHANNELS = require('./lib/channels.js');
const DISCORD_NOTIFIER = require('./lib/discordNotifier.js');

// db connection info(psql)
const connectionInfo = {
  host: 'localhost',
  port: 5432,
  database: config["Database"],
  user: config["DB User"],
  password: config["DB Password"],
  ssl: false,
  poolSize: 10
};

// connect to db
massive(connectionInfo).then(db => {

  /*
  // Automatically create DB Tables if they don't exist
  console.log("Ensuring Correct Tables Exist...");
  db.tableCreation.createCommandsTable()
    .then( result => {
      console.log("Commands Table Verified.");
      db.tableCreation.createUserTable()
        .then( result => {
          console.log("User Table Verified.");
          db.tableCreation.createChannelSettings()
          .then( result => {
            console.log("Channel Settings Table Verified.");
            // makes sure 'db' is able to see new columns added from new tables
            db.reload().then(newDB => {
              db = newDB;
            })
          })
        })
    });
  */

  (async function createTables() {

    // These will run one after another, waiting for the previous to finish.
    // await db.tableCreation.createCommandsTable();
    // await db.tableCreation.createUserTable();
    // await db.tableCreation.createChannelSettings();

    // This will run all db creation at the same time then continue when all are finished.
    console.log("Ensuring Correct Tables Exist...");
    try {
      await Promise.all([db.tableCreation.createCommandsTable(),
                         db.tableCreation.createUserTable(),
                         db.tableCreation.createChannelSettings()]);

      let newDB = await db.reload();
      db = newDB;
      console.log("All Tables Verified.");

    } catch (err) {
      console.log("Something has gone horribly wrong with database creation.");
      console.log(err);
    }
  })();

  var options = {
    options: {
      debug: true
    },
    connection: {
      reconnect: true
    },
    identity: {
      username: config["Twitch Username"],
      password: config["Twitch Oauth"]
    },
    channels: ['#talbotextreme']
  };

  var client = new tmi.client(options);

  // Connect the client to the server..
  client.connect();

  client.on("connected", function (address, port) {
    CHANNELS.joinChannels(db, client);
    USERS.getUserList(db);
  })

  /*
  client.on('connected', function (address, port) {
    client.say('#talbotextreme', 'Hello world, I am back...')
  });
  */

  // Process every chat message sent
  client.on('chat', function (channel, userstate, message, self) {
    // Don't listen to my own messages...
    if (self) return;

    // If message starts with '!' process it as a command
    if (message.charAt(0) === '!') {
      COMMANDS.processCommand(db, client, channel, userstate, message);
    };
  })

  const discordClient = new discord.Client();
  discordClient.on(`ready`, () => {
    console.log(`I am ready!`);
  });
  discordClient.login(config["Discord Token"]);
  DISCORD_NOTIFIER.startNotifier(discord, discordClient);

});
