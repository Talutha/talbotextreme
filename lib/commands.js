'use strict';

const DEFAULT_COMMANDS = ['dropzone', 'addcom', 'remcom', 'editcom'];

function processCommand(db, client, channel, userstate, message) {
  console.log(message);
  var elevatedUser = checkUserElevation(userstate);
  message[0] = message[0].toLowerCase();
  if (message[0] === 'dropzone') {
    // Random drop location for PUBG.
    // Generates random X, Y coords and passes them to a third party website to show location
    dropZone(client, channel);
  }
  else if (message[0] === 'addcom' && elevatedUser) {
    // Input: [addcom, (!)crazycommand, This, is, a, crazy, command!]
    addCommand(db, client, channel, userstate, message);
  }
  else if (message[0] === 'remcom' && elevatedUser) {
    // Input: [remcom, (!)crazycommand]
    removeCommand(db, client, channel, userstate, message);
  }
  else if (message[0] === 'editcom' && elevatedUser) {
    // Input: [editcom, (!)crazycommand, This, is, the, new, command!]
    editCommand(db, client, channel, userstate, message);
  }
  else {
    findCommand(db, client, channel, userstate, message);
  }

}

// Removes first command, lowercases second command and removes '!' if present
function stripCommand(message) {
  message.shift();
  message[0] = message[0].toLowerCase();
  if (message[0].charAt(0) === "!") {
    message[0] = message[0].substr(1);
  }
  return message;
}

function checkUserElevation(userstate) {
  if (userstate['mod'] === true || userstate['badges']['broadcaster'] == 1) {
    return true;
  } else {
    return false;
  }
}

function addCommand(db, client, channel, userstate, message) {

  // Input: [(!)crazycommand, This, is, a, crazy, command!]
  message = stripCommand(message);
  // Input: [crazycommand, This, is, a, crazy, command!]
  var command_name = message.shift();
  message = message.join(' ');
  db.commands.find({
    command_name: command_name,
    channel: channel
  }).then(result => {
    if (result.length === 0 && !DEFAULT_COMMANDS.includes(command_name)) throw 'Command Does Not Exist';
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
  // Input: [remcom, (!)crazycommand]
  message = stripCommand(message).join(' ');
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

function editCommand(db, client, channel, userstate, message) {
  // Input: [editcom, (!)crazycommand, This, is, the, new, command!]
  message = stripCommand(message);
  // Input: [crazycommand, This, is, the, new, command!]
  var command_name = message.shift();
  message = message.join(' ');
  db.commands.update({
    command_name: command_name,
    channel: channel
  }, {
    command_output: message
  }).then (update => {
    if (update.length === 0) throw 'Command Does Not Exist';
    console.log(userstate["display-name"] + " has updated the command !" + command_name + ".");
    client.say(channel, "!" + command_name + " has been updated to \"" + message + "\"");
  }).catch(err => {
    console.log(userstate["display-name"] + " attempted to update the command !" + command_name + " but it did not exist.");
    client.say(channel, "!" + command_name + " does not exist or cannot be edited.  Perhaps you meant to !addcom instead?");
  })
}

function findCommand(db, client, channel, userstate, message) {
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

function dropZone(client, channel) {
  let x = -(Math.random() * 250).toFixed(2);
  let y = (Math.random() * 250).toFixed(2);
  let url = "https://pubgmap.io/erangel.html#2/-106.3/117.8/w=" + x + ',' + y;
  client.say(channel, url);
}

module.exports = {
  processCommand: processCommand
}
