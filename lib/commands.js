'use strict';

function processCommand(db, client, channel, userstate, message) {
  console.log(message);
  message[0] = message[0].toLowerCase();
  switch (message[0]) {
    case 'howdy': {
      client.say(channel, 'Howdy there @' + userstate['display-name'] + '!');
      break;
    }
    case 'dropzone': {
      // Random drop location for PUBG.
      // Generates random X,Y coords and passes them to a third party website to show location
      let x = -(Math.random() * 250).toFixed(2);
      let y = (Math.random() * 250).toFixed(2);
      let url = "https://pubgmap.io/erangel.html#2/-106.3/117.8/w=" + x + ',' + y;
      client.say(channel, url);
      break;
    }
    case 'addcom': {
      if (userstate['mod'] === true || userstate['badges']['broadcaster'] == 1) {
        // Input: [addcom, (!)crazycommand, This, is, a, crazy, command!]
        message.shift();
        message[0] = message[0].toLowerCase();
        // process adding command
        addCommand(db, client, channel, userstate, message)
      } else {
        console.log( userstate['display-name'] + ' attempted to create a command without the correct permissions.');
      }
      break;
    }
    case 'remcom': {
      if (userstate['mod'] === true || userstate['badges']['broadcaster'] == 1) {
        // Input: [remcom, (!)crazycommand]
        message.shift();
        message[0] = message[0].toLowerCase();
        // process removing command
        // Input: [(!)crazycommand]
        removeCommand(db, client, channel, userstate, message);
      } else {
        console.log(userstate['display-name'] + ' attempted to destroy a command without the correct permissions.');
      }
      break;
    }
    default: {
      db.commands.find({
        command_name: message,
        channel: channel
      }).then(result => {
        console.log(result);
        client.say(channel, result[0].command_output);
        db.commands.update({
          id: result[0].id,
          last_used: new Date().toISOString(),
          last_used_by: userstate['user-id'],
          times_used: result[0].times_used + 1
        })
      }).catch(err => {
        console.log( 'I am sorry commander, but I could not find the command !' + message );
      })
    }
  }
}

function addCommand(db, client, channel, userstate, message) {

  // Input: [(!)crazycommand, This, is, a, crazy, command!]
  if (message[0].charAt(0) === "!") {
    message[0] = message[0].substr(1);
  }
  // Input: [crazycommand, This, is, a, crazy, command!]
  var command_name = message.shift();
  message = message.join(' ');
  db.commands.find({
    command_name: command_name,
    channel: channel
  }).then(result => {
    if (results.length === 0) throw 'Command Exists';
    console.log(userstate['display-name'] + " attempted to create the command !" + command_name + " but it already exists.")
    client.say(channel, "I'm sorry " + userstate['display-name'] + ' but a command with that name already exists.')
  }).catch(err => {
    // add command to database here
    db.commands.insert({
      command_name: command_name,
      command_output: message,
      channel: channel,
      creator: userstate['user-id'],
      created_on: new Date().toISOString(),
      times_used: 0
    }).then(success => {
      client.say(channel, "The command !" + command_name + " has successfully been created!");
    }).catch(failure => {
      console.log("I was not able to create the command !" + command_name + " despite the command not existing. " + failure);
      client.say(channel, "Something has gone horribly wrong, against all odds I was not able to create the command !" + command_name);
    })
  })

}

function removeCommand(db, client, channel, userstate, message) {
  // Input: [(!)crazycommand]
  if (message[0].charAt(0) === "!") {
    message[0] = message[0].substr(1);
  }
  // Input: [crazycommand]
  message = message.join(' ');
  // Input: crazycommand
  db.commands.find({
    command_name: message,
    channel: channel
  }).then(result => {
    // Destroy command
    db.commands.destroy({
      command_name: message,
      channel: channel
    }).then(destroy => {
      client.say(channel, "!" + message + " has been destroyed.");
    })
  }).catch(err => {
    console.log("!" + message + " was not found and could not be destroyed.");
    client.say(channel, "!" + message + "could not be found or removed.");
  })
}

module.exports = {
  processCommand: processCommand
}
