'use strict';

const config = require('../../config.json');
const commands = require('./commands.js');
const announcer = require('./announcer.js');
const discord = require('discord.js');
const client = new discord.Client();

function setUpDiscordClient() {
  
  // login and set up everything
  client.login(config['Discord Token'])
    
    .then(() => {
      announcer.start(discord, client);
    })

    .catch(error => {
      console.log(error);
    });


  // log when the discord bot is ready
  client.on('ready', () => {
    console.log('Discord bot ready!');
  });


  // create event listener for when a message is sent
  // TODO: ignore bots own messages
  client.on('message', message => {
    
    if (message.content.charAt(0) === '!') {
      commands.processCommand(message).then(() => {
        console.log('Processed command: ' + message.content);
      });
    }
  
  });
  
}

module.exports = {
  setUpDiscordClient
};