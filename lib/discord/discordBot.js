'use strict';

const config = require('../../config.json');
const commands = require('./commands.js');
const discord = require('discord.js');
const client = new discord.Client();

function setUpDiscordClient() {
  
  client.login(config['Discord Token'])
    .catch(error => {
      console.log(error);
    });

  client.on('ready', () => {
    console.log('Discord bot ready!');
  });

  client.on('message', message => {
    if (message.content.charAt(0) === '!') {
      commands.process(message.content);
    }
  });

}

module.exports = {
  setUpDiscordClient
};