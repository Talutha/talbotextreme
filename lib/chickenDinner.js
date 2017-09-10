'use strict';

const TIMERS = require('./timers.js');
const CDSTRINGS = require('./cdStrings.js');
const USERS = require('./users.js');
const POINTS = require('./points.js');
const DB = require('./database.js');

async function serve(channel, userstate, client, message) {

  try {

    let db = await DB.getDB();
    let gameState = TIMERS.showTimers()[channel].chickenDinner;
    let userID = userstate['user-id'];
    let amount = Math.abs(parseInt(message[1]));
    let hasEnoughPoints = POINTS.hasEnoughPoints(db, channel, userID, amount);

    if (!hasEnoughPoints || gameState.state === 'in-progress') {
      return false;
    } else if (gameState.state === 'lobby') {
      this.lobby(channel, userstate, amount, gameState);
    } else if (gameState.cooldown === true) {
      client.say(channel, 'The plane is currently refueling. !chickendinner ' + 
      'will be available again at the top of the hour!');
    } else {
      this.prepare(channel, userstate, client, amount, gameState);
    }

  } catch (err) {
    console.log(err);
  }

}

async function prepare(channel, userstate, client, amount, gameState) {

  gameState = this.changeState(gameState, 'lobby');
  gameState = this.resetPot(gameState);
  gameState.cooldown = true;

  this.lobby(channel, userstate, amount, gameState);

  client.say(channel, `@${userstate['display-name']} has challenged ` + 
  'everyone to a "!chickendinner"! The battle begins in 5 minutes!');

  gameState.timer(
    this.halfWayPreparation.bind(this, channel, client, gameState), 
    10000
  );

}

async function lobby(channel, userstate, amount, gameState) {

  this.addToPot(channel, userstate, amount, gameState);
  this.addParticipant(userstate['user-id'], gameState);

  return gameState;

}

function halfWayPreparation(channel, client, gameState) {

  client.say(channel, 'The battle for a !chickendinner will begin in ' + 
  '2 minutes and 30 seconds!');

  gameState.timer(
    this.battleReadyCheck.bind(this, channel, client, gameState),
    150000
  );

}

function battleReadyCheck(channel, client, gameState) {

  if (gameState.participants.length <= 1) {
    this.cancelGame(channel, client, gameState);
  } else {
    this.setRewards(gameState);
    client.say(channel, 'The battle for a !chickendinner has begun! '+ 
      'We should be receiving the first set of outcomes soon...');

    this.changeState(gameState, 'in-progress');

    gameState.timer(this.fightRouting.bind(this, channel, client, gameState), 
      150000
    );
  }
}

async function cancelGame(channel, client, gameState) {
  let db = DB.getDB();
  let userID = parseInt(gameState.participants.join());
  let amount = gameState.pot.total;
  let pointsName = await POINTS.getPointsName(db, channel);

  client.say(channel, 'Unfortunately there were not enough people ' +
  `signed up for !chickendinner. ${pointsName} have been refunded.`);

  gameState.cooldown = false;

  POINTS.modifyPoints(db, channel, userID, amount);
}

function setRewards(gameState) {
  let houseCut = 10;
  let totalPool = gameState.pot.total;

  gameState.pot.total = totalPool - getPercentage(houseCut, totalPool);

  let cutPool = gameState.pot.total;

  gameState.pot.first = getPercentage(50, cutPool);
  gameState.pot.second = getPercentage(30, cutPool);
  gameState.pot.third = getPercentage(20, cutPool);

}

function getPercentage(perc, amount) {
  let result = (perc/100)*amount;
  return result;
}

function fightRouting(channel, client, gameState) {

}

async function addToPot(channel, userstate, amount, gameState) {
  let db = await DB.getDB();
  let userID = userstate['user-id'];
  let removeAmount = -Math.abs(amount);
  POINTS.modifyPoints(db, channel, userID, removeAmount);
  gameState.pot.total += amount;

  return gameState;
}

function changeState(gameState, status) {
  gameState.state = status;

  return gameState;
}

function resetPot(gameState) {
  gameState.pot.total = 0;
  
  return gameState;
}

function addParticipant(userID, gameState) {
  gameState.participants.push(userID);

  return gameState;
}

module.exports = {
  serve,
  prepare,
  lobby,
  changeState,
  resetPot,
  addToPot,
  addParticipant,
  halfWayPreparation,
  battleReadyCheck,
  cancelGame,
  setRewards,
  fightRouting,
  getPercentage
};