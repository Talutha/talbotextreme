'use strict';

const TIMERS = require('./timers.js');
const CDSTRINGS = require('./cdStrings.js');
const USERS = require('./users.js');

/*
  Chicken Dinner Idea:
    Players sign up using a chosen number of points.  Lobby is created for 5
    minutes.  After lobby closes, game begins.  Every two minutes, one or two
    players are chosen at random and one randomly wins(in the event of a single
    player chosen, they die).  Game goes until one player is remaining.  Top
    3 players get points back, 50%, 30%, 20%.  Game can go long and is only 
    available once per hour.
*/

// Input: [chickendinner, 100]
async function serve(db, channel, userstate, client, message) {
  
  let amount = parseInt(message[1]);
  let cdStatus = TIMERS.showTimers()[channel].chickenDinner;
  let currentState = cdStatus.state;
  let participants = cdStatus.participants;

  console.log(currentState);

  // if no chicken dinner is running and game is available
  if (currentState === 'available' && cdStatus.activated) {
    cdStatus.state = 'lobby';
    participants.push(userstate['user-id']);
    // Send start warning in 2:30 minutes.
    // Not sure if I need a timer stored in the timer object for each channel
    // but it seemed safer to do it this way.
    client.say(channel, `@${userstate['display-name']} has challenged ` + 
    'everyone to a "!chickendinner"! The battle begins in 5 minutes!');
    cdStatus.timer(startingSoon, 150000);
  } else if (currentState === 'lobby') {
    participants.push(userstate['user-id']);
  }

  function startingSoon() {
    client.say(channel, 'The battle for a !chickendinner will begin in ' + 
    '2 minutes and 30 seconds!');
    cdStatus.timer(battleBegins, 150000);
  }

  function battleBegins() {
    client.say(channel, 'The battle for a !chickendinner has begin! '+ 
    'We should be receiving the first set of outcomes soon...');
    cdStatus.timer(cdFight, 120000);
  }

  async function cdFight() {

    if (participants.length <= 3) {

      // Do something here for the top 3

    } else {

      // Choose one or two random people and select one winner
      let singleParticipant = false;
      // % chance to get a single participant event
      let singleChance = 20;

      if (Math.round(Math.random()*100) <= singleChance) {
        singleParticipant = true;
      }

      let loser = participants[Math.floor(Math.random()*participants.length)];
      loser = await USERS.toDisplayName(loser);
      participants.splice(participants.indexOf(loser), 1);
      // If singleParticipant is true we just throw out the winner
      let winner = participants[Math.floor(Math.random()*participants.length)];
      winner = await USERS.toDisplayName(winner);

      if (singleParticipant) {
        // Single Participant outcome here
        let outcome = CDSTRINGS.solo[Math.floor(Math.random()*CDSTRINGS.solo.length)];
        outcome = outcome.replace('@L', loser);
        client.say(channel, outcome);
      } else {
        let outcome = CDSTRINGS.duo[Math.floor(Math.random()*CDSTRINGS.solo.length)];
        outcome = outcome.replace('@L', loser);
        outcome = outcome.replace('@W', winner);
        client.say(channel, outcome);
      }

    }
  }

}

module.exports = {
  serve
};