'use strict';

const USERS = require('./users.js');
const DB = require('./database.js');

// Need to figure out a way to create individual cancelable timers for each
// channel in the database.

// I think creating an object and storing all the channels in the object at
// startup is the best way to do it.
var timers = {};

/*
The object could look something like this:

{
  #talutha: {
    offlineInterval: 20,
    onlineInterval: 5,
    timer: setInterval(addPointsOnTimerFunction, seeIfChannelOnlineAndSetTimeAccordingly)
  }
}

Then maybe we start the timer function when the channel starts. If a channel
goes online during the timer, we would need to cancel it and set a new timer.
I think an overall check should be done for every channel would be the easiest.

*/

function addProp(channel, innerProps) {
  timers[channel] = innerProps;
}

function addChannel(channel) {
  timers[channel] = {
    channelName: channel,
    pointsTimer: false,
    online: false,
    startTimer: function(time) {
      this.pointsTimer = setInterval( function() {
        iteratePoints(channel);
      }
        , time);
    },
    stopTimer: function() {
      clearInterval(this.pointsTimer);
      this.pointsTimer = false;
    },
    chickenDinner: {
      activated: true,
      state: 'available',
      participants: [],
      timer: function(func, time) {
        setTimeout( func, time);
      }
    }
  };
}

function checkOnlineStatus(func) {
  setInterval( func, 10000);
}

async function iteratePoints(channel) {
  try {

    let db = await DB.db;
    console.log('Running Points Iteration for ' + channel);
    let channel_settings = await db.channel_settings.find({ channel: channel });
    let points = channel_settings[0].points_per_iteration;
    let userList = await USERS.getUserList(db, channel);
    await USERS.processForPoints(db, userList, channel, points);

  } catch (err) { 
    console.log('Point Iteration Error:');
    console.log(err); 
  }

}

async function startPointsTimer(db, channel) {
  try {

    if (Array.isArray(channel)) {
      channel = channel.join(',');
    }

    let interval;
    let channelSettings = await db.channel_settings.find({ channel: channel });
    let pointsActivated = channelSettings[0].points_activated;
    channelSettings = channelSettings[0];

    // check is channel has points enabled
    if (pointsActivated && !timers[channel].online) {

      interval = channelSettings.points_offline_interval;

    } else if (pointsActivated && timers[channel].online) {

      interval = channelSettings.points_online_interval;
      
    }

    // convert interval to seconds
    interval = parseInt(interval);
    interval = interval * 1000;
    timers[channel].startTimer(interval);

  } catch (err) {
    console.log('startPointsTimer Error:');
    console.log(err);
  }
}

function stopPointsTimer(channel) {

  timers[channel].stopTimer();

}

function changeOnlineStatus(channel) {
  let db = global.db;
  timers[channel].online = !timers[channel].online;
  stopPointsTimer(channel);
  startPointsTimer(db, channel);
}

function showTimers() {
  return timers;
}

module.exports = {
  addProp: addProp,
  showTimers: showTimers,
  addChannel: addChannel,
  startPointsTimer: startPointsTimer,
  stopPointsTimer: stopPointsTimer,
  changeOnlineStatus: changeOnlineStatus,
  checkOnlineStatus: checkOnlineStatus
};
