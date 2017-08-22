'use strict';

module.exports = {
  getPointsAmount: getPointsAmount,
  getPointsName: getPointsName,
  modifyPoints: modifyPoints,
  startPointsTimer: startPointsTimer,
  iteratePoints: iteratePoints
};

const DB = require('./database.js');
const CHANNELS = require('./channels.js');
const TIMERS = require('./timers.js');
const USERS = require('./users.js');
const timer = TIMERS.showTimers();

var db;

(async function() {
  db = await DB.db;
});

// ONLY SEND USER IDs TO THESE FUNCTIONS!

async function getPointsAmount(db, channel, userID) {

  let amount = await db.users.find({ channel: channel, twitch_id: userID});
  return amount[0].points;

}

async function getPointsName(db, channel) {

  let name = await db.channel_settings.find({ channel: channel });
  return name[0].points_name;

}

async function startPointsTimer(db, channel) {
  try {
    let channelSettings = await db.channel_settings.find({ channel: channel });
    channelSettings = channelSettings[0];
    if (channelSettings.points_activated === true) {
      let point_amount = channelSettings.points_per_iteration;
      let interval = channelSettings.points_offline_interval;
      // convert seconds to milliseconds
      interval = interval * 1000;
      timer[channel].startTimer(point_amount, interval);
    }
  } catch (err) {
    console.log(err);
  }

}

// Call this function when its time to add points based on timer
async function iteratePoints(channel, points) {

  try { 
    console.log('Running Points Iteration for ' + channel);
    let userList = await USERS.getUserList(db, channel);
    USERS.processForPoints(db, userList, channel, points);
  } catch (err) {
    console.log(err);
  }

}

async function modifyPoints(db, channel, userID, amount) {
  let currentAmount = await getPointsAmount(db, channel, userID);
  let newAmount = parseInt(currentAmount) + parseInt(amount);

  // Do not allow points to go negative
  if (newAmount < 0) {
    newAmount = 0;
  }

  // Update database with new point amount
  await db.users.update({
    twitch_id: userID,
    channel: channel
  }, {
    points: newAmount
  });

}


