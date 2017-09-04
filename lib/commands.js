'use strict';

const CHANNELS = require('./channels.js');
const USERS = require('./users.js');
const POINTS = require('./points.js');
const CHICKENDINNER = require('./chickenDinner.js');
const DEFAULT_COMMANDS = [
  'dropzone',
  'addcom',
  'remcom',
  'editcom',
  'join',
  'leave',
  'add',
  'remove',
  'settings',
  'chickendinner'
];

let db, client, channel, userstate, message, elevatedUser, points, broadcaster;

async function processCommand(database, cl, ch, us, msg) {

  db = database;
  client = cl;
  channel = ch;
  userstate = us;
  message = msg;
  try {

    points = await db.channel_settings.find({ channel: channel });
    points = points[0].points_command;
    
    // Remove '!' from message
    message = message.substr(1);
    
    // Split message into parts for ease of processing
    message = message.split(' ');
    
    // Check if user is a mod or broadcaster
    broadcaster = checkBroadcaster();
    elevatedUser = checkUserElevation(userstate);
    message[0] = message[0].toLowerCase();
    
  } catch (err) {
    console.log(err);
  }

  if (message[0] === 'dropzone') {

    // Random drop location for PUBG.
    // Generates random X, Y coords and passes them to a third party website to
    // show location
    dropZone();

  }
  else if (message[0] === points) {

    // Input: [points(variable)]
    getPoints();

  }
  else if (message[0] === 'settings' && broadcaster) {

    // Input: [settings, points_name, missing, pants]
    joinChannel();

  }
  else if (message[0] === 'add' && elevatedUser) {

    // Input: [add, 500, talutha]
    addPoints();

  }
  else if (message[0] === 'remove' && elevatedUser) {

    // Input: [remove, (-)500, talutha]
    removePoints();

  }
  else if (message[0] === 'join') {

    // Input: [join]
    joinChannel();

  }
  else if (message[0] === 'leave') {

    // Input: [leave]
    leaveChannel();

  }
  else if (message[0] === 'addcom' && elevatedUser) {

    // Input: [addcom, (!)crazycommand, This, is, a, crazy, command!]
    addCommand();

  }
  else if (message[0] === 'chickendinner') {

    // Input: [chickendinner, 100]
    chickenDinner();

  }
  else if (message[0] === 'remcom' && elevatedUser) {

    // Input: [remcom, (!)crazycommand]
    removeCommand();

  }
  else if (message[0] === 'editcom' && elevatedUser) {

    // Input: [editcom, (!)crazycommand, This, is, the, new, command!]
    editCommand();

  }
  else {

    // Input: [(!)crazycommand]
    findCommand();

  }

}

// Removes first command, lowercases second command and removes '!' if present
function stripCommand() {
  message.shift();
  message[0] = message[0].toLowerCase();
  if (message[0].charAt(0) === '!') {
    message[0] = message[0].substr(1);
  }
  return message;
}

function checkUserElevation() {
  if (userstate['mod'] === true) {
    return true;
  } else {
    return checkBroadcaster();
  }
}

function checkBroadcaster() {
  if (userstate['badges'] !== null) {
    if (userstate['badges']['broadcaster'] == 1) {
      return true;
    }
  } 

  return false;

}

function addCommand() {

  // Input: [addcom, (!)crazycommand, This, is, a, crazy, command!]
  // Make sure there is enough to add a full command
  if (message.length < 3) {
    return;
  }
  message = stripCommand();
  // Input: [crazycommand, This, is, a, crazy, command!]
  var command_name = message.shift();
  message = message.join(' ');
  db.commands.find({
    command_name: command_name,
    channel: channel
  }).then(result => {
    if (result.length === 0 && !DEFAULT_COMMANDS.includes(command_name)) {
      throw 'Command Does Not Exist';
    }
    console.log(userstate['display-name'] + ' attempted to create the command !'
                + command_name + ' but it already exists.');
    client.say(channel, 'I\'m sorry ' + userstate['display-name'] + ' but a '
               + 'command with that name already exists.');
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
      client.say(channel, 'The command !' + command_name + ' has successfully '
                 + 'been created!');
    }).catch(failure => {
      console.log('I was not able to create the command !' + command_name
                  + ' despite the command not existing. ' + failure);
      client.say(channel, 'Something has gone horribly wrong, against all odds '
                 + 'I was not able to create the command !' + command_name);
    });
  });

}

