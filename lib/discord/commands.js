'use strict';

const config = require('../../config.json');
const DATABASE = require('../database.js');
let db;


async function processCommand(message) {

  message.array = prepareCommand(message.content);
  db = await DATABASE.getDB();

  if (!isElevatedUser(message)) {
    return;
  }

  switch (message.array[0]) {

  case 'addchannel':
    await enrollChannelInStreamAnnouncer(message);
    break;

  case 'removechannel':
    await unenrollChannelInStreamAnnouncer(message);
    break;

  default:
    console.log('Could not find command ' + message.content);
    message.channel.send('Command ' + message.content + ' does not exist!');
    break;

  }
}


function prepareCommand(command) {

  command = command.slice(1);
  command = command.toLowerCase();
  command = command.split(' ');

  return command;

}


function createObjectForDB(message) {
  
  let obj = {
    discord_guild_id: message.guild.id,
    discord_channel_id: message.channel.id,
    twitch_channel_name: message.array[1]
  };

  return obj;
}

function isElevatedUser(message) {

  let role = message.guild.roles
    .find('name', config['Discord Super User Role']);

  if (role.members.find('id', message.member.id)) {
    return true;
  } else {
    return false;
  }

}

async function checkIfAnnouncerExists(databaseObject) {
  
  let count = await db.discord_announcers.count(databaseObject);

  if (count > 0) {
    // console.log('Entry is already in database!');
    return true;
  
  } else {
    // console.log('Entry is not in database!');
    return false;
  }

}


async function enrollChannelInStreamAnnouncer(message) {

  try {

    let entry = createObjectForDB(message);

    if (await checkIfAnnouncerExists(entry)) {
      message.channel.send(message.array[1] + ' has already been added to '
      + 'the stream announcer!');

    } else {
      await db.discord_announcers.insert(entry);
      message.channel.send('Stream notifications have been turned on for '
      + message.array[1] + '!');

    }

  } catch (error) {

    console.log('Error in enrollChannelInStreamAnnouncer()', error);
    message.channel.send('There was an error enabling nofiticaitons for '
    + message.array[1]);

  }

}


async function unenrollChannelInStreamAnnouncer(message) {
  
  try {

    let entry = createObjectForDB(message);
    await db.discord_announcers.destroy(entry);
    message.channel.send('Stream notifications have been turned off for '
    + message.array[1] + '!');

  } catch (error) {

    console.log('Error in unenrollChannelInStreamAnnouncer()', error);
    message.channel.send('There was an error disabling nofiticaitons for '
    + message.array[1]);

  }

}


module.exports = {
  processCommand
};