'use strict';

const TIMERS = require('./timers.js');

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

  // if no chicken dinner is running and game is available
  if (currentState === 'available' && cdStatus.activated) {
    currentState = 'lobby';
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

  function cdFight() {

    if (participants.length <= 3) {

      // Do something here for the top 3

    } else {

    // Choose one or two random people and select one winner

    }
  }

}

module.exports = {
  serve
};