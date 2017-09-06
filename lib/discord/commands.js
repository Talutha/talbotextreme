'use strict';

const config = require('../../config.json');
const DATABASE = require('../database.js');

function prepareCommand(command) {
  command = command.slice(1);
  command = command.toLowerCase();
  command = command.split(' ');
  return command;
}

async function processCommand(message) {
  let commandArray = prepareCommand(message.content);
  let db = await DATABASE.getDB();
  switch (commandArray[0]) {
  case 'addchannel':
    await db.discord_notifiers.insert({
      discord_guild_id: message.guild.id,
      discord_channel_id: message.channel.id,
      twitch_channel_name: commandArray[1],
      notify_enabled: true
    });
    message.channel.send('Stream notifications have been turned on for '
    + commandArray[1] + '!');
    break;
  }
}

module.exports = {
  processCommand
};