function removeCommand() {
  // Input: [remcom, (!)crazycommand]
  // Make sure there is enough to remove a command
  if (message.length !== 2) {
    return;
  }
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
      client.say(channel, '!' + message + ' has been destroyed.');
    });
  }).catch(err => {
    console.log('!' + message + ' was not found and could not be destroyed.');
    client.say(channel, '!' + message + 'could not be found or removed.');
  });
}

function editCommand() {
  // Input: [editcom, (!)crazycommand, This, is, the, new, command!]
  // Make sure there is enough to edit a command
  if (message.length < 3) {
    return;
  }
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
    console.log(userstate['display-name'] + ' has updated the command !'
                + command_name + '.');
    client.say(channel, '!' + command_name + ' has been updated to "' + message
               + '"');
  }).catch(err => {
    console.log(userstate['display-name'] + ' attempted to update the command !'
                + command_name + ' but it did not exist.');
    client.say(channel, '!' + command_name + ' does not exist or cannot be '
               + 'edited.  Perhaps you meant to !addcom instead?');
  });
}

function findCommand() {
  message = message.join('');
  db.commandFind(message, channel)
    .then(result => {
      console.log(result);
      client.say(channel, result[0].command_output);
      let last_used = new Date().toISOString();
      let last_user = userstate['user-id'];
      let times_used = result[0].times_used + 1;
      let command_id = result[0].id;
      db.commandUpdate(last_used, last_user, times_used, command_id);
    }).catch(err => {
      //console.log(err);
      console.log( 'I am sorry commander, but I could not find the command !'
                  + message );
    });
}

function dropZone() {
  let x = -(Math.random() * 250).toFixed(2);
  let y = (Math.random() * 250).toFixed(2);
  let url = 'https://pubgmap.io/erangel.html#2/-106.3/117.8/w=' + x + ',' + y;
  client.say(channel, url);
}

function joinChannel() {
  CHANNELS.processChannels(db, client, channel, userstate, message);
}

function leaveChannel() {
  CHANNELS.processChannels(db, client, channel, userstate, message);
}

async function getPoints() {
  try {

    // Check to make sure user is in DB before looking for points
    await USERS.addUserToDB(db, channel, userstate);
    let userID = userstate['user-id'];
    let amount = await POINTS.getPointsAmount(db, channel, userID);
    let pointsName = await POINTS.getPointsName(db, channel);

    // Output: Bot: @User has 500 points!
    client.say(channel, '@' + userstate['display-name']
               + ' currently has ' + amount + ' ' + pointsName + '.');

  } catch (err) {

    console.log(err);

  }
}

async function addPoints() {
  try {

    // Input: [add, 500, talutha]
    message = stripCommand(message);

    // Input: [500, talutha]

    // Ensure we are ADDING points
    if (parseInt(message[0]) < 0) return;
    let userInfo = await alterPoints();
    let pointsName = await POINTS.getPointsName(db, channel);
    client.say(channel, 'I have added ' + message[0] + ' ' + pointsName + ' to '
               + userInfo.users[0].display_name + '.');

  } catch (err) {
    console.log(err);
  }

}

async function removePoints() {
  try {

    // Input: [remove, (-)500, talutha]
    message = stripCommand(message);

    // Ensure we are REMOVING points
    message[0] = -Math.abs(message[0]);
    // Input: [-500, talutha]
    let userInfo = await alterPoints();
    let pointsName = await POINTS.getPointsName(db, channel);
    client.say(channel, 'I have removed ' + Math.abs(message[0]) + ' ' + pointsName
               + ' from ' + userInfo.users[0].display_name + '.');

  } catch (err) {
    console.log(err);
  }
}

function chickenDinner() {

  CHICKENDINNER.serve(db, channel, userstate, client, message);

}

async function alterPoints() {
  try {

    let username = message[1];
    let amount = message[0];
    let userInfo = await USERS.getUserInfo(username);
    let userID = userInfo.users[0]._id;
    await POINTS.modifyPoints(db, channel, userID, amount);
    return userInfo;

  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  processCommand: processCommand
};
