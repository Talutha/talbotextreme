'use strict';

function processCommand(db, client, channel, userstate, message) {
  if (message === 'howdy') {
    client.say(channel, 'Howdy there @' + userstate['display-name'] + '!');
  } else {
    // Seach through DB for command
    db.commands.find({
      command_name: message
    }).then(result => {
      client.say(channel, result[0].command_output);
    }).catch(err => {
      console.log( 'I am sorry commander, but I could not find the command !' + message );
    })
  }
}

module.exports = {
  processCommand: processCommand
}
