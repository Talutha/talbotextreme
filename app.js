const tmi = require('tmi.js');
const massive = require('massive');

// db connection info(psql)
const connectionInfo = {
  host: 'localhost',
  port: 5432,
  database: 'test_commands_db',
  user: 'test_commands_db',
  password: 'testing',
  ssl: false,
  poolSize: 10
};

// connect to db
massive(connectionInfo).then(db => {

  db.commands.find({
    command_name: 'testing'
  }).then(result => {
    console.log(result[0].command_output);
  });



  var options = {
    options: {
      debug: true
    },
    connection: {
      reconnect: true
    },
    identity: {
      username: "TalBotExtreme",
      password: "changeme"
    },
    channels: ['#talbotextreme']
  };

  var client = new tmi.client(options);

  // Connect the client to the server..
  //client.connect();

  /*
  client.on('connected', function (address, port) {
    client.say('#talbotextreme', 'Hello world, I am back...')
  });
  */

  client.on('chat', function (channel, userstate, message, self) {
    // Don't listen to my own messages...
    if (self) return;

    if (message === '!howdy') {
      console.log(userstate);
      client.say(channel, 'Howdy there ' + userstate['display-name'] + '!');
    };
  })

});
