const tmi = require('tmi.js');
const massive = require('massive');
const config = require('./config.json');

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

  client.on('chat', function (channel, userstate, message, self) {
    // Don't listen to my own messages...
    if (self) return;

    if (message.charAt(0) === '!') {
      message = message.substr(1);

      if (message === 'howdy') {
        console.log(userstate);
        client.say(channel, 'Howdy there @' + userstate['display-name'] + '!');
      } else {
        db.commands.find({
          command_name: message
        }).then(result => {
          client.say(channel, result[0].command_output);
        }).catch(err => {
          console.log( 'I am sorry commander, but I could not find the command !' + message );
        })
      };
    }
  })

});
