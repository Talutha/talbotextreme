var tmi = require('tmi.js');

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
client.connect();

client.on('connected', function (address, port) {
  client.say('#talbotextreme', 'Hello world, I am back...')
});

client.on('chat', function (channel, userstate, message, self) {
  // Don't listen to my own messages...
  if (self) return;

  if (message === '!howdy') {
    console.log(userstate);
    client.say(channel, 'Howdy there ' + userstate['display-name'] + '!');
  };
})
