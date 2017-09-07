'use strict';

const TIMERS = require('./timers.js');
const CDSTRINGS = require('./cdStrings.js');
const USERS = require('./users.js');
const POINTS = require('./points.js');
const DB = require('./database.js');

async function serve(channel, userstate, client, message) {

  let db = await DB.db;
  let gameState = TIMERS.showTimers()[channel].chickenDinner;
  let userID = userstate['user-id'];
  let amount = parseInt(message[1]);
  let hasEnoughPoints = POINTS.hasEnoughPoints(db, channel, userID, amount);

  if (!hasEnoughPoints || gameState.state === 'in-progress') {
    return false;
  } else if (gameState.cooldown === true) {
    client.say(channel, 'The plane is currently refueling. !chickendinner ' + 
    'will be available again at the top of the hour!');
  } else if (gameState.state === 'lobby') {
    this.lobby();
  }

  this.prepare(channel, userstate, client, amount, gameState);

}

async function prepare() {
  
}

async function lobby() {

}

module.exports = {
  serve,
  prepare,
  lobby
};