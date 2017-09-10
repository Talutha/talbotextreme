'use strict';

const tmi = require('tmi.js');
const config = require('./config.json');
const COMMANDS = require('./lib/commands.js');
const USERS = require('./lib/users.js');
const CHANNELS = require('./lib/channels.js');
const DISCORD = require('./lib/discord/discordBot.js');
const DB = require('./lib/database.js');

global.db;

var options = {
  options: {
    debug: true
  },
  connection: {
    reconnect: true
  },
  identity: {
    username: config['Twitch Username'],
    password: config['Twitch Oauth']
  },
  channels: ['#hyperbets']
};

var client = new tmi.client(options);

// Because why not?
console.log(
  '\n'
+ '\n'
+ 'Welcome to... \n'
+ '   _____     _______       _   _____     _                           \n'
+ '  |_   _|   | | ___ \\     | | |  ___|   | |                          \n'
+ '    | | __ _| | |_/ / ___ | |_| |____  _| |_ _ __ ___ _ __ ___   ___ \n'
+ '    | |/ _` | | ___ \\/ _ \\| __|  __\\ \\/ / __| \'__/ _ \\ \'_ ` _ \\ / _ \\\n'
+ '    | | (_| | | |_/ / (_) | |_| |___>  <| |_| | |  __/ | | | | |  __/\n'
+ '    \\_/\\__,_|_\\____/ \\___/ \\__\\____/_/\\_\\\\__|_|  \\___|_| |_| |_|\\___|\n'
+ '\n'
+ '                                            by @Talutha & @slm_shockz \n'
);

(async function() {
  try {

    global.db = await DB.db;
    let db = global.db;

    // These will run one after another, waiting for the previous to finish.
    // await db.tableCreation.createCommandsTable();
    // await db.tableCreation.createUserTable();
    // await db.tableCreation.createChannelSettings();

    // This will run all db creation at the same time then continue when all are
    // finished.
    console.log('Ensuring Correct Tables Exist...');

    await Promise.all([
      db.tableCreation.createCommandsTable(),
      db.tableCreation.createUserTable(),
      db.tableCreation.createChannelSettings(),
      db.tableCreation.createDiscordNotifiersTable()
    ]);

    let newDB = await db.reload();
    db = newDB;
    console.log('All Tables Verified.');



    // Connect the client to the server..
    if (config['Enable Twitch Bot']) {
      client.connect();
    }

  } catch (err) {
    console.log('Something has gone horribly wrong with database creation.');
    console.log(err);
  }
})();

client.on('connected', function (address, port) {
  console.log('Address: ' + address + ':' + port);
  CHANNELS.joinChannels(db, client);
  // USERS.getUserList(db);
});

/*
client.on('connected', function (address, port) {
  client.say('#talbotextreme', 'Hello world, I am back...')
});
*/

// Process every chat message sent
client.on('chat', async function (channel, userstate, message, self) {
  // Don't listen to my own messages...
  if (self) return;

  // always update users on chat
  USERS.addUserToDB(db, channel, userstate);

  // If message starts with '!' process it as a command
  if (message.charAt(0) === '!') {
    COMMANDS.processCommand(db, client, channel, userstate, message);
  }
});

if (config['Enable Discord Bot']) {
  DISCORD.setUpDiscordClient();
}