'use strict';

const config = require('../../config.json');

let discordObject, discordClient;

function prepareCommand(command) {
  command = command.splice(1);
  command = command.toLowerCase();
  command = command.split(' ');
  return command;
}

function processCommand(command) {
  let commandArray = prepareCommand(command);
  switch (command[0]) {
  case 'addchannel':
    
    break;
  }
}