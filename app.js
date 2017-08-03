'use strict';

const tmi = require('tmi.js');
const massive = require('massive');
const config = require('./config.json');
const COMMANDS = require('./lib/commands.js');

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
      // Remove '!' from message
      message = message.substr(1);

      // Split message into parts for ease of processing
      message = message.split(' ');

      COMMANDS.processCommand(db, client, channel, userstate, message);
    };
  })

});
